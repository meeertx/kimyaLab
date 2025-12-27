import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function cleanDatabase() {
  console.log('🧹 Kategori veritabanı temizleniyor...')
  
  try {
    // Hedef kategoriler (seed'deki gibi)
    const expectedMainCategories = [
      'chemicals', 'life-sciences', 'raw-materials', 'applications'
    ]
    
    const allCategories = await prisma.category.findMany()
    const mainCategories = allCategories.filter(cat => !cat.parentId)
    
    console.log(`📊 Mevcut ana kategoriler: ${mainCategories.length}`)
    console.log(`📊 Hedef ana kategoriler: ${expectedMainCategories.length}`)
    
    // Doğru kategorilerden birini bul (Products için safe target)
    const safeCategory = allCategories.find(cat => cat.slug === 'chemicals')
    if (!safeCategory) {
      console.error('❌ Güvenli kategori bulunamadı! Seed önce çalıştırılmalı.')
      return
    }
    
    // Fazla ana kategorileri tespit et
    const extraMainCategories = mainCategories.filter(cat =>
      !expectedMainCategories.includes(cat.slug)
    )
    
    if (extraMainCategories.length > 0) {
      console.log(`🔄 Ürün referansları güvenli kategoriye taşınıyor...`)
      
      // Silinecek kategorilerin ID'lerini topla
      const categoriesToDelete = []
      for (const category of extraMainCategories) {
        const subcategories = await prisma.category.findMany({
          where: { parentId: category.id }
        })
        
        // Ana kategori ve alt kategorilerini ekle
        categoriesToDelete.push(category.id)
        categoriesToDelete.push(...subcategories.map(sub => sub.id))
      }
      
      // Bu kategorilerdeki ürünleri güvenli kategoriye taşı
      const affectedProducts = await prisma.product.findMany({
        where: { categoryId: { in: categoriesToDelete } }
      })
      
      if (affectedProducts.length > 0) {
        console.log(`📦 ${affectedProducts.length} ürün güvenli kategoriye taşınıyor...`)
        await prisma.product.updateMany({
          where: { categoryId: { in: categoriesToDelete } },
          data: {
            categoryId: safeCategory.id,
            category: 'Chemicals' // string field güncelle
          }
        })
      }
      
      console.log(`🗑️  Fazla kategoriler siliniyor: ${extraMainCategories.length}`)
      
      for (const category of extraMainCategories) {
        // Alt kategorilerini sil
        await prisma.category.deleteMany({
          where: { parentId: category.id }
        })
        
        console.log(`  ✅ ${category.name} ve alt kategorileri silindi`)
        
        // Ana kategoriyi sil
        await prisma.category.delete({
          where: { id: category.id }
        })
      }
    }
    
    console.log('✅ Fazla kategoriler temizlendi!')
    console.log('🌱 Şimdi seed dosyasını çalıştırın: npm run seed')
    
  } catch (error) {
    console.error('❌ Temizleme hatası:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Ana kategorileri kontrol et
async function checkCurrentCategories() {
  console.log('🔍 Mevcut kategoriler kontrol ediliyor...')
  
  const allCategories = await prisma.category.findMany({
    orderBy: [{ parentId: 'asc' }, { order: 'asc' }]
  })
  
  const mainCategories = allCategories.filter(cat => !cat.parentId)
  const subCategories = allCategories.filter(cat => cat.parentId)
  
  console.log(`📂 Toplam kategoriler: ${allCategories.length}`)
  console.log(`🏠 Ana kategoriler: ${mainCategories.length}`)
  console.log(`📁 Alt kategoriler: ${subCategories.length}`)
  
  console.log('\n📋 Ana Kategoriler:')
  mainCategories.forEach(cat => {
    const subs = subCategories.filter(sub => sub.parentId === cat.id)
    console.log(`  - ${cat.name} (${cat.slug}) - ${subs.length} alt kategori`)
  })
  
  // Sorunlu kategorileri tespit et
  console.log('\n🚨 Potansiyel Sorunlar:')
  if (mainCategories.length > 4) {
    console.log(`⚠️  Ana kategori fazla: ${mainCategories.length} (olması gereken: 4)`)
  }
  
  // Türkçe kategori tespit
  const turkishCategories = allCategories.filter(cat => 
    /[çğıöşüÇĞIİÖŞÜ]/.test(cat.name) || 
    cat.name.includes('Kimya') || 
    cat.name.includes('Gıda') ||
    cat.name.includes('Yaşam')
  )
  
  if (turkishCategories.length > 0) {
    console.log(`⚠️  Türkçe kategoriler tespit edildi: ${turkishCategories.length}`)
    turkishCategories.forEach(cat => {
      console.log(`    - ${cat.name} (${cat.slug})`)
    })
  }
  
  await prisma.$disconnect()
}

// Komut satırından çalıştırma
const command = process.argv[2]

if (command === 'check') {
  checkCurrentCategories()
} else if (command === 'clean') {
  cleanDatabase()
} else {
  console.log(`
🔧 Kategori Yönetim Araçları

Kullanım:
  npm run categories:check  - Mevcut kategorileri kontrol et
  npm run categories:clean  - Kategorileri temizle

Önerilen sıralama:
  1. npm run categories:check
  2. npm run categories:clean  
  3. npm run seed
  `)
}