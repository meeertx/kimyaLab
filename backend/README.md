# Kimya Lab Backend

Modern, ölçeklenebilir Node.js backend Firebase'den geçiş için tasarlandı. Frontend kodları hiç değiştirilmeden çalışır.

## 🚀 Özellikler

### ✅ Tam Firebase Uyumluluğu
- **Frontend hiç değişmeden çalışır**
- Firebase Auth interface uyumluluğu
- Firestore API uyumluluğu  
- Firebase Storage uyumluluğu
- Real-time updates (Socket.io)

### ✅ Modern Backend Stack
- **Express.js** - Web framework
- **PostgreSQL** - Relational database
- **Prisma ORM** - Type-safe database client
- **JWT** - Authentication
- **Cloudinary** - File storage
- **Socket.io** - Real-time communication
- **TypeScript** - Type safety

### ✅ Güvenlik & Performance
- Rate limiting
- Input validation
- Error handling
- Compression
- CORS configuration
- Helmet security headers

## 📦 Kurulum

### 1. Gereksinimler
```bash
# Node.js 18+ ve npm
node --version  # v18+
npm --version   # 8+

# PostgreSQL 14+
psql --version  # 14+
```

### 2. Proje Kurulumu
```bash
# Backend dizinine git
cd backend

# Bağımlılıkları yükle
npm install

# Prisma client generate et
npx prisma generate
```

### 3. Veritabanı Kurulumu

#### PostgreSQL Kurulumu (macOS)
```bash
# Homebrew ile PostgreSQL kur
brew install postgresql@14
brew services start postgresql@14

# Database oluştur
createdb kimyalab_dev
```

#### PostgreSQL Kurulumu (Ubuntu/Linux)
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Database oluştur
sudo -u postgres createdb kimyalab_dev
sudo -u postgres psql -c "CREATE USER your_user WITH PASSWORD 'your_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE kimyalab_dev TO your_user;"
```

### 4. Environment Değişkenleri

`.env` dosyasını düzenle:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/kimyalab_dev?schema=public"

# JWT Secrets (32+ karakter olmalı)
JWT_SECRET="your-super-secret-jwt-key-min-32-characters-long-for-security"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-min-32-characters-long-for-security"

# Cloudinary (dosya yükleme için)
CLOUDINARY_CLOUD_NAME="your-cloudinary-cloud-name"
CLOUDINARY_API_KEY="your-cloudinary-api-key"  
CLOUDINARY_API_SECRET="your-cloudinary-api-secret"

# Frontend URLs
FRONTEND_URL="http://localhost:3000"
ADMIN_URL="http://localhost:3001"
```

### 5. Veritabanı Migration

```bash
# Migration dosyaları oluştur ve çalıştır
npx prisma migrate dev --name init

# Seed data ekle (opsiyonel)
npm run seed
```

### 6. Server Başlatma

```bash
# Development mode
npm run dev

# Production mode  
npm run build
npm start
```

Server `http://localhost:5000` adresinde çalışacak.

## 🔄 Frontend Entegrasyonu

### Firebase'den Geçiş

Frontend kodunuzda **hiçbir değişiklik yapmadan** backend'i kullanabilirsiniz:

#### 1. Environment Değişkeni
Frontend `.env` dosyasına:
```env
VITE_USE_NODE_BACKEND=true
VITE_API_URL=http://localhost:5000/api
```

#### 2. Firebase Config Değiştirme

Mevcut Firebase import'unu değiştirin:

```typescript
// Eskiden
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

// Şimdi  
import { initializeApp } from './backend/src/adapters/firebaseAdapter'
import { getAuth } from './backend/src/adapters/firebaseAdapter'  
import { getFirestore } from './backend/src/adapters/firebaseAdapter'
```

**O kadar!** Bütün Firebase kodlarınız aynen çalışmaya devam edecek.

### API Endpoints

Backend şu endpoints'leri sağlar:

#### Authentication
- `POST /api/auth/register` - Kullanıcı kaydı
- `POST /api/auth/login` - Giriş yapma
- `POST /api/auth/refresh` - Token yenileme
- `POST /api/auth/logout` - Çıkış yapma
- `GET /api/auth/me` - Kullanıcı profili

#### Products
- `GET /api/products` - Ürün listesi
- `GET /api/products/:id` - Tek ürün
- `POST /api/products` - Ürün oluşturma (admin)
- `PUT /api/products/:id` - Ürün güncelleme (admin)
- `DELETE /api/products/:id` - Ürün silme (admin)

#### Categories  
- `GET /api/categories` - Kategori listesi
- `GET /api/categories/tree` - Kategori ağacı
- `POST /api/categories` - Kategori oluşturma (admin)

#### Files
- `POST /api/files/upload` - Dosya yükleme
- `GET /api/files/download/:id` - Dosya indirme

#### Admin
- `GET /api/admin/dashboard` - Admin dashboard
- `GET /api/admin/users` - Kullanıcı yönetimi

## 🔐 Authentication

Backend JWT tabanlı authentication kullanır:

### Access & Refresh Tokens
- **Access Token**: 1 saat geçerli
- **Refresh Token**: 7 gün geçerli
- Otomatik token yenileme

### Roller
- **user**: Normal kullanıcı
- **admin**: Yönetici (CRUD işlemleri)

## 📡 Real-time Features

Socket.io ile gerçek zamanlı güncellemeler:

### Client Tarafı
```javascript
// Socket bağlantısı
const socket = io('http://localhost:5000')

// Ürün güncellemelerini dinle
socket.on('product_updated', (data) => {
  console.log('Ürün güncellendi:', data)
})

// Admin notifications
socket.on('admin_notification', (data) => {
  console.log('Admin bildirimi:', data)
})
```

### Events
- `product_updated` - Ürün değişiklikleri
- `inventory_updated` - Stok değişiklikleri  
- `category_updated` - Kategori değişiklikleri
- `new_user_registered` - Yeni kullanıcı kaydı
- `system_notification` - Sistem bildirimleri

## 📁 Dosya Yükleme

Cloudinary entegrasyonu ile güvenli dosya yükleme:

### Desteklenen Formatlar
- **Images**: JPEG, PNG, WebP, GIF
- **Documents**: PDF, DOC, DOCX, XLS, XLSX
- **Text**: TXT, CSV

### Limits
- Tek dosya: 10MB
- Toplam dosya: 10 dosya/istek

## 🗄️ Veritabanı Şeması

### Ana Tablolar
- **users** - Kullanıcılar
- **products** - Ürünler  
- **categories** - Kategoriler
- **documents** - Dosyalar
- **inventory** - Stok yönetimi
- **auth_tokens** - Authentication tokens

### İlişkiler
- Kategori → Alt kategoriler (self-referencing)
- Ürün → Kategori (many-to-one)
- Ürün → Dosyalar (one-to-many)
- Kullanıcı → Ürünler (one-to-many)

## 🚨 Error Handling

Kapsamlı hata yönetimi:

### HTTP Status Codes
- `200` - Başarılı
- `201` - Oluşturuldu
- `400` - Yanlış istek
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Bulunamadı
- `409` - Conflict
- `429` - Rate limit
- `500` - Server hatası

### Error Response Format
```json
{
  "success": false,
  "error": "Validation failed",
  "message": "Email is required",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 📊 Monitoring

### Health Check
```bash
curl http://localhost:5000/health
```

### Admin Dashboard
Admin paneli üzerinden:
- Sistem durumu
- Kullanıcı istatistikleri  
- Ürün metrikleri
- Dosya kullanımı

## 🧪 Testing

```bash
# Unit testler
npm run test

# Integration testler  
npm run test:integration

# Coverage raporu
npm run test:coverage
```

## 📚 API Documentation

Server başladıktan sonra:
- Swagger UI: `http://localhost:5000/api/docs`
- Postman Collection: `docs/kimyalab-api.postman_collection.json`

## 🚀 Production Deployment

### Build
```bash
npm run build
```

### Environment Variables (Production)
```env
NODE_ENV=production
PORT=5000
DATABASE_URL="postgresql://user:pass@prod-host:5432/kimyalab_prod"
JWT_SECRET="super-secure-production-jwt-secret-min-32-chars"
JWT_REFRESH_SECRET="super-secure-production-refresh-secret-min-32-chars"
CLOUDINARY_CLOUD_NAME="prod-cloud-name"
CLOUDINARY_API_KEY="prod-api-key"
CLOUDINARY_API_SECRET="prod-api-secret"
```

### Process Manager (PM2)
```bash
# PM2 kurulum
npm install -g pm2

# Production start
pm2 start ecosystem.config.js --env production

# Monitoring
pm2 monit
```

## 🔧 Troubleshooting

### Sık Karşılaşılan Sorunlar

#### 1. Prisma Client Hatası
```bash
npx prisma generate
```

#### 2. Database Bağlantı Hatası
- PostgreSQL çalışıyor mu kontrol edin
- `.env` dosyasındaki DATABASE_URL doğru mu?

#### 3. JWT Token Hatası  
- JWT_SECRET en az 32 karakter olmalı
- Token süresi dolmuş olabilir

#### 4. Cloudinary Upload Hatası
- API keys doğru mu?
- Dosya boyutu 10MB'dan küçük mü?

### Debug Mode
```bash
DEBUG=kimyalab:* npm run dev
```

### Logs
```bash
# Real-time logs
npm run logs

# Error logs
npm run logs:error
```

## 🤝 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit edin (`git commit -m 'Add amazing feature'`)
4. Push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📄 Lisans

MIT License

## 📞 Destek

Herhangi bir sorun yaşarsanız:
- Issue oluşturun
- Documentation kontrol edin
- Debug loglarını inceleyin

---

**🎉 Firebase'den Node.js'e geçiş tamamlandı!**

Frontend kodlarınız hiç değişmeden çalışmaya devam edecek. Backend artık tamamen size ait ve istediğiniz gibi özelleştirebilirsiniz.