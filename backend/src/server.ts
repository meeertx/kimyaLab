import { app, server } from './app'
import { config, validateConfig } from './config/config'
import { prisma } from './config/database'

async function startServer() {
  try {
    // Validate configuration
    console.log('🔧 Validating configuration...')
    validateConfig()

    // Connect to database
    console.log('🗄️  Connecting to database...')
    await prisma.connect()

    // Start server
    server.listen(config.port, () => {
      console.log('')
      console.log('🚀 Kimya Lab Backend Server Started!')
      console.log('================================')
      console.log(`📍 Environment: ${config.env}`)
      console.log(`🌍 Server: http://localhost:${config.port}`)
      console.log(`🏥 Health Check: http://localhost:${config.port}/health`)
      console.log(`📋 API Docs: http://localhost:${config.port}/api/docs`)
      console.log('')
      console.log('Available endpoints:')
      console.log('  🔐 Auth: /api/auth/*')
      console.log('  📦 Products: /api/products/*')
      console.log('  📂 Categories: /api/categories/*')
      console.log('  📁 Files: /api/files/*')
      console.log('  👨‍💼 Admin: /api/admin/*')
      console.log('')
      
      if (config.env === 'development') {
        console.log('🔥 Development mode - Hot reload enabled')
      }
      
      console.log('✅ Server is ready to accept connections!')
      console.log('================================')
    })

    // Handle server errors
    server.on('error', (error: any) => {
      if (error.syscall !== 'listen') {
        throw error
      }

      const bind = typeof config.port === 'string' 
        ? `Pipe ${config.port}` 
        : `Port ${config.port}`

      switch (error.code) {
        case 'EACCES':
          console.error(`❌ ${bind} requires elevated privileges`)
          process.exit(1)
          break
        case 'EADDRINUSE':
          console.error(`❌ ${bind} is already in use`)
          process.exit(1)
          break
        default:
          throw error
      }
    })

  } catch (error) {
    console.error('❌ Failed to start server:', error)
    process.exit(1)
  }
}

// Start the server
startServer()