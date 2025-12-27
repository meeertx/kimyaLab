import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const categories = [
  // Ana Kategoriler
  {
    name: 'Analitik Kimyasallar',
    slug: 'analitik-kimyasallar',
    description: 'Analitik ölçüm ve test işlemleri için kullanılan kimyasal maddeler',
    imageUrl: null,
    isActive: true,
    order: 1,
    parentId: null,
    subcategories: [
      { name: 'HPLC Çözücüleri', slug: 'hplc-cozuculeri', description: 'Yüksek performanslı sıvı kromatografisi çözücüleri', order: 1 },
      { name: 'GC Standartları', slug: 'gc-standartlari', description: 'Gaz kromatografisi standart maddeleri', order: 2 },
      { name: 'Buffer Çözeltileri', slug: 'buffer-cozelitleri', description: 'pH tampon çözeltileri ve buffer sistemleri', order: 3 },
      { name: 'LC-MS Çözücüleri', slug: 'lcms-cozuculeri', description: 'Sıvı kromatografi kütle spektrometresi çözücüleri', order: 4 },
      { name: 'Spektroskopi Kimyasalları', slug: 'spektroskopi-kimyasallari', description: 'Spektroskopik analizler için kimyasallar', order: 5 },
      { name: 'pH Standartları', slug: 'ph-standartlari', description: 'pH ölçüm standartları ve kalibratörleri', order: 6 },
      { name: 'İyon Kromatografi', slug: 'iyon-kromatografi', description: 'İyon kromatografi sistemleri için kimyasallar', order: 7 },
      { name: 'Ayırma Kimyasalları', slug: 'ayirma-kimyasallari', description: 'Bileşen ayırma ve saflaştırma kimyasalları', order: 8 }
    ]
  },
  {
    name: 'Biyokimyasallar',
    slug: 'biyokimyasallar', 
    description: 'Biyolojik araştırmalar ve testler için kullanılan kimyasal maddeler',
    imageUrl: null,
    isActive: true,
    order: 2,
    parentId: null,
    subcategories: [
      { name: 'Enzimler', slug: 'enzimler', description: 'Biyokataliz ve enzimatik reaksiyonlar için enzimler', order: 1 },
      { name: 'Proteinler', slug: 'proteinler', description: 'Araştırma ve analiz amaçlı proteinler', order: 2 },
      { name: 'Antikorlar', slug: 'antikorlar', description: 'İmmünoloji ve tanı testleri için antikorlar', order: 3 },
      { name: 'Amino Asitler', slug: 'amino-asitler', description: 'Protein sentezi ve metabolizma çalışmaları için amino asitler', order: 4 },
      { name: 'PCR Reaktifleri', slug: 'pcr-reaktifleri', description: 'Polimeraz zincir reaksiyonu için reaktifler', order: 5 },
      { name: 'Hücre Kültürü Medyası', slug: 'hucre-kulturu-medyasi', description: 'Hücre kültürü ve büyütme ortamları', order: 6 },
      { name: 'Western Blot Reaktifleri', slug: 'western-blot-reaktifleri', description: 'Western blot analizi için reaktifler', order: 7 },
      { name: 'ELISA Kitleri', slug: 'elisa-kitleri', description: 'Enzim bağlantılı immunosorbent assay kitleri', order: 8 }
    ]
  },
  {
    name: 'Organik Kimyasallar',
    slug: 'organik-kimyasallar',
    description: 'Organik sentez ve araştırma için kullanılan kimyasal bileşikler',
    imageUrl: null,
    isActive: true,
    order: 3,
    parentId: null,
    subcategories: [
      { name: 'Çözücüler', slug: 'cozucular', description: 'Organik çözücüler ve çözücü karışımları', order: 1 },
      { name: 'Aromatik Bileşikler', slug: 'aromatik-bilesikler', description: 'Benzen türevi ve aromatik kimyasal bileşikler', order: 2 },
      { name: 'Alkoller', slug: 'alkoller', description: 'Alifatik ve aromatik alkoller', order: 3 },
      { name: 'Organik Asitler', slug: 'organik-asitler', description: 'Karboksilik asitler ve organik asit türevleri', order: 4 },
      { name: 'Esterler', slug: 'esterler', description: 'Organik esterler ve ester türevleri', order: 5 },
      { name: 'Aldehitler & Ketonlar', slug: 'aldehitler-ketonlar', description: 'Karbonilli organik bileşikler', order: 6 },
      { name: 'Alkil Halojenürler', slug: 'alkil-halojenurler', description: 'Halojen içeren organik bileşikler', order: 7 },
      { name: 'Organik Sentez Reaktifleri', slug: 'organik-sentez-reaktifleri', description: 'Organik sentez reaksiyonları için reaktifler', order: 8 }
    ]
  },
  {
    name: 'Laboratuvar Ekipmanları',
    slug: 'laboratuvar-ekipmanlari',
    description: 'Laboratuvar çalışmaları için gerekli araç gereç ve ekipmanlar',
    imageUrl: null,
    isActive: true,
    order: 4,
    parentId: null,
    subcategories: [
      { name: 'Cam Malzemeler', slug: 'cam-malzemeler', description: 'Laboratuvar cam malzemeleri ve kapları', order: 1 },
      { name: 'Plastik Malzemeler', slug: 'plastik-malzemeler', description: 'Plastik laboratuvar malzemeleri', order: 2 },
      { name: 'pH Metreleri', slug: 'ph-metreleri', description: 'Dijital ve analog pH ölçüm cihazları', order: 3 },
      { name: 'Analitik Teraziler', slug: 'analitik-teraziler', description: 'Hassas ölçüm için analitik teraziler', order: 4 },
      { name: 'Spektrofotometreler', slug: 'spektrofotometreler', description: 'UV-Vis ve diğer spektrofotometreler', order: 5 },
      { name: 'Mikropipetler', slug: 'mikropipetler', description: 'Hassas hacim ölçümleri için mikropipetler', order: 6 },
      { name: 'Güvenlik Ekipmanları', slug: 'guvenlik-ekipmanlari', description: 'Laboratuvar güvenliği için koruyucu ekipmanlar', order: 7 },
      { name: 'Metal Aletler', slug: 'metal-aletler', description: 'Paslanmaz çelik ve metal laboratuvar aletleri', order: 8 }
    ]
  }
]

async function seedCategories() {
  console.log('🌱 Starting category seeding...')

  try {
    // Önce mevcut kategorileri temizle (soft delete)
    await prisma.category.updateMany({
      data: { isActive: false }
    })

    console.log('✅ Existing categories deactivated')

    // Ana kategorileri ve alt kategorileri oluştur
    for (const categoryData of categories) {
      // Ana kategoriyi oluştur
      const mainCategory = await prisma.category.create({
        data: {
          name: categoryData.name,
          slug: categoryData.slug,
          description: categoryData.description,
          imageUrl: categoryData.imageUrl,
          isActive: categoryData.isActive,
          order: categoryData.order,
          parentId: categoryData.parentId
        }
      })

      console.log(`✅ Created main category: ${mainCategory.name}`)

      // Alt kategorileri oluştur
      if (categoryData.subcategories) {
        for (const subCategoryData of categoryData.subcategories) {
          const subCategory = await prisma.category.create({
            data: {
              name: subCategoryData.name,
              slug: subCategoryData.slug,
              description: subCategoryData.description,
              imageUrl: null,
              isActive: true,
              order: subCategoryData.order,
              parentId: mainCategory.id
            }
          })

          console.log(`  ✅ Created subcategory: ${subCategory.name}`)
        }
      }
    }

    console.log('🎉 Category seeding completed successfully!')
    
    // Toplam sayıları göster
    const totalCategories = await prisma.category.count({
      where: { isActive: true }
    })
    
    const mainCategories = await prisma.category.count({
      where: { isActive: true, parentId: null }
    })
    
    const subCategories = await prisma.category.count({
      where: { isActive: true, parentId: { not: null } }
    })

    console.log(`📊 Summary:`)
    console.log(`   Total categories: ${totalCategories}`)
    console.log(`   Main categories: ${mainCategories}`) 
    console.log(`   Subcategories: ${subCategories}`)

  } catch (error) {
    console.error('❌ Error seeding categories:', error)
    throw error
  }
}

async function main() {
  try {
    await seedCategories()
  } catch (error) {
    console.error('Failed to seed categories:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()