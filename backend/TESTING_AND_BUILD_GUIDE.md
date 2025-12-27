# Backend Test ve Build Rehberi

Bu rehber KimyaLab backend'inin test edilmesi ve build süreçleri için hazırlanmıştır.

## 1. Build ve Type Checking

### TypeScript Build Testi

```bash
# Backend klasörüne git
cd backend

# Dependencies'leri kontrol et
npm install

# TypeScript derlemesini test et
npm run build

# Type checking (derleme olmadan)
npm run type-check

# Incremental build kontrol et
tsc --build --verbose
```

### Build Output Kontrolü

Build başarılı olduktan sonra kontrol edilecekler:

```bash
# Dist klasörünün oluştuğunu kontrol et
ls -la dist/

# Ana dosyaların derlendiğini kontrol et
ls -la dist/
├── app.js
├── server.js
├── config/
│   ├── config.js
│   └── database.js
├── middleware/
├── routes/
├── services/
└── types/
```

### Build Sorunları ve Çözümler

**TypeScript Hatalar:**
```bash
# Tüm type hatalarını göster
npx tsc --noEmit --listFiles

# Sadece hataları göster
npx tsc --noEmit --pretty
```

**Module Resolution Hataları:**
```bash
# Node module resolution test
npx tsc --traceResolution --noEmit
```

**Path Mapping Sorunları:**
```typescript
// tsconfig.json kontrol
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

## 2. Server Başlatma Testleri

### Development Server Test

```bash
# Development modda başlat
npm run dev

# Beklenen çıktı:
# 🔧 Validating configuration...
# 🗄️  Connecting to database...
# 🗄️  Database connected successfully
# 🚀 Kimya Lab Backend Server Started!
# ================================
# 📍 Environment: development
# 🌍 Server: http://localhost:5000
# 🏥 Health Check: http://localhost:5000/health
# 📋 API Docs: http://localhost:5000/api/docs
```

### Production Build Test

```bash
# Production build oluştur
npm run build

# Production modda başlat
NODE_ENV=production npm start

# Port kullanımını kontrol et
lsof -i :5000
```

### Health Check Test

```bash
# Server sağlığını kontrol et
curl http://localhost:5000/health

# Beklenen yanıt:
{
  "status": "OK",
  "timestamp": "2024-01-04T12:00:00.000Z",
  "uptime": 123.456,
  "database": "connected",
  "memory": {
    "used": "45.2 MB",
    "total": "128.0 MB"
  }
}
```

## 3. Database Connection Testleri

### Bağlantı Test Scripti

```bash
# Prisma bağlantısını test et
npx prisma db pull

# Database introspection
npx prisma db pull --print

# Bağlantı validasyonu
npx prisma validate
```

### Manual Connection Test

```typescript
// test/database-connection.test.ts
import { prisma } from '../src/config/database'

describe('Database Connection', () => {
  beforeAll(async () => {
    await prisma.$connect()
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  it('should connect to database', async () => {
    const result = await prisma.$queryRaw`SELECT 1 as result`
    expect(result).toBeDefined()
  })

  it('should have tables created', async () => {
    const users = await prisma.user.findMany({ take: 1 })
    expect(Array.isArray(users)).toBe(true)
  })
})
```

## 4. API Endpoint Testleri

### Auth Endpoints Test

```bash
# Kayıt testi
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@kimyalab.com",
    "password": "test123456",
    "name": "Test User"
  }'

# Login testi  
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@kimyalab.com", 
    "password": "test123456"
  }'
```

### Products Endpoints Test

```bash
# Token'ı kaydet (login'den dönen token)
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Ürünleri listele
curl -X GET "http://localhost:5000/api/products" \
  -H "Authorization: Bearer $TOKEN"

# Kategori filtresi ile listele
curl -X GET "http://localhost:5000/api/products?category=laboratuvar-kimyasallari" \
  -H "Authorization: Bearer $TOKEN"

# Arama testi
curl -X GET "http://localhost:5000/api/products?search=sodyum" \
  -H "Authorization: Bearer $TOKEN"
```

### Categories Endpoints Test

```bash
# Kategorileri listele
curl -X GET "http://localhost:5000/api/categories" \
  -H "Authorization: Bearer $TOKEN"

# Spesifik kategori
curl -X GET "http://localhost:5000/api/categories/laboratuvar-kimyasallari" \
  -H "Authorization: Bearer $TOKEN"
```

## 5. Automated Test Setup

### Jest Konfigürasyonu

```json
// package.json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:integration": "jest --testMatch='**/*.integration.test.ts'"
  }
}
```

### Test Dosya Yapısı

```
backend/
├── tests/
│   ├── unit/
│   │   ├── services/
│   │   │   ├── authService.test.ts
│   │   │   └── productService.test.ts
│   │   └── utils/
│   ├── integration/
│   │   ├── auth.integration.test.ts
│   │   ├── products.integration.test.ts
│   │   └── categories.integration.test.ts
│   └── helpers/
│       ├── setup.ts
│       └── testDb.ts
```

### Sample Unit Test

```typescript
// tests/unit/services/authService.test.ts
import { AuthService } from '../../../src/services/authService'
import { prisma } from '../../../src/config/database'

jest.mock('../../../src/config/database')

describe('AuthService', () => {
  let authService: AuthService

  beforeEach(() => {
    authService = new AuthService()
    jest.clearAllMocks()
  })

  describe('login', () => {
    it('should login with valid credentials', async () => {
      const mockUser = {
        id: '1',
        email: 'test@test.com',
        password: 'hashedpassword',
        name: 'Test User'
      }

      ;(prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser)

      const result = await authService.login('test@test.com', 'password')

      expect(result).toHaveProperty('user')
      expect(result).toHaveProperty('tokens')
    })
  })
})
```

### Sample Integration Test

```typescript
// tests/integration/products.integration.test.ts
import request from 'supertest'
import { app } from '../../src/app'
import { prisma } from '../../src/config/database'

describe('Products API', () => {
  let authToken: string

  beforeAll(async () => {
    // Test user oluştur ve token al
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@kimyalab.com',
        password: 'admin123!'
      })

    authToken = response.body.data.tokens.accessToken
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  describe('GET /api/products', () => {
    it('should return products list', async () => {
      const response = await request(app)
        .get('/api/products')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(Array.isArray(response.body.data)).toBe(true)
    })

    it('should filter by category', async () => {
      const response = await request(app)
        .get('/api/products?category=laboratuvar-kimyasallari')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
    })
  })
})
```

## 6. Load Testing

### Artillery Setup

```bash
# Artillery kur
npm install -g artillery

# Load test çalıştır
artillery run load-test.yml
```

### load-test.yml

```yaml
config:
  target: 'http://localhost:5000'
  phases:
    - duration: 60
      arrivalRate: 10
    - duration: 120
      arrivalRate: 20

scenarios:
  - name: "API Load Test"
    flow:
      - post:
          url: "/api/auth/login"
          json:
            email: "test@kimyalab.com"
            password: "test123456"
          capture:
            json: "$.data.tokens.accessToken"
            as: "token"
      
      - get:
          url: "/api/products"
          headers:
            Authorization: "Bearer {{ token }}"
      
      - get:
          url: "/api/categories"
          headers:
            Authorization: "Bearer {{ token }}"
```

## 7. Performance Monitoring

### Memory Usage Test

```bash
# Memory profiling
node --inspect dist/server.js

# Memory leak detection
node --trace-warnings --trace-deprecation dist/server.js
```

### Response Time Test

```typescript
// middleware/responseTime.ts
app.use((req, res, next) => {
  const start = Date.now()
  
  res.on('finish', () => {
    const duration = Date.now() - start
    console.log(`${req.method} ${req.path} - ${duration}ms`)
    
    if (duration > 1000) {
      console.warn(`Slow request detected: ${req.path} took ${duration}ms`)
    }
  })
  
  next()
})
```

## 8. Test Checklist

### Pre-deployment Test Checklist

- [ ] TypeScript build successful (`npm run build`)
- [ ] Type checking passes (`npm run type-check`)
- [ ] All unit tests pass (`npm test`)
- [ ] All integration tests pass (`npm run test:integration`)
- [ ] Database connection successful
- [ ] All API endpoints responding correctly
- [ ] Authentication flow working
- [ ] File upload working
- [ ] Error handling working correctly
- [ ] CORS configuration correct
- [ ] Environment variables set
- [ ] Health check endpoint working
- [ ] Load test results acceptable
- [ ] Memory usage within limits

### API Endpoint Test Matrix

| Endpoint | Method | Auth Required | Status | Response Time |
|----------|--------|---------------|--------|---------------|
| /health | GET | No | ✅ | <100ms |
| /api/auth/register | POST | No | ✅ | <500ms |
| /api/auth/login | POST | No | ✅ | <500ms |
| /api/auth/refresh | POST | Yes | ✅ | <200ms |
| /api/products | GET | Optional | ✅ | <300ms |
| /api/products/:id | GET | Optional | ✅ | <200ms |
| /api/products | POST | Admin | ✅ | <1000ms |
| /api/categories | GET | No | ✅ | <200ms |
| /api/files/upload | POST | Yes | ✅ | <2000ms |

## 9. Continuous Integration

### GitHub Actions Example

```yaml
# .github/workflows/backend-test.yml
name: Backend Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: kimyalab_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: cd backend && npm ci
        
      - name: Run type check
        run: cd backend && npm run type-check
        
      - name: Run build
        run: cd backend && npm run build
        
      - name: Run tests
        run: cd backend && npm test
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/kimyalab_test
```

Bu rehberi takip ederek backend'inizin tam fonksiyonel olarak çalıştığından emin olabilirsiniz.