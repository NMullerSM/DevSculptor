# Guía Maestra de Despliegue Backend: Railway vs Render (Docker)

> **Documento:** `Documentation/Backend/Cloud_Deployment_Guide.md`  
> **Proyecto:** DevSculptor Backend Core  
> **Estándar:** Docker Multi-stage (Sprint 5) + Node.js 20 LTS  
> **Base de Datos:** PostgreSQL en Supabase Cloud  
> **Frontend:** Vercel (`https://temporary-zippy-nitrogen-3e2182f.vercel.app`)

---

## 🧭 ¿Por qué Dockerizar la Imagen Soluciona los Problemas?

Al desplegar directamente con Node nativo en la nube, los proveedores (como Render) usan por defecto versiones dispares (como Node 24) o entornos sin herramientas para compilar módulos C++ nativos (`bcrypt`), o intentan compilar TypeScript con flags cambiantes (`baseUrl`).

Con el **`Dockerfile` multi-etapa** (`devsculptor-backend/Dockerfile`):
1. **Fijación de entorno:** Se compila y ejecuta exactamente sobre `node:20-slim`.
2. **Determinismo total:** El código que compila en tu máquina compilará idéntico en cualquier nube.
3. **Portabilidad:** Puedes correr la misma imagen en **Railway**, **Render**, **Fly.io**, **AWS ECS** o **GCP Cloud Run**.

---

## ⚡ Opción 1: Railway (Recomendada — Despliegue en 3 minutos sin fricción)

Railway es actualmente la plataforma PaaS más rápida y amigable para proyectos Node.js y Docker en monorepos.

### Ventajas de Railway frente a Render:
* **Editor RAW de Variables de Entorno:** Puedes copiar y pegar todo tu archivo `.env` de una sola vez. No necesitas escribir variable por variable.
* **Sin "Cold Sleep" excesivo:** En el plan inicial, el backend responde de inmediato sin congelarse 50 segundos.
* **Detección automática de Docker:** Detecta el `Dockerfile` de forma nativa.

### Paso a Paso para Desplegar en Railway:

1. **Crear cuenta o entrar:** Ve a [railway.com](https://railway.com/) e inicia sesión con tu cuenta de GitHub.
2. **Nuevo Proyecto:**
   * Haz clic en **"New Project"** ➔ **"Deploy from GitHub repo"**.
   * Selecciona el repositorio **`NMullerSM/DevSculptor`**.
3. **Configurar el Servicio (Root Directory):**
   * Haz clic sobre la tarjeta del servicio que se acaba de crear y ve a la pestaña **"Settings"**.
   * En **"Root Directory"**, haz clic en **Edit** e ingresa:
     ```text
     devsculptor-backend
     ```
   * En **"Service Name"**, puedes renombrarlo a `devsculptor-backend`.
4. **Cargar Variables de Entorno en 1 Clic (RAW Editor):**
   * Ve a la pestaña **"Variables"**.
   * Haz clic en el botón **"RAW Editor"** (esquina superior derecha de la sección de variables).
   * Pega directamente el contenido de tus variables (basado en tu `.env`):
     ```env
     NODE_ENV=production
     PORT=3000
     DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres?sslmode=require
     DB_SSL=true
     JWT_SECRET=tu_clave_secreta_segura_de_mas_de_32_caracteres
     JWT_EXPIRES_IN=24h
     CORS_ORIGINS=https://temporary-zippy-nitrogen-3e2182f.vercel.app,http://localhost:5173
     RATE_LIMIT_WINDOW_MS=900000
     RATE_LIMIT_MAX=100
     AI_PROVIDER=gemini
     GEMINI_API_KEY=tu_gemini_api_key_aqui
     GEMINI_MODEL=gemini-2.5-flash
     ```
   * Haz clic en **Update**.
5. **Generar Dominio Público HTTPS:**
   * Ve a la pestaña **"Settings"** ➔ sección **"Networking"**.
   * Haz clic en **"Generate Domain"**.
   * Railway generará una URL pública segura como:
     `https://devsculptor-backend-production.up.railway.app`
6. **Verificar Despliegue:**
   * Abre en tu navegador:
     `https://tu-dominio-railway.up.railway.app/api/v1/health`
   * Debe responder:
     ```json
     { "success": true, "data": { "status": "ok", "environment": "production" } }
     ```

---

## 🛠️ Opción 2: Render usando Docker (`Environment: Docker`)

Si deseas continuar en Render, ahora que el backend cuenta con `Dockerfile` y `render.yaml` actualizado para Docker, ya no fallará por versiones de Node.

### Paso a Paso para Desplegar en Render con Docker:

1. **Entrar al Dashboard:** Ve a [dashboard.render.com](https://dashboard.render.com/).
2. **Crear o Reconfigurar el Web Service:**
   * Haz clic en **"New +" ➔ "Web Service"**.
   * Conecta tu repositorio `NMullerSM/DevSculptor`.
   * En la configuración:
     * **Name:** `devsculptor-backend`
     * **Region:** `Oregon (US West)`
     * **Branch:** `main`
     * **Root Directory:** `devsculptor-backend`
     * **Runtime / Environment:** Selecciona **`Docker`** (NO Node).
     * **Dockerfile Path:** `Dockerfile` (o déjalo en blanco si usas `devsculptor-backend` como Root Directory).
     * **Instance Type:** `Free`.
3. **Health Check:**
   * En **Advanced** ➔ **Health Check Path**: `/api/v1/health`.
4. **Variables de Entorno (Environment):**
   * Agrega las variables:
     * `NODE_ENV`: `production`
     * `PORT`: `10000` *(Render mapea automáticamente su puerto)*
     * `DATABASE_URL`: tu URI de Supabase
     * `DB_SSL`: `true`
     * `JWT_SECRET`: cadena secreta
     * `JWT_EXPIRES_IN`: `24h`
     * `CORS_ORIGINS`: `https://temporary-zippy-nitrogen-3e2182f.vercel.app,http://localhost:5173`
     * `GEMINI_API_KEY`: tu clave de Gemini
     * `GEMINI_MODEL`: `gemini-2.5-flash`
5. **Crear / Desplegar:**
   * Haz clic en **"Create Web Service"**.
   * Render ejecutará el `Dockerfile`, compilará TypeScript en el contenedor y levantará el servicio.

---

## 🔗 Paso Final: Conectar el Backend con el Frontend de Vercel

Sin importar si eliges **Railway** o **Render**, conecta el frontend de Vercel en 2 pasos:

1. Ve a tu proyecto en **Vercel** ➔ **Settings** ➔ **Environment Variables**.
2. Modifica o crea la variable:
   * **Key:** `VITE_API_URL`
   * **Value:** `https://<tu-backend-url>/api/v1`
     *(Ejemplo Railway: `https://devsculptor-backend-production.up.railway.app/api/v1`)*
     *(Ejemplo Render: `https://devsculptor-backend.onrender.com/api/v1`)*
3. En Vercel, ve a **Deployments** ➔ haz clic en los `...` del último commit ➔ selecciona **"Redeploy"** para aplicar la nueva URL.
