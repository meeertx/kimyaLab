import express, { Application } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import { createServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'

import { config } from './config/config'
import { prisma } from './config/database'
import { errorHandler, notFoundHandler } from './middleware/errorHandler'

// Import routes
import authRoutes from './routes/auth'
import productRoutes from './routes/products'
import categoryRoutes from './routes/categories'
import fileRoutes from './routes/files'
import adminRoutes from './routes/admin'

// Initialize Express app
const app: Application = express()
const server = createServer(app)

// Initialize Socket.io
const io = new SocketIOServer(server, {
  cors: {
    origin: [config.frontend.url, config.admin.url],
    credentials: true
  }
})

// Trust proxy (for production deployment)
app.set('trust proxy', 1)

// CORS configuration - MUST be before static middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', config.frontend.url, config.admin.url],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-client-version'],
  exposedHeaders: ['Content-Range', 'X-Total-Count']
}))

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false // Allow for development
}))

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    success: false,
    error: 'Too many requests',
    message: 'Too many requests from this IP, please try again later.',
    timestamp: new Date().toISOString()
  },
  standardHeaders: true,
  legacyHeaders: false
})

app.use('/api/', limiter)

// Body parsing middleware
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    try {
      JSON.parse(buf.toString())
    } catch (e) {
      (res as any).status(400).json({
        success: false,
        error: 'Invalid JSON',
        message: 'Request body contains invalid JSON',
        timestamp: new Date().toISOString()
      })
      throw new Error('Invalid JSON')
    }
  }
}))

app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb' 
}))

// Compression
app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false
    }
    return compression.filter(req, res)
  }
}))

// Serve mock uploads statically with comprehensive CORS headers
app.use('/mock-uploads', (req, res, next) => {
  // Comprehensive CORS headers for static files
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control')
  res.header('Access-Control-Expose-Headers', 'Content-Length, Content-Type')
  res.header('Cross-Origin-Resource-Policy', 'cross-origin')
  res.header('Cross-Origin-Opener-Policy', 'unsafe-none')
  res.header('Cross-Origin-Embedder-Policy', 'unsafe-none')
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.sendStatus(200)
    return
  }
  
  next()
}, express.static('mock-uploads', {
  setHeaders: (res, path) => {
    // Additional headers for images with strong CORS support
    res.set({
      'Cache-Control': 'public, max-age=86400', // 1 day cache
      'Access-Control-Allow-Origin': '*',
      'Cross-Origin-Resource-Policy': 'cross-origin',
      'X-Content-Type-Options': 'nosniff'
    })
  }
}))

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now()
  
  res.on('finish', () => {
    const duration = Date.now() - start
    const log = {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    }
    
    if (config.env === 'development') {
      console.log(`${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`)
    }
  })
  
  next()
})

// Root endpoint - API info
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'KimyaLab Backend API',
    data: {
      name: 'KimyaLab API Server',
      version: '1.0.0',
      environment: config.env,
      endpoints: {
        health: '/health',
        auth: '/api/auth',
        products: '/api/products',
        categories: '/api/categories',
        files: '/api/files',
        admin: '/api/admin'
      },
      documentation: '/api/docs',
      timestamp: new Date().toISOString()
    }
  })
})

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const dbHealthy = await prisma.healthCheck()
    
    res.json({
      success: true,
      message: 'Server is healthy',
      data: {
        server: 'OK',
        database: dbHealthy ? 'OK' : 'ERROR',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: config.env
      }
    })
  } catch (error) {
    res.status(503).json({
      success: false,
      error: 'Service unavailable',
      message: 'Health check failed',
      timestamp: new Date().toISOString()
    })
  }
})

// API routes
app.use('/api/auth', authRoutes)
app.use('/api/products', productRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/files', fileRoutes)
app.use('/api/admin', adminRoutes)

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`)
  
  // Join room for real-time updates
  socket.on('join_room', (room: string) => {
    socket.join(room)
    console.log(`Client ${socket.id} joined room: ${room}`)
  })
  
  // Leave room
  socket.on('leave_room', (room: string) => {
    socket.leave(room)
    console.log(`Client ${socket.id} left room: ${room}`)
  })
  
  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`)
  })
})

// Export io for use in other modules
export { io }

// 404 handler
app.use(notFoundHandler)

// Global error handler
app.use(errorHandler)

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`)
  
  server.close(async () => {
    console.log('HTTP server closed')
    
    try {
      await prisma.disconnect()
      console.log('Database disconnected')
      process.exit(0)
    } catch (error) {
      console.error('Error during shutdown:', error)
      process.exit(1)
    }
  })
  
  // Force close after 10 seconds
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down')
    process.exit(1)
  }, 10000)
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error)
  gracefulShutdown('UNCAUGHT_EXCEPTION')
})

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
  gracefulShutdown('UNHANDLED_REJECTION')
})

export { app, server }