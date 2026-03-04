FROM node:20-alpine AS base

# --- Dependencies ---
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
# Once tum bagimliliklari kur (build icin gerekli)
RUN npm ci
# Prod bagimliliklari ayri kaydet (runner icin)
RUN cp -R node_modules /tmp/all_node_modules && \
    npm ci --omit=dev && \
    cp -R node_modules /tmp/prod_node_modules

# --- Builder ---
FROM base AS builder
WORKDIR /app
COPY --from=deps /tmp/all_node_modules ./node_modules
COPY . .

# Prisma generate
RUN npx prisma generate

# Build
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# --- Runner ---
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Chromium ve bagimliliklari kur (Puppeteer icin)
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Puppeteer'a Chromium yolunu bildir
ENV CHROMIUM_PATH=/usr/bin/chromium-browser
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# 1) Once standalone output'u kopyala (server.js + minimal node_modules)
COPY --from=builder /app/.next/standalone ./

# 2) Standalone'un ustune eksik prod bagimliliklari ekle (bcryptjs, slugify vb)
COPY --from=deps /tmp/prod_node_modules ./node_modules

# 3) Prisma client'i kopyala (standalone bunu dogru trace edemiyor)
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# 4) Prisma schema (migration icin)
COPY --from=builder /app/prisma ./prisma

# 5) Static dosyalar ve public
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json

# Upload dizini
RUN mkdir -p public/uploads && chown -R nextjs:nodejs public/uploads

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
