-- Önce mevcut kategorileri temizle
DELETE FROM "categories";

-- Ana kategorileri ekle (kullanıcının istediği yapı)
INSERT INTO "categories" (id, name, slug, description, "parentId", "order", "isActive", "createdAt", "updatedAt") VALUES

-- 1. CHEMICALS (Ana Kategori)
('chemicals', 'Chemicals', 'chemicals', 'Chemical products and reagents', NULL, 1, true, NOW(), NOW()),

-- Chemicals Alt Kategorileri
('absorbents-adsorbents', 'Absorbents & adsorbents', 'absorbents-adsorbents', 'Absorbent and adsorbent materials', 'chemicals', 1, true, NOW(), NOW()),
('acids-bases', 'Acids & bases', 'acids-bases', 'Acid and base solutions', 'chemicals', 2, true, NOW(), NOW()),
('alcohols', 'Alcohols', 'alcohols', 'Alcohol compounds', 'chemicals', 3, true, NOW(), NOW()),
('buffers', 'Buffers', 'buffers', 'Buffer solutions', 'chemicals', 4, true, NOW(), NOW()),
('catalysts', 'Catalysts', 'catalysts', 'Catalyst materials', 'chemicals', 5, true, NOW(), NOW()),
('dyes-stains-indicators', 'Dyes, stains & indicators', 'dyes-stains-indicators', 'Dyes, stains and indicator compounds', 'chemicals', 6, true, NOW(), NOW()),
('elements-elemental-solutions', 'Elements & elemental solutions', 'elements-elemental-solutions', 'Elemental compounds and solutions', 'chemicals', 7, true, NOW(), NOW()),
('grease-oils-paraffins', 'Grease, oils & paraffins', 'grease-oils-paraffins', 'Grease, oil and paraffin products', 'chemicals', 8, true, NOW(), NOW()),
('macherey-nagel-products', 'Macherey-Nagel products', 'macherey-nagel-products', 'Macherey-Nagel branded products', 'chemicals', 9, true, NOW(), NOW()),
('oxides', 'Oxides', 'oxides', 'Oxide compounds', 'chemicals', 10, true, NOW(), NOW()),
('salts-minerals', 'Salts & minerals', 'salts-minerals', 'Salt and mineral compounds', 'chemicals', 11, true, NOW(), NOW()),
('reagents', 'Reagents', 'reagents', 'Chemical reagents', 'chemicals', 12, true, NOW(), NOW()),
('solvents-water', 'Solvents & water', 'solvents-water', 'Solvents and purified water', 'chemicals', 13, true, NOW(), NOW()),
('standards', 'Standards', 'standards', 'Reference standards', 'chemicals', 14, true, NOW(), NOW()),

-- 2. LIFE SCIENCES (Ana Kategori)
('life-sciences', 'Life Sciences', 'life-sciences', 'Life science products and reagents', NULL, 2, true, NOW(), NOW()),

-- Life Sciences Alt Kategorileri
('amino-acids', 'Amino acids', 'amino-acids', 'Amino acid compounds', 'life-sciences', 1, true, NOW(), NOW()),
('antibiotics-antimycotics', 'Antibiotics & antimycotics', 'antibiotics-antimycotics', 'Antibiotic and antimycotic agents', 'life-sciences', 2, true, NOW(), NOW()),
('life-sciences-buffers', 'Life Sciences buffers', 'life-sciences-buffers', 'Specialized buffers for life sciences', 'life-sciences', 3, true, NOW(), NOW()),
('bioreagents', 'Bioreagents', 'bioreagents', 'Biological reagents', 'life-sciences', 4, true, NOW(), NOW()),
('carbohydrates-sugars', 'Carbohydrates & sugars', 'carbohydrates-sugars', 'Carbohydrate and sugar compounds', 'life-sciences', 5, true, NOW(), NOW()),
('decontamination-cleaning', 'Decontamination & cleaning', 'decontamination-cleaning', 'Decontamination and cleaning solutions', 'life-sciences', 6, true, NOW(), NOW()),
('detergents', 'Detergents', 'detergents', 'Detergent compounds', 'life-sciences', 7, true, NOW(), NOW()),
('enzymes', 'Enzymes', 'enzymes', 'Enzyme products', 'life-sciences', 8, true, NOW(), NOW()),
('histology', 'Histology', 'histology', 'Histology products', 'life-sciences', 9, true, NOW(), NOW()),
('microbiology-cell-culture', 'Microbiology & cell culture', 'microbiology-cell-culture', 'Microbiology and cell culture products', 'life-sciences', 10, true, NOW(), NOW()),
('molecular-biology', 'Molecular biology', 'molecular-biology', 'Molecular biology products', 'life-sciences', 11, true, NOW(), NOW()),
('protein-biochemistry', 'Protein biochemistry', 'protein-biochemistry', 'Protein biochemistry products', 'life-sciences', 12, true, NOW(), NOW()),
('vitamins', 'Vitamins', 'vitamins', 'Vitamin compounds', 'life-sciences', 13, true, NOW(), NOW()),

-- 3. RAW MATERIALS (Ana Kategori)
('raw-materials', 'Raw materials', 'raw-materials', 'Raw material products', NULL, 3, true, NOW(), NOW()),

-- Raw Materials Alt Kategorileri
('biopharma', 'Biopharma', 'biopharma', 'Biopharmaceutical raw materials', 'raw-materials', 1, true, NOW(), NOW()),
('pharma', 'Pharma', 'pharma', 'Pharmaceutical raw materials', 'raw-materials', 2, true, NOW(), NOW()),
('diagnostics', 'Diagnostics', 'diagnostics', 'Diagnostic raw materials', 'raw-materials', 3, true, NOW(), NOW()),
('food', 'Food', 'food', 'Food industry raw materials', 'raw-materials', 4, true, NOW(), NOW()),

-- 4. APPLICATIONS (Ana Kategori)
('applications', 'Applications', 'applications', 'Application-specific products', NULL, 4, true, NOW(), NOW()),

-- Applications Alt Kategorileri
('chromatography-gc-hplc', 'Chromatography (GC & HPLC)', 'chromatography-gc-hplc', 'Gas and liquid chromatography products', 'applications', 1, true, NOW(), NOW()),
('decontamination-cleaning-app', 'Decontamination & cleaning', 'decontamination-cleaning-app', 'Application-specific decontamination and cleaning', 'applications', 2, true, NOW(), NOW()),
('karl-fischer-titration', 'Karl Fischer titration', 'karl-fischer-titration', 'Karl Fischer titration products', 'applications', 3, true, NOW(), NOW()),
('kjeldahl-analysis', 'Kjeldahl analysis', 'kjeldahl-analysis', 'Kjeldahl analysis products', 'applications', 4, true, NOW(), NOW()),
('microbiology-cell-culture-app', 'Microbiology & cell culture', 'microbiology-cell-culture-app', 'Application-specific microbiology and cell culture', 'applications', 5, true, NOW(), NOW()),
('protein-biochemistry-app', 'Protein biochemistry', 'protein-biochemistry-app', 'Application-specific protein biochemistry', 'applications', 6, true, NOW(), NOW()),
('spectroscopy-ms', 'Spectroscopy & MS', 'spectroscopy-ms', 'Spectroscopy and mass spectrometry products', 'applications', 7, true, NOW(), NOW()),
('titration', 'Titration', 'titration', 'Titration products', 'applications', 8, true, NOW(), NOW());