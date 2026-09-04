# Sprint 1 — ADRs: Modelado de Datos y Backend Core (Semana 4)

## Índice

1. [Justificación de Decisiones de Diseño y Patrones](#1-justificación-de-decisiones-de-diseño-y-patrones)
2. [Estructura de Directorios del Monolito Modular](#2-estructura-de-directorios-del-monolito-modular)
3. [Convenciones Técnicas Específicas](#3-convenciones-técnicas-específicas)
4. [Lista Detallada de Tareas (De lo General a lo Atómico)](#4-lista-detallada-de-tareas)
5. [Criterios de Definition of Done (DoD)](#5-criterios-de-definition-of-done)

---

## 1. Justificación de Decisiones de Diseño y Patrones

### 1.1 Arquitectura Monolito Modular con Patrón MVC en Capas

* **Decisión:** Descartar arquitecturas de microservicios y optar por un **Monolito Modular con capas estrictas (Layered MVC)** en Node.js/TypeScript.
* **Justificación Macro:** En un ciclo de desarrollo ágil de 5 semanas efectivas (S4 a S8) llevado a cabo de forma individual, los microservicios introducen una sobrecarga operacional inmanejable (latencia entre procesos, consistencia eventual, orquestación de red y observabilidad distribuida). El Monolito Modular mantiene una sola unidad de despliegue y una única conexión de base de datos, garantizando simplicidad operativa.
* **Justificación Micro / Capas:** La separación en tres capas clásicas desacopla responsabilidades:
  1. **Capa de Transporte / Controladores (Controllers):** Gestiona el protocolo HTTP (request/response), sanitiza parámetros de entrada mediante DTOs validados con Zod y devuelve códigos de estado HTTP semánticos. No contiene lógica de negocio.
  2. **Capa de Dominio / Lógica de Negocio (Services):** Contiene las reglas operativas, orquesta llamadas a repositorios y procesa la información antes de retornarla. Es agnóstica al framework web. Recibe dependencias por inyección (factory functions) para facilitar el testing.
  3. **Capa de Persistencia / Acceso a Datos (Repositories):** Centraliza la interacción con PostgreSQL mediante SQL parametrizado, aislando el motor de base de datos del resto de la aplicación. Hereda de un `BaseRepository<T>` genérico para eliminar duplicación de código CRUD.

### 1.2 Patrón Repository con BaseRepository Genérico (Aislamiento de Persistencia)

* **Decisión:** Implementar el patrón Repository sobre el cliente nativo de PostgreSQL (`pg Pool`), descartando ORMs pesados (como Prisma o TypeORM). Además, se implementará una clase abstracta `BaseRepository<T>` que centralice las operaciones CRUD comunes.
* **Justificación:** El requerimiento institucional exige el uso estricto de **Triggers** y **Procedimientos Almacenados (SPs)**. Los ORMs modernos presentan fricciones críticas para gestionar triggers avanzados (como capturar OLD y NEW dinámicos en formato JSON) y complican la ejecución transparente de funciones SQL. Al utilizar el patrón Repository con migraciones SQL puras, se tiene control determinista sobre el DDL, garantizando rendimiento máximo y eliminando capas de abstracción innecesarias.
* **BaseRepository<T>:** Centraliza métodos `create()`, `findById()`, `findAll()`, `update()`, `delete()` y `withTransaction()`, recibiendo el nombre de tabla y la configuración de columnas como parámetros genéricos. Los repositorios concretos extienden esta clase y solo añaden queries especializadas propias de su dominio.

### 1.3 Patrón Middleware (Cadena de Responsabilidad)

* **Decisión:** Delegar los requerimientos transversales (*cross-cutting concerns*) a middlewares en la canalización (*pipeline*) de Express.
* **Justificación:** Mantiene los controladores limpios. La cadena de middlewares ejecuta en orden:
  1. `helmet()` — Headers de seguridad HTTP (X-Content-Type-Options, X-Frame-Options, etc.).
  2. `cors()` — Control de orígenes permitidos desde whitelist configurable en variables de entorno.
  3. `express-rate-limit` — Protección contra ataques de fuerza bruta y DoS (ventana de 15 min, máximo 100 requests por IP).
  4. `requestId` — Asignación de UUID único por request para correlación de logs.
  5. `requestLogger` — Logging estructurado de cada petición entrante (método, ruta, duración, status code).
  6. `validateRequest(schema)` — Validación de DTOs contra schemas Zod antes de llegar al controlador.
  7. `authenticate` — Verificación de token JWT en rutas protegidas (extrae `userId` y lo inyecta en `req.user`).
  8. `notFoundHandler` — Captura de rutas inexistentes (404).
  9. `errorHandler` — Captura centralizada de excepciones con sanitización (nunca expone stack traces ni códigos internos de PostgreSQL al cliente en producción).

### 1.4 Seguridad como Principio Transversal desde Sprint 1

* **Decisión:** Incluir el módulo de autenticación (JWT + bcrypt) en el Sprint 1, adelantándolo respecto al plan original que lo ubicaba en la Semana 5.
* **Justificación:** La autenticación es un **prerrequisito estructural**:
  - Sin `user_id` autenticado, el trigger de auditoría no puede registrar *quién* realizó un cambio (pierde valor el log).
  - Sin auth, la Semana 5 tendría que construir backend de auth + frontend de auth + frontend de proyectos simultáneamente, saturando el sprint.
  - Todas las rutas CRUD de proyectos requieren `user_id` como FK obligatoria; sin auth no hay forma real de probar el flujo completo.
  - El patrón `protect → validate → handle` es más seguro y limpio si se establece desde la primera iteración.

### 1.5 Validación con Zod como Fuente Única de Verdad

* **Decisión:** Utilizar la librería **Zod** para definir schemas de validación que sirvan simultáneamente como DTOs (Data Transfer Objects) y como fuente de tipos TypeScript (mediante `z.infer<>`).
* **Justificación:** Elimina la duplicación entre tipos TypeScript y lógica de validación. Un solo schema Zod genera automáticamente el tipo TS correspondiente. La validación se ejecuta en el middleware `validateRequest` antes de que la petición llegue al controlador, garantizando que la capa de servicios siempre reciba datos limpios y tipados.

### 1.6 Logging Estructurado con Pino

* **Decisión:** Adoptar **Pino** como librería de logging estructurado (JSON) con integración `pino-http` para Express.
* **Justificación:** A diferencia de `console.log`, Pino:
  - Produce logs en formato JSON nativo, compatible con herramientas de observabilidad.
  - Soporta niveles jerárquicos (trace, debug, info, warn, error, fatal).
  - Correlaciona cada log con el `request-id` asignado al request, habilitando trazabilidad end-to-end.
  - En desarrollo, se utiliza `pino-pretty` para legibilidad humana.
  - Es el logger más rápido del ecosistema Node.js (low-overhead, asíncrono).

---

## 2. Estructura de Directorios del Monolito Modular

```
devsculptor-backend/
├── src/
│   ├── config/                         # Variables de entorno y configuración de infraestructura
│   │   ├── env.ts                      # Validación de variables de entorno con Zod (tipado estricto)
│   │   ├── database.ts                 # Instancia singleton de pg.Pool con configuración de pool tuning
│   │   └── logger.ts                   # Instancia de Pino configurada por entorno (dev/prod)
│   │
│   ├── database/                       # Migraciones y artefactos SQL deterministas
│   │   ├── migrations/                 # Scripts DDL numerados secuencialmente
│   │   │   ├── 001_initial_schema.sql  # Tablas core: users, projects, requirements, canvas_entities, architecture_decisions, audit_logs
│   │   │   └── 002_indexes.sql         # Índices de rendimiento para FK y columnas de filtrado frecuente
│   │   ├── triggers/                   # Definición formal de funciones trigger y listeners
│   │   │   └── trg_audit_canvas.sql
│   │   ├── procedures/                 # Funciones almacenadas / Stored Procedures
│   │   │   └── sp_project_metrics.sql
│   │   ├── seeds/                      # Datos de prueba para validación rápida
│   │   │   └── seed_dev.sql
│   │   └── migrate.ts                  # Runner de migraciones idempotente (tabla _migrations para control)
│   │
│   ├── middlewares/                    # Interceptores y cadena de responsabilidad
│   │   ├── errorHandler.ts             # Middleware global de captura, sanitización y formateo de errores
│   │   ├── validateRequest.ts          # Validador genérico que recibe un Zod schema y valida body/params/query
│   │   ├── authenticate.ts             # Verificación de JWT, extracción de userId e inyección en req.user
│   │   ├── rateLimiter.ts              # Configuración de express-rate-limit por ventana de tiempo
│   │   ├── requestId.ts                # Generación de UUID v4 por request, inyección en req y en headers de respuesta
│   │   ├── requestLogger.ts            # Log de entrada/salida de cada request con duración y status
│   │   └── notFoundHandler.ts          # Manejo de rutas inexistentes (404)
│   │
│   ├── modules/                        # Módulos del dominio (Modular Monolith)
│   │   ├── auth/                       # Dominio de Autenticación y Registro
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.repository.ts      # (extiende BaseRepository para users)
│   │   │   ├── auth.routes.ts
│   │   │   └── auth.dto.ts             # Zod schemas: RegisterDto, LoginDto
│   │   │
│   │   ├── projects/                   # Dominio de Gestión de Proyectos
│   │   │   ├── projects.controller.ts
│   │   │   ├── projects.service.ts
│   │   │   ├── projects.repository.ts  # (extiende BaseRepository)
│   │   │   ├── projects.routes.ts
│   │   │   └── projects.dto.ts         # Zod schemas: CreateProjectDto, UpdateProjectDto
│   │   │
│   │   ├── requirements/               # Dominio de Requisitos Funcionales y No Funcionales
│   │   │   ├── requirements.controller.ts
│   │   │   ├── requirements.service.ts
│   │   │   ├── requirements.repository.ts
│   │   │   ├── requirements.routes.ts
│   │   │   └── requirements.dto.ts     # Zod schemas: CreateRequirementDto, UpdateRequirementDto
│   │   │
│   │   ├── canvas/                     # Dominio de Entidades del Canvas y Auditoría
│   │   │   ├── canvas.controller.ts
│   │   │   ├── canvas.service.ts
│   │   │   ├── canvas.repository.ts
│   │   │   ├── canvas.routes.ts
│   │   │   └── canvas.dto.ts           # Zod schemas: CreateCanvasEntityDto, UpdateCanvasEntityDto
│   │   │
│   │   ├── decisions/                  # Dominio de Decisiones de Arquitectura (ADRs)
│   │   │   ├── decisions.controller.ts
│   │   │   ├── decisions.service.ts
│   │   │   ├── decisions.repository.ts
│   │   │   ├── decisions.routes.ts
│   │   │   └── decisions.dto.ts        # Zod schemas: CreateDecisionDto, UpdateDecisionStatusDto
│   │   │
│   │   └── metrics/                    # Dominio de Métricas y Consulta de SP
│   │       ├── metrics.controller.ts
│   │       ├── metrics.service.ts
│   │       ├── metrics.repository.ts
│   │       └── metrics.routes.ts
│   │
│   ├── shared/                         # Utilidades transversales y contratos comunes
│   │   ├── base/                       # Clases base reutilizables
│   │   │   └── BaseRepository.ts       # Clase abstracta genérica con CRUD, paginación y transacciones
│   │   ├── exceptions/                 # Clases de error personalizadas
│   │   │   ├── AppError.ts             # Error base con statusCode, errorCode y isOperational
│   │   │   ├── NotFoundError.ts        # 404 especializado
│   │   │   ├── ValidationError.ts      # 400 especializado para errores de validación
│   │   │   ├── UnauthorizedError.ts    # 401 especializado
│   │   │   └── ConflictError.ts        # 409 especializado (ej. email duplicado)
│   │   ├── responses/                  # Formateadores estándar de respuesta JSON
│   │   │   └── apiResponse.ts          # Funciones sendSuccess(data, meta?) y sendError(error)
│   │   ├── types/                      # Tipos globales TypeScript
│   │   │   ├── express.d.ts            # Extensión de Request para incluir user y requestId
│   │   │   ├── pagination.ts           # Tipos para PaginationParams, PaginatedResult<T>
│   │   │   └── repository.ts           # Interface IRepository<T> para contrato base
│   │   └── utils/                      # Funciones utilitarias puras
│   │       ├── jwt.ts                  # Funciones signToken() y verifyToken() (wrapping jsonwebtoken)
│   │       └── hash.ts                 # Funciones hashPassword() y comparePassword() (wrapping bcrypt)
│   │
│   ├── app.ts                          # Configuración de Express, montaje de middlewares y rutas
│   └── server.ts                       # Arranque del servidor HTTP, verificación de conexión DB y listener de puerto
│
├── .env.example                        # Plantilla COMPLETA de variables de entorno con valores de ejemplo
├── package.json                        # Dependencias y scripts de ejecución
├── tsconfig.json                       # Configuración estricta del compilador TypeScript
└── README.md                           # Guía de instalación, levantamiento local y documentación de endpoints
```

---

## 3. Convenciones Técnicas Específicas

### 3.1 Nomenclatura en Base de Datos (PostgreSQL)

* **Tablas:** Sustantivos en plural, minúsculas y snake\_case (ej. `projects`, `canvas_entities`, `audit_logs`).
* **Columnas:** snake\_case en minúsculas (ej. `project_id`, `architecture_style`, `created_at`).
* **Claves Primarias:** `id UUID DEFAULT gen_random_uuid() PRIMARY KEY` (evita la enumeración predictiva y simplifica la generación asíncrona de entidades).
* **Claves Foráneas:** Nombre de la entidad referenciada en singular + sufijo `_id` con restricción declarada `FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE`.
* **Índices:** Se crean explícitamente sobre todas las columnas FK (`project_id`, `user_id`) y columnas de filtrado frecuente (`email` en users, `type` en requirements, `status` en architecture\_decisions). Nomenclatura: `idx_{tabla}_{columna}`.
* **Timestamps:** Todas las tablas incluyen `created_at TIMESTAMPTZ DEFAULT NOW()`. Las tablas mutables incluyen `updated_at TIMESTAMPTZ DEFAULT NOW()` con trigger de auto-actualización.

### 3.2 Convenciones de API REST

* **Prefijo de versionamiento:** `/api/v1/` para todas las rutas.
* **Recursos en plural:** `/api/v1/projects`, `/api/v1/projects/:projectId/requirements`.
* **Rutas públicas (sin auth):**
  - `POST /api/v1/auth/register`
  - `POST /api/v1/auth/login`
  - `GET /api/v1/health`
* **Rutas protegidas (requieren JWT):**
  - Todas las rutas bajo `/api/v1/projects`, `/api/v1/projects/:projectId/*`
* **Códigos de Estado HTTP:**
  - `200 OK` — Consulta o actualización exitosa.
  - `201 Created` — Creación exitosa de un recurso.
  - `400 Bad Request` — Parámetros o cuerpo malformados (error de validación Zod).
  - `401 Unauthorized` — Token ausente, expirado o inválido.
  - `404 Not Found` — Recurso no encontrado.
  - `409 Conflict` — Violación de unicidad (ej. email ya registrado, nombre de proyecto duplicado por usuario).
  - `429 Too Many Requests` — Rate limit excedido.
  - `500 Internal Server Error` — Falla no controlada en el servidor (mensaje genérico, detalles solo en logs).

### 3.3 Formato de Respuesta Estandarizado (Envelope Extendido)

**Éxito sin paginación:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Éxito con paginación (listas):**
```json
{
  "success": true,
  "data": [ ... ],
  "meta": {
    "total": 42,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

**Error:**
```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "El proyecto solicitado no existe.",
    "details": []
  }
}
```

**Error de validación (400):**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Los datos proporcionados no son válidos.",
    "details": [
      { "field": "email", "message": "Formato de email inválido" },
      { "field": "name", "message": "El nombre es requerido" }
    ]
  }
}
```

### 3.4 Convenciones de Logging

* **Niveles:** `debug` (solo desarrollo), `info` (operaciones normales), `warn` (situaciones atípicas pero recuperables), `error` (fallos que requieren atención).
* **Formato:** JSON estructurado con campos: `timestamp`, `level`, `requestId`, `method`, `path`, `statusCode`, `duration`, `message`.
* **Regla de sanitización:** Nunca loggear passwords, tokens JWT ni datos sensibles del usuario. Los payloads de request se loggean sin campos sensibles.

### 3.5 Convenciones de Manejo de Errores

* **Errores operacionales:** Errores esperados (validación, not found, conflictos). Se manejan con clases de `shared/exceptions/`. Se retornan al cliente con código y mensaje apropiado.
* **Errores de programación:** Errores inesperados (null reference, tipo incorrecto). Se capturan en `errorHandler`, se loggean con nivel `error` y se retorna un 500 genérico al cliente. **Nunca** se expone el stack trace ni el mensaje interno de PostgreSQL al cliente en producción.
* **Mapeo de códigos PostgreSQL:** El `errorHandler` mapea códigos de error conocidos de PG a errores HTTP apropiados:
  - `23505` (unique\_violation) → `409 Conflict` con `ConflictError`.
  - `23503` (foreign\_key\_violation) → `400 Bad Request` con mensaje descriptivo.
  - `23502` (not\_null\_violation) → `400 Bad Request`.
  - Cualquier otro → `500 Internal Server Error` con mensaje genérico.

### 3.6 Convenciones de Transacciones

* Las operaciones que afectan múltiples tablas **deben** ejecutarse dentro de una transacción.
* El `BaseRepository` expone un método `withTransaction(callback)` que:
  1. Obtiene un client del pool.
  2. Ejecuta `BEGIN`.
  3. Ejecuta el callback pasándole el client.
  4. Si todo es exitoso, ejecuta `COMMIT`.
  5. Si hay error, ejecuta `ROLLBACK` y re-lanza el error.

---

## 4. Lista Detallada de Tareas

### Bloque 0: Configuración de Entorno e Infraestructura Base

* [ ] **Tarea 0.1: Inicialización del proyecto Node.js/TypeScript**
  * *Detalle:* Inicializar `package.json`, configurar `tsconfig.json` con `strict: true`, `esModuleInterop: true`, `outDir: "./dist"`, `rootDir: "./src"`. Agregar scripts: `"dev": "tsx watch src/server.ts"`, `"build": "tsc"`, `"start": "node dist/server.js"`, `"migrate": "tsx src/database/migrate.ts"`.
  * *Dependencias de producción:* `express`, `pg`, `dotenv`, `cors`, `helmet`, `express-rate-limit`, `jsonwebtoken`, `bcrypt`, `zod`, `pino`, `pino-http`, `uuid`.
  * *Dependencias de desarrollo:* `typescript`, `tsx`, `@types/express`, `@types/pg`, `@types/cors`, `@types/jsonwebtoken`, `@types/bcrypt`, `@types/uuid`, `pino-pretty`.

* [ ] **Tarea 0.2: Validación de variables de entorno (`config/env.ts`)**
  * *Detalle:* Definir un Zod schema que valide TODAS las variables requeridas al arrancar la aplicación. Si alguna falta o es inválida, la app debe fallar inmediatamente con un mensaje claro.
  * *Variables requeridas:*
    ```
    NODE_ENV=development
    PORT=3000
    DB_HOST=localhost
    DB_PORT=5432
    DB_USER=devsculptor
    DB_PASSWORD=devsculptor_secret
    DB_NAME=devsculptor_db
    JWT_SECRET=your_jwt_secret_here_min_32_chars
    JWT_EXPIRES_IN=24h
    CORS_ORIGINS=http://localhost:3000,http://localhost:5173
    RATE_LIMIT_WINDOW_MS=900000
    RATE_LIMIT_MAX=100
    ```

* [ ] **Tarea 0.3: Conexión y Pool tuning de PostgreSQL (`config/database.ts`)**
  * *Detalle:* Configurar una instancia singleton de `pg.Pool` con parámetros de rendimiento explícitos:
    - `max: 20` (máximo de conexiones simultáneas).
    - `idleTimeoutMillis: 30000` (cerrar conexiones idle después de 30s).
    - `connectionTimeoutMillis: 5000` (timeout al intentar conectar).
  * Añadir listener `pool.on('error')` para loggear y evitar caídas del proceso por desconexiones imprevistas.
  * Exportar función `testConnection()` que ejecute `SELECT NOW()` para verificar conectividad al arrancar.

* [ ] **Tarea 0.4: Logger estructurado (`config/logger.ts`)**
  * *Detalle:* Configurar Pino con:
    - Nivel base: `debug` en development, `info` en production.
    - Transport: `pino-pretty` en development (formato legible humano), JSON nativo en production.
    - Exportar la instancia del logger como singleton.

* [ ] **Tarea 0.5: `.env.example` completo**
  * *Detalle:* Crear archivo con TODAS las variables documentadas con comentarios y valores de ejemplo (nunca valores reales de producción).

---

### Bloque I: Persistencia y Lógica en Base de Datos (PostgreSQL)

* [ ] **Tarea 1.1: Configuración del contenedor y esquema inicial**
  * *Detalle:* Configurar el servicio de PostgreSQL en local (Docker o instancia de desarrollo). Crear la base de datos `devsculptor_db` y habilitar la extensión `pgcrypto` para la función `gen_random_uuid()`.

* [ ] **Tarea 1.2: Script DDL de Entidades Fundamentales (`001_initial_schema.sql`)**
  * *Detalle:* Escribir el script SQL normalizado creando las 6 tablas esenciales derivadas del DER:
    * `users`: `id (UUID PK)`, `email (VARCHAR UNIQUE NOT NULL)`, `password_hash (VARCHAR NOT NULL)`, `full_name (VARCHAR NOT NULL)`, `created_at (TIMESTAMPTZ DEFAULT NOW())`.
    * `projects`: `id (UUID PK)`, `user_id (UUID FK → users ON DELETE CASCADE NOT NULL)`, `name (VARCHAR NOT NULL)`, `description (TEXT)`, `architecture_style (VARCHAR)`, `created_at`, `updated_at`.
      * **Restricción de unicidad compuesta:** `UNIQUE(user_id, name)` — un usuario no puede tener dos proyectos con el mismo nombre.
    * `requirements`: `id (UUID PK)`, `project_id (UUID FK → projects ON DELETE CASCADE NOT NULL)`, `code (VARCHAR NOT NULL)`, `title (VARCHAR NOT NULL)`, `description (TEXT)`, `type (VARCHAR CHECK IN ('RF', 'RNF') NOT NULL)`, `priority (VARCHAR CHECK IN ('HIGH', 'MEDIUM', 'LOW') DEFAULT 'MEDIUM')`.
      * **Restricción de unicidad compuesta:** `UNIQUE(project_id, code)` — no puede haber dos requisitos con el mismo código en un proyecto.
    * `canvas_entities`: `id (UUID PK)`, `project_id (UUID FK → projects ON DELETE CASCADE NOT NULL)`, `table_name (VARCHAR NOT NULL)`, `columns_json (JSONB NOT NULL DEFAULT '[]')`, `position_x (INTEGER DEFAULT 0)`, `position_y (INTEGER DEFAULT 0)`, `created_at`, `updated_at`.
      * **Restricción de unicidad compuesta:** `UNIQUE(project_id, table_name)` — no puede haber dos tablas con el mismo nombre en un proyecto.
    * `architecture_decisions`: `id (UUID PK)`, `project_id (UUID FK → projects ON DELETE CASCADE NOT NULL)`, `title (VARCHAR NOT NULL)`, `context (TEXT)`, `decision (TEXT)`, `status (VARCHAR CHECK IN ('PROPOSED', 'ACCEPTED', 'REJECTED') DEFAULT 'PROPOSED')`, `created_at`, `updated_at`.
    * `audit_logs`: `id (UUID PK)`, `project_id (UUID FK → projects ON DELETE CASCADE)`, `user_id (UUID FK → users ON DELETE SET NULL)`, `entity_type (VARCHAR NOT NULL)`, `entity_id (UUID)`, `action (VARCHAR CHECK IN ('INSERT', 'UPDATE', 'DELETE') NOT NULL)`, `payload_before (JSONB)`, `payload_after (JSONB)`, `created_at (TIMESTAMPTZ DEFAULT NOW())`.
      * **Nota:** `user_id` usa `ON DELETE SET NULL` para preservar el log de auditoría incluso si el usuario es eliminado.
      * **Nota:** `entity_id` se añade para rastrear la entidad específica que fue modificada.

* [ ] **Tarea 1.3: Script de Índices de Rendimiento (`002_indexes.sql`)**
  * *Detalle:* Crear índices explícitos para optimizar las consultas más frecuentes:
    ```sql
    CREATE INDEX idx_projects_user_id ON projects(user_id);
    CREATE INDEX idx_requirements_project_id ON requirements(project_id);
    CREATE INDEX idx_requirements_type ON requirements(type);
    CREATE INDEX idx_canvas_entities_project_id ON canvas_entities(project_id);
    CREATE INDEX idx_architecture_decisions_project_id ON architecture_decisions(project_id);
    CREATE INDEX idx_architecture_decisions_status ON architecture_decisions(status);
    CREATE INDEX idx_audit_logs_project_id ON audit_logs(project_id);
    CREATE INDEX idx_audit_logs_entity_type ON audit_logs(entity_type);
    CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
    CREATE UNIQUE INDEX idx_users_email ON users(email);
    ```

* [ ] **Tarea 1.4: Trigger de auto-actualización de `updated_at`**
  * *Detalle:* Crear función `fn_set_updated_at()` y asociarla como trigger `BEFORE UPDATE` en todas las tablas que tengan columna `updated_at` (projects, canvas\_entities, architecture\_decisions). Esto garantiza que la fecha de última modificación se actualice automáticamente sin intervención del código de aplicación.

* [ ] **Tarea 1.5: Desarrollo de la Lógica de Trigger de Auditoría (`trg_audit_canvas.sql`)**
  * *Detalle:* Desarrollar la función PL/pgSQL `fn_audit_canvas_entities()` que se ejecuta `AFTER INSERT OR UPDATE OR DELETE` sobre la tabla `canvas_entities`.
  * *Lógica:* Extrae automáticamente el `project_id`, asigna la acción ejecutada (`TG_OP`), guarda el registro anterior en `payload_before` (mediante `to_jsonb(OLD)`) y el nuevo estado en `payload_after` (mediante `to_jsonb(NEW)`), insertándolo de manera atómica en `audit_logs`.
  * *Nota sobre user\_id:* El trigger no puede conocer el `user_id` del usuario autenticado de forma nativa. Se utilizará la función `current_setting('app.current_user_id', true)` para leer un parámetro de sesión que será establecido por el backend antes de cada operación que active el trigger. Si no está establecido, se inserta `NULL`.

* [ ] **Tarea 1.6: Desarrollo del Stored Procedure de Métricas (`sp_project_metrics.sql`)**
  * *Detalle:* Implementar la función `sp_calculate_project_metrics(p_project_id UUID)` que calcula y retorna en un solo llamado:
    * `total_rf`: Conteo de requisitos tipo 'RF'.
    * `total_rnf`: Conteo de requisitos tipo 'RNF'.
    * `total_entities`: Conteo de tablas creadas en `canvas_entities`.
    * `total_adrs_accepted`: Conteo de decisiones arquitectónicas con estado 'ACCEPTED'.
    * `total_adrs_total`: Conteo total de decisiones arquitectónicas.
    * `maturity_index`: Cálculo ponderado (entero de 0 a 100) que mide la madurez documental del proyecto evaluando la presencia equilibrada de requisitos, diseño de datos y ADRs aprobados.
  * *Fórmula del maturity\_index:* Promedio ponderado de 4 indicadores booleanos (25% cada uno):
    1. ¿Tiene al menos 1 RF? (25 puntos)
    2. ¿Tiene al menos 1 RNF? (25 puntos)
    3. ¿Tiene al menos 1 entidad en el Canvas? (25 puntos)
    4. ¿Tiene al menos 1 ADR aceptado? (25 puntos)

* [ ] **Tarea 1.7: Runner de Migraciones Idempotente (`migrate.ts`)**
  * *Detalle:* Implementar un script en TypeScript que:
    1. Cree automáticamente la tabla `_migrations(id SERIAL PK, filename VARCHAR UNIQUE, executed_at TIMESTAMPTZ)` si no existe.
    2. Lea secuencialmente TODOS los archivos `.sql` de las carpetas `database/migrations/`, `database/triggers/` y `database/procedures/`.
    3. Para cada archivo, verifique en `_migrations` si ya fue ejecutado.
    4. Si no fue ejecutado, lo ejecute dentro de una transacción (`BEGIN ... COMMIT`) y registre la migración.
    5. Si falla, haga `ROLLBACK` y reporte el error con el nombre del archivo y la línea problemática.

* [ ] **Tarea 1.8: Datos semilla para desarrollo (`seed_dev.sql`)**
  * *Detalle:* Script que inserte:
    * 1 usuario de prueba (email: `dev@devsculptor.test`, password hasheado con bcrypt).
    * 1 proyecto asociado al usuario de prueba.
    * 2 requisitos (1 RF, 1 RNF) asociados al proyecto.
    * 1 entidad de canvas con un `columns_json` de ejemplo.
    * 1 decisión de arquitectura en estado 'ACCEPTED'.

---

### Bloque II: Infraestructura Compartida del Backend

* [ ] **Tarea 2.1: Clases de Error Personalizadas (`shared/exceptions/`)**
  * *Detalle:* Crear la jerarquía de errores:
    * `AppError` (base): `statusCode`, `errorCode`, `message`, `isOperational: true`, `details?: any[]`.
    * `NotFoundError` (404): Hereda de AppError, `errorCode: 'RESOURCE_NOT_FOUND'`.
    * `ValidationError` (400): Hereda de AppError, `errorCode: 'VALIDATION_ERROR'`, acepta array de detalles Zod.
    * `UnauthorizedError` (401): Hereda de AppError, `errorCode: 'UNAUTHORIZED'`.
    * `ConflictError` (409): Hereda de AppError, `errorCode: 'CONFLICT'`.

* [ ] **Tarea 2.2: Formateadores de Respuesta (`shared/responses/apiResponse.ts`)**
  * *Detalle:* Funciones helper:
    * `sendSuccess(res, data, statusCode = 200, meta?)` — Envuelve la respuesta en el envelope estándar con `success: true`.
    * `sendCreated(res, data)` — Shortcut para `sendSuccess` con status 201.
    * `sendError(res, error: AppError)` — Envuelve el error en el envelope estándar con `success: false`.

* [ ] **Tarea 2.3: Tipos Globales (`shared/types/`)**
  * *Detalle:*
    * `express.d.ts`: Extensión de `express.Request` para incluir `user?: { id: string, email: string }` y `requestId: string`.
    * `pagination.ts`: `PaginationParams { limit: number, offset: number }`, `PaginatedResult<T> { data: T[], meta: { total: number, limit: number, offset: number, hasMore: boolean } }`.
    * `repository.ts`: Interface `IRepository<T>` con firma de métodos CRUD genéricos.

* [ ] **Tarea 2.4: BaseRepository Genérico (`shared/base/BaseRepository.ts`)**
  * *Detalle:* Clase abstracta que recibe el nombre de tabla y la lista de columnas insertables:
    * `create(data)`: `INSERT INTO {table} (...) VALUES (...) RETURNING *`.
    * `findById(id)`: `SELECT * FROM {table} WHERE id = $1`.
    * `findAll(pagination)`: `SELECT * FROM {table} ORDER BY created_at DESC LIMIT $1 OFFSET $2` con query de conteo `SELECT COUNT(*) FROM {table}` para el meta.
    * `findAllByField(field, value, pagination)`: Query filtrada por una columna específica.
    * `update(id, data)`: `UPDATE {table} SET ... WHERE id = $1 RETURNING *`.
    * `delete(id)`: `DELETE FROM {table} WHERE id = $1 RETURNING *`.
    * `withTransaction(callback)`: Wrapper transaccional que obtiene client del pool, ejecuta BEGIN/COMMIT/ROLLBACK.
    * `setSessionUserId(client, userId)`: Ejecuta `SET LOCAL "app.current_user_id" = $1` para que los triggers puedan acceder al usuario autenticado.

* [ ] **Tarea 2.5: Utilidades de JWT (`shared/utils/jwt.ts`)**
  * *Detalle:*
    * `signToken(payload: { id: string, email: string }): string` — Genera un token JWT firmado con `JWT_SECRET` y expiración `JWT_EXPIRES_IN`.
    * `verifyToken(token: string): JwtPayload` — Verifica y decodifica el token. Lanza `UnauthorizedError` si es inválido o expirado.

* [ ] **Tarea 2.6: Utilidades de Hash (`shared/utils/hash.ts`)**
  * *Detalle:*
    * `hashPassword(password: string): Promise<string>` — Hash con bcrypt, salt rounds = 12.
    * `comparePassword(password: string, hash: string): Promise<boolean>` — Comparación segura.

---

### Bloque III: Middlewares

* [ ] **Tarea 3.1: Middleware de Request ID (`middlewares/requestId.ts`)**
  * *Detalle:* Genera `uuid.v4()`, lo asigna a `req.requestId` y lo incluye en el header de respuesta `X-Request-Id`. Esto permite correlacionar logs del servidor con requests del cliente.

* [ ] **Tarea 3.2: Middleware de Request Logger (`middlewares/requestLogger.ts`)**
  * *Detalle:* Utiliza `pino-http` integrado con la instancia de Pino del proyecto. Loggea automáticamente: método, ruta, status code, duración, request-id. En nivel `debug`, loggea también el body (excluyendo campos sensibles como `password`).

* [ ] **Tarea 3.3: Middleware de Rate Limiting (`middlewares/rateLimiter.ts`)**
  * *Detalle:* Configura `express-rate-limit` con ventana y máximo de requests desde variables de entorno. Retorna 429 con el envelope de error estándar cuando se excede el límite.

* [ ] **Tarea 3.4: Middleware de Validación (`middlewares/validateRequest.ts`)**
  * *Detalle:* Función factory que recibe un objeto `{ body?: ZodSchema, params?: ZodSchema, query?: ZodSchema }` y retorna un middleware que valida cada parte del request contra su schema correspondiente. Si falla, lanza `ValidationError` con los detalles de Zod formateados.

* [ ] **Tarea 3.5: Middleware de Autenticación (`middlewares/authenticate.ts`)**
  * *Detalle:*
    1. Extrae el token del header `Authorization: Bearer <token>`.
    2. Si no hay token, lanza `UnauthorizedError("Token de autenticación requerido")`.
    3. Verifica el token con `verifyToken()`.
    4. Si es inválido/expirado, lanza `UnauthorizedError("Token inválido o expirado")`.
    5. Si es válido, asigna `req.user = { id, email }` y llama a `next()`.

* [ ] **Tarea 3.6: Middleware de Manejo de Errores (`middlewares/errorHandler.ts`)**
  * *Detalle:* Middleware final de Express `(err, req, res, next)`:
    1. Si `err` es instancia de `AppError` (operacional), responde con su `statusCode` y `errorCode`.
    2. Si `err` es un error de PostgreSQL, mapea el código:
       - `23505` → `ConflictError` con mensaje descriptivo.
       - `23503` → `ValidationError("Referencia inválida")`.
       - Otros → log `error` y respuesta 500 genérica.
    3. Si `err` es cualquier otro error, log `error` con stack trace completo y respuesta 500 genérica: `"Error interno del servidor"`.
    4. **Nunca** expone stack traces, queries SQL ni mensajes internos al cliente en producción.

* [ ] **Tarea 3.7: Middleware Not Found (`middlewares/notFoundHandler.ts`)**
  * *Detalle:* Middleware que captura todas las rutas no registradas y responde con 404 en el formato de error estándar.

---

### Bloque IV: Capa de Persistencia — Repositorios

* [ ] **Tarea 4.1: Repositorio de Usuarios / Auth (`auth.repository.ts`)**
  * *Detalle:* Extiende `BaseRepository<User>`. Añade:
    * `findByEmail(email: string)`: Query especializada para login.

* [ ] **Tarea 4.2: Repositorio de Proyectos (`projects.repository.ts`)**
  * *Detalle:* Extiende `BaseRepository<Project>`. Sobreescribe `findAll` para filtrar por `user_id` del usuario autenticado. Añade:
    * `findAllByUserId(userId, pagination)`: Listado paginado de proyectos del usuario.

* [ ] **Tarea 4.3: Repositorio de Requisitos (`requirements.repository.ts`)**
  * *Detalle:* Extiende `BaseRepository<Requirement>`. Añade:
    * `findAllByProjectId(projectId, pagination)`: Listado paginado filtrado por proyecto.
    * `findByProjectIdAndType(projectId, type)`: Filtrado por tipo (RF/RNF).

* [ ] **Tarea 4.4: Repositorio de Canvas (`canvas.repository.ts`)**
  * *Detalle:* Extiende `BaseRepository<CanvasEntity>`. Añade:
    * `findAllByProjectId(projectId)`: Listado de entidades del canvas (sin paginación, son pocas por proyecto).
    * `getAuditLogsByProject(projectId, pagination)`: Consulta la tabla `audit_logs` filtrada por `project_id` y `entity_type = 'canvas_entity'`.

* [ ] **Tarea 4.5: Repositorio de Decisiones de Arquitectura (`decisions.repository.ts`)**
  * *Detalle:* Extiende `BaseRepository<ArchitectureDecision>`. Añade:
    * `findAllByProjectId(projectId, pagination)`: Listado paginado.
    * `findByProjectIdAndStatus(projectId, status)`: Filtrado por estado.

* [ ] **Tarea 4.6: Repositorio de Métricas (`metrics.repository.ts`)**
  * *Detalle:* No extiende BaseRepository (no es CRUD). Ejecuta directamente:
    * `getProjectMetrics(projectId)`: `SELECT * FROM sp_calculate_project_metrics($1);`, mapeando el resultado a un tipo `ProjectMetrics` fuertemente tipado.

---

### Bloque V: Capa de Servicios y Controladores (Lógica de Negocio y HTTP)

* [ ] **Tarea 5.1: Módulo de Autenticación (Auth)**
  * *Detalle:*
    * `auth.dto.ts`: Zod schemas `RegisterDto` (email, password min 8 chars, full\_name) y `LoginDto` (email, password).
    * `auth.service.ts`:
      - `register(data)`: Verifica que el email no exista (si existe, lanza `ConflictError`). Hashea el password con bcrypt. Crea el usuario. Genera y retorna token JWT.
      - `login(data)`: Busca usuario por email. Si no existe o password no coincide, lanza `UnauthorizedError("Credenciales inválidas")` (mensaje genérico por seguridad, no revelar si es email o password el incorrecto).
    * `auth.controller.ts`: Extrae body validado, invoca al servicio, responde con 201 (register) o 200 (login) incluyendo el token.
    * `auth.routes.ts`: `POST /api/v1/auth/register`, `POST /api/v1/auth/login` — Rutas **públicas** (sin middleware `authenticate`).

* [ ] **Tarea 5.2: Módulo de Proyectos (CRUD Core)**
  * *Detalle:*
    * `projects.dto.ts`: Zod schemas `CreateProjectDto` (name requerido, description opcional, architecture\_style opcional) y `UpdateProjectDto` (todos opcionales, al menos uno requerido).
    * `projects.service.ts`: Utiliza `req.user.id` como `user_id`. Valida unicidad de nombre de proyecto por usuario antes de crear. Verifica que el proyecto pertenezca al usuario autenticado antes de actualizar/eliminar (prevención de acceso horizontal).
    * `projects.controller.ts`: Extrae body/params validados, invoca al servicio, responde con códigos apropiados.
    * `projects.routes.ts`: Todas las rutas protegidas con `authenticate`. Rutas: `GET /api/v1/projects` (lista del usuario), `POST /api/v1/projects`, `GET /api/v1/projects/:projectId`, `PUT /api/v1/projects/:projectId`, `DELETE /api/v1/projects/:projectId`.

* [ ] **Tarea 5.3: Módulo de Requisitos**
  * *Detalle:*
    * `requirements.dto.ts`: Zod schemas con validación de formato de código (`/^(RF|RNF)-\d{2,3}$/`), tipo, y prioridad.
    * `requirements.service.ts`: Valida que el proyecto pertenezca al usuario autenticado. Valida unicidad de código de requisito por proyecto.
    * `requirements.routes.ts`: Rutas anidadas protegidas: `GET/POST /api/v1/projects/:projectId/requirements`, `GET/PUT/DELETE /api/v1/projects/:projectId/requirements/:requirementId`.

* [ ] **Tarea 5.4: Módulo de Canvas y Verificación del Trigger**
  * *Detalle:*
    * `canvas.dto.ts`: Zod schemas con validación de `table_name` (alfanumérico + underscore), `columns_json` (array de objetos con estructura definida).
    * `canvas.service.ts`: Antes de cada operación de escritura, establece `app.current_user_id` en la sesión de PG para que el trigger registre quién hizo el cambio.
    * Rutas protegidas: `GET/POST /api/v1/projects/:projectId/canvas`, `PUT/DELETE /api/v1/projects/:projectId/canvas/:canvasId`, `GET /api/v1/projects/:projectId/audit-logs`.

* [ ] **Tarea 5.5: Módulo de Decisiones de Arquitectura (ADRs)**
  * *Detalle:*
    * `decisions.dto.ts`: Zod schemas para crear (title, context, decision), actualizar estado (status con validación de transiciones: solo PROPOSED→ACCEPTED o PROPOSED→REJECTED).
    * `decisions.service.ts`: Valida que el proyecto pertenezca al usuario. Implementa lógica de transición de estados (no se puede aceptar un ADR ya rechazado ni viceversa).
    * Rutas protegidas: `GET/POST /api/v1/projects/:projectId/decisions`, `GET/PUT/DELETE /api/v1/projects/:projectId/decisions/:decisionId`, `PATCH /api/v1/projects/:projectId/decisions/:decisionId/status`.

* [ ] **Tarea 5.6: Módulo de Métricas (Consumo de SP)**
  * *Detalle:*
    * `metrics.service.ts`: Invoca el repositorio de métricas. Puede implementar caché en memoria con TTL de 30 segundos para evitar ejecutar el SP en cada request.
    * Ruta protegida: `GET /api/v1/projects/:projectId/metrics`.

---

### Bloque VI: Ensamblaje de la Aplicación

* [ ] **Tarea 6.1: Configuración de Express (`app.ts`)**
  * *Detalle:* Montar middlewares en orden estricto:
    1. `helmet()`
    2. `cors({ origin: CORS_ORIGINS })`
    3. `rateLimiter`
    4. `express.json({ limit: '1mb' })`
    5. `requestId`
    6. `requestLogger`
    7. Rutas de salud: `GET /api/v1/health` → responde `{ success: true, data: { status: 'ok', timestamp: new Date() } }`.
    8. Rutas públicas: auth routes.
    9. Rutas protegidas: projects, requirements, canvas, decisions, metrics routes.
    10. `notFoundHandler`
    11. `errorHandler`

* [ ] **Tarea 6.2: Arranque del servidor (`server.ts`)**
  * *Detalle:*
    1. Cargar y validar variables de entorno.
    2. Verificar conexión a base de datos con `testConnection()`.
    3. Iniciar el listener HTTP en el puerto configurado.
    4. Loggear `info`: "Servidor DevSculptor iniciado en puerto {PORT}".
    5. Manejar señales de cierre graceful (`SIGTERM`, `SIGINT`): cerrar el pool de DB y el servidor HTTP antes de salir.

---

### Bloque VII: Aseguramiento de Calidad y Pruebas con Postman (QA)

* [ ] **Tarea 7.1: Colección Postman de Pruebas de Integración**
  * *Detalle:* Diseñar una colección en Postman con variables de entorno (`baseUrl`, `authToken`, `projectId`, `requirementId`, `canvasId`, `decisionId`). Organizar en carpetas: Auth, Projects, Requirements, Canvas, Decisions, Metrics.

* [ ] **Tarea 7.2: Batería de Pruebas de Auth**
  * *Detalle:*
    1. `POST /auth/register` con datos válidos → 201, recibe token.
    2. `POST /auth/register` con email duplicado → 409.
    3. `POST /auth/login` con credenciales válidas → 200, recibe token.
    4. `POST /auth/login` con credenciales inválidas → 401.
    5. `GET /projects` sin token → 401.
    6. `GET /projects` con token inválido → 401.
    * Guardar el token recibido en variable `authToken` para usar en tests subsiguientes.

* [ ] **Tarea 7.3: Batería de Pruebas CRUD de Proyectos**
  * *Detalle:*
    1. `POST /projects` → 201, guardar `projectId`.
    2. `GET /projects` → 200, verificar que el proyecto creado esté en la lista.
    3. `GET /projects/:projectId` → 200, verificar datos.
    4. `PUT /projects/:projectId` → 200, verificar actualización.
    5. `POST /projects` con nombre duplicado → 409.
    6. `DELETE /projects/:projectId` → 200.

* [ ] **Tarea 7.4: Batería de Pruebas de Requisitos**
  * *Detalle:*
    1. Crear proyecto para tests. Guardar `projectId`.
    2. `POST /projects/:projectId/requirements` con RF → 201.
    3. `POST /projects/:projectId/requirements` con RNF → 201.
    4. `POST /projects/:projectId/requirements` con código duplicado → 409.
    5. `GET /projects/:projectId/requirements` → 200, verificar que haya 2 requisitos.

* [ ] **Tarea 7.5: Validación del Trigger de Auditoría**
  * *Detalle:*
    1. Crear entidad en Canvas: `POST /projects/:projectId/canvas` → 201.
    2. Actualizar entidad: `PUT /projects/:projectId/canvas/:canvasId` → 200.
    3. Consultar audit logs: `GET /projects/:projectId/audit-logs` → 200, verificar que existan 2 registros (INSERT y UPDATE) con los payloads before/after correctos.

* [ ] **Tarea 7.6: Validación de ADRs**
  * *Detalle:*
    1. Crear ADR: `POST /projects/:projectId/decisions` → 201, status default 'PROPOSED'.
    2. Aceptar ADR: `PATCH /projects/:projectId/decisions/:decisionId/status` con `{ "status": "ACCEPTED" }` → 200.
    3. Intentar rechazar un ADR ya aceptado → 400 (transición inválida).

* [ ] **Tarea 7.7: Validación del Stored Procedure de Métricas**
  * *Detalle:* Consumir `GET /projects/:projectId/metrics` y verificar que la respuesta contenga los conteos correctos de requisitos, entidades, ADRs aceptados y un `maturity_index` válido (entre 0 y 100).

* [ ] **Tarea 7.8: Pruebas de Seguridad Básica**
  * *Detalle:*
    1. Verificar que endpoints protegidos retornen 401 sin token.
    2. Verificar que un usuario no pueda acceder a proyectos de otro usuario (crear segundo usuario, intentar GET/PUT/DELETE sobre proyecto del primer usuario → 404, no 403, para no revelar existencia).
    3. Verificar que el rate limiter funcione enviando requests rápidos repetidos → 429.
    4. Verificar que errores de validación retornen detalles útiles pero no información interna.

---

## 5. Criterios de Definition of Done (DoD)

Cada tarea se considera DONE cuando cumple **todos** estos criterios:

| Criterio | Descripción |
|:---|:---|
| ✅ Funcionalidad | El código implementa correctamente el requisito descrito en la tarea. |
| ✅ Tipos | No hay errores de compilación TypeScript con `strict: true`. |
| ✅ Validación | Los DTOs validan correctamente entradas válidas e inválidas (Zod). |
| ✅ Errores | Los errores se capturan y retornan en el formato estándar del envelope. |
| ✅ Seguridad | Los endpoints protegidos requieren JWT. Los errores no exponen información interna. |
| ✅ Logging | Las operaciones críticas generan logs con nivel apropiado y request-id. |
| ✅ SQL Parametrizado | Todas las queries usan parámetros posicionales ($1, $2...), nunca concatenación de strings. |
| ✅ Testeable | El código se puede probar con la colección Postman documentada. |

---

Con la ejecución de esta lista ordenada y atomizada, se garantiza una base técnica desacoplada, segura y robusta, cumpliendo con la rúbrica institucional (CRUD completo, persistencia relacional con PostgreSQL, procedimientos almacenados y triggers, autenticación JWT/bcrypt), dejando el backend listo para recibir la interfaz de usuario en las semanas posteriores sin bloqueos técnicos.
