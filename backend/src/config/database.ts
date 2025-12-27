import { PrismaClient } from '@prisma/client'
import { config } from './config'

// Extend PrismaClient with custom methods if needed
class ExtendedPrismaClient extends PrismaClient {
  constructor() {
    super({
      log: config.env === 'development' ? [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'info' },
        { emit: 'event', level: 'warn' }
      ] : [
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'warn' }
      ]
    })
  }

  async connect(): Promise<void> {
    try {
      await this.$connect()
      console.log('🗄️  Database connected successfully')
    } catch (error) {
      console.error('❌ Database connection failed:', error)
      process.exit(1)
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.$disconnect()
      console.log('🗄️  Database disconnected')
    } catch (error) {
      console.error('❌ Database disconnection error:', error)
    }
  }

  // Health check method
  async healthCheck(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`
      return true
    } catch (error) {
      console.error('Database health check failed:', error)
      return false
    }
  }
}

// Create single instance
export const prisma = new ExtendedPrismaClient()

// Logging will be handled through Prisma log configuration in constructor

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.disconnect()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  await prisma.disconnect()
  process.exit(0)
})

export default prisma