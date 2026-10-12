# Sprint 4 — Especificación Técnica Backend: Seguridad CORS Dinámica, Storage RLS y Persistencia de Bóveda OKF

**Proyecto:** DevSculptor Core Backend  
**Sprint:** Sprint 4 — Etapa A  
**Autor:** Nathaniel Muller San Martin  
**Estado:** IMPLEMENTADO Y VERIFICADO EN `develop`  
**Fecha:** Septiembre 2026  
**Componentes Impactados:** `devsculptor-backend/src/app.ts`, `devsculptor-backend/.env`, `devsculptor-backend/src/database/migrations/005_okf_vault_and_storage.sql`

---

## 1. Resumen Ejecutivo

Durante la ejecución de la **Etapa 4A**, el backend de DevSculptor incorporó la infraestructura de almacenamiento y seguridad necesaria para respaldar el estándar **OKF (*One Knowledge Format*)** y garantizar una comunicación fluida y blindada con el frontend en entornos distribuidos de desarrollo (localhost, redes locales privadas LAN y VPNs de malla como Tailscale).

---

## 2. Aislamiento Multi-Tenant en Supabase Storage (`okf-vault`)

### 2.1. Arquitectura del Bucket Privado
Se aprovisionó en Supabase Cloud el bucket privado `okf-vault` destinado a albergar tanto los árboles personales de cada proyecto como las plantillas maestras globales del sistema:

* **Bucket ID:** `okf-vault`
* **Visibilidad:** Privado (`public: false`)
* **Límite de Tamaño por Objeto:** 52.428.800 bytes (50 MB)
* **Tipos MIME Permitidos:**
  - `text/markdown`, `text/plain`
  - `application/sql`, `application/x-sql`
  - `application/json`, `application/yaml`, `text/yaml`
  - `application/zip`, `application/x-zip-compressed`

### 2.2. Políticas de Seguridad a Nivel de Fila (RLS) en Almacenamiento
Para garantizar aislamiento horizontal estricto (*Multi-Tenant Horizontal Partitioning*), se configuraron 4 políticas RLS sobre la tabla del sistema `storage.objects`:

```sql
-- 1. Lectura segura (SELECT)
CREATE POLICY "okf_vault_tenant_select" ON storage.objects
FOR SELECT USING (
  bucket_id = 'okf-vault' AND
  (
    (storage.foldername(name))[1] = auth.uid()::text OR
    (storage.foldername(name))[1] = '_global'
  )
);

-- 2. Inserción restringida a la propia carpeta (INSERT)
CREATE POLICY "okf_vault_tenant_insert" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'okf-vault' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. Actualización de objetos propios (UPDATE)
CREATE POLICY "okf_vault_tenant_update" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'okf-vault' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. Eliminación de objetos propios (DELETE)
CREATE POLICY "okf_vault_tenant_delete" ON storage.objects
FOR DELETE USING (
  bucket_id = 'okf-vault' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

> **Garantía:** Ningún usuario autenticado puede leer, sobreescribir ni listar archivos que pertenezcan a la carpeta raíz `{user_id}/` de otro usuario. La carpeta `/_global/` es accesible en modo lectura para todos los usuarios autenticados.

---

## 3. Persistencia Relacional de Metadatos OKF (Migración 005)

Se creó y aplicó la migración `005_okf_vault_and_storage.sql`, introduciendo la tabla `okf_documents` y sus índices de búsqueda de alto rendimiento:

```sql
CREATE TABLE IF NOT EXISTS okf_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  canonical_path VARCHAR(255) NOT NULL,
  filename VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN ('manifest', 'documentation', 'database', 'skills', 'context')),
  document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('OKF_INDEX_MANIFEST', 'REQUIREMENT_SRS', 'ARCHITECTURE_DECISION', 'DDL_SCHEMA', 'DATA_DICTIONARY', 'MERMAID_ERD', 'SKILL', 'PROMPT_BUNDLE')),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  state_hash CHAR(64) NOT NULL,
  freshness_status VARCHAR(20) NOT NULL DEFAULT 'FRESH' CHECK (freshness_status IN ('FRESH', 'STALE', 'DRIFT_DETECTED')),
  storage_path VARCHAR(500),
  size_bytes INTEGER NOT NULL DEFAULT 0,
  verified_by VARCHAR(150),
  last_verified TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_okf_documents_project_path UNIQUE (project_id, canonical_path)
);
```

### Características Técnicas:
1. **Hash de Estado SHA-256 (`state_hash CHAR(64)`):** Almacena el hash determinista del contenido para comparaciones ultra-rápidas de vigencia en tiempo real.
2. **Índice Compuesto de Búsqueda:** `idx_okf_documents_lookup ON okf_documents (project_id, canonical_path)`.
3. **Trigger de Auditoría Temporal:** Se asoció la función `update_updated_at_column()` para mantener la consistencia en cada mutación.

---

## 4. Middleware de Seguridad CORS Dinámico para Entornos de Desarrollo

### 4.1. Diagnóstico del Problema
Cuando el desarrollador abre múltiples terminales o instancias de Vite, el servidor frontend puede asignarse a puertos alternativos (`5173`, `5174`, `5175`) o ser accedido mediante IP privada (LAN `192.168.x.x` o VPN `100.x.x.x`). La configuración anterior de CORS en `app.ts` arrojaba `callback(new Error('Bloqueado por política CORS'))`, lo cual provocaba:
1. Retorno de error `HTTP 500 Internal Server Error` sin cabeceras `Access-Control-Allow-Origin`.
2. Bloqueo inmediato del navegador y reporte de fallo de red por parte de Axios.

### 4.2. Implementación de la Solución Dinámica
En `devsculptor-backend/src/app.ts`, se perfeccionó el middleware de CORS:

```typescript
// Control de CORS con whitelist y soporte de orígenes de desarrollo
const allowedOrigins = env.CORS_ORIGINS.split(',').map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        allowedOrigins.includes('*') ||
        (env.NODE_ENV === 'development' &&
          /^http:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|100\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?$/.test(origin))
      ) {
        callback(null, true);
      } else {
        callback(new Error('Bloqueado por política CORS'));
      }
    },
    credentials: true,
  })
);
```

### 4.3. Variables de Entorno Actualizadas (`.env`)
Se sincronizó el archivo `.env` del backend:
```ini
CORS_ORIGINS=http://localhost:3000,http://localhost:5173,http://localhost:5174,http://127.0.0.1:3000,http://127.0.0.1:5173,http://127.0.0.1:5174
```

---

## 5. Pruebas y Validación

1. **Preflight CORS (OPTIONS):**
   ```bash
   curl -i -s -X OPTIONS http://localhost:3000/api/v1/projects \
     -H "Origin: http://localhost:5174" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: Authorization,Content-Type,X-Request-Id"
   # Resultado: HTTP 204 No Content, Access-Control-Allow-Origin: http://localhost:5174
   ```
2. **Petición Autenticada con Origen Dinámico:**
   ```bash
   curl -i -s -X POST http://localhost:3000/api/v1/auth/login \
     -H "Origin: http://localhost:5174" ...
   # Resultado: Cabeceras CORS válidas inyectadas en la respuesta.
   ```
3. **Build de Producción:** `npm run build` (`tsc && tsc-alias`) finalizado con código de salida 0 y cero errores.
