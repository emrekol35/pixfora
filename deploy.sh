#!/bin/bash
# ============================================
# Pixfora - Hetzner Deploy Script
# ============================================
set -e

echo "🚀 Pixfora Deploy Basliyor..."

# 1. .env dosyasi kontrol
if [ ! -f .env ]; then
  echo "❌ .env dosyasi bulunamadi!"
  echo "   .env.production dosyasini .env olarak kopyalayin ve degerleri doldurun:"
  echo "   cp .env.production .env && nano .env"
  exit 1
fi

# 2. Domain ayarla
read -p "Domain adresiniz (ornek: pixfora.com): " DOMAIN

if [ -z "$DOMAIN" ]; then
  echo "❌ Domain gerekli!"
  exit 1
fi

# Nginx config'de domain'i guncelle
sed -i "s/DOMAIN.COM/$DOMAIN/g" nginx/conf.d/default.conf
echo "✅ Nginx config guncellendi: $DOMAIN"

# 3. Ilk SSL sertifikasi al (once HTTP-only nginx calistir)
echo "📝 SSL sertifikasi aliniyor..."

# Gecici nginx config (sadece HTTP, certbot icin)
cat > /tmp/nginx-temp.conf << 'TEMPEOF'
server {
    listen 80;
    server_name _;
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    location / {
        return 200 'Pixfora kurulum devam ediyor...';
        add_header Content-Type text/plain;
    }
}
TEMPEOF

# Gecici olarak sadece nginx baslat
docker compose -f docker-compose.prod.yml run --rm -d \
  -v /tmp/nginx-temp.conf:/etc/nginx/conf.d/default.conf:ro \
  -p 80:80 nginx 2>/dev/null || true

# Certbot ile sertifika al
docker compose -f docker-compose.prod.yml run --rm certbot \
  certbot certonly --webroot --webroot-path=/var/www/certbot \
  --email admin@$DOMAIN --agree-tos --no-eff-email \
  -d $DOMAIN -d www.$DOMAIN

# Gecici nginx'i durdur
docker compose -f docker-compose.prod.yml down 2>/dev/null || true

echo "✅ SSL sertifikasi alindi"

# 4. Uygulamayi build et ve baslat
echo "🔨 Uygulama build ediliyor..."
docker compose -f docker-compose.prod.yml build --no-cache app

echo "🚀 Servisler baslatiliyor..."
docker compose -f docker-compose.prod.yml up -d

# 5. Veritabani migration
echo "📦 Veritabani migration..."
sleep 5
docker compose -f docker-compose.prod.yml exec app npx prisma migrate deploy

# 6. Seed data (ilk kurulumda)
read -p "Seed data yuklensin mi? (y/n): " SEED
if [ "$SEED" = "y" ]; then
  docker compose -f docker-compose.prod.yml exec app npx tsx prisma/seed.ts
  echo "✅ Seed data yuklendi"
fi

echo ""
echo "============================================"
echo "✅ Pixfora basariyla deploy edildi!"
echo "============================================"
echo ""
echo "🌐 Site:  https://$DOMAIN"
echo "🔧 Admin: https://$DOMAIN/admin"
echo "📧 Admin: admin@pixfora.com / admin123"
echo ""
echo "⚠️  Onemli: Admin sifresini hemen degistirin!"
echo ""
