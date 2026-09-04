# Plan de Trabajo Sprint 1 — DevSculptor Backend Core
## Guía de Implementación para IA de Desarrollo

> **CONTEXTO OBLIGATORIO**: Este documento es la guía paso a paso para implementar el Sprint 1 del backend de DevSculptor. Antes de comenzar CUALQUIER tarea, debes leer y comprender el documento [Sprint1ADRs.md](file:///c:/Users/natha/Documents/Repos/DevSculptor/Documentation/Desicitions/Backend/Sprint1ADRs.md) completo.

---

## Información del Proyecto

| Clave | Valor |
|:---|:---|
| **Nombre** | DevSculptor |
| **Stack** | Node.js + TypeScript + Express + PostgreSQL |
| **Patrón** | Monolito Modular MVC en Capas |
| **Directorio Backend** | `devsculptor-backend/` (crear en la raíz del repo) |
| **Objetivo del Sprint** | Backend Core operativo: DB con triggers/SP, auth JWT, CRUD completo de 5 módulos, Postman QA |

---

## Reglas Generales para la IA

> [!CAUTION]
> Estas reglas son **obligatorias** y deben seguirse en TODAS las tareas.

1. **TypeScript estricto**: `tsconfig.json` con `strict: true`. No usar `any` bajo ninguna circunstancia. Si un tipo es desconocido, usar `unknown` y hacer type narrowing.
2. **SQL parametrizado**: NUNCA concatenar strings para construir queries SQL. Siempre usar parámetros posicionales `$1, $2, $3...` con `pool.query(sql, [param1, param2])`.
3. **Imports absolutos**: No usar `../../..`. Configurar `paths` en tsconfig para alias `@config`, `@modules`, `@shared`, `@middlewares`.
4. **Errores tipados**: Nunca lanzar `throw new Error()`. Siempre usar las clases de `shared/exceptions/`.
5. **Formato de respuesta**: Todas las respuestas HTTP deben usar los helpers de `shared/responses/apiResponse.ts`. Nunca usar `res.json()` directamente.
6. **Logging**: Usar la instancia de Pino de `config/logger.ts`. Nunca usar `console.log`.
7. **Variables de entorno**: Nunca hardcodear valores. Siempre leer desde `config/env.ts`.
8. **Async/await**: Todo código asíncrono debe usar async/await con try/catch apropiado. Nunca dejar promesas sin manejar.

---

## Fase 1: Inicialización del Proyecto (Tareas 0.1 a 0.5)

### Paso 1.1 — Crear el proyecto Node.js/TypeScript

**Qué hacer:**

```bash
# Desde la raíz del repo DevSculptor/
mkdir devsculptor-backend
cd devsculptor-backend
npm init -y
```

**Instalar dependencias de producción:**
```bash
npm install express pg dotenv cors helmet express-rate-limit jsonwebtoken bcrypt zod pino pino-http uuid
```

**Instalar dependencias de desarrollo:**
```bash
npm install -D typescript tsx @types/express @types/pg @types/cors @types/jsonwebtoken @types/bcrypt @types/uuid @types/node pino-pretty
```

**Crear `tsconfig.json`:**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "baseUrl": "./src",
    "paths": {
      "@config/*": ["config/*"],
      "@modules/*": ["modules/*"],
      "@shared/*": ["shared/*"],
      "@middlewares/*": ["middlewares/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**Actualizar scripts en `package.json`:**
```json
{
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "migrate": "tsx src/database/migrate.ts",
    "seed": "tsx src/database/seeds/run-seed.ts"
  }
}
```

**Crear toda la estructura de carpetas** según la sección 2 del Sprint1ADRs. Crear archivos vacíos como placeholders.

---

### Paso 1.2 — Configuración de Variables de Entorno (`src/config/env.ts`)

**Qué hacer:** Crear un módulo que:
1. Llame a `dotenv.config()` al inicio.
2. Defina un Zod schema con TODAS las variables de entorno.
3. Parse `process.env` contra el schema.
4. Si falla, imprima el error exacto y termine el proceso con `process.exit(1)`.
5. Exporte el objeto validado y tipado.

**Estructura del schema Zod:**
```typescript
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  DB_HOST: z.string().min(1),
  DB_PORT: z.coerce.number().default(5432),
  DB_USER: z.string().min(1),
  DB_PASSWORD: z.string().min(1),
  DB_NAME: z.string().min(1),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET debe tener al menos 32 caracteres'),
  JWT_EXPIRES_IN: z.string().default('24h'),
  CORS_ORIGINS: z.string().default('http://localhost:3000,http://localhost:5173'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000),
  RATE_LIMIT_MAX: z.coerce.number().default(100),
});
```

**Output esperado:** Un módulo que exporta `export const env = envSchema.parse(process.env);` con tipo inferido.

---

### Paso 1.3 — Pool de PostgreSQL (`src/config/database.ts`)

**Qué hacer:**
```typescript
// Crear instancia singleton de pg.Pool con:
// - Lectura de variables desde env.ts
// - max: 20
// - idleTimeoutMillis: 30000
// - connectionTimeoutMillis: 5000
// - Listener pool.on('error') que loguee con pino y NO tire el proceso
// - Función testConnection() que ejecute SELECT NOW() y loguee éxito/fallo
// - Función getPool() que retorne la instancia
```

---

### Paso 1.4 — Logger Estructurado (`src/config/logger.ts`)

**Qué hacer:**
```typescript
// Crear instancia de pino con:
// - level: env.NODE_ENV === 'development' ? 'debug' : 'info'
// - transport: pino-pretty en development (con colorize: true, translateTime: 'SYS:standard')
// - timestamp: true
// - Exportar como default
```

---

### Paso 1.5 — `.env.example`

**Qué hacer:** Crear archivo en la raíz de `devsculptor-backend/` con:
```env
# Server
NODE_ENV=development
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=devsculptor
DB_PASSWORD=devsculptor_secret
DB_NAME=devsculptor_db

# Auth
JWT_SECRET=your_jwt_secret_here_must_be_at_least_32_characters_long
JWT_EXPIRES_IN=24h

# Security
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

---

## Fase 2: Base de Datos (Tareas 1.1 a 1.8)

### Paso 2.1 — DDL del Esquema Inicial

**Archivo:** `src/database/migrations/001_initial_schema.sql`

**Qué hacer:** Crear las 6 tablas exactamente como se describen en la Tarea 1.2 del Sprint1ADRs. Puntos críticos que NO debes olvidar:
- `CREATE EXTENSION IF NOT EXISTS "pgcrypto";` al inicio.
- Todas las PK son `UUID DEFAULT gen_random_uuid()`.
- Restricciones `UNIQUE` compuestas: `(user_id, name)` en projects, `(project_id, code)` en requirements, `(project_id, table_name)` en canvas_entities.
- `audit_logs.user_id` FK con `ON DELETE SET NULL` (no CASCADE).
- Columnas `position_x` y `position_y` en canvas_entities para posición visual.
- Checks para `type`, `priority`, `status`, `action`.
- `created_at TIMESTAMPTZ DEFAULT NOW()` en todas las tablas.
- `updated_at TIMESTAMPTZ DEFAULT NOW()` en tablas mutables (projects, canvas_entities, architecture_decisions).

### Paso 2.2 — Índices de Rendimiento

**Archivo:** `src/database/migrations/002_indexes.sql`

**Qué hacer:** Copiar exactamente los índices listados en la Tarea 1.3 del Sprint1ADRs. Son 10 índices en total.

### Paso 2.3 — Trigger de Updated_at

**Archivo:** Incluir en `001_initial_schema.sql` o crear `src/database/triggers/trg_set_updated_at.sql`

**Qué hacer:**
```sql
CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Asociar a cada tabla con updated_at:
CREATE TRIGGER trg_set_updated_at_projects
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

-- Repetir para canvas_entities y architecture_decisions
```

### Paso 2.4 — Trigger de Auditoría

**Archivo:** `src/database/triggers/trg_audit_canvas.sql`

**Qué hacer:** Implementar según Tarea 1.5 del Sprint1ADRs. Punto crítico: usar `current_setting('app.current_user_id', true)` para capturar user_id.

```sql
CREATE OR REPLACE FUNCTION fn_audit_canvas_entities()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Intentar obtener el user_id de la sesión (establecido por el backend)
  BEGIN
    v_user_id := current_setting('app.current_user_id', true)::UUID;
  EXCEPTION WHEN OTHERS THEN
    v_user_id := NULL;
  END;

  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (project_id, user_id, entity_type, entity_id, action, payload_before, payload_after)
    VALUES (NEW.project_id, v_user_id, 'canvas_entity', NEW.id, 'INSERT', NULL, to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_logs (project_id, user_id, entity_type, entity_id, action, payload_before, payload_after)
    VALUES (NEW.project_id, v_user_id, 'canvas_entity', NEW.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (project_id, user_id, entity_type, entity_id, action, payload_before, payload_after)
    VALUES (OLD.project_id, v_user_id, 'canvas_entity', OLD.id, 'DELETE', to_jsonb(OLD), NULL);
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_canvas_changes
  AFTER INSERT OR UPDATE OR DELETE ON canvas_entities
  FOR EACH ROW EXECUTE FUNCTION fn_audit_canvas_entities();
```

### Paso 2.5 — Stored Procedure de Métricas

**Archivo:** `src/database/procedures/sp_project_metrics.sql`

**Qué hacer:** Implementar según Tarea 1.6. Retornar tipo `TABLE(total_rf INT, total_rnf INT, total_entities INT, total_adrs_accepted INT, total_adrs_total INT, maturity_index INT)`.

### Paso 2.6 — Runner de Migraciones

**Archivo:** `src/database/migrate.ts`

**Qué hacer:** Implementar según Tarea 1.7. Es un script CLI que se ejecuta con `npm run migrate`. Debe:
1. Conectar a la DB.
2. Crear tabla `_migrations` si no existe.
3. Leer archivos `.sql` de migrations/, triggers/, procedures/ en orden.
4. Ejecutar solo los que no estén registrados.
5. Registrar cada migración ejecutada.
6. Cerrar la conexión y salir.

### Paso 2.7 — Datos Semilla

**Archivo:** `src/database/seeds/seed_dev.sql`

**Qué hacer:** Según Tarea 1.8. El password del usuario de prueba debe estar pre-hasheado con bcrypt (puedes generar un hash offline para `"DevSculptor123!"` con salt 12).

---

## Fase 3: Infraestructura Compartida (Tareas 2.1 a 2.6)

### Orden de implementación obligatorio:
1. **Exceptions** (no depende de nada)
2. **Types** (no depende de nada)
3. **API Response helpers** (depende de Exceptions)
4. **JWT utils** (depende de env.ts y Exceptions)
5. **Hash utils** (no depende de nada)
6. **BaseRepository** (depende de database.ts, Types y Logger)

### Paso 3.1 — Exceptions

**Archivos:** `src/shared/exceptions/AppError.ts`, `NotFoundError.ts`, `ValidationError.ts`, `UnauthorizedError.ts`, `ConflictError.ts`, y un `index.ts` que re-exporte todo.

**Patrón:**
```typescript
// AppError.ts
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: string;
  public readonly isOperational: boolean;
  public readonly details: any[];

  constructor(message: string, statusCode: number, errorCode: string, details: any[] = []) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = true;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

// NotFoundError.ts
export class NotFoundError extends AppError {
  constructor(resource: string = 'Recurso') {
    super(`${resource} no encontrado.`, 404, 'RESOURCE_NOT_FOUND');
  }
}
// ... similar para los otros
```

### Paso 3.2 — Types

**Archivos:** Según Tarea 2.3 del Sprint1ADRs.

Punto crítico para `express.d.ts`:
```typescript
declare namespace Express {
  interface Request {
    user?: { id: string; email: string };
    requestId: string;
  }
}
```

### Paso 3.3 — API Response Helpers

**Archivo:** `src/shared/responses/apiResponse.ts`

```typescript
import { Response } from 'express';

interface PaginationMeta {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export function sendSuccess<T>(res: Response, data: T, statusCode: number = 200, meta?: PaginationMeta): void {
  const response: any = { success: true, data };
  if (meta) response.meta = meta;
  res.status(statusCode).json(response);
}

export function sendCreated<T>(res: Response, data: T): void {
  sendSuccess(res, data, 201);
}
```

### Paso 3.4 — JWT Utils

**Archivo:** `src/shared/utils/jwt.ts`

Implementar `signToken` y `verifyToken` según Tarea 2.5. Usar `jsonwebtoken`. `verifyToken` debe lanzar `UnauthorizedError` si falla.

### Paso 3.5 — Hash Utils

**Archivo:** `src/shared/utils/hash.ts`

Implementar `hashPassword` (salt rounds = 12) y `comparePassword` según Tarea 2.6.

### Paso 3.6 — BaseRepository

**Archivo:** `src/shared/base/BaseRepository.ts`

Este es el componente más crítico para reutilización. Implementar según Tarea 2.4 del Sprint1ADRs.

**Puntos clave:**
- Recibe `tableName: string` y `insertableColumns: string[]` en el constructor.
- Todos los métodos usan SQL parametrizado.
- `findAll` retorna `PaginatedResult<T>` con dos queries (datos + count).
- `withTransaction` maneja BEGIN/COMMIT/ROLLBACK automáticamente.
- `setSessionUserId` ejecuta `SET LOCAL "app.current_user_id" = '${userId}'` para triggers.

---

## Fase 4: Middlewares (Tareas 3.1 a 3.7)

### Orden de implementación:
1. requestId
2. requestLogger
3. rateLimiter
4. validateRequest
5. authenticate
6. notFoundHandler
7. errorHandler

Implementar cada uno según las Tareas 3.1 a 3.7 del Sprint1ADRs. Cada middleware es un archivo independiente que exporta una función o middleware de Express.

**Punto crítico del errorHandler:** Debe mapear códigos PG y NUNCA exponer stack traces en producción. Ver sección 3.5 del Sprint1ADRs para la tabla de mapeo.

---

## Fase 5: Módulos de Dominio (Tareas 4.1 a 5.6)

### Orden de implementación obligatorio:

1. **Auth** (los demás módulos necesitan autenticación para funcionar)
2. **Projects** (todos los demás dependen de `project_id`)
3. **Requirements** (depende de projects)
4. **Canvas** (depende de projects, interactúa con trigger)
5. **Decisions** (depende de projects)
6. **Metrics** (depende de que existan datos en las tablas anteriores)

### Para CADA módulo, seguir este patrón exacto:

```
1. Crear el .dto.ts con Zod schemas
2. Crear el .repository.ts extendiendo BaseRepository (o directo para metrics)
3. Crear el .service.ts recibiendo el repositorio como parámetro
4. Crear el .controller.ts que use sendSuccess/sendCreated/sendError
5. Crear el .routes.ts que aplique validateRequest y authenticate
6. Registrar las rutas en app.ts
```

### Detalles específicos por módulo:

Consultar las Tareas 5.1 a 5.6 del Sprint1ADRs para los detalles exactos de cada módulo. Los puntos más críticos:

- **Auth**: Rutas públicas (sin authenticate). Login retorna mensaje genérico en caso de error.
- **Projects**: `user_id` se obtiene de `req.user.id`. Validar que el proyecto pertenezca al usuario antes de operar.
- **Requirements**: Validar regex del código `^(RF|RNF)-\d{2,3}$`.
- **Canvas**: Establecer `app.current_user_id` en sesión PG antes de escrituras.
- **Decisions**: Implementar máquina de estados para transiciones de status.
- **Metrics**: Puede tener caché en memoria con TTL de 30s.

---

## Fase 6: Ensamblaje (Tareas 6.1 a 6.2)

### Paso 6.1 — `app.ts`

Montar TODO en el orden exacto especificado en la Tarea 6.1 del Sprint1ADRs. El orden de middlewares es CRÍTICO para seguridad.

### Paso 6.2 — `server.ts`

Implementar según Tarea 6.2. No olvidar:
- Graceful shutdown con `SIGTERM` y `SIGINT`.
- Verificar conexión DB antes de abrir el puerto.
- Loggear con pino, no con console.log.

---

## Fase 7: QA con Postman (Tareas 7.1 a 7.8)

### Flujo de pruebas:

Ejecutar las tareas 7.1 a 7.8 en orden secuencial. Cada batería genera datos que son prerrequisito para la siguiente.

**Flujo completo esperado:**
1. Registrar usuario → obtener token
2. Login → obtener token
3. Probar acceso sin token → 401
4. CRUD completo de projects
5. CRUD de requirements dentro del proyecto
6. CRUD de canvas → verificar audit_logs
7. CRUD de decisions → verificar transiciones de estado
8. Consultar metrics → verificar maturity_index
9. Probar acceso entre usuarios → verificar aislamiento
10. Probar rate limiting → 429

---

## Checklist de Validación Final

Antes de considerar el Sprint 1 como COMPLETO, verificar:

- [ ] `npm run build` compila sin errores
- [ ] `npm run migrate` ejecuta todas las migraciones correctamente
- [ ] `npm run dev` arranca el servidor y loguea éxito
- [ ] `GET /api/v1/health` responde 200
- [ ] Registro y login funcionan
- [ ] CRUD de proyectos funciona con auth
- [ ] CRUD de requisitos funciona anidado bajo proyecto
- [ ] CRUD de canvas funciona y trigger genera audit_logs
- [ ] CRUD de ADRs funciona con transiciones de estado
- [ ] Métricas retornan datos correctos del SP
- [ ] Endpoints sin token retornan 401
- [ ] Endpoints de otro usuario retornan 404
- [ ] Rate limiter retorna 429 al exceder límite
- [ ] Errores de validación retornan detalles legibles
- [ ] Errores internos NO exponen stack traces
- [ ] Logs en consola muestran JSON estructurado con request-id
