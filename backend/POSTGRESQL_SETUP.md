# PostgreSQL Kurulum ve Konfigürasyon Rehberi

Bu rehber macOS için PostgreSQL kurulumunu ve KimyaLab projesi için konfigürasyonunu anlatmaktadır.

## 1. PostgreSQL Kurulumu

### Seçenek A: Homebrew ile Kurulum (Önerilen)

```bash
# Homebrew'i güncelle
brew update

# PostgreSQL kur
brew install postgresql@15

# PostgreSQL servisini başlat
brew services start postgresql@15

# PATH'e ekle
echo 'export PATH="/opt/homebrew/opt/postgresql@15/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

### Seçenek B: PostgreSQL.app ile Kurulum

1. [PostgreSQL.app](https://postgresapp.com/) sitesinden indirin
2. Uygulamayı Applications klasörüne taşıyın
3. PostgreSQL.app'i çalıştırın
4. PATH'e ekleyin:
```bash
echo 'export PATH="/Applications/Postgres.app/Contents/Versions/latest/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

### Seçenek C: Docker ile Kurulum

```bash
# Docker Compose dosyası oluştur (docker-compose.dev.yml)
docker-compose -f docker-compose.dev.yml up -d postgres
```

## 2. PostgreSQL Konfigürasyonu

### Veritabanı ve Kullanıcı Oluşturma

```bash
# PostgreSQL komut satırına gir
psql postgres

# Veritabanı kullanıcısı oluştur
CREATE USER kimyalab_user WITH PASSWORD 'kimyalab_password_2024!';

# Veritabanı oluştur
CREATE DATABASE kimyalab_dev OWNER kimyalab_user;

# Test veritabanı oluştur
CREATE DATABASE kimyalab_test OWNER kimyalab_user;

# Kullanıcıya gerekli yetkileri ver
GRANT ALL PRIVILEGES ON DATABASE kimyalab_dev TO kimyalab_user;
GRANT ALL PRIVILEGES ON DATABASE kimyalab_test TO kimyalab_user;

# PostgreSQL'den çık
\q
```

### Bağlantı Testı

```bash
# Oluşturduğun veritabanına bağlan
psql -U kimyalab_user -d kimyalab_dev -h localhost

# Başarılıysa çık
\q
```

## 3. Environment Konfigürasyonu

`.env` dosyasındaki DATABASE_URL'yi güncelle:

```bash
DATABASE_URL="postgresql://kimyalab_user:kimyalab_password_2024!@localhost:5432/kimyalab_dev?schema=public"
```

## 4. Docker Compose Alternativo (İsteğe Bağlı)

Eğer Docker kullanmak isterseniz, `docker-compose.dev.yml` dosyası:

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15-alpine
    container_name: kimyalab-postgres-dev
    restart: always
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: kimyalab_user
      POSTGRES_PASSWORD: kimyalab_password_2024!
      POSTGRES_DB: kimyalab_dev
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./postgres-init:/docker-entrypoint-initdb.d
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U kimyalab_user -d kimyalab_dev"]
      interval: 10s
      timeout: 5s
      retries: 5

  pgadmin:
    image: dpage/pgadmin4:latest
    container_name: kimyalab-pgadmin
    restart: always
    ports:
      - "8080:80"
    environment:
      PGADMIN_DEFAULT_EMAIL: admin@kimyalab.com
      PGADMIN_DEFAULT_PASSWORD: admin123
    volumes:
      - pgadmin_data:/var/lib/pgadmin
    depends_on:
      - postgres

volumes:
  postgres_data:
  pgadmin_data:
```

## 5. Kurulum Sonrası Adımlar

### PostgreSQL Kurulumunu Doğrula

```bash
# PostgreSQL versiyonunu kontrol et
psql --version

# Servis durumunu kontrol et
brew services list | grep postgresql
# veya
ps aux | grep postgres
```

### Veritabanı Bağlantısını Test Et

```bash
cd backend

# Environment değişkenlerini yükle
source .env

# Prisma ile bağlantıyı test et
npx prisma db pull
```

## 6. Güvenlik Ayarları

### postgresql.conf Ayarları (İsteğe Bağlı)

```bash
# Konfigürasyon dosyasının yerini bul
psql -U postgres -c 'SHOW config_file'

# Güvenlik ayarları
listen_addresses = 'localhost'
port = 5432
max_connections = 100
shared_buffers = 256MB
```

### pg_hba.conf Ayarları

```
# Local connections
local   all             all                                     trust
host    all             all             127.0.0.1/32            md5
host    all             all             ::1/128                 md5
```

## 7. Yaygın Sorunlar ve Çözümler

### Port Zaten Kullanılıyor
```bash
# 5432 portunu kullanan işlemi bul
lsof -i :5432

# İşlemi durdur
kill -9 <PID>
```

### Bağlantı Reddediliyor
```bash
# PostgreSQL servisinin çalıştığını kontrol et
brew services restart postgresql@15

# Log dosyalarını kontrol et
tail -f /opt/homebrew/var/log/postgresql@15.log
```

### Permissions Hatası
```bash
# Veri dizininin sahibini değiştir
sudo chown -R $(whoami) /opt/homebrew/var/postgresql@15
```

## 8. Sonraki Adımlar

PostgreSQL kurulumu tamamlandıktan sonra:

1. ✅ Environment dosyasını güncelle
2. ✅ Prisma migration'ları çalıştır
3. ✅ Seed verilerini yükle
4. ✅ Backend'i test et

## Kullanışlı Komutlar

```bash
# PostgreSQL başlat/durdur
brew services start postgresql@15
brew services stop postgresql@15
brew services restart postgresql@15

# Veritabanı listele
psql -U kimyalab_user -d kimyalab_dev -c "\l"

# Tabloları listele
psql -U kimyalab_user -d kimyalab_dev -c "\dt"

# Veritabanı boyutunu göster
psql -U kimyalab_user -d kimyalab_dev -c "SELECT pg_size_pretty(pg_database_size('kimyalab_dev'));"
```

## Backup ve Restore

```bash
# Backup al
pg_dump -U kimyalab_user -h localhost kimyalab_dev > kimyalab_backup.sql

# Restore et
psql -U kimyalab_user -h localhost kimyalab_dev < kimyalab_backup.sql