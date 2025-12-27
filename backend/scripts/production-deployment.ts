#!/usr/bin/env tsx
import { PrismaClient } from '@prisma/client'
import * as dotenv from 'dotenv'
import * as path from 'path'
import { fileURLToPath } from 'url'

// Load production environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.production') })

const prisma = new PrismaClient()

interface DeploymentStep {
  name: string
  description: string
  execute: () => Promise<void>
  rollback?: () => Promise<void>
}

class ProductionDeployment {
  private steps: DeploymentStep[] = []
  private completedSteps: string[] = []

  constructor() {
    this.setupSteps()
  }

  private setupSteps() {
    this.steps = [
      {
        name: 'database_connection',
        description: 'Test database connection',
        execute: async () => {
          console.log('🔗 Testing database connection...')
          await prisma.$connect()
          await prisma.$queryRaw`SELECT 1`
          console.log('✅ Database connection successful')
        }
      },
      {
        name: 'database_migration',
        description: 'Run database migrations',
        execute: async () => {
          console.log('🚀 Running database migrations...')
          const { exec } = await import('child_process')
          const { promisify } = await import('util')
          const execAsync = promisify(exec)
          
          try {
            const { stdout, stderr } = await execAsync('npx prisma migrate deploy')
            if (stderr && !stderr.includes('warning')) {
              throw new Error(stderr)
            }
            console.log('✅ Database migrations completed')
            console.log(stdout)
          } catch (error) {
            console.error('❌ Migration failed:', error)
            throw error
          }
        }
      },
      {
        name: 'check_tables',
        description: 'Verify database tables exist',
        execute: async () => {
          console.log('🔍 Checking database tables...')
          
          const tables = await prisma.$queryRaw`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name;
          ` as any[]
          
          const expectedTables = [
            'User', 'Product', 'Category', 'Order', 'OrderItem', 
            '_prisma_migrations'
          ]
          
          const existingTableNames = tables.map(t => t.table_name)
          const missingTables = expectedTables.filter(table => 
            !existingTableNames.some(existing => existing.toLowerCase() === table.toLowerCase())
          )
          
          if (missingTables.length > 0) {
            console.warn('⚠️ Missing tables:', missingTables)
          } else {
            console.log('✅ All required tables exist')
          }
          
          console.log('📋 Existing tables:')
          existingTableNames.forEach(table => console.log(`  - ${table}`))
        }
      },
      {
        name: 'seed_categories',
        description: 'Seed categories if empty',
        execute: async () => {
          console.log('🌱 Checking and seeding categories...')
          
          const categoryCount = await prisma.category.count()
          
          if (categoryCount === 0) {
            console.log('📂 No categories found, running seed...')
            const { exec } = await import('child_process')
            const { promisify } = await import('util')
            const execAsync = promisify(exec)
            
            try {
              const { stdout } = await execAsync('npm run db:seed')
              console.log('✅ Categories seeded successfully')
              console.log(stdout)
            } catch (error) {
              console.error('❌ Seeding failed:', error)
              // Don't throw - seeding failure shouldn't stop deployment
            }
          } else {
            console.log(`✅ Found ${categoryCount} existing categories`)
          }
        }
      },
      {
        name: 'create_admin_user',
        description: 'Create admin user if not exists',
        execute: async () => {
          console.log('👤 Checking admin user...')
          
          const adminEmail = process.env.ADMIN_EMAIL || 'admin@kimyalab.com'
          const adminPassword = process.env.ADMIN_PASSWORD || 'admin123'
          
          const existingAdmin = await prisma.user.findUnique({
            where: { email: adminEmail }
          })
          
          if (!existingAdmin) {
            const bcrypt = await import('bcrypt')
            const hashedPassword = await bcrypt.hash(adminPassword, 12)
            
            await prisma.user.create({
              data: {
                email: adminEmail,
                name: 'System Administrator',
                password: hashedPassword,
                role: 'ADMIN',
                isActive: true
              }
            })
            
            console.log(`✅ Admin user created: ${adminEmail}`)
            console.log('⚠️  Remember to change the default password!')
          } else {
            console.log(`✅ Admin user already exists: ${adminEmail}`)
          }
        }
      },
      {
        name: 'verify_cloudinary',
        description: 'Verify Cloudinary configuration',
        execute: async () => {
          console.log('☁️  Checking Cloudinary configuration...')
          
          const cloudName = process.env.CLOUDINARY_CLOUD_NAME
          const apiKey = process.env.CLOUDINARY_API_KEY
          const apiSecret = process.env.CLOUDINARY_API_SECRET
          const forceMock = process.env.FORCE_MOCK_UPLOADS
          
          if (forceMock === 'true') {
            console.log('🎭 Mock uploads enabled - Cloudinary not required')
            return
          }
          
          if (!cloudName || !apiKey || !apiSecret) {
            console.warn('⚠️ Cloudinary not properly configured')
            console.warn('   File uploads will use mock system')
            return
          }
          
          if (cloudName.includes('your-') || apiKey.includes('your-')) {
            console.warn('⚠️ Cloudinary using placeholder values')
            console.warn('   Please update with real credentials')
            return
          }
          
          console.log('✅ Cloudinary configuration looks valid')
        }
      },
      {
        name: 'health_check',
        description: 'Final health check',
        execute: async () => {
          console.log('🏥 Running final health check...')
          
          // Check database connection
          await prisma.$connect()
          
          // Count records
          const stats = {
            users: await prisma.user.count(),
            categories: await prisma.category.count(),
            products: await prisma.product.count()
          }
          
          console.log('📊 Database statistics:')
          Object.entries(stats).forEach(([key, value]) => {
            console.log(`  - ${key}: ${value}`)
          })
          
          console.log('✅ Health check completed successfully')
        }
      }
    ]
  }

  async execute(): Promise<void> {
    console.log('🚀 Starting KimyaLab Production Deployment')
    console.log('=' .repeat(50))
    
    const startTime = Date.now()
    
    try {
      for (const step of this.steps) {
        console.log(`\n▶️  ${step.name}: ${step.description}`)
        
        try {
          await step.execute()
          this.completedSteps.push(step.name)
        } catch (error) {
          console.error(`❌ Step '${step.name}' failed:`, error)
          
          // Try rollback if available
          if (step.rollback) {
            console.log(`🔄 Attempting rollback for '${step.name}'...`)
            try {
              await step.rollback()
              console.log('✅ Rollback successful')
            } catch (rollbackError) {
              console.error('❌ Rollback failed:', rollbackError)
            }
          }
          
          throw new Error(`Deployment failed at step: ${step.name}`)
        }
      }
      
      const duration = (Date.now() - startTime) / 1000
      
      console.log('\n' + '=' .repeat(50))
      console.log('🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!')
      console.log(`⏱️  Duration: ${duration.toFixed(2)} seconds`)
      console.log(`✅ Completed steps: ${this.completedSteps.length}/${this.steps.length}`)
      
      console.log('\n📋 Next Steps:')
      console.log('1. Update DNS to point to your server')
      console.log('2. Configure SSL certificate')
      console.log('3. Set up monitoring and backups')
      console.log('4. Update production environment variables')
      console.log('5. Test all functionality')
      
    } catch (error) {
      console.error('\n💥 DEPLOYMENT FAILED!')
      console.error('Error:', error)
      console.log(`✅ Completed steps: ${this.completedSteps.join(', ')}`)
      process.exit(1)
    } finally {
      await prisma.$disconnect()
    }
  }

  async rollbackAll(): Promise<void> {
    console.log('🔄 Rolling back deployment...')
    
    // Reverse the order for rollback
    const reversedSteps = this.steps.slice().reverse()
    
    for (const step of reversedSteps) {
      if (this.completedSteps.includes(step.name) && step.rollback) {
        try {
          console.log(`🔄 Rolling back: ${step.name}`)
          await step.rollback()
        } catch (error) {
          console.error(`❌ Rollback failed for ${step.name}:`, error)
        }
      }
    }
    
    await prisma.$disconnect()
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2)
  const command = args[0]
  
  const deployment = new ProductionDeployment()
  
  switch (command) {
    case 'deploy':
      await deployment.execute()
      break
    case 'rollback':
      await deployment.rollbackAll()
      break
    default:
      console.log('KimyaLab Production Deployment Tool')
      console.log('')
      console.log('Usage:')
      console.log('  npm run production:setup     - Run full deployment')
      console.log('  tsx scripts/production-deployment.ts deploy   - Run deployment')
      console.log('  tsx scripts/production-deployment.ts rollback - Rollback deployment')
      process.exit(1)
  }
}

// Handle uncaught errors
process.on('uncaughtException', async (error) => {
  console.error('💥 Uncaught Exception:', error)
  await prisma.$disconnect()
  process.exit(1)
})

process.on('unhandledRejection', async (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason)
  await prisma.$disconnect()
  process.exit(1)
})

if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

export { ProductionDeployment }