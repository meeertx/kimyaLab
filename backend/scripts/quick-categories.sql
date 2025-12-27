-- Önce mevcut kategorileri temizle
DELETE FROM "categories";

-- Ana kategorileri ekle
INSERT INTO "categories" (id, name, slug, description, "parentId", "order", "isActive", "createdAt", "updatedAt") VALUES
('cat1', 'Analitik Kimyasallar', 'analitik-kimyasallar', 'Analiz ve test amaçlı kimyasal maddeler', NULL, 1, true, NOW(), NOW()),
('cat2', 'Biyokimyasallar', 'biyokimyasallar', 'Biyolojik ve medikal kimyasal ürünler', NULL, 2, true, NOW(), NOW()),
('cat3', 'Organik Kimyasallar', 'organik-kimyasallar', 'Organik yapılı kimyasal bileşikler', NULL, 3, true, NOW(), NOW()),
('cat4', 'Laboratuvar Ekipmanları', 'laboratuvar-ekipmanlari', 'Laboratuvar araç ve gereçleri', NULL, 4, true, NOW(), NOW());