import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const categories = [
  // Ana Kategoriler
  { name: 'Analitik Kimyasallar', slug: 'analitik-kimyasallar', description: 'Analiz ve test amaçlı kimyasal maddeler', parentId: null, order: 1 },
  { name: 'Biyokimyasallar', slug: 'biyokimyasallar', description: 'Biyolojik ve medikal kimyasal ürünler', parentId: null, order: 2 },
  { name: 'Organik Kimyasallar', slug: 'organik-kimyasallar', description: 'Organik yapılı kimyasal bileşikler', parentId: null, order: 3 },
  { name: 'Laboratuvar Ekipmanları', slug: 'laboratuvar-ekipmanlari', description: 'Laboratuvar araç ve gereçleri', parentId: null, order: 4 }
]

async function main() {
  console.log('🌱 Kategori seeding başlıyor...')
  
  // Önce mevcut kategorileri temizle
  await prisma.category.deleteMany({})
  console.log('✅ Mevcut kategoriler temizlendi')

  // Ana kategorileri oluştur
  for (const category of categories) {
    const created = await prisma.category.create({
      data: category
    })
    console.log(`✅ Kategori oluşturuldu: ${created.name}`)
  }

  console.log('🎉 Kategori seeding tamamlandı!')
}

main()
  .catch((e) => {
    console.error('❌ Seed hatası:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })