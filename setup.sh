#!/bin/bash
# ============================================================
# Pixfora E-Ticaret - Hetzner Otomatik Kurulum (Git ile)
# ============================================================
# Kullanim:
#   ssh root@SUNUCU_IP
#   curl -sL https://raw.githubusercontent.com/emrekol35/pixfora/main/setup.sh | bash
# ============================================================
set -e

# --- Renkler ---
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log()  { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
err()  { echo -e "${RED}[✗]${NC} $1"; exit 1; }
info() { echo -e "${BLUE}[→]${NC} $1"; }

echo ""
echo -e "${BLUE}============================================================${NC}"
echo -e "${BLUE}   Pixfora E-Ticaret - Hetzner Otomatik Kurulum${NC}"
echo -e "${BLUE}============================================================${NC}"
echo ""

# --- Root kontrolu ---
if [ "$EUID" -ne 0 ]; then
  err "Bu script root olarak calistirilmalidir: sudo bash setup.sh"
fi

# --- Bilgileri topla ---
GIT_REPO=""
DOMAIN=""
EMAIL=""

read -p "Git repo URL'si (ornek: https://github.com/kullanici/pixfora.git): " GIT_REPO
if [ -z "$GIT_REPO" ]; then
  err "Git repo URL'si zorunludur!"
fi

read -p "Domain adresi (ornek: pixfora.com): " DOMAIN
if [ -z "$DOMAIN" ]; then
  err "Domain adresi zorunludur!"
fi

read -p "SSL icin e-posta adresi: " EMAIL
if [ -z "$EMAIL" ]; then
  err "E-posta adresi zorunludur!"
fi

# Otomatik guclu sifre ve secret uret
DB_PASSWORD=$(openssl rand -base64 24 | tr -dc 'a-zA-Z0-9' | head -c 32)
AUTH_SECRET_VAL=$(openssl rand -base64 32)

echo ""
info "Git Repo: $GIT_REPO"
info "Domain:   $DOMAIN"
info "E-posta:  $EMAIL"
info "DB sifresi & Auth secret otomatik uretildi"
echo ""
read -p "Devam edilsin mi? (y/n): " CONFIRM
if [ "$CONFIRM" != "y" ]; then
  echo "Iptal edildi."
  exit 0
fi

PROJECT_DIR="/home/pixfora/app"

# ============================================================
# 1. SISTEM GUNCELLEME
# ============================================================
echo ""
info "1/9 - Sistem guncelleniyor..."

apt update -qq && apt upgrade -y -qq
apt install -y -qq curl git ufw fail2ban ca-certificates gnupg lsb-release
log "Sistem guncellendi"

# ============================================================
# 2. FIREWALL
# ============================================================
info "2/9 - Firewall ayarlaniyor..."

ufw --force reset > /dev/null 2>&1
ufw default deny incoming > /dev/null 2>&1
ufw default allow outgoing > /dev/null 2>&1
ufw allow 22/tcp > /dev/null 2>&1
ufw allow 80/tcp > /dev/null 2>&1
ufw allow 443/tcp > /dev/null 2>&1
ufw --force enable > /dev/null 2>&1
log "Firewall aktif (22, 80, 443)"

# ============================================================
# 3. DOCKER KURULUMU
# ============================================================
info "3/9 - Docker kuruluyor..."

if ! command -v docker &> /dev/null; then
  curl -fsSL https://get.docker.com | sh -s -- --quiet
  systemctl enable docker
  systemctl start docker
  log "Docker kuruldu"
else
  log "Docker zaten kurulu"
fi

# ============================================================
# 4. KULLANICI OLUSTUR
# ============================================================
info "4/9 - pixfora kullanicisi olusturuluyor..."

if ! id "pixfora" &>/dev/null; then
  useradd -m -s /bin/bash pixfora
  usermod -aG docker pixfora
  log "pixfora kullanicisi olusturuldu"
else
  usermod -aG docker pixfora
  log "pixfora kullanicisi zaten var"
fi

mkdir -p /home/pixfora/backups

# ============================================================
# 5. GIT CLONE
# ============================================================
info "5/9 - Proje Git'ten cekiliyor..."

if [ -d "$PROJECT_DIR" ]; then
  warn "Mevcut proje dizini bulundu, yedekleniyor..."
  mv "$PROJECT_DIR" "${PROJECT_DIR}.bak.$(date +%Y%m%d%H%M%S)"
fi

git clone "$GIT_REPO" "$PROJECT_DIR"
cd "$PROJECT_DIR"
log "Git clone tamamlandi"

# ============================================================
# 6. ENV & NGINX DOSYALARI
# ============================================================
info "6/9 - Yapilandirma dosyalari olusturuluyor..."

# --- .env ---
cat > .env << ENVEOF
DATABASE_URL="postgresql://pixfora:${DB_PASSWORD}@postgres:5432/pixfora?schema=public"
DB_PASSWORD="${DB_PASSWORD}"
AUTH_SECRET="${AUTH_SECRET_VAL}"
AUTH_URL="https://${DOMAIN}"
REDIS_URL="redis://redis:6379"
NEXT_PUBLIC_SITE_URL="https://${DOMAIN}"
NEXT_PUBLIC_SITE_NAME="Pixfora"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER=""
SMTP_PASS=""
SMTP_FROM="noreply@${DOMAIN}"
UPLOAD_DIR="public/uploads"
MAX_FILE_SIZE=10485760
ENVEOF

# --- Nginx: ilk config (sadece HTTP, SSL icin) ---
mkdir -p nginx/conf.d

cat > nginx/nginx.conf << 'NGEOF'
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent"';
    access_log /var/log/nginx/access.log main;

    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 20M;

    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript application/xml+rss application/atom+xml image/svg+xml;

    include /etc/nginx/conf.d/*.conf;
}
NGEOF

cat > nginx/conf.d/default.conf << NGCEOF
server {
    listen 80;
    server_name ${DOMAIN} www.${DOMAIN};

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        proxy_pass http://app:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
NGCEOF

log "Yapilandirma dosyalari olusturuldu"

# ============================================================
# 7. NPM INSTALL (package-lock.json olusturmak icin)
# ============================================================
info "7/9 - npm install (package-lock.json olusturuluyor)..."

docker run --rm -v "$PROJECT_DIR:/app" -w /app node:20-alpine npm install 2>&1 | tail -3
log "npm install tamamlandi"

# ============================================================
# 8. BUILD & BASLAT
# ============================================================
info "8/9 - Docker build & baslatiliyor (3-5 dakika surebilir)..."

docker compose -f docker-compose.prod.yml build --no-cache app 2>&1 | tail -5
log "Docker build tamamlandi"

docker compose -f docker-compose.prod.yml up -d
log "Tum servisler baslatildi"

# DB'nin hazir olmasini bekle
info "Veritabani hazirlaniyor..."
sleep 10

# Migration
docker compose -f docker-compose.prod.yml exec -T app npx prisma migrate deploy 2>&1 | tail -3
log "Veritabani migration tamamlandi"

# Seed
docker compose -f docker-compose.prod.yml exec -T app npx tsx prisma/seed.ts 2>&1 | tail -1
log "Seed data yuklendi"

# ============================================================
# 9. SSL SERTIFIKASI
# ============================================================
info "9/9 - SSL sertifikasi aliniyor..."

docker compose -f docker-compose.prod.yml run --rm certbot \
  certonly --webroot --webroot-path=/var/www/certbot \
  --email "$EMAIL" --agree-tos --no-eff-email \
  -d "$DOMAIN" -d "www.$DOMAIN" 2>&1 | tail -5

# SSL alindiysa HTTPS config'e gec
if [ -d "/home/pixfora/app" ]; then
  # certbot volume icinde kontrol yapmak zor, her durumda yaz
  cat > nginx/conf.d/default.conf << SSLEOF
server {
    listen 80;
    server_name ${DOMAIN} www.${DOMAIN};

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://\$host\$request_uri;
    }
}

server {
    listen 443 ssl;
    http2 on;
    server_name ${DOMAIN} www.${DOMAIN};

    ssl_certificate /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    location /_next/static {
        proxy_pass http://app:3000;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    location /uploads {
        proxy_pass http://app:3000;
        add_header Cache-Control "public, max-age=86400";
    }

    location / {
        proxy_pass http://app:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
SSLEOF

  docker compose -f docker-compose.prod.yml restart nginx
  log "SSL aktif, HTTPS yonlendirmesi yapildi"
fi

# ============================================================
# SAHIPLIK & CRONTAB
# ============================================================
chown -R pixfora:pixfora /home/pixfora

# Otomatik yedekleme crontab'a ekle
(crontab -u pixfora -l 2>/dev/null; echo "0 3 * * * cd $PROJECT_DIR && bash scripts/backup.sh >> /home/pixfora/backups/cron.log 2>&1") | sort -u | crontab -u pixfora -
log "Otomatik yedekleme (her gece 03:00) ayarlandi"

# ============================================================
# BILGILERI KAYDET
# ============================================================
cat > /home/pixfora/CREDENTIALS.txt << CREDEOF
============================================================
PIXFORA SUNUCU BILGILERI
============================================================
Tarih:  $(date)
Git:    ${GIT_REPO}

Site:   https://${DOMAIN}
Admin:  https://${DOMAIN}/admin

Admin Giris:
  E-posta: admin@pixfora.com
  Sifre:   admin123  <-- HEMEN DEGISTIRIN!

Veritabani:
  Host:     postgres (Docker network icinde)
  User:     pixfora
  Password: ${DB_PASSWORD}
  DB:       pixfora

Auth Secret: ${AUTH_SECRET_VAL}

Proje Dizini: ${PROJECT_DIR}

--- FAYDALI KOMUTLAR ---

# Loglari izle
cd ${PROJECT_DIR}
docker compose -f docker-compose.prod.yml logs -f

# Uygulamayi yeniden baslat
docker compose -f docker-compose.prod.yml restart app

# Git'ten guncelle ve yeniden deploy et
bash scripts/update.sh

# Manuel yedek al
bash scripts/backup.sh

# DB yonetim arayuzu
docker compose -f docker-compose.prod.yml exec app npx prisma studio
============================================================
CREDEOF
chmod 600 /home/pixfora/CREDENTIALS.txt
chown pixfora:pixfora /home/pixfora/CREDENTIALS.txt

# ============================================================
# TAMAMLANDI
# ============================================================
echo ""
echo -e "${GREEN}============================================================${NC}"
echo -e "${GREEN}   Pixfora basariyla kuruldu!${NC}"
echo -e "${GREEN}============================================================${NC}"
echo ""
echo -e "  Site:   ${BLUE}https://${DOMAIN}${NC}"
echo -e "  Admin:  ${BLUE}https://${DOMAIN}/admin${NC}"
echo ""
echo -e "  Admin:  admin@pixfora.com"
echo -e "  Sifre:  admin123"
echo ""
echo -e "  ${RED}Admin sifresini hemen degistirin!${NC}"
echo ""
echo -e "  Bilgiler: /home/pixfora/CREDENTIALS.txt"
echo ""
echo -e "  ${YELLOW}Guncelleme:${NC}  cd $PROJECT_DIR && bash scripts/update.sh"
echo -e "  ${YELLOW}Yedekleme:${NC}   cd $PROJECT_DIR && bash scripts/backup.sh"
echo -e "  ${YELLOW}Loglar:${NC}      cd $PROJECT_DIR && docker compose -f docker-compose.prod.yml logs -f"
echo ""
echo -e "${GREEN}============================================================${NC}"
echo ""
