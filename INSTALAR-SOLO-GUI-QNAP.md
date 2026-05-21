# RentaGest — Instalación ÚNICAMENTE desde Container Station (GUI)
# Sin instalar nada en Windows, sin tocar la terminal

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 RESUMEN (3 pasos, ~40 minutos)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  1. Configurar Supabase (en el navegador)
  2. Copiar el .env al QNAP (Explorador Windows)
  3. Crear contenedor desde GitHub en Container Station (GUI)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 PASO 1 — CONFIGURAR SUPABASE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Ve a https://supabase.com → crea cuenta gratis

2. Crea proyecto nuevo:
   - Nombre: rentagest
   - Contraseña: apúntala en un lugar seguro
   - Región: West EU

3. Espera a que se inicialice (~2 min)

4. SQL Editor → New query:
   - Abre el archivo supabase/schema.sql del ZIP
   - Copia TODO el contenido
   - Pégalo en el SQL Editor
   - Pulsa "Run" (verde)

5. Authentication → Users → "Invite user":
   - Escribe tu email
   - Entra en tu email y establece contraseña

6. Guarda estas tres credenciales (las necesitarás en Paso 2):
   
   Settings → API:
   ┌─────────────────────────────────────────────┐
   │ Project URL (ej: https://xxx.supabase.co)   │
   │ anon public key (empieza por eyJ...)         │
   │ service_role secret (empieza por eyJ...)     │
   └─────────────────────────────────────────────┘

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 PASO 2 — PREPARAR EL ARCHIVO .env
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. En Windows, abre el Bloc de notas

2. Copia esto (sustituye los valores de Supabase):

   NEXT_PUBLIC_SUPABASE_URL=https://XXXXXXXXXX.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.XXXX
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.XXXX
   NEXT_PUBLIC_APP_URL=http://192.168.1.100:8090
   CRON_SECRET=cualquier-texto-largo-aleatorio

3. Guarda como:
   - Nombre exacto: .env
   - Tipo: Todos los archivos (importante!)
   - Carpeta: tu Escritorio

4. Copia al QNAP:
   - Explorador Windows → \\192.168.1.XXX\ (la IP de tu QNAP)
   - Usuario: admin
   - Entra en la carpeta compartida (Public o homes/admin)
   - Crea carpeta llamada rentagest
   - Copia el archivo .env dentro

   Resultado: /share/homes/admin/rentagest/.env

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 PASO 3 — CREAR CONTENEDOR DESDE CONTAINER STATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. En el QNAP, abre Container Station (desde el escritorio o Apps)

2. Ve a la pestaña "Create" o "Build" (depende de la versión)

3. En "Image Source" selecciona:
   ☑ Build from Dockerfile (or git repository)

4. En "Git Repository URL" escribe:
   https://github.com/TU-USUARIO-GITHUB/rentagest.git
   
   (Si no tienes GitHub, te pido que lo uses. Es gratuito y
    así Container Station descarga el código automáticamente)

5. En "Dockerfile path" deja: Dockerfile

6. En "Tag" escribe: rentagest:latest

7. Pulsa "Build"
   ⏱ Esto tardará 20-30 minutos la primera vez (LibreOffice es pesado)
   ✓ Verás "Build completed successfully" cuando termine

8. Una vez construida, ve a la pestaña "Containers"

9. Pulsa "Create" o "New" y selecciona "rentagest:latest"

10. En "Advanced Settings":

    ┌─ ENVIRONMENT ─────────────────────────────────────────┐
    │ Haz clic en "Environment" y añade estas variables:    │
    │                                                        │
    │ NODE_ENV = production                                 │
    │ PORT = 3000                                            │
    │ NEXT_PUBLIC_SUPABASE_URL = (de Supabase)              │
    │ NEXT_PUBLIC_SUPABASE_ANON_KEY = (de Supabase)         │
    │ SUPABASE_SERVICE_ROLE_KEY = (de Supabase)             │
    │ NEXT_PUBLIC_APP_URL = http://192.168.1.100:8090       │
    │ CRON_SECRET = (cualquier texto)                        │
    └────────────────────────────────────────────────────────┘

    ┌─ PORTS ────────────────────────────────────────────────┐
    │ Container port: 3000                                   │
    │ Host port: 8090                                        │
    └────────────────────────────────────────────────────────┘

    ┌─ VOLUMES ──────────────────────────────────────────────┐
    │ Mount path (container): /app/plantillas                │
    │ Mount path (host): /share/homes/admin/rentagest/       │
    │                    plantillas                          │
    └────────────────────────────────────────────────────────┘

11. Pulsa "Create" y espera a que arranque

12. Cuando veas status "Running", abre en el navegador:
    http://192.168.1.100:8090
    
    ¡Deberías ver la pantalla de login!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GESTIONAR DESDE CONTAINER STATION (SIN TERMINAL)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Ver logs (errores):
  - Click derecho en el contenedor → View logs

Reiniciar:
  - Click derecho → Stop → Start

Parar:
  - Click derecho → Stop

Eliminar:
  - Click derecho → Remove

Actualizar a nueva versión:
  - Vuelve a la pestaña "Build" → Build nuevamente
  - En Containers, elimina el anterior y crea uno nuevo con
    la imagen actualizada

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 APUNTES IMPORTANTES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

• Necesitas tener el archivo .env EN EL QNAP ANTES de crear
  el contenedor. Container Station lo necesita para las
  variables de entorno.

• La primera vez que se construye la imagen tardará mucho
  (20-30 min). Las siguientes veces será más rápido.

• Si la app no inicia, ve a Containers → Click derecho en
  rentagest → View logs → busca mensajes rojos (errores).

• El puerto 8090 es provisional para la red local. Luego
  podemos configurar HTTPS y acceso desde fuera.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 ACCESO DESDE FUERA DE CASA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Cuando funcione en local y quieras acceder desde fuera:

1. Abre puerto 8090 en tu router → IP del QNAP:8090

2. Accede desde cualquier sitio:
   http://TU-IP-PUBLICA:8090

3. Para HTTPS (recomendado), dímelo y añadimos certificado
   Let's Encrypt gratuito.
