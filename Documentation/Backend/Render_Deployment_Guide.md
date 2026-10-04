# Guía de Despliegue del Backend en Render y Conexión con Vercel

> **Documento:** `Documentation/Backend/Render_Deployment_Guide.md`  
> **Proyecto:** DevSculptor Backend Core  
> **Plataforma de Hosting:** Render (Web Service)  
> **Plataforma Frontend:** Vercel  
> **Base de Datos:** PostgreSQL en Supabase Cloud  

---

## 📋 Resumen de la Topología de Despliegue

```
┌─────────────────────────────────┐           HTTPS REST /api/v1          ┌─────────────────────────────────┐
│     FRONTEND (Vercel)           │ ────────────────────────────────────► │      BACKEND (Render)           │
│  https://*.vercel.app           │ ◄──────────────────────────────────── │  https://*.onrender.com         │
│  (o tu dominio propio)          │                CORS OK                │  (o api.tudominio.com)          │
└─────────────────────────────────┘                                       └────────────────┬────────────────┘
                                                                                           │ Conexión SSL Pool
                                                                                           ▼
                                                                          ┌─────────────────────────────────┐
                                                                          │   BASE DE DATOS (Supabase)      │
                                                                          │   PostgreSQL 15+ Cloud          │
                                                                          └─────────────────────────────────┘
```

---

## 🚀 Método 1: Despliegue Automatizado con Blueprint (`render.yaml`) — Recomendado

El repositorio incluye un archivo [`render.yaml`](file:///c:/Users/natha/Documents/Repos/DevSculptor/render.yaml) preconfigurado que define la infraestructura como código.

1. **Inicia sesión en Render:** Ve a [dashboard.render.com](https://dashboard.render.com/).
2. Haz clic en el botón superior **"New +"** y selecciona **"Blueprint"**.
3. Conecta y selecciona tu repositorio `NMullerSM/DevSculptor`.
4. Render detectará automáticamente `render.yaml` y configurará:
   * **Nombre del servicio:** `devsculptor-backend`
   * **Directorio raíz (`rootDir`):** `devsculptor-backend`
   * **Entorno de ejecución (`env`):** `docker` (Utiliza el Dockerfile multi-etapa con Node 20 LTS)
   * **Ruta del Dockerfile:** `Dockerfile`
   * **Ruta de verificación de salud (`healthCheckPath`):** `/api/v1/health`
5. En la pantalla de revisión, Render te solicitará completar las variables secretas que no están sincronizadas:
   * `DATABASE_URL`: La cadena de conexión a tu base de datos Supabase (o `DB_HOST`, `DB_PASSWORD`, etc.).
   * `GEMINI_API_KEY`: Tu API Key de Google Gemini.
   * `CORS_ORIGINS`: La URL de tu frontend en Vercel (ej. `https://temporary-zippy-nitrogen-3e2182f.vercel.app`) y tu dominio personalizado si lo tienes.
6. Haz clic en **"Apply"** y Render comenzará a construir y desplegar tu backend.

---

## 🛠️ Método 2: Despliegue Manual como Web Service en Render

Si prefieres configurarlo manualmente desde el panel de Render paso a paso:

### Paso 1: Crear el Web Service
1. En el Dashboard de Render, haz clic en **"New +" ➔ "Web Service"**.
2. Conecta tu repositorio de GitHub `NMullerSM/DevSculptor`.
3. Completa los siguientes campos:

| Parámetro | Valor |
| :--- | :--- |
| **Name** | `devsculptor-backend` |
| **Region** | `Oregon (US West)` o la más cercana a tu base de datos Supabase |
| **Branch** | `main` |
| **Root Directory** | `devsculptor-backend` |
| **Runtime / Environment** | `Docker` |
| **Dockerfile Path** | `Dockerfile` |
| **Instance Type** | `Free` (o el plan que desees) |

### Paso 2: Configurar la Verificación de Salud (Health Check)
En la sección **Advanced**:
* **Health Check Path:** `/api/v1/health`
*(Esto permite que Render verifique que Express y PostgreSQL estén respondiendo antes de enrutar tráfico).*

### Paso 3: Configurar Variables de Entorno (Environment Variables)
Agrega las siguientes variables en la pestaña **Environment**:

| Clave | Valor Recomendado / Descripción |
| :--- | :--- |
| `NODE_ENV` | `production` |
| `PORT` | `10000` *(Render inyecta PORT automáticamente, pero puedes fijarlo)* |
| `DATABASE_URL` | URI de Supabase: `postgresql://postgres.[ref]:[PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres?sslmode=require` |
| `DB_SSL` | `true` |
| `JWT_SECRET` | Clave aleatoria de al menos 32 caracteres *(ej. generada con `openssl rand -base64 32`)* |
| `JWT_EXPIRES_IN` | `24h` |
| `CORS_ORIGINS` | URLs de tu frontend separadas por coma, por ejemplo: `https://temporary-zippy-nitrogen-3e2182f.vercel.app,https://tudominio.com` |
| `RATE_LIMIT_WINDOW_MS` | `900000` *(15 minutos)* |
| `RATE_LIMIT_MAX` | `100` |
| `AI_PROVIDER` | `gemini` |
| `GEMINI_API_KEY` | Tu API Key de Google Gemini |
| `GEMINI_MODEL` | `gemini-2.5-flash` |

> [!TIP]
> Si no utilizas `DATABASE_URL`, puedes ingresar los valores individuales: `DB_HOST`, `DB_PORT` (5432), `DB_USER`, `DB_PASSWORD`, `DB_NAME` (postgres) y `DB_SSL=true`.

4. Haz clic en **"Create Web Service"**.

---

## 🔗 Paso 3: Conectar el Backend de Render con el Frontend de Vercel

Una vez que Render finalice el despliegue con éxito, verás la URL pública de tu API, por ejemplo:
`https://devsculptor-backend.onrender.com`

Para que el frontend desplegado en Vercel se comunique con Render:

1. Ve a tu panel de **Vercel** ➔ Selecciona el proyecto `devsculptor-frontend`.
2. Dirígete a **Settings** ➔ **Environment Variables**.
3. Añade la variable:
   * **Key:** `VITE_API_URL`
   * **Value:** `https://devsculptor-backend.onrender.com/api/v1` *(o con tu dominio propio: `https://api.tudominio.com/api/v1`)*
   * **Environment:** Selecciona `Production`, `Preview` y `Development`.
4. Ve a la pestaña **Deployments** en Vercel, haz clic en los tres puntos `...` del último despliegue y selecciona **"Redeploy"** para que los archivos estáticos se compilen con la nueva variable.

---

## 🌐 Paso 4: Configurar tu Dominio Personalizado

Si tienes un dominio propio (por ejemplo, `midominio.com`):

### Para el Frontend en Vercel:
1. En Vercel: **Settings ➔ Domains**.
2. Añade `midominio.com` (o `app.midominio.com`).
3. En tu proveedor de DNS (GoDaddy, Namecheap, Cloudflare, etc.), añade el registro `CNAME` apuntando a `cname.vercel-dns.com` o el registro `A` indicado por Vercel.

### Para el Backend en Render:
1. En Render: **Settings ➔ Custom Domains**.
2. Añade un subdominio para la API, por ejemplo `api.midominio.com`.
3. En tu proveedor de DNS, añade el registro `CNAME` apuntando a la dirección que Render te proporcione (ej. `devsculptor-backend.onrender.com`).
4. **Actualiza las variables de entorno:**
   * En Render: Actualiza `CORS_ORIGINS` para incluir `https://midominio.com`.
   * En Vercel: Actualiza `VITE_API_URL` con `https://api.midominio.com/api/v1`.
