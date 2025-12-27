-- Check latest images data in database after upload test
SELECT 
    id,
    name,
    images,
    CASE 
        WHEN images IS NULL THEN 'NULL'
        WHEN images::text = '[]' THEN 'EMPTY ARRAY'
        WHEN images::text = 'null' THEN 'NULL STRING'
        ELSE 'HAS DATA'
    END as images_status,
    length(images::text) as images_length,
    "createdAt",
    "updatedAt"
FROM "Product" 
WHERE "updatedAt" >= NOW() - INTERVAL '1 hour'
ORDER BY "updatedAt" DESC
LIMIT 10;

-- Check the SuminePella product specifically (ID from logs: cmggp0lo30001o2n56uzs1lie)
SELECT 
    id,
    name,
    images,
    CASE 
        WHEN images IS NULL THEN 'NULL'
        WHEN images::text = '[]' THEN 'EMPTY ARRAY'
        WHEN images::text = 'null' THEN 'NULL STRING'
        ELSE 'HAS DATA'
    END as images_status,
    "createdAt",
    "updatedAt"
FROM "Product" 
WHERE id = 'cmggp0lo30001o2n56uzs1lie';

-- Check all products with any images
SELECT 
    id,
    name,
    images,
    "updatedAt"
FROM "Product" 
WHERE images IS NOT NULL 
    AND images::text != '[]' 
    AND images::text != 'null'
ORDER BY "updatedAt" DESC;