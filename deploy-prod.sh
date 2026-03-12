#!/bin/bash
# ==============================================================================
# OTO MUHASEBE - YEDEK PARÇA ERP SİSTEMİ
# ÜRETİM (PRODUCTION) ORTAMI OTOMATİK KURULUM VE BAŞLATMA BETİĞİ
# Sunucu Özellikleri Hedefi: 4 vCPU, 4GB RAM 
# Veritabanı: PostgreSQL, Redis
# ==============================================================================

# Hata durumunda betiği durdur
set -e

echo "🚀 Oto Muhasebe Üretim Sunucusu Hazırlığı Başlıyor..."
echo "================================================================="

# 1. GEREKSİNİMLERİN KONTROLÜ VE PM2 KURULUMU
echo "📦 Bağımlılıklar kontrol ediliyor..."
if ! command -v pm2 &> /dev/null
then
    echo "⚙️ PM2 bulunamadı, global olarak kuruluyor..."
    sudo npm install -g pm2
    pm2 update
fi

if ! command -v pnpm &> /dev/null
then
    echo "⚙️ pnpm bulunamadı, global olarak kuruluyor..."
    sudo npm install -g pnpm
fi

# 2. BACKEND (API STAGE) KURULUMU VE BUILD İŞLEMİ
echo "-----------------------------------------------------------------"
echo "🛠️ 1/2: Backend (NestJS API) Kurulumu ve Derlenmesi..."
cd api-stage/server

echo "   > Paketler pnpm ile yükleniyor..."
pnpm install --frozen-lockfile

echo "   > Prisma Mimarisi Yeniden Oluşturuluyor..."
npx prisma generate

# Veritabanı push komutu, migration yerine tabloların canlıya yansıması için (Test için önce backup alınız)
# echo "   > Veritabanı Tabloları Güncelleniyor..."
# npx prisma db push --accept-data-loss

echo "   > Backend Projesi (NestJS) Derleniyor (Build)..."
pnpm run build

# Geri Ana Dizine Dön
cd ../../

# 3. FRONTEND (PANEL STAGE) KURULUMU VE BUILD İŞLEMİ
echo "-----------------------------------------------------------------"
echo "🛠️ 2/2: Frontend (Next.js Application) Kurulumu ve Derlenmesi..."
cd panel-stage/client

echo "   > Paketler pnpm ile yükleniyor..."
pnpm install --frozen-lockfile

echo "   > Frontend Projesi (Next.js) Standalone Moda Göre Derleniyor (Build)..."
# Build sürecinde Type veya Lint hataları çıkarsa durmaması için
SKIP_ENV_VALIDATION=true ESLINT_NO_DEV_ERRORS=true TYPESCRIPT_TRANSPILE_ONLY=true pnpm run build

# Geri Ana Dizine Dön
cd ../../


# 4. UYGULAMANIN PM2 İLE CANLIYA (CLUSTER MODUNDA) ALINMASI
echo "-----------------------------------------------------------------"
echo "🌐 PM2 Üretim Ortamı Ağacı Oluşturuluyor (4 vCPU Dengesi)..."

# Klasör yolları güncel sunucu yolunuz (pwd) ile hizalanıyor
echo "   > ecosystem.config.js içindeki yollar otomatik güncelleniyor..."
CURRENT_DIR=$(pwd)
sed -i "s|cwd: '/var/www/otomuhasebe/api-stage/server'|cwd: '${CURRENT_DIR}/api-stage/server'|g" ecosystem.config.js
sed -i "s|cwd: '/var/www/otomuhasebe/panel-stage/client'|cwd: '${CURRENT_DIR}/panel-stage/client'|g" ecosystem.config.js

# PM2 varolan processes silinip Cluster güncellenmiş olarak baştan oluşturulur
pm2 delete otomuhasebe-api 2>/dev/null || true
pm2 delete otomuhasebe-client 2>/dev/null || true

echo "   > Uygulama PM2 üzerinden cluster modunda başlatılıyor..."
pm2 start ecosystem.config.js

echo "   > Restart edildikçe otomatik başlaması için PM2 kaydediliyor..."
pm2 save
pm2 startup | tail -n 1 | bash 2>/dev/null || true

# 5. NGINX UYARISI
echo "================================================================="
echo "✅ BAŞARILI: Backend ve Frontend projeleri derlendi ve PM2'de canlandırıldı."
echo ""
echo "🔥 PM2 Durumunu görüntülemek için: 'pm2 status'"
echo "📜 Günlük log akışı için: 'pm2 logs'"
echo ""
echo "⚠️  SON ADIM (NGINX): Uygulamayı internete açmak için 'nginx.prod.conf' dosyasındaki"
echo "    sıkıştırma ayarlarını /etc/nginx/sites-available dizinine atarak nginx'i yeniden başlatınız!"
echo "    sudo ln -s /etc/nginx/sites-available/otomuhasebe /etc/nginx/sites-enabled/"
echo "    sudo systemctl restart nginx"
echo "================================================================="
