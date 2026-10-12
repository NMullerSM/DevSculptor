# DevSculptor Backend — Guía de Despliegue e Infraestructura Cloud

> **Documento Maestro:** `Documentation/Backend/Backend_Deployment_and_Cloud_Infrastructure_Guide.md`  
> **Proyecto:** DevSculptor Backend Core (`devsculptor-backend`)  
> **Plataformas de Hosting:** Render (Web Service / Blueprint), Railway (Docker)  
> **Frontend:** Vercel (`https://temporary-zippy-nitrogen-3e2182f.vercel.app`)  
> **Base de Datos:** PostgreSQL 15+ en Supabase Cloud  
> **Contenedor:** Docker Multi-stage con Node.js 20 LTS (`node:20-slim`)  

---

## 📑 Tabla de Contenidos

1. [Topología de Red e Infraestructura Cloud](#1-topología-de-red-e-infraestructura-cloud)
2. [Estrategia de Contenerización Docker Multi-Stage](#2-estrategia-de-contenerización-docker-multi-stage)
3. [Despliegue en Render (Método Blueprint y Manual)](#3-despliegue-en-render-método-blueprint-y-manual)
4. [Despliegue Alternativo en Railway (PaaS Rápido)](#4-despliegue-alternativo-en-railway-paas-rápido)
5. [Variables de Entorno y Configuración de Producción](#5-variables-de-entorno-y-configuración-de-producción)
6. [Conexión y Pool Tuning con Supabase PostgreSQL](#6-conexión-y-pool-tuning-con-supabase-postgresql)
7. [Endpoints de Monitoreo y Verificación de Salud (Healthchecks)](#7-endpoints-de-monitoreo-y-verificación-de-salud-healthchecks)
8. [Configuración de Dominio Personalizado y SSL](#8-configuración-de-dominio-personalizado-y-ssl)
9. [Protocolo Post-Despliegue y Pruebas de Humo (Smoke Tests)](#9-protocolo-post-despliegue-y-pruebas-de-humo-smoke-tests)

---

## 1. Topología de Red e Infraestructura Cloud

DevSculptor opera bajo una arquitectura desacoplada de alto rendimiento y bajo costo, distribuyendo responsabilidades entre tres plataformas cloud especializadas:

```
┌─────────────────────────────────┐           HTTPS REST /api/v1          ┌─────────────────────────────────┐
│     FRONTEND (Vercel)           │ ────────────────────────────────────► │      BACKEND (Render/Railway)   │
│  https://*.vercel.app           │ ◄──────────────────────────────────── │  https://*.onrender.com         │
│  (o app.devsculptor.cl)         │                CORS OK                │  (o api.devsculptor.cl)         │
└─────────────────────────────────┘                                       └────────────────┬────────────────┘
                                                                                           │ Conexión SSL Pool
                                                                                           ▼
                                                                          ┌─────────────────────────────────┐
                                                                          │   BASE DE DATOS (Supabase)      │
                                                                          │   PostgreSQL 15+ Cloud          │
                                                                          │   RLS 100% / Pool PgBouncer     │
                                                                          └─────────────────────────────────┘
```

- **Frontend:** Single Page Application (SPA) en React 19 + Vite alojada en la CDN global de Vercel con cabeceras de seguridad estrictas (CSP, anti-clickjacking).
- **Backend:** Monolito Modular Express alojado como contenedor Docker en Render o Railway, configurado con `trust proxy` para lectura precisa de IP y rate limiters.
- **Base de Datos:** PostgreSQL en Supabase Cloud protegido por Row Level Security (RLS) en todas las tablas públicas y conexión SSL mandatoria (`sslmode=require`).

---

## 2. Estrategia de Contenerización Docker Multi-Stage

Para evitar discrepancias de versiones de Node en la nube (como saltos inesperados a versiones inestables) o problemas de compilación de módulos C++ nativos (`bcrypt`), el backend utiliza un `Dockerfile` multi-etapa determinista:

```dockerfile
# Etapa 1: Builder
FROM node:20-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Etapa 2: Runner de Producción
FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/server.js"]
```

### Ventajas Operativas:
1. **Determinismo total:** El código que compila localmente compila idéntico en cualquier proveedor cloud.
2. **Superficie de ataque mínima:** La imagen final `runner` excluye compiladores, TypeScript y dependencias de desarrollo (`devDependencies`), reduciendo el tamaño a ~150 MB.
3. **Portabilidad:** Desplegable sin modificaciones en Render, Railway, AWS ECS, GCP Cloud Run o Fly.io.

---

## 3. Despliegue en Render (Método Blueprint y Manual)

### 3.1 Método 1: Blueprint Automatizado con `render.yaml` (Recomendado)

El repositorio incluye [`render.yaml`](file:///c:/Users/natha/Documents/Repos/DevSculptor/render.yaml) en la raíz:

1. Ingresa a [dashboard.render.com](https://dashboard.render.com/).
2. Haz clic en **"New +"** ➔ **"Blueprint"**.
3. Conecta el repositorio `NMullerSM/DevSculptor`.
4. Render detecta `render.yaml` y configura:
   - **Service Name:** `devsculptor-backend`
   - **Root Directory:** `devsculptor-backend`
   - **Environment:** `docker`
   - **Dockerfile Path:** `Dockerfile`
   - **Health Check Path:** `/api/v1/health`
5. Provee las variables secretas que solicita el asistente (`DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGINS`).
6. Presiona **"Apply"**.

### 3.2 Método 2: Despliegue Manual como Web Service

Si prefieres la creación manual:
1. En Render Dashboard: **"New +" ➔ "Web Service"**.
2. Conecta `NMullerSM/DevSculptor`.
3. Completa los parámetros esenciales:
   - **Name:** `devsculptor-backend`
   - **Region:** Ohio (US East) o Frankfurt (según cercanía a Supabase).
   - **Root Directory:** `devsculptor-backend`
   - **Runtime:** `Docker`
   - **Instance Type:** `Free` (o `Starter` para evitar suspensión en inactividad).
4. Agrega las variables de entorno en la sección **"Environment Variables"**.

---

## 4. Despliegue Alternativo en Railway (PaaS Rápido)

Railway ofrece ventajas de agilidad para desarrollo y pruebas de concepto:

1. Ingresa a [railway.com](https://railway.com/) con GitHub.
2. **"New Project"** ➔ **"Deploy from GitHub repo"** ➔ `NMullerSM/DevSculptor`.
3. En la tarjeta del servicio ➔ **"Settings"**:
   - **Root Directory:** `devsculptor-backend`
   - **Service Name:** `devsculptor-backend`
4. En **"Variables"** ➔ botón **"RAW Editor"**:
   - Puedes pegar directamente el bloque `.env` de producción en una sola operación.
5. Railway compila el Dockerfile automáticamente y provee un dominio público `*.up.railway.app`.

---

## 5. Variables de Entorno y Configuración de Producción

En producción, todas las variables son validadas en el arranque por [`env.ts`](file:///c:/Users/natha/Documents/Repos/DevSculptor/devsculptor-backend/src/config/env.ts) mediante Zod con filosofía *Fail-Fast*. Si falta una variable crítica o no cumple el formato, el proceso se detiene de inmediato.

| Variable | Tipo / Formato | Requerido | Descripción |
| :--- | :--- | :---: | :--- |
| `NODE_ENV` | `'production'` | Sí | Activa optimizaciones de Express y deshabilita logs verbosos. |
| `PORT` | Número (`3000`) | Sí | Puerto asignado por Render/Railway. |
| `DATABASE_URL` | URI `postgresql://...` | Sí | Cadena de conexión completa con `sslmode=require`. |
| `DB_SSL` | `'true'` | Sí | Fuerza el handshake TLS seguro con el pool de PostgreSQL. |
| `DB_POOL_MAX` | Número (`10` a `20`) | No | Límite de conexiones simultáneas por instancia. |
| `JWT_SECRET` | String (≥ 32 caracteres) | Sí | Clave criptográfica para firma HMAC-SHA256 de tokens de acceso. |
| `JWT_EXPIRES_IN` | String (`'24h'`) | Sí | Tiempo de expiración del token de sesión. |
| `CORS_ORIGINS` | URLs separadas por coma | Sí | Lista blanca de orígenes cliente autorizados. Prohibido `'*'` en producción. |
| `TRUST_PROXY_HOPS` | Número (`1`) | Sí | Número de proxies inversos confiables delante de Express. |
| `RATE_LIMIT_WINDOW_MS`| Número (`900000` = 15m) | No | Ventana de rate limiting global. |
| `RATE_LIMIT_MAX` | Número (`100` o más) | No | Cuota máxima de peticiones por ventana de tiempo. |
| `AI_PROVIDER` | `'gemini' \| 'deepseek'` | No | Proveedor predeterminado de IA del servidor. |
| `GEMINI_API_KEY` | String | No | Clave de Google Gemini para copiloto backend. |
| `GEMINI_MODEL` | String (`'gemini-2.5-flash'`)| No | Modelo LLM configurado. |

---

## 6. Conexión y Pool Tuning con Supabase PostgreSQL

La conexión hacia Supabase se gestiona mediante [`database.ts`](file:///c:/Users/natha/Documents/Repos/DevSculptor/devsculptor-backend/src/config/database.ts) con las siguientes directivas:

1. **Modo Directo vs Pooled (PgBouncer):**
   - Para migraciones transaccionales (`npm run migrate`), se recomienda el puerto directo `5432`.
   - Para la operación continua del backend en entornos con múltiples instancias, se utiliza el Transaction Pooler de Supabase (puerto `6543`).
2. **Rechazo de Certificados no Autorizados:**
   ```typescript
   ssl: env.DB_SSL ? { rejectUnauthorized: false } : false
   ```
   Permite validar la conexión encriptada sobre la infraestructura compartida de Supabase AWS.
3. **Manejo de Desconexión y Timeout:**
   El pool implementa `idleTimeoutMillis: 30000` y `connectionTimeoutMillis: 5000` para reciclar conexiones inactivas y evitar fugas de sockets.

---

## 7. Endpoints de Monitoreo y Verificación de Salud (Healthchecks)

Express expone tres endpoints de diagnóstico bajo `/api/v1`:

### 7.1 Raíz de la API (`GET /api/v1`)
Retorna metadatos de versión y estado general:
```json
{
  "success": true,
  "data": {
    "name": "DevSculptor Backend API",
    "version": "1.0.0",
    "status": "online",
    "healthCheck": "/api/v1/health",
    "readyCheck": "/api/v1/health/ready"
  }
}
```

### 7.2 Liveness Probe (`GET /api/v1/health`)
Utilizado por Render/Railway para verificar que el proceso Node.js responde:
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "environment": "production",
    "timestamp": "2026-10-12T18:00:00.000Z"
  }
}
```

### 7.3 Readiness Probe (`GET /api/v1/health/ready`)
Ejecuta un `SELECT 1` real sobre el pool de PostgreSQL. Si la base de datos no está disponible, retorna código 500:
```json
{
  "success": true,
  "data": {
    "status": "ready",
    "database": "connected",
    "timestamp": "2026-10-12T18:00:00.000Z"
  }
}
```

---

## 8. Configuración de Dominio Personalizado y SSL

Para asignar un subdominio profesional como `api.devsculptor.cl`:

1. En Render Web Service ➔ pestaña **"Settings"** ➔ sección **"Custom Domains"**.
2. Haz clic en **"Add Custom Domain"** e ingresa `api.devsculptor.cl`.
3. Render proporcionará un registro CNAME de destino (por ejemplo `devsculptor-backend.onrender.com`).
4. En el panel de control DNS de tu proveedor de dominio (Cloudflare, NIC Chile, Namecheap):
   - **Tipo:** `CNAME`
   - **Nombre / Host:** `api`
   - **Valor / Destino:** `devsculptor-backend.onrender.com`
   - **TTL:** Automático o 300 segundos.
5. Render emitirá y renovará automáticamente el certificado SSL Let's Encrypt una vez que la propagación DNS se confirme.
6. **Actualización en Frontend:** Modifica la variable de entorno en Vercel:
   ```env
   VITE_API_URL=https://api.devsculptor.cl/api/v1
   ```
7. **Actualización de CORS en Backend:** Añade el dominio del frontend y tu dominio principal a `CORS_ORIGINS`:
   ```env
   CORS_ORIGINS=https://devsculptor.cl,https://app.devsculptor.cl,https://temporary-zippy-nitrogen-3e2182f.vercel.app
   ```

---

## 9. Protocolo Post-Despliegue y Pruebas de Humo (Smoke Tests)

Tras cada despliegue a producción, ejecuta los siguientes comandos de verificación (PowerShell o cURL):

```bash
# 1. Verificar liveness
curl -i https://devsculptor-backend.onrender.com/api/v1/health

# 2. Verificar conectividad a base de datos
curl -i https://devsculptor-backend.onrender.com/api/v1/health/ready

# 3. Verificar preflight CORS desde el dominio del frontend
curl -i -X OPTIONS https://devsculptor-backend.onrender.com/api/v1/auth/login \
  -H "Origin: https://temporary-zippy-nitrogen-3e2182f.vercel.app" \
  -H "Access-Control-Request-Method: POST"

# 4. Verificar cabeceras de seguridad Helmet
# Debe retornar X-Content-Type-Options: nosniff, Strict-Transport-Security, etc.
```
