# 🚀 StNoto - Yeni Sunucu Hızlı Kurulum Rehberi
**Sunucu:** Ubuntu 24.04 LTS  
**Proje:** StNoto (stnoto.com)  
**Tahmini Süre:** 30-45 dakika

---

## 📋 İçindekiler

1. [Sistem Gereksinimleri](#1-sistem-gereksinimleri)
2. [Kurulum Adımları](#2-kurulum-adımları)
3. [Veritabanı Restore](#3-veritabanı-restore)
4. [Doğrulama ve Test](#4-doğrulama-ve-test)
5. [Sık Karşılaşılan Sorunlar](#5-sık-karşılaşılan-sorunlar)

---

## 1. Sistem Gereksinimleri

| Kaynak | Minimum | Önerilen |
|---------|---------|----------|
| CPU | 2 vCPU | 4 vCPU |
| RAM | 4 GB | 8 GB |
| Disk | 20 GB | 40 GB |
| İşletim Sistemi | Ubuntu 24.04 LTS | Ubuntu 24.04 LTS |

**Gerekli Portlar:**
- 80 (HTTP)
- 443 (HTTPS)
- 22 (SSH)

---

## 2. Kurulum Adımları

### Adım 1: SSH ile Sunucuya Bağlanma

```bash
ssh root@<sunucu-ip-adresi>
```

### Adım 2: Sistem Güncelleme (~2 dakika)

```bash
# Sistem paketlerini güncelleme
apt update && apt upgrade -y

# Temel paketlerin kurulumu
apt install -y curl wget git ca-certificates gnupg lsb-release

echo "✅ Sistem güncellendi ve temel paketler yüklendi"
```

### Adım 3: Docker Kurulumu (~3 dakika)

```bash
# Docker'ın kolay kurulum script'i
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Docker'ın çalıştığını doğrulama
docker --version
docker compose version

echo "✅ Docker ve Docker Compose kuruldu"
```

### Adım 4: Proje Dizini Oluşturma ve GitHub'tan Çekme (~3 dakika)

```bash
# Proje dizini oluşturma
mkdir -p /var/www
cd /var/www

# GitHub'tan projeyi klonlama
git clone https://github.com/firatemu/stnoto.git stnoto
cd stnoto

# İzinleri ayarlama
chmod -R 755 .

echo "✅ Proje klonlandı: /var/www/stnoto"
```

### Adım 5: Environment Dosyası Oluşturma (~2 dakika)

```bash
# Environment template'ten production dosyası oluştur
cp .env.production.example .env.production

# Dosyayı düzenle
nano .env.production
```

**⚠️ ÖNEMLİ: Aşağıdaki değerleri MANDATORY olarak değiştirin:**

```bash
# Database
DB_PASSWORD=GUCLU_SIFRE_BURAYA

# MinIO
MINIO_ACCESS_KEY=MINIO_ACCESS_KEY_BURAYA
MINIO_SECRET_KEY=MINIO_SECRET_KEY_BURAYA

# JWT
JWT_SECRET=EN_AZ_32_KARAKTER_UZUNLUGUNDA_GIZLI_ANAHTAR
```

**Kaydedip çık:** `Ctrl + X`, `Y`, `Enter`

```bash
echo "✅ .env.production dosyası oluşturuldu"
```

### Adım 6: Docker Network Oluşturma (~1 dakika)

```bash
# Docker network oluştur
docker network create app-network

echo "✅ Docker network oluşturuldu: app-network"
```

### Adım 7: Docker Image'larını Build Etme (~15-30 dakika)

```bash
# Backend image build
docker compose -f docker-compose.prod.yml build backend

# Frontend image build
docker compose -f docker-compose.prod.yml build frontend

echo "✅ Docker image'ları build edildi"
```

**💡 İpucu:** Build işlemi sunucu kaynaklarına göre 15-30 dakika sürebilir. Bu süreç sırasında terminal açık kalmalıdır.

### Adım 8: Altyapı Servislerini Başlatma (~2 dakika)

```bash
# PostgreSQL, Redis, MinIO başlatma
docker compose -f docker-compose.prod.yml up -d postgres redis minio

# Servislerin sağlığını kontrol etme (10-15 saniye bekleme)
sleep 15
docker ps

echo "✅ Altyapı servisleri başlatıldı"
```

---

## 3. Veritabanı Restore

Bu adımı SİZ manuel olarak yapacaksınız. Dump dosyasını sunucuya aktarın:

### 3.1. Dump Dosyasını Sunucuya Kopyalama

```bash
# Local makineden sunucuya dump dosyasını kopyalama
scp database_dump.sql root@<sunucu-ip>:/var/www/stnoto/
```

### 3.2. Veritabanını Restore Etme

```bash
# Sunucuya SSH ile bağlanın
ssh root@<sunucu-ip>
cd /var/www/stnoto

# PostgreSQL container'ına restore etme
docker exec -i otomuhasebe-postgres psql -U postgres -d otomuhasebe < database_dump.sql

echo "✅ Veritabanı restore edildi"
```

---

## 4. Doğrulama ve Test

### Adım 9: Uygulama Servislerini Başlatma (~2 dakika)

```bash
# Backend ve Frontend başlatma
docker compose -f docker-compose.prod.yml up -d backend frontend

# Caddy (SSL proxy) başlatma
docker compose -f docker-compose.prod.yml up -d caddy

# Tüm servislerin durumunu kontrol etme
docker ps

echo "✅ Tüm servisler başlatıldı"
```

### Adım 10: Health Check (~3 dakika)

```bash
# Backend health check
curl http://localhost:3000/api/health

# Frontend health check
curl http://localhost:3000

# Servis loglarını kontrol etme
docker logs stnoto-api --tail 20
docker logs stnoto-client --tail 20
docker logs otomuhasebe-caddy --tail 20

echo "✅ Health check tamamlandı"
```

### Adım 11: External Doğrulama

```bash
# Eğer DNS yönlendirmesi yapıldıysa:
curl https://stnoto.com
curl https://api.stnoto.com/api/health

# Veya IP adresi ile:
curl http://<sunucu-ip>
```

---

## 5. Sık Karşılaşılan Sorunlar

### Sorun 1: Docker Hatası - "Permission Denied"

**Çözüm:**
```bash
# Docker grubuna kullanıcı ekleme (opsiyonel)
usermod -aG docker $USER

# Veya tüm komutları sudo ile çalıştırın
sudo docker compose -f docker-compose.prod.yml up -d
```

### Sorun 2: Build Sırasında Memory Hatası

**Çözüm:** Swap oluşturma (daha sonrasında yapacağınız gibi)

```bash
# Geçici swap oluşturma
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile

# Build'i tekrar deneme
docker compose -f docker-compose.prod.yml build backend
docker compose -f docker-compose.prod.yml build frontend
```

### Sorun 3: Portlar Zaten Kullanımda

**Çözüm:**
```bash
# Hangi servisin kullandığını kontrol etme
netstat -tulnp | grep -E ':(80|443|3000)'

# Çakışan servisi durdurma
systemctl stop nginx  # veya başka bir servis

# Docker servislerini yeniden başlatma
docker compose -f docker-compose.prod.yml restart caddy
```

### Sorun 4: SSL Sertifikası Alınamıyor (Caddy)

**Çözüm:**
```bash
# Caddy loglarını kontrol etme
docker logs otomuhasebe-caddy --tail 50

# DNS yönlendirmesi yapıldığından emin olun
# Domain (stnoto.com, api.stnoto.com) sunucuya doğru DNS kaydına sahip olmalı

# Caddy'yi yeniden başlatma
docker compose -f docker-compose.prod.yml restart caddy
```

### Sorun 5: Database Connection Hatası

**Çözüm:**
```bash
# PostgreSQL container'ının çalıştığını kontrol etme
docker ps | grep postgres

# DATABASE_URL'i kontrol etme
cat .env.production | grep DATABASE_URL

# PostgreSQL loglarını kontrol etme
docker logs otomuhasebe-postgres --tail 20
```

---

## 🎯 Hızlı Özet (Kopyala-Yapıştır Ready)

```bash
# Tüm adımları tek seferde çalıştırabilirsiniz (MANUEL adımlar hariç):

# 1. Sistem güncelleme ve Docker kurulumu
apt update && apt upgrade -y && apt install -y curl wget git ca-certificates gnupg lsb-release
curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh

# 2. Proje klonlama
mkdir -p /var/www && cd /var/www
git clone https://github.com/firatemu/stnoto.git stnoto && cd stnoto && chmod -R 755 .

# 3. Environment dosyası oluştur ve düzenle (MANUEL)
cp .env.production.example .env.production
nano .env.production  # Şifreleri değiştir!

# 4. Docker network
docker network create app-network

# 5. Build (15-30 dakika)
docker compose -f docker-compose.prod.yml build backend
docker compose -f docker-compose.prod.yml build frontend

# 6. Altyapı başlat
docker compose -f docker-compose.prod.yml up -d postgres redis minio
sleep 15

# 7. Veritabanı restore (MANUEL - dump dosyasını yükleyin)
# docker exec -i otomuhasebe-postgres psql -U postgres -d otomuhasebe < database_dump.sql

# 8. Uygulama başlat
docker compose -f docker-compose.prod.yml up -d backend frontend caddy

# 9. Doğrulama
docker ps
curl http://localhost:3000/api/health
```

---

## 📞 Yardım ve Destek

Eğer sorun yaşarsanız:

1. **Logları kontrol edin:**
   ```bash
   docker logs <container-name> --tail 50
   ```

2. **Servis durumunu kontrol edin:**
   ```bash
   docker ps -a
   ```

3. **Container'ların kaynak kullanımını kontrol edin:**
   ```bash
   docker stats
   ```

---

## ✅ Kurulum Tamamlandıktan Sonra

1. **Firewall yapılandırması** (opsiyonel ama önerilir)
2. **Swap ayarları** (sunucu durumuna göre)
3. **Otomatik backup script'leri** kurulumu
4. **Monitoring ve alerting** (opsiyonel)
5. **Cron job'lar** ile otomatik backup'lar

---

**🎉 Kurulum tamamlandı! Projeniz yayında!**

**Not:** Bu rehber build yapabilecek seviyeye getiren minimal bir rehberdir. Swap ayarları ve diğer optimizasyonları sunucu durumuna göre sonrasında yapabilirsiniz.