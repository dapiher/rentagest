#!/bin/sh
# ============================================================
# instalar-en-qnap.sh
# Ejecutar en el QNAP por SSH después de copiar los archivos
#
# Uso:
#   ssh admin@<IP-QNAP>
#   sh /share/docker/rentagest/instalar-en-qnap.sh
# ============================================================

set -e

DIR="/share/docker/rentagest"
IMAGEN="rentagest-qnap.tar.gz"

echo ""
echo "=== RentaGest — Instalación en QNAP ==="
echo ""

# Verificar que existe el archivo de imagen
if [ ! -f "${DIR}/${IMAGEN}" ]; then
  echo "❌  No se encuentra ${DIR}/${IMAGEN}"
  echo "    Copia primero el archivo desde tu Mac."
  exit 1
fi

# Verificar que existe .env
if [ ! -f "${DIR}/.env" ]; then
  echo "❌  No se encuentra ${DIR}/.env"
  echo "    Copia y rellena el archivo .env con tus credenciales de Supabase."
  exit 1
fi

# Crear carpetas necesarias
echo "📁  Creando carpetas..."
mkdir -p ${DIR}/plantillas
mkdir -p ${DIR}/nginx/ssl
mkdir -p ${DIR}/nginx/certbot

# Cargar imagen Docker
echo "📦  Cargando imagen Docker (puede tardar 1-2 minutos)..."
docker load < ${DIR}/${IMAGEN}

echo ""
echo "✅  Imagen cargada correctamente."
echo ""
echo "📋  Siguiente paso — obtener certificado SSL:"
echo ""
echo "    1. Asegúrate de que el puerto 80 está abierto en tu router"
echo "       apuntando a la IP de este QNAP."
echo ""
echo "    2. Edita ${DIR}/nginx/nginx.conf y sustituye"
echo "       'tudominio.duckdns.org' por tu dominio real."
echo ""
echo "    3. Ejecuta este comando para obtener el certificado SSL:"
echo ""
echo "    docker run --rm \\"
echo "      -v ${DIR}/nginx/ssl:/etc/letsencrypt \\"
echo "      -v ${DIR}/nginx/certbot:/var/www/certbot \\"
echo "      -p 80:80 \\"
echo "      certbot/certbot certonly --standalone \\"
echo "      --email tu@email.com \\"
echo "      --agree-tos --no-eff-email \\"
echo "      -d tudominio.duckdns.org"
echo ""
echo "    4. Una vez obtenido el certificado, arranca todo con:"
echo ""
echo "    cd ${DIR} && docker compose --env-file .env up -d"
echo ""
