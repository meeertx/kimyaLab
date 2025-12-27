# Database Migration ve Seed Rehberi

Bu rehber PostgreSQL kurulumu sonrası Prisma migration'larının çalıştırılması ve başlangıç verilerinin yüklenmesi için hazırlanmıştır.

## 1. Prisma Migration Adımları

### Adım 1: Environment Konfigürasyonu

`.env` dosyasını güncelle:

```bash
# PostgreSQL bağlantısını düzenle
DATABASE_URL="postgresql://kimyalab_user:kimyalab_password_2024!@localhost:5432/kimyalab_dev?schema=public"
```

### Adım 2: Prisma Client Oluştur

```bash
cd backend

# Prisma client'ı yeniden oluştur
npx prisma generate
```

### Adım 3: İlk Migration'ı Çalıştır

```bash
# Development migration (otomatik tablo oluşturma)
npx prisma db push

# Veya resmi migration yaklaşımı:
npx prisma migrate dev --name init
```

### Adım 4: Migration Durumunu Kontrol Et

```bash
# Migration geçmişini görüntüle
npx prisma migrate status

# Veritabanı şemasını kontrol et
npx prisma db pull
```

## 2. Seed Dosyası Oluşturma

### prisma/seed.ts Dosyası

```typescript
import { PrismaClient, UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seed işlemi başlatılıyor...')

  // Admin kullanıcısı oluştur
  const adminPassword = await bcrypt.hash('admin123!', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@kimyalab.com' },
    update: {},
    create: {
      email: 'admin@kimyalab.com',
      password: adminPassword,
      name: 'KimyaLab Admin',
      role: UserRole.ADMIN,
      isActive: true,
    },
  })

  console.log('👤 Admin kullanıcısı oluşturuldu:', admin.email)

  // Ana kategorileri oluştur
  const categories = [
    {
      name: 'Laboratuvar Kimyasalları',
      slug: 'laboratuvar-kimyasallari',
      description: 'Genel laboratuvar kullanımı için kimyasal maddeler',
      order: 1
    },
    {
      name: 'Analitik Reagentler',
      slug: 'analitik-reagentler', 
      description: 'Analiz ve test işlemleri için özel reagentler',
      order: 2
    },
    {
      name: 'Organik Kimyasallar',
      slug: 'organik-kimyasallar',
      description: 'Organik sentez ve araştırma için kimyasallar',
      order: 3
    },
    {
      name: 'İnorganik Kimyasallar',
      slug: 'inorganik-kimyasallar',
      description: 'İnorganik bileşikler ve tuzlar',
      order: 4
    },
    {
      name: 'Çözücüler',
      slug: 'cozucular',
      description: 'Laboratuvar çözücüleri ve seyreltici maddeler',
      order: 5
    }
  ]

  for (const categoryData of categories) {
    const category = await prisma.category.upsert({
      where: { slug: categoryData.slug },
      update: {},
      create: categoryData,
    })
    console.log(`📂 Kategori oluşturuldu: ${category.name}`)
  }

  // Örnek ürünler oluştur
  const labCategory = await prisma.category.findFirst({
    where: { slug: 'laboratuvar-kimyasallari' }
  })

  const organicCategory = await prisma.category.findFirst({
    where: { slug: 'organik-kimyasallar' }
  })

  if (labCategory) {
    const sampleProducts = [
      {
        name: 'Sodyum Klorür (NaCl) - Analitik Saflık',
        code: 'KL-001',
        description: 'Yüksek saflıkta sodyum klorür, analitik çalışmalar için idealdir.',
        category: 'Laboratuvar Kimyasalları',
        price: 45.50,
        stockQuantity: 100,
        minStockLevel: 10,
        unit: 'kg',
        categoryId: labCategory.id,
        createdBy: admin.id,
        technicalSpecs: [
          { name: 'Saflık', value: '>99.5%', unit: '%' },
          { name: 'Nem', value: '<0.5%', unit: '%' },
          { name: 'Çözünmezler', value: '<0.005%', unit: '%' }
        ],
        applications: [
          'Buffer hazırlama',
          'Hücre kültürü',
          'Protein çöktürme',
          'Elektroforez'
        ],
        certifications: ['ISO 9001', 'GMP', 'Analitik Sertifikası'],
        images: []
      },
      {
        name: 'Etanol (%96) - Laboratuvar Kalitesi',
        code: 'KL-002',
        description: 'Denature edilmemiş etanol, laboratuvar kullanımı için',
        category: 'Çözücüler',
        price: 78.00,
        stockQuantity: 50,
        minStockLevel: 5,
        unit: 'L',
        categoryId: labCategory.id,
        createdBy: admin.id,
        technicalSpecs: [
          { name: 'Konsantrasyon', value: '96%', unit: '%' },
          { name: 'Su içeriği', value: '4%', unit: '%' },
          { name: 'Metanol', value: '<0.1%', unit: '%' }
        ],
        applications: [
          'Çözücü olarak kullanım',
          'Ekstraksiyon işlemleri',
          'Temizleme',
          'Sterilizasyon'
        ],
        certifications: ['Laboratuvar Kalitesi', 'MSDS Mevcut'],
        images: []
      }
    ]

    for (const productData of sampleProducts) {
      const product = await prisma.product.upsert({
        where: { code: productData.code },
        update: {},
        create: productData,
      })
      console.log(`📦 Ürün oluşturuldu: ${product.name}`)

      // Inventory kaydı oluştur
      await prisma.inventory.upsert({
        where: { productId: product.id },
        update: {},
        create: {
          productId: product.id,
          quantity: productData.stockQuantity,
          minLevel: productData.minStockLevel,
          location: 'Ana Depo',
          updatedBy: admin.id,
        },
      })
    }
  }

  console.log('✅ Seed işlemi tamamlandı!')
}

main()
  .catch((e) => {
    console.error('❌ Seed hatası:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

### package.json'a Seed Script'i Ekle

```json
{
  "scripts": {
    "db:seed": "tsx prisma/seed.ts"
  },
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

## 3. Migration Çalıştırma Adımları

### Tam Setup Sırası:

```bash
# 1. Backend klasörüne git
cd backend

# 2. Dependencies kur
npm install

# 3. Environment kontrol et
cat .env

# 4. PostgreSQL bağlantısını test et
npx prisma db pull

# 5. Prisma client oluştur
npx prisma generate

# 6. Migration çalıştır
npx prisma db push
# veya
npx prisma migrate dev --name initial

# 7. Seed verilerini yükle
npm run db:seed

# 8. Prisma Studio ile kontrol et
npx prisma studio
```

## 4. Yaygın Migration Sorunları ve Çözümler

### Bağlantı Hatası
```bash
# PostgreSQL'in çalıştığından emin ol
brew services restart postgresql@15

# Bağlantı stringini kontrol et
echo $DATABASE_URL
```

### Migration Conflict
```bash
# Migration'ları sıfırla
npx prisma migrate reset

# Yeniden başlat
npx prisma migrate dev --name init
```

### Schema Sync Hatası
```bash
# Database'i schema ile senkronize et
npx prisma db push --force-reset

# Seed'i yeniden çalıştır
npm run db:seed
```

## 5. Production Migration

### Production Environment için:

```bash
# Migration dosyalarını deploy et
npx prisma migrate deploy

# Production seed (sadece gerekiyorsa)
NODE_ENV=production npm run db:seed
```

## 6. Backup Önerisi

### Migration Öncesi Backup:

```bash
# Backup al
pg_dump -U kimyalab_user -h localhost kimyalab_dev > backup_before_migration.sql

# Migration çalıştır
npx prisma migrate dev

# Sorun varsa geri yükle
psql -U kimyalab_user -h localhost kimyalab_dev < backup_before_migration.sql
```

## 7. Migration Komutları Özeti

```bash
# Temel komutlar
npx prisma generate          # Client oluştur
npx prisma db push          # Schema'yı DB'ye uygula
npx prisma migrate dev      # Development migration
npx prisma migrate deploy   # Production migration  
npx prisma migrate status   # Migration durumu
npx prisma migrate reset    # Tüm migration'ları sıfırla
npx prisma db pull         # DB'den schema oluştur
npx prisma studio          # Visual admin interface
npx prisma validate        # Schema'yı doğrula
```

Bu rehberi takip ederek database migration'larınızı güvenli bir şekilde gerçekleştirebilirsiniz.