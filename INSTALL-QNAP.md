# RentaGest en QNAP TS-251 — Guía de instalación completa

---

## Lo que vamos a montar

```
Internet → Router (puerto 443) → QNAP → Nginx (SSL) → RentaGest (Node)
                                                      → Supabase (nube, bbdd)
```

La base de datos sigue en Supabase (gratuito permanente).
El servidor Next.js corre en tu QNAP dentro de Docker.

---

## PASO 1 — Preparar el QNAP

### 1.1 Abrir SSH en el QNAP

1. Panel de control → Servicios de red → Telnet/SSH
2. Activar **Servicio SSH** → puerto 22
3. Desde tu PC: `ssh admin@<IP-del-QNAP>`

### 1.2 Crear carpetas de trabajo

```bash
mkdir -p /share/docker/rentagest/plantillas
mkdir -p /share/docker/rentagest/nginx
```

---

## PASO 2 — Modificar el Dockerfile (eliminar Railway, añadir QNAP)

El Dockerfile del proyecto ya funciona en el QNAP sin cambios.
Solo hay que asegurarse de que el build se hace correctamente.

En tu PC, dentro de la carpeta del proyecto:

```bash
# Construir la imagen (hazlo en tu PC si es más rápido, o en el QNAP)
docker build -t rentagest:latest .
```

Si quieres construir directamente en el QNAP (más lento pero sin mover archivos):

```bash
# Copiar proyecto al QNAP
scp -r rentagest/ admin@<IP-QNAP>:/share/docker/rentagest/app

# Conectar por SSH al QNAP y construir
ssh admin@<IP-QNAP>
cd /share/docker/rentagest/app
docker build -t rentagest:latest .
```

---

## PASO 3 — docker-compose.yml

Crea este archivo en `/share/docker/rentagest/docker-compose.yml`:

```yaml
version: '3.8'

services:

  # ── Aplicación Next.js ──────────────────────────────────────
  rentagest:
    image: rentagest:latest
    container_name: rentagest
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - PORT=3000
      - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
      - NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
      - CRON_SECRET=${CRON_SECRET}
    volumes:
      # Plantillas Word persistentes (no se pierden al actualizar)
      - /share/docker/rentagest/plantillas:/app/plantillas
    expose:
      - "3000"
    networks:
      - rentagest-net
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # ── Nginx (SSL + proxy inverso) ─────────────────────────────
  nginx:
    image: nginx:alpine
    container_name: rentagest-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /share/docker/rentagest/nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - /share/docker/rentagest/nginx/ssl:/etc/nginx/ssl:ro
      - /share/docker/rentagest/nginx/certbot:/var/www/certbot:ro
    depends_on:
      - rentagest
    networks:
      - rentagest-net

networks:
  rentagest-net:
    driver: bridge
```

---

## PASO 4 — Variables de entorno

Crea `/share/docker/rentagest/.env`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxxxxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxxxxxxxxx
NEXT_PUBLIC_APP_URL=https://tudominio.duckdns.org
CRON_SECRET=pon-aqui-una-clave-larga-aleatoria
```

> ⚠️ Sustituye `tudominio.duckdns.org` por tu IP fija o dominio DDNS real.

---

## PASO 5 — Configurar Nginx con SSL

### 5.1 Configuración inicial (HTTP, para obtener el certificado)

Crea `/share/docker/rentagest/nginx/nginx.conf`:

```nginx
events { worker_connections 1024; }

http {
    # Redirigir todo HTTP a HTTPS
    server {
        listen 80;
        server_name tudominio.duckdns.org;

        # Necesario para que certbot pueda verificar el dominio
        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }

        location / {
            return 301 https://$host$request_uri;
        }
    }
}
```

### 5.2 Obtener certificado SSL gratuito (Let's Encrypt)

```bash
# En el QNAP por SSH
docker run --rm \
  -v /share/docker/rentagest/nginx/ssl:/etc/letsencrypt \
  -v /share/docker/rentagest/nginx/certbot:/var/www/certbot \
  -p 80:80 \
  certbot/certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email tu@email.com \
  --agree-tos \
  --no-eff-email \
  -d tudominio.duckdns.org
```

### 5.3 Configuración Nginx final (HTTPS)

Actualiza `/share/docker/rentagest/nginx/nginx.conf`:

```nginx
events { worker_connections 1024; }

http {
    # Seguridad
    server_tokens off;
    add_header X-Frame-Options SAMEORIGIN;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";

    # Redirigir HTTP → HTTPS
    server {
        listen 80;
        server_name tudominio.duckdns.org;
        return 301 https://$host$request_uri;
    }

    # HTTPS → RentaGest
    server {
        listen 443 ssl http2;
        server_name tudominio.duckdns.org;

        ssl_certificate     /etc/nginx/ssl/live/tudominio.duckdns.org/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/live/tudominio.duckdns.org/privkey.pem;
        ssl_protocols       TLSv1.2 TLSv1.3;
        ssl_ciphers         HIGH:!aNULL:!MD5;

        # Subida de archivos (plantillas Word)
        client_max_body_size 20M;

        location / {
            proxy_pass         http://rentagest:3000;
            proxy_http_version 1.1;
            proxy_set_header   Upgrade $http_upgrade;
            proxy_set_header   Connection 'upgrade';
            proxy_set_header   Host $host;
            proxy_set_header   X-Real-IP $remote_addr;
            proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header   X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
            proxy_read_timeout 60s;
        }
    }
}
```

---

## PASO 6 — Abrir puertos en el router

En la configuración de tu router, añade estas reglas de NAT/reenvío de puertos:

| Puerto externo | Puerto interno | Protocolo | Destino       |
|---------------|----------------|-----------|---------------|
| 80            | 80             | TCP       | IP del QNAP   |
| 443           | 443            | TCP       | IP del QNAP   |

> El QNAP debe tener IP fija en tu red local (asígnala en el router por MAC address).

---

## PASO 7 — Arrancar todo

```bash
ssh admin@<IP-QNAP>
cd /share/docker/rentagest

# Arrancar los contenedores
docker compose --env-file .env up -d

# Ver logs
docker compose logs -f rentagest

# Verificar que está corriendo
docker compose ps
```

Si todo va bien, en los logs verás:
```
rentagest  | ▲ Next.js 14.x.x
rentagest  | - Local: http://localhost:3000
rentagest  | ✓ Ready in Xs
```

---

## PASO 8 — Renovación automática del certificado SSL

El certificado de Let's Encrypt dura 90 días. Añade un cron job en el QNAP:

```bash
# Panel de control QNAP → Aplicaciones → Tareas programadas → Crear
# O editar crontab por SSH:
crontab -e

# Añadir esta línea (renueva cada mes, día 1 a las 3am):
0 3 1 * * docker run --rm -v /share/docker/rentagest/nginx/ssl:/etc/letsencrypt -v /share/docker/rentagest/nginx/certbot:/var/www/certbot certbot/certbot renew --quiet && docker exec rentagest-nginx nginx -s reload
```

---

## PASO 9 — Cron job para recibos mensuales

El día 1 de cada mes el sistema genera automáticamente los recibos de renta.
Añade otra tarea programada en el QNAP:

```bash
# En crontab (día 1 de cada mes a las 8am):
0 8 1 * * curl -s -X POST https://tudominio.duckdns.org/api/pagos -H "Authorization: Bearer <CRON_SECRET>"
```

Sustituye `<CRON_SECRET>` por el valor que pusiste en el `.env`.

---

## PASO 10 — Actualizar la aplicación

Cuando haya cambios en el código:

```bash
# En tu PC
docker build -t rentagest:latest .
docker save rentagest:latest | gzip > rentagest.tar.gz
scp rentagest.tar.gz admin@<IP-QNAP>:/share/docker/rentagest/

# En el QNAP
ssh admin@<IP-QNAP>
docker load < /share/docker/rentagest/rentagest.tar.gz
cd /share/docker/rentagest
docker compose up -d --no-deps rentagest
```

---

## Resumen de costes

| Servicio     | Coste    | Notas                              |
|-------------|----------|------------------------------------|
| QNAP TS-251 | Ya tienes| Consume ~15W, ~1,30€/mes de luz    |
| Supabase    | Gratis   | 500MB bbdd, 1GB storage            |
| Let's Encrypt| Gratis  | SSL renovable cada 90 días         |
| DuckDNS     | Gratis   | DDNS si no tienes IP fija estática |
| **Total**   | **~0€**  |                                    |

---

## Solución de problemas

**El contenedor no arranca:**
```bash
docker compose logs rentagest
```

**La generación de PDF falla:**
```bash
# Verificar que LibreOffice está en el contenedor
docker exec rentagest which libreoffice
```

**No se puede acceder desde fuera:**
- Verificar que los puertos 80 y 443 están abiertos en el router
- Verificar que el QNAP tiene IP local fija
- Probar acceso local primero: `http://<IP-QNAP>:3000`

**El certificado SSL no se obtiene:**
- Asegúrate de que el puerto 80 está abierto en el router ANTES de ejecutar certbot
- Verifica que el dominio DDNS apunta a tu IP pública: `nslookup tudominio.duckdns.org`
