#!/bin/bash
# ============================================================
# Pixfora - Git Pull & Redeploy
# Kullanim: cd /home/pixfora/app && bash scripts/update.sh
# ============================================================
set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT_DIR="/home/pixfora/app"
cd $PROJECT_DIR

echo -e "${BLUE}Pixfora guncelleniyor...${NC}"
echo ""

# 1. Onceki halini yedekle
echo "[1/5] Veritabani yedegi aliniyor..."
mkdir -p /home/pixfora/backups
docker compose -f docker-compose.prod.yml exec -T postgres \
  pg_dump -U pixfora pixfora > "/home/pixfora/backups/pre-update-$(date +%Y%m%d-%H%M%S).sql"
echo -e "${GREEN}[✓]${NC} Yedek alindi"

# 2. Git pull
echo "[2/5] Git pull..."
git fetch origin
CURRENT=$(git rev-parse HEAD)
git pull origin main
NEW=$(git rev-parse HEAD)

if [ "$CURRENT" = "$NEW" ]; then
  echo -e "${GREEN}[✓]${NC} Zaten guncel, degisiklik yok."
  read -p "Yine de yeniden build edilsin mi? (y/n): " FORCE
  if [ "$FORCE" != "y" ]; then
    echo "Iptal edildi."
    exit 0
  fi
fi

echo -e "${GREEN}[✓]${NC} Kod guncellendi: ${CURRENT:0:7} -> ${NEW:0:7}"

# 3. Yeniden build
echo "[3/5] Docker build ediliyor (2-4 dk)..."
docker compose -f docker-compose.prod.yml build app
echo -e "${GREEN}[✓]${NC} Build tamamlandi"

# 4. Yeniden baslat (zero-downtime olmasi icin once build, sonra up)
echo "[4/5] Servisler yeniden baslatiliyor..."
docker compose -f docker-compose.prod.yml up -d app
sleep 5
echo -e "${GREEN}[✓]${NC} Uygulama baslatildi"

# 5. Migration
echo "[5/5] Veritabani migration..."
docker compose -f docker-compose.prod.yml exec -T app npx prisma migrate deploy 2>&1 | tail -3
echo -e "${GREEN}[✓]${NC} Migration tamamlandi"

# Nginx reload
docker compose -f docker-compose.prod.yml exec -T nginx nginx -s reload 2>/dev/null || true

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  Guncelleme tamamlandi!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
