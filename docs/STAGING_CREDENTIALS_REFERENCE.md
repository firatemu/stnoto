# Staging Sunucu: Kullanıcı ve Şifre Referansı

Bu dosya **31.210.43.185 (stnoto.com)** staging kurulumunda kullanılan hesap bilgilerini özetler. `.env.staging` oluştururken bu değerlerle **tutarlı** olmalıdır (özellikle PostgreSQL ve MinIO).

---

## 1. PostgreSQL (Veritabanı)

Container `docker-compose.base.yml` ile aynı şifreyi kullanır; `.env.staging` içindeki `POSTGRES_PASSWORD` ve `DATABASE_URL` buna uygun olmalı.

| Alan | Değer | Nerede kullanılır |
|------|--------|-------------------|
| Kullanıcı | `postgres` | base.yml, .env.staging |
| Şifre | `IKYYJ1R8fUZ3PItqxf6qel12VNbLYiOe` (base.yml ile aynı kullanın) | base.yml, .env.staging POSTGRES_PASSWORD ve DATABASE_URL |
| Veritabanı adı | `otomuhasebe_stage` | base.yml, .env.staging |
| Port | `5432` | base.yml |
| Bağlantı (container içi) | `postgresql://postgres:IKYYJ1R8fUZ3PItqxf6qel12VNbLYiOe@otomuhasebe-postgres:5432/otomuhasebe_stage?schema=public` | .env.staging `DATABASE_URL` |

**Önemli:** `docker/compose/docker-compose.base.yml` içinde `POSTGRES_PASSWORD` sabit tanımlıdır. Sunucuda `.env.staging` oluştururken bu şifreyi oradan alıp `POSTGRES_PASSWORD` ve `DATABASE_URL` içinde kullanın. Şifreyi değiştirirseniz base.yml içindeki değeri de aynı yapın.

---

## 2. MinIO (Object storage)

Varsayılan değerler `docker-compose.base.yml` içinde env ile override edilebilir; `.env.staging` ile uyumlu tutun.

| Alan | Varsayılan değer | Nerede kullanılır |
|------|-------------------|-------------------|
| Root user | `minioadmin` | base.yml (MINIO_ROOT_USER) |
| Root password | `minioadmin123` | base.yml (MINIO_ROOT_PASSWORD) |
| Backend erişim (API) | `MINIO_ACCESS_KEY` / `MINIO_SECRET_KEY` | .env.staging – genelde root user/password ile aynı verilir |

`.env.staging` örneği:
- `MINIO_ACCESS_KEY=minioadmin`
- `MINIO_SECRET_KEY=minioadmin123`

---

## 3. Redis

Şifre kullanılmıyor (boş).

| Alan | Değer |
|------|--------|
| URL | `redis://otomuhasebe-redis:6379` |
| Şifre | *(boş)* |

---

## 4. Uygulama (Backend / Panel)

Bu değerler **gizli** tutulmalı; gerçek değerleri sadece sunucudaki `.env.staging` içinde kullanın.

| Alan | Açıklama | Örnek format |
|------|----------|----------------|
| JWT_SECRET | En az 32 karakter, rastgele | `.env.staging.example` içinde placeholder |
| JWT_ACCESS_EXPIRATION | Token süresi | `1d` |
| JWT_REFRESH_EXPIRATION | Refresh süresi | `7d` |
| STAGING_DEFAULT_TENANT_ID | Varsayılan tenant (opsiyonel) | Backup’taki tenant id veya boş bırakılabilir |

---

## 5. Hizli entegrasyonu (test)

Sadece test ortamı için; gerçek değerleri `.env.staging` içinde doldurun.

| Alan | Açıklama |
|------|----------|
| HIZLI_BASE_URL | Test API adresi (ör. econnecttest.hizliteknoloji.com.tr) |
| HIZLI_SECRET_KEY | Hizli tarafından verilen |
| HIZLI_API_KEY | Hizli tarafından verilen |
| HIZLI_USERNAME | Hizli kullanıcı adı |
| HIZLI_PASSWORD | Hizli şifre |

---

## 6. Sunucu erişimi

| Açıklama | Değer |
|----------|--------|
| SSH | `root@31.210.43.185` |
| Proje dizini | `/var/www/otomuhasebe` |

---

## 7. .env.staging oluşturma

1. Örnek dosyayı kopyalayın:  
   `cp .env.staging.example .env.staging`
2. **PostgreSQL:** `docker-compose.base.yml` içindeki `POSTGRES_PASSWORD` değerini alıp `.env.staging` içinde `POSTGRES_PASSWORD` ve `DATABASE_URL` içinde kullanın.
3. **MinIO:** Yukarıdaki MinIO varsayılanları veya kendi değerlerinizi `MINIO_ACCESS_KEY` / `MINIO_SECRET_KEY` olarak yazın.
4. **JWT_SECRET:** En az 32 karakter rastgele bir string üretip yazın.
5. CORS, API URL ve domain’ler stnoto.com için örnekteki gibi bırakılabilir; farklı domain kullanıyorsanız güncelleyin.

**Güvenlik:** `.env.staging` dosyası repoya commit edilmemeli (`.gitignore`’da olmalı). Sunucuda sadece siz veya güvenli bir yolla oluşturup düzenleyin.
