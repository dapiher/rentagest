# RentaGest — CRM de alquileres residenciales

Stack: **Next.js 14** · **Supabase** · **Railway** · **LibreOffice** (generación PDF)

---

## Puesta en marcha

### 1. Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com)
2. Ve a **SQL Editor** y ejecuta todo el contenido de `supabase/schema.sql`
3. Ve a **Authentication → Providers** y activa Email/Password
4. Crea tu usuario en **Authentication → Users → Invite user**
5. Anota:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public key` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role secret` → `SUPABASE_SERVICE_ROLE_KEY`

### 2. Subir plantilla de contrato

1. En Supabase → **Storage** → bucket `plantillas`
2. Crea una carpeta con el `user_id` (UUID del usuario creado)
3. Sube tu plantilla Word como `lau_vivienda.docx`
4. La plantilla debe usar estas variables (sintaxis Mustache):
   - `{nombre_inquilino}`, `{apellidos_inquilino}`, `{dni_inquilino}`
   - `{nombre_propietario}`, `{dni_propietario}`
   - `{direccion_vivienda}`, `{superficie}`, `{referencia_catastral}`
   - `{renta}`, `{importe_fianza}`, `{dia_pago}`, `{forma_pago}`
   - `{fecha_inicio}`, `{fecha_fin}`, `{duracion}`
   - Cláusulas condicionales: `{#clausula_mascotas}...{/clausula_mascotas}`
5. Registra la plantilla en la tabla `plantillas_contrato` desde el SQL Editor:
   ```sql
   INSERT INTO plantillas_contrato (user_id, nombre, tipo, storage_path)
   VALUES ('<tu-user-id>', 'LAU Vivienda estándar', 'lau_vivienda', '<user-id>/lau_vivienda.docx');
   ```

### 3. Railway

1. Instala Railway CLI: `npm install -g @railway/cli`
2. Conecta tu repositorio:
   ```bash
   railway login
   railway init
   railway link
   ```
3. Configura las variables de entorno en Railway Dashboard → Variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   SUPABASE_SERVICE_ROLE_KEY=eyJ...
   NEXT_PUBLIC_APP_URL=https://tu-app.up.railway.app
   CRON_SECRET=una-clave-secreta-aleatoria
   ```
4. Despliega:
   ```bash
   railway up
   ```

### 4. Cron job — recibos mensuales automáticos

Configura en Railway un cron service (o usa [cron-job.org](https://cron-job.org)) que llame el día 1 de cada mes:

```
POST https://tu-app.up.railway.app/api/pagos
Authorization: Bearer <CRON_SECRET>
```

---

## Desarrollo local

```bash
cp .env.example .env.local
# Rellenar .env.local con tus credenciales de Supabase

npm install
npm run dev
# → http://localhost:3000
```

Para la generación de PDF en local necesitas LibreOffice instalado:
- **macOS**: `brew install libreoffice`
- **Ubuntu/Debian**: `sudo apt install libreoffice`
- **Windows**: Descargar desde libreoffice.org

---

## Estructura del proyecto

```
src/
├── app/
│   ├── (auth)/login/          # Página de login
│   ├── (dashboard)/
│   │   ├── dashboard/         # Dashboard con stats
│   │   ├── viviendas/         # CRUD viviendas + multi-propietario
│   │   ├── inquilinos/        # CRUD inquilinos
│   │   ├── contratos/         # Contratos + generación PDF
│   │   ├── pagos/             # Control de cobros
│   │   ├── fianzas/           # Depósitos y devoluciones
│   │   └── contabilidad/      # Ingresos vs gastos
│   └── api/
│       ├── contratos/generar/ # POST → genera PDF
│       ├── pagos/             # POST → genera recibos del mes (cron)
│       └── health/            # GET → healthcheck Railway
├── components/
│   └── dashboard/Sidebar.tsx
├── lib/
│   ├── supabase/              # Clientes server + browser
│   ├── contratos/generador.ts # Lógica docxtemplater + LibreOffice
│   └── utils.ts
└── types/index.ts

supabase/
└── schema.sql                 # Esquema completo con RLS y Storage
```

---

## Módulos incluidos

| Módulo         | Funcionalidad |
|----------------|---------------|
| Viviendas      | Alta, edición, múltiples propietarios con % y reparto de rentas |
| Inquilinos     | Ficha completa, historial de contratos |
| Contratos      | Generación PDF desde plantilla Word, cláusulas opcionales, firma |
| Pagos          | Recibos automáticos mensuales, marcado de cobros, alertas de impago |
| Fianzas        | Depósito, retención, devolución parcial/total |
| Contabilidad   | Ingresos vs gastos, gráfico mensual, desglose por categoría |

---

## Generación de contratos PDF

El flujo es:
1. Usuario pulsa "Generar PDF" en la página del contrato
2. Frontend llama a `POST /api/contratos/generar`
3. El servidor descarga la plantilla `.docx` de Supabase Storage
4. `docxtemplater` inyecta los datos del contrato en la plantilla
5. LibreOffice headless convierte el `.docx` a `.pdf`
6. El PDF se sube a Supabase Storage (`contratos/<id>/contrato.pdf`)
7. Se devuelve el PDF al navegador para descarga

La plantilla Word se edita con Word o LibreOffice, sin tocar código.
