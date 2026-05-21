═══════════════════════════════════════════════════════════════════════
 SUBIR RENTAGEST A GITHUB — SOLO CON EL NAVEGADOR
═══════════════════════════════════════════════════════════════════════

PASO 1 — CREAR CUENTA GITHUB
═══════════════════════════════════════════════════════════════════════

☐ 1. Ve a https://github.com/signup

☐ 2. Introduce tu email

☐ 3. Crea contraseña (guárdala en un lugar seguro)

☐ 4. Nombre de usuario (ej: juan-garcia, tu-nombre, etc)
        Esto será importante más adelante

☐ 5. Verifica tu email

☐ 6. Elige plan → "Free" (es gratuito permanente)

PASO 2 — CREAR NUEVO REPOSITORIO
═══════════════════════════════════════════════════════════════════════

☐ 1. Inicia sesión en GitHub (si no lo estás ya)

☐ 2. En la esquina superior derecha, clic en tu foto/avatar

☐ 3. Clic en "Your repositories"

☐ 4. Botón verde "New"

☐ 5. Rellena los datos:

    Repository name: rentagest
    
    Description: CRM para gestión de alquileres residenciales
    
    Public (IMPORTANTE: debe ser público, no privado)
    
    ☑ Initialize this repository with:
       ☐ Add a README file (déjalo sin marcar)
       ☐ Add .gitignore (déjalo sin marcar)
       ☐ Choose a license (déjalo sin marcar)

☐ 6. Clic en "Create repository"

PASO 3 — SUBIR LOS ARCHIVOS (SIN DESCOMPRIMIR)
═══════════════════════════════════════════════════════════════════════

En la página del repositorio que acabas de crear, verás un botón
"Upload files" o un área donde dice "drop files here"

☐ 1. Clic en "Upload files" (o "Add files" → "Upload files")

☐ 2. Abre el explorador Windows

☐ 3. Descomprime el ZIP (clic derecho → Extraer todo)

☐ 4. Entra en la carpeta descomprimida "rentagest"

☐ 5. Selecciona TODO (Ctrl+A):
    - src/
    - supabase/
    - plantillas/
    - nginx/
    - Dockerfile
    - docker-compose.yml
    - package.json
    - tsconfig.json
    - tailwind.config.ts
    - next.config.js
    - postcss.config.js
    - .gitignore
    - .env.example
    - README.md
    - CHECKLIST.txt
    - INSTALAR-SOLO-GUI-QNAP.md
    - (todos los archivos)

☐ 6. Arrastra TODO a la ventana del navegador GitHub
    (o clic en "select files" y navega hasta la carpeta)

☐ 7. Espera a que termine la carga

☐ 8. En "Commit message" escribe:
    Initial commit: RentaGest CRM

☐ 9. Clic en "Commit changes"

PASO 4 — VERIFICAR QUE ESTÁ BIEN SUBIDO
═══════════════════════════════════════════════════════════════════════

☐ 1. Espera unos segundos

☐ 2. Deberías ver los archivos en el navegador:
    - src/ (carpeta)
    - supabase/ (carpeta)
    - Dockerfile (archivo)
    - docker-compose.yml (archivo)
    - etc.

☐ 3. Copia la URL del repositorio (está en la barra del navegador)
    Ejemplo: https://github.com/tu-usuario/rentagest

GUARDA ESTA URL ↓
═══════════════════════════════════════════════════════════════════════
https://github.com/TU-USUARIO/rentagest
═══════════════════════════════════════════════════════════════════════

PASO 5 — USAR EN CONTAINER STATION
═══════════════════════════════════════════════════════════════════════

En el QNAP, Container Station → Build:

☐ 1. ☑ Build from Git repository

☐ 2. Git Repository URL:
    https://github.com/TU-USUARIO/rentagest.git
    (importante: .git al final)

☐ 3. Dockerfile path: Dockerfile

☐ 4. Tag: rentagest:latest

☐ 5. Pulsa "Build"

   ⏳ Esto tardará 20-30 minutos la primera vez
   ✅ Cuando veas "Build completed successfully" → listo

═══════════════════════════════════════════════════════════════════════
 NOTAS IMPORTANTES
═══════════════════════════════════════════════════════════════════════

✓ El repositorio DEBE ser público (no privado) para que
  Container Station pueda descargarlo sin problemas

✓ Si GitHub dice que no puede cargar ciertos archivos
  (como .env), es normal — no es un problema

✓ Una vez que está en GitHub, puedes hacer cambios y
  actualizaciones simplemente cambiando los archivos allí,
  y en Container Station hacer un nuevo Build

✓ Si se te olvida la URL, siempre puedes volver a:
  github.com → tu usuario → tu repositorio
