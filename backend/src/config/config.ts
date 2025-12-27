import dotenv from 'dotenv'
dotenv.config()

interface Config {
  env: string
  port: number
  database: {
    url: string
  }
  jwt: {
    secret: string
    expiresIn: string
    refreshSecret: string
    refreshExpiresIn: string
    emailVerificationSecret: string
    passwordResetSecret: string
  }
  bcrypt: {
    rounds: number
  }
  frontend: {
    url: string
  }
  admin: {
    url: string
  }
  email: {
    service: string
    user: string
    password: string
  }
  cloudinary: {
    cloudName: string
    apiKey: string
    apiSecret: string
  }
  google: {
    clientId: string
    clientSecret: string
  }
  rateLimit: {
    windowMs: number
    maxRequests: number
  }
  features: {
    websockets: boolean
    fileUploads: boolean
    compression: boolean
  }
  logging: {
    level: string
    enableMetrics: boolean
  }
}

export const config: Config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  
  database: {
    url: process.env.DATABASE_URL || 'postgresql://localhost:5432/kimyalab'
  },
  
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
    emailVerificationSecret: process.env.JWT_EMAIL_VERIFICATION_SECRET || 'email-verification-secret',
    passwordResetSecret: process.env.JWT_PASSWORD_RESET_SECRET || 'password-reset-secret'
  },
  
  bcrypt: {
    rounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10)
  },
  
  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:3000'
  },
  
  admin: {
    url: process.env.ADMIN_URL || 'http://localhost:3001'
  },
  
  email: {
    service: process.env.EMAIL_SERVICE || 'gmail',
    user: process.env.EMAIL_USER || '',
    password: process.env.EMAIL_PASSWORD || ''
  },
  
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || ''
  },
  
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || ''
  },
  
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10), // 1 minute (development)
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '1000', 10) // Much higher for admin dashboard
  },
  
  features: {
    websockets: process.env.ENABLE_WEBSOCKETS === 'true',
    fileUploads: process.env.ENABLE_FILE_UPLOADS === 'true',
    compression: process.env.ENABLE_COMPRESSION === 'true'
  },
  
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    enableMetrics: process.env.ENABLE_METRICS === 'true'
  }
}

// Validate required environment variables
const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET'
]

export function validateConfig(): void {
  const missingVars: string[] = []
  
  requiredEnvVars.forEach(envVar => {
    if (!process.env[envVar]) {
      missingVars.push(envVar)
    }
  })
  
  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:')
    missingVars.forEach(varName => {
      console.error(`   - ${varName}`)
    })
    console.error('Please check your .env file')
    process.exit(1)
  }
  
  // Validate JWT secret length
  if (config.jwt.secret.length < 32) {
    console.error('❌ JWT_SECRET must be at least 32 characters long')
    process.exit(1)
  }
  
  if (config.jwt.refreshSecret.length < 32) {
    console.error('❌ JWT_REFRESH_SECRET must be at least 32 characters long')
    process.exit(1)
  }
  
  console.log('✅ Configuration validated successfully')
}