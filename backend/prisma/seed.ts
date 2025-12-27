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

  // Test kullanıcısı oluştur
  const userPassword = await bcrypt.hash('user123!', 12)
  const user = await prisma.user.upsert({
    where: { email: 'user@kimyalab.com' },
    update: {},
    create: {
      email: 'user@kimyalab.com',
      password: userPassword,
      name: 'Test User',
      role: UserRole.USER,
      isActive: true,
    },
  })

  console.log('👤 Test kullanıcısı oluşturuldu:', user.email)

  // Ana kategorileri oluştur - Professional Chemistry Categories
  const mainCategories = [
    {
      name: 'Chemicals',
      slug: 'chemicals',
      description: 'Laboratory chemicals, reagents and analytical standards',
      order: 1
    },
    {
      name: 'Life Sciences',
      slug: 'life-sciences',
      description: 'Biochemicals, enzymes and life science research products',
      order: 2
    },
    {
      name: 'Raw Materials',
      slug: 'raw-materials',
      description: 'Industrial raw materials and bulk chemicals',
      order: 3
    },
    {
      name: 'Applications',
      slug: 'applications',
      description: 'Application-specific products and analytical solutions',
      order: 4
    }
  ]

  // Ana kategorileri oluştur
  const createdMainCategories: any = {}
  for (const categoryData of mainCategories) {
    const category = await prisma.category.upsert({
      where: { slug: categoryData.slug },
      update: {},
      create: categoryData,
    })
    createdMainCategories[category.slug] = category
    console.log(`📂 Ana kategori oluşturuldu: ${category.name}`)
  }

  // Alt kategorileri oluştur - Professional Chemistry Subcategories
  const subCategories = [
    // Chemicals subcategories
    {
      name: 'Absorbents & Adsorbents',
      slug: 'absorbents-adsorbents',
      description: 'Drying agents, molecular sieves and adsorbent materials',
      parentSlug: 'chemicals',
      order: 1
    },
    {
      name: 'Acids & Bases',
      slug: 'acids-bases',
      description: 'Analytical grade acids, bases and pH solutions',
      parentSlug: 'chemicals',
      order: 2
    },
    {
      name: 'Alcohols',
      slug: 'alcohols',
      description: 'Laboratory grade alcohols and glycols',
      parentSlug: 'chemicals',
      order: 3
    },
    {
      name: 'Buffers',
      slug: 'buffers',
      description: 'pH buffer solutions and buffer components',
      parentSlug: 'chemicals',
      order: 4
    },
    {
      name: 'Catalysts',
      slug: 'catalysts',
      description: 'Catalysts for synthesis and analytical applications',
      parentSlug: 'chemicals',
      order: 5
    },
    {
      name: 'Dyes, Stains & Indicators',
      slug: 'dyes-stains-indicators',
      description: 'Biological stains, pH indicators and analytical dyes',
      parentSlug: 'chemicals',
      order: 6
    },
    {
      name: 'Elements & Elemental Solutions',
      slug: 'elements-elemental-solutions',
      description: 'Pure elements and standard elemental solutions',
      parentSlug: 'chemicals',
      order: 7
    },
    {
      name: 'Grease, Oils & Paraffins',
      slug: 'grease-oils-paraffins',
      description: 'Laboratory greases, oils and paraffin products',
      parentSlug: 'chemicals',
      order: 8
    },
    {
      name: 'Macherey-Nagel Products',
      slug: 'macherey-nagel-products',
      description: 'Specialized Macherey-Nagel laboratory products',
      parentSlug: 'chemicals',
      order: 9
    },
    {
      name: 'Oxides',
      slug: 'oxides',
      description: 'Metal oxides and oxide compounds',
      parentSlug: 'chemicals',
      order: 10
    },
    {
      name: 'Salts & Minerals',
      slug: 'salts-minerals',
      description: 'Inorganic salts and mineral compounds',
      parentSlug: 'chemicals',
      order: 11
    },
    {
      name: 'Reagents',
      slug: 'reagents',
      description: 'General laboratory reagents and fine chemicals',
      parentSlug: 'chemicals',
      order: 12
    },
    {
      name: 'Solvents & Water',
      slug: 'solvents-water',
      description: 'High purity solvents and purified water',
      parentSlug: 'chemicals',
      order: 13
    },
    {
      name: 'Standards',
      slug: 'standards',
      description: 'Reference standards and calibration solutions',
      parentSlug: 'chemicals',
      order: 14
    },

    // Life Sciences subcategories
    {
      name: 'Amino Acids',
      slug: 'amino-acids',
      description: 'L-amino acids, derivatives and protected amino acids',
      parentSlug: 'life-sciences',
      order: 1
    },
    {
      name: 'Antibiotics & Antimycotics',
      slug: 'antibiotics-antimycotics',
      description: 'Antibiotics, antimycotics and antimicrobial agents',
      parentSlug: 'life-sciences',
      order: 2
    },
    {
      name: 'Life Sciences Buffers',
      slug: 'life-sciences-buffers',
      description: 'Biological buffers and buffer systems',
      parentSlug: 'life-sciences',
      order: 3
    },
    {
      name: 'Bioreagents',
      slug: 'bioreagents',
      description: 'Biochemical reagents and biological compounds',
      parentSlug: 'life-sciences',
      order: 4
    },
    {
      name: 'Carbohydrates & Sugars',
      slug: 'carbohydrates-sugars',
      description: 'Monosaccharides, disaccharides and sugar derivatives',
      parentSlug: 'life-sciences',
      order: 5
    },
    {
      name: 'Decontamination & Cleaning',
      slug: 'decontamination-cleaning-ls',
      description: 'Laboratory decontamination and cleaning solutions',
      parentSlug: 'life-sciences',
      order: 6
    },
    {
      name: 'Detergents',
      slug: 'detergents',
      description: 'Biological detergents and surfactants',
      parentSlug: 'life-sciences',
      order: 7
    },
    {
      name: 'Enzymes',
      slug: 'enzymes',
      description: 'Enzymes for research and analytical applications',
      parentSlug: 'life-sciences',
      order: 8
    },
    {
      name: 'Histology',
      slug: 'histology',
      description: 'Histological stains, fixatives and embedding media',
      parentSlug: 'life-sciences',
      order: 9
    },
    {
      name: 'Microbiology & Cell Culture',
      slug: 'microbiology-cell-culture-ls',
      description: 'Culture media, supplements and microbiology reagents',
      parentSlug: 'life-sciences',
      order: 10
    },
    {
      name: 'Molecular Biology',
      slug: 'molecular-biology',
      description: 'DNA/RNA reagents, PCR components and cloning reagents',
      parentSlug: 'life-sciences',
      order: 11
    },
    {
      name: 'Protein Biochemistry',
      slug: 'protein-biochemistry-ls',
      description: 'Protein analysis reagents and biochemical assays',
      parentSlug: 'life-sciences',
      order: 12
    },
    {
      name: 'Vitamins',
      slug: 'vitamins',
      description: 'Vitamins, cofactors and nutritional supplements',
      parentSlug: 'life-sciences',
      order: 13
    },

    // Raw Materials subcategories
    {
      name: 'Biopharma',
      slug: 'biopharma',
      description: 'Raw materials for biopharmaceutical applications',
      parentSlug: 'raw-materials',
      order: 1
    },
    {
      name: 'Pharma',
      slug: 'pharma',
      description: 'Pharmaceutical raw materials and excipients',
      parentSlug: 'raw-materials',
      order: 2
    },
    {
      name: 'Diagnostics',
      slug: 'diagnostics',
      description: 'Raw materials for diagnostic applications',
      parentSlug: 'raw-materials',
      order: 3
    },
    {
      name: 'Food',
      slug: 'food',
      description: 'Food grade raw materials and additives',
      parentSlug: 'raw-materials',
      order: 4
    },

    // Applications subcategories
    {
      name: 'Chromatography (GC & HPLC)',
      slug: 'chromatography-gc-hplc',
      description: 'Chromatography solvents, standards and accessories',
      parentSlug: 'applications',
      order: 1
    },
    {
      name: 'Decontamination & Cleaning',
      slug: 'decontamination-cleaning-app',
      description: 'Industrial decontamination and cleaning chemicals',
      parentSlug: 'applications',
      order: 2
    },
    {
      name: 'Karl Fischer Titration',
      slug: 'karl-fischer-titration',
      description: 'Karl Fischer reagents and water determination',
      parentSlug: 'applications',
      order: 3
    },
    {
      name: 'Kjeldahl Analysis',
      slug: 'kjeldahl-analysis',
      description: 'Kjeldahl reagents for nitrogen determination',
      parentSlug: 'applications',
      order: 4
    },
    {
      name: 'Microbiology & Cell Culture',
      slug: 'microbiology-cell-culture-app',
      description: 'Microbiology and cell culture applications',
      parentSlug: 'applications',
      order: 5
    },
    {
      name: 'Protein Biochemistry',
      slug: 'protein-biochemistry-app',
      description: 'Protein analysis and biochemistry applications',
      parentSlug: 'applications',
      order: 6
    },
    {
      name: 'Spectroscopy & MS',
      slug: 'spectroscopy-ms',
      description: 'Spectroscopy and mass spectrometry applications',
      parentSlug: 'applications',
      order: 7
    },
    {
      name: 'Titration',
      slug: 'titration',
      description: 'Titration reagents and volumetric solutions',
      parentSlug: 'applications',
      order: 8
    }
  ]

  // Alt kategorileri oluştur
  for (const subCategoryData of subCategories) {
    const parentCategory = createdMainCategories[subCategoryData.parentSlug]
    if (parentCategory) {
      const { parentSlug, ...categoryData } = subCategoryData
      const subCategory = await prisma.category.upsert({
        where: { slug: categoryData.slug },
        update: {},
        create: {
          ...categoryData,
          parentId: parentCategory.id
        },
      })
      console.log(`📁 Alt kategori oluşturuldu: ${parentCategory.name} > ${subCategory.name}`)
    }
  }

  // Örnek ürünler oluştur - Yeni profesyonel kategorileri kullan
  const reagentsCategory = await prisma.category.findFirst({
    where: { slug: 'reagents' }
  })

  const acidsBasesCategory = await prisma.category.findFirst({
    where: { slug: 'acids-bases' }
  })

  const solventsCategory = await prisma.category.findFirst({
    where: { slug: 'solvents-water' }
  })

  const foodCategory = await prisma.category.findFirst({
    where: { slug: 'food' }
  })

  const microbiologyCategory = await prisma.category.findFirst({
    where: { slug: 'microbiology-cell-culture-ls' }
  })

  if (reagentsCategory) {
    const sampleProducts = [
      {
        name: 'Sodium Chloride (NaCl) - Analytical Grade',
        code: 'KL-001',
        description: 'High purity sodium chloride for analytical applications. Ideal for buffer preparation, cell culture and protein precipitation.',
        category: 'Reagents',
        price: 45.50,
        stockQuantity: 100,
        minStockLevel: 10,
        unit: 'kg',
        categoryId: reagentsCategory.id,
        createdBy: admin.id,
        technicalSpecs: [
          { name: 'Purity', value: '>99.5%', unit: '%' },
          { name: 'Moisture', value: '<0.5%', unit: '%' },
          { name: 'Insolubles', value: '<0.005%', unit: '%' }
        ],
        applications: [
          'Buffer preparation',
          'Cell culture',
          'Protein precipitation',
          'Electrophoresis'
        ],
        certifications: ['ISO 9001', 'GMP', 'Analytical Certificate'],
        images: []
      },
      {
        name: 'Potassium Hydroxide (KOH) - Technical Grade',
        code: 'KL-002',
        description: 'Strong base potassium hydroxide for pH adjustment and saponification reactions.',
        category: 'Reagents',
        price: 78.00,
        stockQuantity: 50,
        minStockLevel: 5,
        unit: 'kg',
        categoryId: reagentsCategory.id,
        createdBy: admin.id,
        technicalSpecs: [
          { name: 'Concentration', value: '≥85%', unit: '%' },
          { name: 'Carbonate', value: '≤2%', unit: '%' },
          { name: 'Chloride', value: '≤0.01%', unit: '%' }
        ],
        applications: [
          'pH adjustment',
          'Saponification reactions',
          'Organic synthesis',
          'Cleaning solutions'
        ],
        certifications: ['Technical Grade', 'MSDS Available'],
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
      console.log(`📊 Inventory kaydı oluşturuldu: ${product.name}`)
    }
  }

  // Çözücüler kategorisi için ürünler
  if (solventsCategory) {
    const solventProducts = [
      {
        name: 'Ethanol (96%) - Laboratory Grade',
        code: 'KL-003',
        description: 'Non-denatured ethanol, high purity for laboratory use.',
        category: 'Solvents & Water',
        price: 125.00,
        stockQuantity: 30,
        minStockLevel: 5,
        unit: 'L',
        categoryId: solventsCategory.id,
        createdBy: admin.id,
        technicalSpecs: [
          { name: 'Concentration', value: '96%', unit: '%' },
          { name: 'Water content', value: '4%', unit: '%' },
          { name: 'Methanol', value: '<0.1%', unit: '%' }
        ],
        applications: [
          'Solvent applications',
          'Extraction procedures',
          'Cleaning',
          'Sterilization'
        ],
        certifications: ['Laboratory Grade', 'MSDS Available'],
        images: []
      },
      {
        name: 'Dichloromethane (DCM) - HPLC Grade',
        code: 'KL-004',
        description: 'High purity dichloromethane for chromatography and organic synthesis.',
        category: 'Solvents & Water',
        price: 195.00,
        stockQuantity: 15,
        minStockLevel: 3,
        unit: 'L',
        categoryId: solventsCategory.id,
        createdBy: admin.id,
        technicalSpecs: [
          { name: 'Purity', value: '≥99.8%', unit: '%' },
          { name: 'Water content', value: '<0.01%', unit: '%' },
          { name: 'UV Absorbance (254nm)', value: '<0.01', unit: 'AU' }
        ],
        applications: [
          'HPLC analysis',
          'Organic synthesis',
          'Extraction',
          'Chromatography'
        ],
        certifications: ['HPLC Grade', 'GC-MS Compatible'],
        images: []
      }
    ]

    for (const productData of solventProducts) {
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
          location: 'Çözücü Deposu',
          updatedBy: admin.id,
        },
      })
      console.log(`📊 Inventory kaydı oluşturuldu: ${product.name}`)
    }
  }

  // Asit ve Baz kategorisi için ürünler
  if (acidsBasesCategory) {
    const acidsProducts = [
      {
        name: 'Acetic Acid (CH3COOH) - Glacial',
        code: 'KL-005',
        description: 'Anhydrous acetic acid for organic synthesis and analysis.',
        category: 'Acids & Bases',
        price: 89.50,
        stockQuantity: 25,
        minStockLevel: 5,
        unit: 'L',
        categoryId: acidsBasesCategory.id,
        createdBy: admin.id,
        technicalSpecs: [
          { name: 'Purity', value: '≥99.7%', unit: '%' },
          { name: 'Water content', value: '<0.2%', unit: '%' },
          { name: 'Aldehydes', value: '<0.01%', unit: '%' }
        ],
        applications: [
          'Organic synthesis',
          'pH adjustment',
          'Buffer preparation',
          'Crystallization'
        ],
        certifications: ['Reagent Grade', 'ACS Standard'],
        images: []
      }
    ]

    for (const productData of acidsProducts) {
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
          location: 'Acids & Bases Storage',
          updatedBy: admin.id,
        },
      })
      console.log(`📊 Inventory kaydı oluşturuldu: ${product.name}`)
    }
  }

  // Gıda Ham Maddeleri için örnek ürünler
  if (foodCategory) {
    const foodProducts = [
      {
        name: 'Citric Acid - Food Grade',
        code: 'KL-006',
        description: 'Food grade citric acid for food industry, used as preservative and pH regulator.',
        category: 'Food',
        subCategory: 'Acidulants',
        price: 65.00,
        stockQuantity: 200,
        minStockLevel: 20,
        unit: 'kg',
        categoryId: foodCategory.id,
        createdBy: admin.id,
        technicalSpecs: [
          { name: 'Purity', value: '≥99.5%', unit: '%' },
          { name: 'Heavy Metals', value: '<5ppm', unit: 'ppm' },
          { name: 'Moisture', value: '<0.5%', unit: '%' }
        ],
        applications: [
          'Food preservative',
          'pH regulator',
          'Flavor enhancer',
          'Beverage production'
        ],
        certifications: ['Food Grade', 'HACCP', 'ISO 22000'],
        images: []
      },
      {
        name: 'Xanthan Gum - Food Grade',
        code: 'KL-007',
        description: 'Food grade xanthan gum used as thickener and stabilizer.',
        category: 'Food',
        subCategory: 'Stabilizers',
        price: 450.00,
        stockQuantity: 25,
        minStockLevel: 3,
        unit: 'kg',
        categoryId: foodCategory.id,
        createdBy: admin.id,
        technicalSpecs: [
          { name: 'Viscosity', value: '1200-1600', unit: 'cP' },
          { name: 'Moisture', value: '<13%', unit: '%' },
          { name: 'Protein', value: '<6%', unit: '%' }
        ],
        applications: [
          'Sauces and creams',
          'Gluten-free products',
          'Salad dressings',
          'Ice cream production'
        ],
        certifications: ['E415 Approved', 'Halal Certified', 'Kosher'],
        images: []
      }
    ]

    for (const productData of foodProducts) {
      const product = await prisma.product.upsert({
        where: { code: productData.code },
        update: {},
        create: productData,
      })
      console.log(`📦 Food product created: ${product.name}`)

      // Inventory kaydı oluştur
      await prisma.inventory.upsert({
        where: { productId: product.id },
        update: {},
        create: {
          productId: product.id,
          quantity: productData.stockQuantity,
          minLevel: productData.minStockLevel,
          location: 'Food Raw Materials Storage',
          updatedBy: admin.id,
        },
      })
      console.log(`📊 Inventory kaydı oluşturuldu: ${product.name}`)
    }
  }

  // Mikrobiyoloji için örnek ürünler
  if (microbiologyCategory) {
    const microProducts = [
      {
        name: 'Nutrient Agar - Microbiology',
        code: 'KL-008',
        description: 'General purpose culture medium for bacterial isolation and cultivation.',
        category: 'Microbiology & Cell Culture',
        subCategory: 'Culture Media',
        price: 85.00,
        stockQuantity: 50,
        minStockLevel: 8,
        unit: 'kg',
        categoryId: microbiologyCategory.id,
        createdBy: admin.id,
        technicalSpecs: [
          { name: 'pH', value: '7.2±0.2', unit: 'pH' },
          { name: 'Moisture', value: '<5%', unit: '%' },
          { name: 'Sterility', value: 'Sterile', unit: '' }
        ],
        applications: [
          'Bacterial culture',
          'Microorganism isolation',
          'Antibiotic susceptibility testing',
          'Quality control'
        ],
        certifications: ['USP', 'EP', 'Microbiology Grade'],
        images: []
      }
    ]

    for (const productData of microProducts) {
      const product = await prisma.product.upsert({
        where: { code: productData.code },
        update: {},
        create: productData,
      })
      console.log(`📦 Microbiology product created: ${product.name}`)

      // Inventory kaydı oluştur
      await prisma.inventory.upsert({
        where: { productId: product.id },
        update: {},
        create: {
          productId: product.id,
          quantity: productData.stockQuantity,
          minLevel: productData.minStockLevel,
          location: 'Microbiology Storage',
          updatedBy: admin.id,
        },
      })
      console.log(`📊 Inventory kaydı oluşturuldu: ${product.name}`)
    }
  }

  console.log('')
  console.log('✅ Professional Chemistry Database Seed Completed Successfully!')
  console.log(`👥 ${await prisma.user.count()} users created`)
  console.log(`📂 ${await prisma.category.count()} categories created (Main + Sub)`)
  console.log(`📦 ${await prisma.product.count()} products created`)
  console.log(`📊 ${await prisma.inventory.count()} inventory records created`)
  console.log('')
  console.log('🎯 Professional Hierarchical Category Structure:')
  console.log('   📁 Chemicals (14 subcategories)')
  console.log('     └── Absorbents, Acids & Bases, Alcohols, Buffers, Catalysts, Dyes & Indicators, etc.')
  console.log('   📁 Life Sciences (13 subcategories)')
  console.log('     └── Amino Acids, Antibiotics, Enzymes, Molecular Biology, Protein Biochemistry, etc.')
  console.log('   📁 Raw Materials (4 subcategories)')
  console.log('     └── Biopharma, Pharma, Diagnostics, Food')
  console.log('   📁 Applications (8 subcategories)')
  console.log('     └── Chromatography, Karl Fischer, Spectroscopy, Titration, etc.')
  console.log('')
  console.log('🧪 Ready for professional laboratory chemical management!')
}

main()
  .catch((e) => {
    console.error('❌ Seed hatası:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })