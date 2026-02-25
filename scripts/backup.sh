#!/bin/bash
# ============================================================
# Pixfora - Otomatik Yedekleme Script'i
# Crontab: 0 3 * * * /home/pixfora/app/scripts/backup.sh
# (Her gece saat 03:00'te calisir)
# ============================================================
set -e

PROJECT_DIR="/home/pixfora/app"
BACKUP_DIR="/home/pixfora/backups"
DATE=$(date +%Y%m%d-%H%M%S)
KEEP_DAYS=7

mkdir -p $BACKUP_DIR

cd $PROJECT_DIR

# 1. Veritabani yedegi
echo "📦 Veritabani yedekleniyor..."
docker compose -f docker-compose.prod.yml exec -T postgres \
  pg_dump -U pixfora pixfora | gzip > "$BACKUP_DIR/db-$DATE.sql.gz"

# 2. Upload dosyalari yedegi
echo "📁 Upload dosyalari yedekleniyor..."
docker compose -f docker-compose.prod.yml exec -T app \
  tar czf - public/uploads 2>/dev/null > "$BACKUP_DIR/uploads-$DATE.tar.gz" || true

# 3. Eski yedekleri sil
echo "🗑️  $KEEP_DAYS gunden eski yedekler siliniyor..."
find $BACKUP_DIR -name "*.gz" -mtime +$KEEP_DAYS -delete

# 4. Boyut raporu
TOTAL=$(du -sh $BACKUP_DIR | cut -f1)
echo "✅ Yedekleme tamamlandi. Toplam: $TOTAL"
echo "   DB:      $BACKUP_DIR/db-$DATE.sql.gz"
echo "   Uploads: $BACKUP_DIR/uploads-$DATE.tar.gz"
