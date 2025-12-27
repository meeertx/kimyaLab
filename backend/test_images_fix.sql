-- Test Images Fix - Resim Görüntüleme Problemi Çözümü
-- Manuel test resim URL'leri ekleme

UPDATE products 
SET images = ARRAY[
    'https://res.cloudinary.com/demo/image/upload/sample.jpg',
    'https://res.cloudinary.com/demo/image/upload/w_400/sample.jpg'
]
WHERE id = 'cmggux6pi0003hy64b30na6cz';

-- Kontrol sorgusu
SELECT id, name, images, array_length(images, 1) as image_count 
FROM products 
WHERE id = 'cmggux6pi0003hy64b30na6cz';