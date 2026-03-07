# Sunucu RAM Optimizasyonu

## Yapılan Ayarlar

### 1. Container bellek limitleri (Docker Compose)

| Servis | RAM limiti | CPU limiti |
|--------|------------|------------|
| user-panel-staging | 1024 MB | 1.25 |
| backend-staging | 512 MB | 0.75 |
| postgres | 384 MB | 0.5 |
| minio | 256 MB | 0.25 |
| caddy | 128 MB | - |
| redis | 128 MB | 0.25 |

### 2. Node.js panel (Next.js)

- `NODE_OPTIONS=--max-old-space-size=768` ile V8 heap 768 MB ile sınırlandı.
- Gereksiz bellek büyümesi ve GC yükü azaltıldı.

### 3. Kernel (sysctl) – opsiyonel

Sunucuda RAM’i rahatlatmak için:

```bash
sudo cp docker/scripts/99-otomuhasebe-ram.conf /etc/sysctl.d/
sudo sysctl -p /etc/sysctl.d/99-otomuhasebe-ram.conf
```

- **vm.swappiness=10** – Mümkün olduğunca RAM kullan, swap’e az geç.
- **vm.vfs_cache_pressure=80** – Dosya önbelleğini daha çabuk bırak, uygulama için daha fazla RAM kalsın.

### 4. Limitleri uygulamak

Compose dosyalarını güncelledikten sonra:

```bash
cd /var/www/otomuhasebe
docker compose -f docker/compose/docker-compose.base.yml -f docker/compose/docker-compose.staging.ghcr.yml up -d --force-recreate
```

(GHCR yerine pull kullanıyorsanız `docker-compose.staging.pull.yml` kullanın.)

### 5. Gereksiz tüketimi azaltmak

- **Cursor / IDE** sunucuda çalışıyorsa yüksek RAM kullanır; mümkünse yerel veya ayrı bir makinede çalıştırın.
- **Zombie process** sayısı yüksekse `systemd` veya ilgili servisleri yeniden başlatın.
- **PostgreSQL**: Çok büyük veri yoksa `mem_limit: 256m` deneyebilirsiniz (staging için).
