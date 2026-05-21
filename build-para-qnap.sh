#!/bin/bash
# ============================================================
# build-para-qnap.sh
# Construye la imagen Docker para QNAP (Intel x86_64)
# desde un Mac Apple Silicon (M1/M2/M3/M4)
#
# Uso: ./build-para-qnap.sh
# ============================================================

set -e

IMAGEN="rentagest"
TAG="latest"
ARCHIVO_SALIDA="rentagest-qnap.tar.gz"

echo ""
echo "🏗  Construyendo imagen para linux/amd64 (Intel/QNAP)..."
echo "    (Puede tardar 5-10 minutos la primera vez por LibreOffice)"
echo ""

# Construir para x86_64 aunque estemos en Apple Silicon
docker buildx build \
  --platform linux/amd64 \
  --load \
  -t ${IMAGEN}:${TAG} \
  .

echo ""
echo "📦  Exportando imagen a ${ARCHIVO_SALIDA}..."
docker save ${IMAGEN}:${TAG} | gzip > ${ARCHIVO_SALIDA}

SIZE=$(du -sh ${ARCHIVO_SALIDA} | cut -f1)
echo ""
echo "✅  Listo. Archivo generado: ${ARCHIVO_SALIDA} (${SIZE})"
echo ""
echo "📋  Próximos pasos:"
echo "    1. Copia ${ARCHIVO_SALIDA} al QNAP (FileStation o scp)"
echo "    2. Copia también docker-compose.yml, nginx/ y .env al QNAP"
echo "    3. Sigue la guía INSTALL-QNAP.md desde el Paso 6"
echo ""
