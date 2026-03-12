# 🏠 Yerel Bilgisayarda Çalıştırma Rehberi (Local Run Guide)

Bu rehber, projenin tüm bileşenlerini (Backend, Admin Panel, User Panel) kendi bilgisayarınızda nasıl çalıştıracağınızı adım adım açıklar.

## 🛠 Ön Hazırlıklar

Bilgisayarınızda aşağıdaki araçların kurulu olması gerekmektedir:
1. **Node.js** (v20 veya üzeri önerilir)
2. **Docker & Docker Desktop** (Veritabanı ve altyapı servisleri için)
3. **Git**
4. **pnpm** (`npm install -g pnpm`)

---

## 🚀 Adım Adım Kurulum

### 1. Dosya Düzenleme ve Hazırlık
Proje dosyalarını yerel bilgisayarınıza kopyaladıktan sonra, sizin için hazırladığım `local-setup` klasöründeki dosyaları kullanacağız.

- `local-setup/docker-compose.local.yml`: Altyapı servisleri (Postgres, Redis, MinIO).
- `local-setup/.env.local.example`: Örnek environment dosyaları.

### 2. Altyapı Servislerini Başlatma (Docker)
Veritabanı ve cache servislerini Docker ile hızlıca ayağa kaldırın:

```bash
cd local-setup
docker-compose -f docker-compose.local.yml up -d
```

Bu komut şunları başlatacaktır:
- **PostgreSQL**: `localhost:5432` (Şifre: `localpassword`, DB: `otomuhasebe_local`)
- **Redis**: `localhost:6379`
- **MinIO**: `localhost:9000` (Console: `localhost:9001`)

### 3. Backend (NestJS) Kurulumu
Backend'i yerel olarak çalıştırın:

```bash
cd api-stage/server

# Environment dosyasını oluşturun
# local-setup/.env.local.example içindeki Backend bölümünü buradaki .env dosyasına kopyalayın
cp .env.example .env 

# Bağımlılıkları yükleyin
npm install

# Veritabanı şemasını oluşturun ve Prisma'yı hazırlayın
npx prisma generate
npx prisma migrate dev --name init

# Backend'i başlatın
npm run start:dev
```
Backend artık `http://localhost:3000` adresinde çalışıyor olacaktır.

### 4. Admin Panel (Vite) Kurulumu
Admin panelini başlatın:

```bash
cd admin-stage

# Bağımlılıkları yükleyin
npm install

# local-setup/.env.local.example içindeki Admin bölümünü .env dosyasına ekleyin

# Başlatın
npm run dev
```
Admin paneli artık `http://localhost:5173` (veya terminalde görünen port) adresinde çalışacaktır.

### 5. User Panel (Next.js) Kurulumu
Kullanıcı panelini başlatın:

```bash
cd panel-stage/client

# Bağımlılıkları yükleyin
pnpm install

# local-setup/.env.local.example içindeki User Panel bölümünü .env.local dosyasına ekleyin

# Başlatın
pnpm dev:fast
```
User panel artık `http://localhost:3010` (veya terminalde görünen port) adresinde çalışacaktır.

---

## 📝 Önemli Notlar & İpuçları

- **Veritabanı Şifresi**: `local-setup/docker-compose.local.yml` içindeki şifreyi değiştirirseniz, `.env` dosyalarındaki `DATABASE_URL` kısmını da güncellemeyi unutmayın.
- **Hızlı Teknoloji Entegrasyonu**: Örnek `.env` dosyasında test kullanıcı bilgileri eklenmiştir. Gerçek bilgilerle deneme yapmak isterseniz bu alanları güncelleyebilirsiniz.
- **MinIO (Dosya Saklama)**: Yerel ortamda dosya yükleme işlemlerinin çalışması için MinIO'nun ayakta olması gerekir.

## 🔍 Sorun Giderme
- **DB Bağlantı Hatası**: Docker'ın çalıştığından ve `5432` portunun başka bir uygulama tarafından kullanılmadığından emin olun.
- **Port Çakışması**: Eğer portlar doluysa, `package.json` veya `.env` dosyalarından portları değiştirebilirsiniz.

Artık projeniz yerel bilgisayarınızda çalışmaya hazır! 🎉
