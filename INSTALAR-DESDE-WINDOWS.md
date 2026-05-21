# RentaGest — Instalación desde Windows 11 en QNAP TS-251
# Sin instalar nada en Windows (excepto PuTTY, opcional)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 RESUMEN DEL PROCESO (3 partes, ~30 minutos)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  PARTE 1 — Supabase (en el navegador, ~5 min)
  PARTE 2 — Copiar archivos al QNAP (Explorador Windows, ~2 min)
  PARTE 3 — Construir y arrancar en el QNAP (SSH, ~20 min)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 PARTE 1 — CONFIGURAR SUPABASE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Ve a https://supabase.com y crea una cuenta gratuita

2. Crea un nuevo proyecto:
   - Nombre: rentagest
   - Contraseña de base de datos: anótala en un lugar seguro
   - Región: West EU (Amsterdam) — la más cercana a España

3. Espera ~2 minutos a que el proyecto se inicialice

4. Ve a: SQL Editor (menú izquierdo)
   - Pulsa "New query"
   - Abre el archivo  supabase/schema.sql  del ZIP
   - Copia TODO el contenido y pégalo en el editor
   - Pulsa "Run" (botón verde)
   - Verás "Success. No rows returned" — es correcto

5. Crea tu usuario:
   - Ve a Authentication → Users → "Invite user"
   - Pon tu email y pulsa "Send invite"
   - Revisa tu correo y establece tu contraseña

6. Anota tus credenciales:
   - Ve a Settings → API
   - Copia estos tres valores (los necesitarás en el Paso 2):

     Project URL:        https://XXXX.supabase.co
     anon public:        eyJhbGci...  (clave larga)
     service_role:       eyJhbGci...  (clave larga, más abajo)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 PARTE 2 — COPIAR ARCHIVOS AL QNAP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Descomprime el ZIP en tu escritorio
   Verás la carpeta "rentagest"

2. Abre el archivo  .env.example  con el Bloc de notas:
   - Sustituye los valores con los de Supabase (Parte 1, paso 6)
   - En NEXT_PUBLIC_APP_URL pon la IP local de tu QNAP:
       http://192.168.1.XXX:8090
     (la IP la ves en el panel del QNAP o en tu router)
   - Guarda el archivo como  .env  (sin .example, sin .txt)
     → En "Guardar como", en "Tipo" elige "Todos los archivos"
     → Escribe el nombre exacto:  .env

3. Copia la carpeta al QNAP por la red:
   - Abre el Explorador de Windows
   - En la barra de dirección escribe:
       \\192.168.1.XXX\  (la IP de tu QNAP)
   - Entra con usuario "admin" y tu contraseña del QNAP
   - Navega hasta la carpeta compartida (normalmente "Public"
     o "homes/admin")
   - Crea una carpeta llamada  rentagest
   - Copia TODA la carpeta del escritorio dentro

   La ruta final en el QNAP debe ser algo como:
     /share/homes/admin/rentagest/
   o
     /share/Public/rentagest/

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 PARTE 3 — CONSTRUIR Y ARRANCAR EN EL QNAP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Necesitas conectarte al QNAP por SSH. Windows 11 ya incluye
un cliente SSH, no hace falta instalar nada.

1. Abre una ventana de PowerShell:
   - Pulsa  Windows + X  → "Terminal" o "PowerShell"

2. Conéctate al QNAP:
   ssh admin@192.168.1.XXX
   (escribe la IP de tu QNAP)
   - Primera vez pregunta si confías: escribe  yes  y Enter
   - Introduce tu contraseña del QNAP

3. Navega a la carpeta del proyecto:
   cd /share/homes/admin/rentagest
   (o la ruta donde copiaste los archivos)

4. Activa SSH en el QNAP si no lo tienes:
   Panel de control QNAP → Red y servicios de archivos
   → Telnet/SSH → Activar SSH

5. Construye e inicia la aplicación:

   docker compose --env-file .env up -d --build

   ⚠️  Esto tardará entre 15 y 30 minutos la primera vez
       porque descarga e instala LibreOffice en la imagen.
       Es normal, no te preocupes si parece que no hace nada.

6. Verifica que está funcionando:

   docker compose ps

   Debes ver algo así:
   NAME               STATUS
   rentagest          Up (healthy)
   rentagest-nginx    Up

7. Abre el navegador en Windows y ve a:
   http://192.168.1.XXX:8090

   ¡Deberías ver la pantalla de login de RentaGest!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 COMANDOS ÚTILES PARA EL DÍA A DÍA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Conectarte al QNAP:
  ssh admin@192.168.1.XXX

Ver si la app está corriendo:
  docker compose -f /share/homes/admin/rentagest/docker-compose.yml ps

Reiniciar la app:
  docker compose -f /share/homes/admin/rentagest/docker-compose.yml restart

Ver los logs (errores):
  docker compose -f /share/homes/admin/rentagest/docker-compose.yml logs -f rentagest

Parar todo:
  docker compose -f /share/homes/admin/rentagest/docker-compose.yml down

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 ACCESO DESDE FUERA DE CASA (con tu IP fija o DDNS)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Una vez que funcione en local, para acceder desde fuera:

1. En tu router, abre el puerto 8090 → IP del QNAP, puerto 8090

2. Accede desde cualquier sitio con:
   http://TU-IP-FIJA-O-DDNS:8090

3. Si quieres HTTPS (recomendado), dímelo y te añado
   el certificado SSL gratuito con Let's Encrypt.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 SOLUCIÓN DE PROBLEMAS COMUNES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

"No puedo conectarme por SSH"
  → Activa SSH en: Panel de control QNAP → Red y servicios
    de archivos → Telnet/SSH → Activar SSH en el puerto 22

"El build falla con error de memoria"
  → El QNAP necesita al menos 1 GB libre. Reinicia el QNAP
    y vuelve a intentarlo.

"La web carga pero no puedo entrar"
  → Verifica que el usuario existe en Supabase:
    Authentication → Users

"El contenedor no aparece como 'healthy'"
  → Espera 2 minutos más, el arranque inicial es lento.
  → Revisa los logs: docker compose logs rentagest
