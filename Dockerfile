FROM node:20-slim AS base

# Instalar LibreOffice para conversión DOCX → PDF
RUN apt-get update && apt-get install -y \
    libreoffice \
    libreoffice-writer \
    fonts-liberation \
    curl \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# ---- Deps ----
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# ---- Build ----
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---- Runner ----
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser  --system --uid 1001 nextjs

# Copiar archivos de build
COPY --from=builder /app/public             ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static    ./.next/static

# Carpeta de plantillas
COPY --from=builder /app/plantillas ./plantillas

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
