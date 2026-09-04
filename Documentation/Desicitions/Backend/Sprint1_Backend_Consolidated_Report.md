# Informe Técnico Consolidado: Arquitectura e Implementación Backend Core (Sprint 1)

**Proyecto:** DevSculptor — Technical Governance & AI-Assisted Documentation  
**Asignatura / Portafolio:** Taller de Integración de Software (PTY4479)  
**Autor:** Nathaniel Muller San Martin  
**Ciclo de Desarrollo:** Sprint 1 / Semana 4 (con adelanto de Auth de Semana 5)  
**Fecha de Publicación:** Septiembre 2026  
**Versión del Artefacto:** 1.0.0 (Release Candidate Core)  
**Ubicación del Código:** [`devsculptor-backend/`](file:///c:/Users/natha/Documents/Repos/DevSculptor/devsculptor-backend)

---

## 📑 Tabla de Contenidos

1. [Ficha Técnica del Proyecto](#1-ficha-técnica-del-proyecto)
2. [Trazabilidad de Decisiones Arquitectónicas (ADRs Consolidados)](#2-trazabilidad-de-decisiones-arquitectónicas-adrs-consolidados)
3. [Arquitectura: Monolito Modular con Patrón MVC en Capas](#3-arquitectura-monolito-modular-con-patrón-mvc-en-capas)
4. [Diseño y Desglose Exhaustivo de la Implementación](#4-diseño-y-desglose-exhaustivo-de-la-implementación)
   - 4.1. [Infraestructura Transversal y Middleware Pipeline](#41-infraestructura-transversal-y-middleware-pipeline)
   - 4.2. [Capa Base de Persistencia: `BaseRepository<T>`](#42-capa-base-de-persistencia-baserepositoryt)
   - 4.3. [Dominio Auth (Autenticación y Registro)](#43-dominio-auth-autenticación-y-registro)
   - 4.4. [Dominio Projects (Gestión y Propiedad de Proyectos)](#44-dominio-projects-gestión-y-propiedad-de-proyectos)
   - 4.5. [Dominio Requirements (Requisitos RF y RNF)](#45-dominio-requirements-requisitos-rf-y-rnf)
   - 4.6. [Dominio Canvas & Audit (Entidades ERD y Auditoría Atómica)](#46-dominio-canvas--audit-entidades-erd-y-auditoría-atómica)
   - 4.7. [Dominio Decisions (ADRs con Máquina de Estados)](#47-dominio-decisions-adrs-con-máquina-de-estados)
   - 4.8. [Dominio Metrics (Consumo de Stored Procedure y Caché)](#48-dominio-metrics-consumo-de-stored-procedure-y-caché)
5. [Capa de Datos y Lógica en Motor (PostgreSQL / Supabase)](#5-capa-de-datos-y-lógica-en-motor-postgresql--supabase)
6. [Topología de Conexiones y Estrategias de Despliegue](#6-topología-de-conexiones-y-estrategias-de-despliegue)
7. [Aseguramiento de Calidad (QA) y Pruebas Automatizadas](#7-aseguramiento-de-calidad-qa-y-pruebas-automatizadas)
8. [Guía de Escalabilidad y Playbook para la Adición de Nuevas Features](#8-guía-de-escalabilidad-y-playbook-para-la-adición-de-nuevas-features)
9. [Conclusiones del Sprint 1](#9-conclusiones-del-sprint-1)

---

## 1. Ficha Técnica del Proyecto

| Parámetro | Definición Técnica |
| :--- | :--- |
| **Nombre del Sistema** | DevSculptor Platform Backend |
| **Propósito** | Motor API REST para gobernanza técnica pre-código, diagramado relacional y síntesis documental asistida por IA |
| **Estilo Arquitectónico** | Monolito Modular con Separación en Capas Estrictas (Layered MVC) |
| **Lenguaje y Tipado** | TypeScript 5.7+ en modo estricto (`strict: true`, cero `any`) |
| **Runtime** | Node.js (v20+ LTS / v25+ Compatible) |
| **Framework HTTP** | Express.js 4.21+ |
| **Motor de Base de Datos** | PostgreSQL 17+ (Despliegue local y en Supabase Managed Cloud) |
| **Cliente de Persistencia** | `pg.Pool` nativo sin ORMs intermediarios (Control DDL total) |
| **Validación de Datos** | Zod 3.24+ (Single Source of Truth para validación y tipos `z.infer`) |
| **Cifrado y Tokens** | bcrypt (12 salt rounds) + jsonwebtoken (HMAC SHA-256) |
| **Observabilidad** | Pino 9.6+ (JSON estructurado) + pino-http + pino-pretty (Dev) |

---

## 2. Trazabilidad de Decisiones Arquitectónicas (ADRs Consolidados)

A lo largo del Sprint 1, se establecieron **8 decisiones estructurales irreversibles** documentadas formalmente en [Sprint1ADRs.md](file:///c:/Users/natha/Documents/Repos/DevSculptor/Documentation/Desicitions/Backend/Sprint1ADRs.md). El siguiente cuadro expone el análisis causa-efecto y sus ventajas:

```
                                ARQUITECTURA DE DECISIONES SPRINT 1
                                
       [Requerimiento Institucional]           [Eficiencia & Simplicidad]            [Seguridad Transversal]
                     │                                     │                                    │
                     ▼                                     ▼                                    ▼
       Triggers PL/pgSQL & Stored Procs           Monolito Modular Layered           Auth JWT adelantado a S1
                     │                                     │                                    │
                     ▼                                     ▼                                    ▼
         Uso de pg.Pool nativo                    Desacoplamiento modular            Trazabilidad en audit_logs
           (Descarte de ORMs)                    por carpetas funcionales               y aislamiento por FK
                     │                                     │                                    │
                     └─────────────────────────────────────┼────────────────────────────────────┘
                                                           │
                                                           ▼
                                         [Contratos Estrictos & Tipado]
                                           - Zod como SSOT de Tipos/DTOs
                                           - Envelope JSON Estandarizado
                                           - Pino Structured Logging
                                           - Blindaje RLS en Supabase
```

### ADR-01: Monolito Modular en Capas (MVC) vs. Microservicios
* **Contexto:** Plazo académico acotado de 5 semanas efectivas (S4 a S8) desarrollado de forma individual.
* **Decisión:** Descartar microservicios y construir un **Monolito Modular**.
* **Fundamento:** Los microservicios introducen fricción operativa inmanejable (múltiples pipelines de despliegue, latencia de red entre servicios, consistencia eventual, orquestación con Docker Compose/K8s y tracing distribuido). El Monolito Modular ofrece una única unidad de compilación y despliegue, pero organiza el código en módulos de dominio autónomos (`auth`, `projects`, `requirements`, `canvas`, `decisions`, `metrics`), permitiendo que en el futuro cualquier módulo pueda extraerse como microservicio sin reescribir su lógica interna.

### ADR-02: Acceso a Datos Nativo con `pg.Pool` vs. ORMs Pesados (Prisma / TypeORM)
* **Contexto:** La rúbrica institucional del portafolio exige explícitamente el diseño de **Triggers relacionales** y **Procedimientos Almacenados (SPs)** en PostgreSQL.
* **Decisión:** Utilizar el driver oficial `pg` mediante un singleton de `pg.Pool` con migraciones SQL puras.
* **Fundamento:** Los ORMs modernos presentan fricciones graves al trabajar con triggers avanzados (por ejemplo, capturar `OLD` y `NEW` dinámicos en formato `JSONB`, o establecer variables de sesión transaccionales `SET LOCAL`). El driver nativo garantiza rendimiento sin sobrecarga, control milimétrico sobre el DDL y plena compatibilidad con funciones de motor.

### ADR-03: Adelanto Estratégico del Módulo de Autenticación (Auth) al Sprint 1
* **Contexto:** El cronograma original ubicaba la autenticación en la Semana 5.
* **Decisión:** Adelantar e implementar Auth completo (JWT + bcrypt) en la Semana 4 (Sprint 1).
* **Fundamento:** Sin `user_id` autenticado:
  1. Los proyectos no pueden persistirse cumpliendo la FK obligatoria `user_id`.
  2. El trigger de auditoría no podría capturar la identidad de quién realiza mutaciones.
  3. La Semana 5 se habría saturado al tener que construir backend de auth + frontend de auth + frontend de proyectos en paralelo.

### ADR-04: Validación Zod como Fuente Única de Verdad (SSOT)
* **Decisión:** Unificar la validación de payloads HTTP y la definición de interfaces TypeScript mediante **Zod**.
* **Fundamento:** Evita la divergencia clásica entre la interfaz TypeScript y la validación en tiempo de ejecución. Cada DTO se define una sola vez en un schema Zod y el tipo de TypeScript se infiere automáticamente mediante `z.infer<typeof schema>`.

### ADR-05: Logging Estructurado con Pino y Correlación de Peticiones
* **Decisión:** Reemplazar `console.log` por **Pino** integrado con `pino-http` y UUID v4.
* **Fundamento:** Cada solicitud HTTP recibe un `X-Request-Id` único generado al ingresar. Todas las salidas por consola y logs de error incluyen este identificador, permitiendo rastrear el ciclo de vida de una petición de punta a punta. En desarrollo se utiliza `pino-pretty` para formato legible.

### ADR-06: Envelope Extendido Estandarizado de Respuestas HTTP
* **Decisión:** Prohibir llamadas directas a `res.json()` y encapsular todas las respuestas bajo helpers uniformes (`sendSuccess`, `sendCreated`, `sendError`).
* **Formato Éxito:** `{ "success": true, "data": T, "meta"?: PaginationMeta }`
* **Formato Error:** `{ "success": false, "error": { "code": string, "message": string, "details": [] } }`
* **Fundamento:** Homogeneidad estricta para el frontend de React/Vite en las semanas 5 y 6, simplificando interceptores en Axios o Fetch.

### ADR-07: Abstracción CRUD Reutilizable mediante `BaseRepository<T>`
* **Decisión:** Implementar una clase abstracta genérica que centralice las operaciones de base de datos recurrentes.
* **Fundamento:** Elimina cientos de líneas de código duplicado. Los repositorios de dominio (`ProjectsRepository`, `RequirementsRepository`, etc.) heredan automáticamente `create`, `findById`, `findAll`, `findAllByField`, `update`, `delete`, `withTransaction` y `setSessionUserId`.

### ADR-08: Blindaje RLS para Supabase
* **Decisión:** Activar Row Level Security (RLS) en todas las tablas públicas en la nube sin políticas públicas anónimas.
* **Fundamento:** Cierra la exposición accidental de la API REST automática de PostgREST generada por Supabase, garantizando que el único punto de entrada a los datos sea el backend Express autenticado.

---

## 3. Arquitectura: Monolito Modular con Patrón MVC en Capas

El backend adopta una arquitectura en capas estrictas donde **las dependencias fluyen únicamente hacia adentro**. Ninguna capa inferior conoce los detalles de la capa superior.

```
                                    SOLICITUD HTTP (Cliente / Postman)
                                                   │
                                                   ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                             PIPELINE DE MIDDLEWARES (Express)                                    │
│  [Helmet] ──► [CORS Whitelist] ──► [Rate Limiter] ──► [express.json] ──► [RequestId (UUID)]     │
│                                           │                                                      │
│                                           ▼                                                      │
│                         [RequestLogger (Pino HTTP Logger)]                                       │
│                                           │                                                      │
│                                           ▼                                                      │
│            [validateRequest(Zod)] ──► [authenticate(JWT Bearer)]                                 │
└───────────────────────────────────────────┬──────────────────────────────────────────────────────┘
                                            │
                                            ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                      CAPA DE TRANSPORTE / CONTROLADORES (Controllers)                            │
│  - Extrae parámetros validados (req.body, req.params, req.query)                                 │
│  - Extrae identidad de usuario seguro (req.user.id)                                              │
│  - Invoca a la capa de Servicios                                                                 │
│  - Retorna HTTP semántico mediante sendSuccess(200), sendCreated(201)                            │
└───────────────────────────────────────────┬──────────────────────────────────────────────────────┘
                                            │
                                            ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                        CAPA DE DOMINIO / NEGOCIO (Services)                                      │
│  - Lógica pura de aplicación (Agnóstica a HTTP y a Express)                                     │
│  - Verificación de propiedad (aislamiento horizontal entre usuarios)                             │
│  - Reglas de negocio (máquinas de estado en ADRs, unicidad de nombres/códigos)                   │
│  - Lanzamiento de excepciones tipadas (NotFoundError, ConflictError, ValidationError)           │
│  - Gestión de sesiones y transacciones atómicas                                                  │
└───────────────────────────────────────────┬──────────────────────────────────────────────────────┘
                                            │
                                            ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                      CAPA DE PERSISTENCIA / DATOS (Repositories)                                 │
│  - Hereda de BaseRepository<T>                                                                   │
│  - Ejecución de consultas SQL 100% parametrizadas ($1, $2, ...)                                  │
│  - Mapeo de filas relacionales a entidades tipadas de TypeScript                                 │
│  - Conexión vía pg.Pool singleton con Pool Tuning                                                │
└───────────────────────────────────────────┬──────────────────────────────────────────────────────┘
                                            │
                                            ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                   MOTOR DE BASE DE DATOS (PostgreSQL / Supabase Cloud)                           │
│  - Tablas normalizadas con PKs gen_random_uuid()                                                 │
│  - Triggers automáticos (fn_set_updated_at)                                                      │
│  - Trigger de auditoría atómica (fn_audit_canvas_entities)                                       │
│  - Procedimiento almacenado de métricas (sp_calculate_project_metrics)                           │
│  - 11 Índices de rendimiento optimizados                                                         │
│  - RLS activado para aislamiento en la nube                                                      │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Diseño y Desglose Exhaustivo de la Implementación

### 4.1. Infraestructura Transversal y Middleware Pipeline

El orden de montaje en [`src/app.ts`](file:///c:/Users/natha/Documents/Repos/DevSculptor/devsculptor-backend/src/app.ts) responde a una rigurosa jerarquía de seguridad y observabilidad:

1. **`helmet()`**: Protege cabeceras HTTP contra vulnerabilidades comunes (X-Content-Type-Options, X-Frame-Options, DNS prefetching control).
2. **`cors()`**: Whitelist dinámica configurada en `env.CORS_ORIGINS`. Permite llamadas de desarrollo local (`localhost:3000`, `localhost:5173`) y rechaza orígenes sospechosos con soporte de credenciales.
3. **`rateLimiter`**: Limitador de tasa configurado en 100 peticiones por ventana de 15 minutos (`RATE_LIMIT_WINDOW_MS=900000`), respondiendo con código `429 Too Many Requests` y cabeceras estándar Draft-7.
4. **`express.json({ limit: '1mb' })`**: Parser de cuerpos JSON con cota máxima de 1 MB para mitigar ataques de denegación de servicio por memoria (*payload flooding*).
5. **`requestId`**: Genera un identificador único mediante `uuid.v4()`, lo adjunta a `req.requestId` y lo expone al cliente en la cabecera `X-Request-Id`.
6. **`requestLogger`**: Integra `pino-http` correlacionando cada log con el `requestId`. Mide tiempos de respuesta en milisegundos y registra códigos de estado, omitiendo rutas de telemetría como `/api/v1/health` para no generar ruido.
7. **`validateRequest`**: Middleware factory que recibe schemas Zod para `{ body, params, query }`. Si la validación falla, captura los errores de Zod y los transforma en una instancia de `ValidationError` con los campos afectados. Si es exitosa, reemplaza los objetos de la petición con la versión parseada y sanitizada.
8. **`authenticate`**: Extrae el header `Authorization: Bearer <token>`. Valida la firma del JWT con `JWT_SECRET`. Si es correcto, inyecta `req.user = { id, email }`. Si el token expira o es inválido, aborta con `UnauthorizedError (401)`.
9. **`notFoundHandler`**: Captura cualquier ruta que no haya hecho match en los routers y lanza `NotFoundError (404)`.
10. **`errorHandler`**: Receptor global de excepciones `(err, req, res, next)`.
    - Errores de tipo `AppError`: Retorna código y mensaje operacional.
    - Errores de PostgreSQL:
      - `23505` (unique_violation) $\rightarrow$ `ConflictError (409)`.
      - `23503` (foreign_key_violation) $\rightarrow$ `ValidationError (400)` descriptivo.
      - `23502` (not_null_violation) $\rightarrow$ `ValidationError (400)`.
      - `22P02` (invalid_text_representation / UUID malformado) $\rightarrow$ `ValidationError (400)`.
    - Errores imprevistos: Loguea el stack trace completo con nivel `fatal/error` en Pino y devuelve al cliente un mensaje genérico `500 Internal Server Error`, **garantizando que jamás se filtren detalles de infraestructura o consultas SQL al cliente en producción**.

---

### 4.2. Capa Base de Persistencia: `BaseRepository<T>`

Ubicada en [`src/shared/base/BaseRepository.ts`](file:///c:/Users/natha/Documents/Repos/DevSculptor/devsculptor-backend/src/shared/base/BaseRepository.ts), esta clase es el núcleo de reusabilidad de datos:

```typescript
export abstract class BaseRepository<T extends { id: string }> implements IRepository<T> {
  // Constructor recibe nombre de tabla y lista blanca de columnas insertables
  constructor(protected readonly tableName: string, protected readonly insertableColumns: string[]);
  
  create(data: Partial<T>, client?: PoolClient): Promise<T>;
  findById(id: string, client?: PoolClient): Promise<T | null>;
  findAll(params?: PaginationParams, client?: PoolClient): Promise<PaginatedResult<T>>;
  findAllByField(field: string, value: unknown, params?: PaginationParams, client?: PoolClient): Promise<PaginatedResult<T>>;
  update(id: string, data: Partial<T>, client?: PoolClient): Promise<T | null>;
  delete(id: string, client?: PoolClient): Promise<T | null>;
  withTransaction<R>(callback: (client: PoolClient) => Promise<R>): Promise<R>;
  setSessionUserId(client: PoolClient, userId: string): Promise<void>;
}
```

* **Prevención de Inyección SQL:** Los nombres de columna en `create` y `update` se filtran contra la lista blanca `insertableColumns` y los valores se pasan exclusivamente a través de parámetros posicionales (`$1, $2, $3`). En `findAllByField`, el identificador de columna se valida con la expresión regular `/^[a-zA-Z0-9_]+$/`.
* **Transaccionalidad Atómica:** `withTransaction` adquiere un cliente exclusivo del pool, ejecuta `BEGIN`, pasa el cliente al callback y ejecuta `COMMIT` o `ROLLBACK` en caso de fallo, liberando el cliente en el bloque `finally`.
* **Inyección de Usuario de Sesión:** `setSessionUserId` ejecuta `SELECT set_config('app.current_user_id', $1, true);`. Al ser un parámetro transaccional (`is_local = true`), su ciclo de vida concluye con la transacción, evitando fugas de contexto en el pool de conexiones.

---

### 4.3. Dominio Auth (Autenticación y Registro)
* **Directorio:** [`src/modules/auth/`](file:///c:/Users/natha/Documents/Repos/DevSculptor/devsculptor-backend/src/modules/auth)
* **DTOs ([`auth.dto.ts`](file:///c:/Users/natha/Documents/Repos/DevSculptor/devsculptor-backend/src/modules/auth/auth.dto.ts)):**
  - `RegisterDto`: `email` (validación de formato RFC), `password` (mínimo 8 caracteres), `full_name` (mínimo 2 caracteres).
  - `LoginDto`: `email`, `password`.
* **Lógica de Negocio ([`auth.service.ts`](file:///c:/Users/natha/Documents/Repos/DevSculptor/devsculptor-backend/src/modules/auth/auth.service.ts)):**
  - En registro: Valida que el email no exista en `users`. Hashea la contraseña con bcrypt utilizando factor de coste 12. Genera y retorna el token JWT firmado con expiración de 24 horas.
  - En login: Busca el usuario por email en minúsculas. Compara el hash con `bcrypt.compare`. Si el usuario no existe o la contraseña no coincide, **emite exactamente el mismo error genérico** (`UnauthorizedError("Credenciales inválidas")`), impidiendo ataques de enumeración de cuentas.
* **Endpoints Públicos ([`auth.routes.ts`](file:///c:/Users/natha/Documents/Repos/DevSculptor/devsculptor-backend/src/modules/auth/auth.routes.ts)):**
  - `POST /api/v1/auth/register` $\rightarrow$ Retorna `201 Created` con token y perfil.
  - `POST /api/v1/auth/login` $\rightarrow$ Retorna `200 OK` con token y perfil.

---

### 4.4. Dominio Projects (Gestión y Propiedad de Proyectos)
* **Directorio:** [`src/modules/projects/`](file:///c:/Users/natha/Documents/Repos/DevSculptor/devsculptor-backend/src/modules/projects)
* **DTOs ([`projects.dto.ts`](file:///c:/Users/natha/Documents/Repos/DevSculptor/devsculptor-backend/src/modules/projects/projects.dto.ts)):**
  - `CreateProjectDto`: `name` (1 a 255 caracteres), `description` (opcional), `architecture_style` (opcional).
  - `UpdateProjectDto`: Campos opcionales con refinamiento `.refine(keys.length > 0)` para prohibir payloads vacíos.
  - `projectIdParamSchema`: Valida que el parámetro de ruta sea un UUID válido.
* **Aislamiento Horizontal ([`projects.service.ts`](file:///c:/Users/natha/Documents/Repos/DevSculptor/devsculptor-backend/src/modules/projects/projects.service.ts)):**
  - Todas las operaciones requieren el `user_id` inyectado por el token JWT (`req.user.id`).
  - Un usuario no puede consultar, modificar ni eliminar proyectos de otro usuario. Si se solicita un proyecto perteneciente a otro usuario, el servicio devuelve `NotFoundError (404)` en lugar de `403 Forbidden`, evitando que actores maliciosos puedan deducir la existencia de IDs ajenos mediante fuerza bruta.
  - Valida la unicidad del nombre del proyecto por usuario antes de persistir.
* **Endpoints Protegidos ([`projects.routes.ts`](file:///c:/Users/natha/Documents/Repos/DevSculptor/devsculptor-backend/src/modules/projects/projects.routes.ts)):**
  - `POST /api/v1/projects` (Crear proyecto)
  - `GET /api/v1/projects` (Listado paginado del usuario)
  - `GET /api/v1/projects/:projectId` (Detalle de proyecto)
  - `PUT /api/v1/projects/:projectId` (Actualización)
  - `DELETE /api/v1/projects/:projectId` (Eliminación en cascada)

---

### 4.5. Dominio Requirements (Requisitos RF y RNF)
* **Directorio:** [`src/modules/requirements/`](file:///c:/Users/natha/Documents/Repos/DevSculptor/devsculptor-backend/src/modules/requirements)
* **Validación Rigurosa de Código ([`requirements.dto.ts`](file:///c:/Users/natha/Documents/Repos/DevSculptor/devsculptor-backend/src/modules/requirements/requirements.dto.ts)):**
  - Expresión regular: `/^(RF|RNF)-\d{2,3}$/` (ej. `RF-01`, `RNF-100`).
  - `type`: Enum `'RF' | 'RNF'`.
  - `priority`: Enum `'HIGH' | 'MEDIUM' | 'LOW'`.
* **Lógica de Integridad ([`requirements.service.ts`](file:///c:/Users/natha/Documents/Repos/DevSculptor/devsculptor-backend/src/modules/requirements/requirements.service.ts)):**
  - Verifica que el proyecto pertenezca al usuario solicitante.
  - Valida que el código sea único dentro del ámbito del proyecto (`UNIQUE(project_id, code)`).
* **Rutas Anidadas ([`requirements.routes.ts`](file:///c:/Users/natha/Documents/Repos/DevSculptor/devsculptor-backend/src/modules/requirements/requirements.routes.ts)):**
  - Utiliza `Router({ mergeParams: true })` para heredar `:projectId`.
  - Montadas bajo: `/api/v1/projects/:projectId/requirements`.

---

### 4.6. Dominio Canvas & Audit (Entidades ERD y Auditoría Atómica)
* **Directorio:** [`src/modules/canvas/`](file:///c:/Users/natha/Documents/Repos/DevSculptor/devsculptor-backend/src/modules/canvas)
* **Estructura de Datos ([`canvas.dto.ts`](file:///c:/Users/natha/Documents/Repos/DevSculptor/devsculptor-backend/src/modules/canvas/canvas.dto.ts)):**
  - `table_name`: Validado con regex `/^[a-zA-Z_][a-zA-Z0-9_]*$/` (identificador SQL seguro).
  - `columns_json`: Array de objetos con estructura `{ name, type, is_pk, nullable, default_value }`.
  - `position_x`, `position_y`: Coordenadas enteras para el renderizado del lienzo visual.
* **Integración Crítica con Trigger ([`canvas.service.ts`](file:///c:/Users/natha/Documents/Repos/DevSculptor/devsculptor-backend/src/modules/canvas/canvas.service.ts)):**
  - Cada operación de escritura (`create`, `update`, `delete`) se envuelve en una transacción:
    ```typescript
    await this.canvasRepository.withTransaction(async (client) => {
      // 1. Configura la variable de sesión para que el trigger capture quién hizo el cambio
      await this.canvasRepository.setSessionUserId(client, userId);
      // 2. Realiza la mutación en la tabla canvas_entities
      return this.canvasRepository.create(payload, client);
    });
    ```
* **Endpoints ([`canvas.routes.ts`](file:///c:/Users/natha/Documents/Repos/DevSculptor/devsculptor-backend/src/modules/canvas/canvas.routes.ts)):**
  - `POST /api/v1/projects/:projectId/canvas`
  - `GET /api/v1/projects/:projectId/canvas`
  - `GET /api/v1/projects/:projectId/canvas/:canvasId`
  - `PUT /api/v1/projects/:projectId/canvas/:canvasId`
  - `DELETE /api/v1/projects/:projectId/canvas/:canvasId`
  - `GET /api/v1/projects/:projectId/audit-logs` (Consulta el historial generado por el trigger de auditoría)

---

### 4.7. Dominio Decisions (ADRs con Máquina de Estados)
* **Directorio:** [`src/modules/decisions/`](file:///c:/Users/natha/Documents/Repos/DevSculptor/devsculptor-backend/src/modules/decisions)
* **Máquina de Estados de Arquitectura ([`decisions.service.ts`](file:///c:/Users/natha/Documents/Repos/DevSculptor/devsculptor-backend/src/modules/decisions/decisions.service.ts)):**
  - Los ADRs nacen por defecto en estado `PROPOSED`.
  - Solo se permiten transiciones desde `PROPOSED` hacia `ACCEPTED` o `REJECTED`.
  - Una decisión en estado final (`ACCEPTED` o `REJECTED`) es **inmutable** en su estado. Intentar reabrir o cambiar una decisión aprobada a rechazada arroja un `ValidationError (400)` para preservar la trazabilidad histórica de gobernanza.
* **Endpoints ([`decisions.routes.ts`](file:///c:/Users/natha/Documents/Repos/DevSculptor/devsculptor-backend/src/modules/decisions/decisions.routes.ts)):**
  - `POST /api/v1/projects/:projectId/decisions`
  - `GET /api/v1/projects/:projectId/decisions` (Filtrable por `?status=`)
  - `PATCH /api/v1/projects/:projectId/decisions/:decisionId/status` (Transición de estado)
  - `PUT /api/v1/projects/:projectId/decisions/:decisionId` (Actualización de texto)
  - `DELETE /api/v1/projects/:projectId/decisions/:decisionId`

---

### 4.8. Dominio Metrics (Consumo de Stored Procedure y Caché)
* **Directorio:** [`src/modules/metrics/`](file:///c:/Users/natha/Documents/Repos/DevSculptor/devsculptor-backend/src/modules/metrics)
* **Ejecución de Stored Procedure ([`metrics.repository.ts`](file:///c:/Users/natha/Documents/Repos/DevSculptor/devsculptor-backend/src/modules/metrics/metrics.repository.ts)):**
  - Invoca `SELECT * FROM sp_calculate_project_metrics($1);`.
  - Mapea los resultados a la interfaz fuertemente tipada `ProjectMetrics`:
    - `total_rf`: Conteo de requisitos funcionales.
    - `total_rnf`: Conteo de requisitos no funcionales.
    - `total_entities`: Conteo de tablas del canvas.
    - `total_adrs_accepted`: Conteo de decisiones aprobadas.
    - `total_adrs_total`: Conteo total de ADRs.
    - `maturity_index`: Índice compuesto de 0 a 100.
* **Caché en Memoria con TTL ([`metrics.service.ts`](file:///c:/Users/natha/Documents/Repos/DevSculptor/devsculptor-backend/src/modules/metrics/metrics.service.ts)):**
  - Para evitar sobrecargar la base de datos con cómputos recurrentes, se implementó un `Map<string, CachedMetrics>` estático en memoria con un TTL (*Time-To-Live*) de **30 segundos**. Peticiones repetidas dentro de dicha ventana se responden de forma instantánea ($< 2 \text{ ms}$).
* **Endpoint ([`metrics.routes.ts`](file:///c:/Users/natha/Documents/Repos/DevSculptor/devsculptor-backend/src/modules/metrics/metrics.routes.ts)):**
  - `GET /api/v1/projects/:projectId/metrics`

---

## 5. Capa de Datos y Lógica en Motor (PostgreSQL / Supabase)

Toda la estructura de la base de datos se versiona formalmente mediante scripts SQL deterministas en [`src/database/`](file:///c:/Users/natha/Documents/Repos/DevSculptor/devsculptor-backend/src/database):

### Tablas del Sistema y Restricciones Compuestas
1. **`users`**: Identidad de desarrolladores/arquitectos. Contiene `email (UNIQUE)`, `password_hash`, `full_name`.
2. **`projects`**: Entidad raíz del espacio de trabajo. Restricción compuesta: `CONSTRAINT uq_projects_user_name UNIQUE(user_id, name)`.
3. **`requirements`**: Especificaciones funcionales y no funcionales. Restricción compuesta: `CONSTRAINT uq_requirements_project_code UNIQUE(project_id, code)`.
4. **`canvas_entities`**: Nodos del diagrama entidad-relación. Restricción compuesta: `CONSTRAINT uq_canvas_entities_project_table UNIQUE(project_id, table_name)`.
5. **`architecture_decisions`**: Registro de ADRs con check de estados `('PROPOSED', 'ACCEPTED', 'REJECTED')`.
6. **`audit_logs`**: Trazabilidad atómica. FK a usuarios configurada con `ON DELETE SET NULL` para no perder la bitácora si un usuario es dado de baja.

### Lógica Procedural (Triggers y SPs)
* **Trigger de Auditoría ([`trg_audit_canvas.sql`](file:///c:/Users/natha/Documents/Repos/DevSculptor/devsculptor-backend/src/database/triggers/trg_audit_canvas.sql)):**
  ```sql
  CREATE OR REPLACE FUNCTION fn_audit_canvas_entities()
  RETURNS TRIGGER AS $$
  DECLARE
    v_user_id UUID;
  BEGIN
    -- Captura segura del usuario inyectado por el backend
    BEGIN
      v_user_id := NULLIF(current_setting('app.current_user_id', true), '')::UUID;
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
  ```

* **Stored Procedure de Métricas ([`sp_project_metrics.sql`](file:///c:/Users/natha/Documents/Repos/DevSculptor/devsculptor-backend/src/database/procedures/sp_project_metrics.sql)):**
  Evalúa el índice de madurez documental (`maturity_index`) asignando 25 puntos por cada pilar cubierto:
  1. ¿Posee al menos 1 Requisito Funcional? ($+25$)
  2. ¿Posee al menos 1 Requisito No Funcional? ($+25$)
  3. ¿Posee al menos 1 Entidad de Datos en el Canvas? ($+25$)
  4. ¿Posee al menos 1 Decisión de Arquitectura Aprobada? ($+25$)

### Migración de Blindaje y Optimización en Supabase
Tras desplegar en la nube, se aplicó la migración [`003_security_and_performance_fixes.sql`](file:///c:/Users/natha/Documents/Repos/DevSculptor/devsculptor-backend/src/database/migrations/003_security_and_performance_fixes.sql):
- Activación de `ENABLE ROW LEVEL SECURITY` en las 6 tablas para bloquear el endpoint PostgREST público de internet.
- Establecimiento de `SET search_path = public, pg_temp` en todas las funciones PL/pgSQL para neutralizar vulnerabilidades de secuestro de esquemas.
- Eliminación del índice redundante en `users(email)`.
- Creación del índice de cobertura para la clave foránea `audit_logs(user_id)`.

---

## 6. Topología de Conexiones y Estrategias de Despliegue

El sistema fue diseñado para alternar de forma transparente entre un entorno **local** y un entorno **cloud gestionado en Supabase**, controlado exclusivamente por variables de entorno:

```
                                      CONEXIÓN DUAL DEL BACKEND
                                      
                              ┌────────────────────────────────────────┐
                              │     devsculptor-backend (Node.js)      │
                              │       pg.Pool Singleton Tuning         │
                              └───────────────────┬────────────────────┘
                                                  │
                                   ¿Dónde apunta DB_HOST en .env?
                                                  │
                         ┌────────────────────────┴────────────────────────┐
                         ▼                                                 ▼
             [ ENTORNO LOCAL / DOCKER ]                             [ ENTORNO CLOUD SUPABASE ]
             DB_HOST=localhost                                      DB_HOST=db.gtcuhxhwwqzfhleoozlz.supabase.co
             DB_PORT=5432                                           DB_PORT=5432
             DB_SSL=false                                           DB_SSL=true (rejectUnauthorized: false)
             DB_NAME=devsculptor_db                                 DB_NAME=postgres
             Sin RLS requerido                                      RLS Activado (Bypass por rol postgres)
```

### Parámetros de Pool Tuning
- `max: 20`: Hasta 20 clientes concurrentes por instancia de backend.
- `idleTimeoutMillis: 30000`: Libera conexiones inactivas tras 30 segundos de desuso.
- `connectionTimeoutMillis: 5000`: Falla controlada si la base de datos no responde en 5 segundos.
- `ssl: env.DB_SSL ? { rejectUnauthorized: false } : undefined`: Soporta el cifrado TLS obligatorio de Supabase.

---

## 7. Aseguramiento de Calidad (QA) y Pruebas Automatizadas

Se diseñó la colección de pruebas [`DevSculptor_Sprint1.postman_collection.json`](file:///c:/Users/natha/Documents/Repos/DevSculptor/devsculptor-backend/postman/DevSculptor_Sprint1.postman_collection.json) y el entorno [`DevSculptor_Local.postman_environment.json`](file:///c:/Users/natha/Documents/Repos/DevSculptor/devsculptor-backend/postman/DevSculptor_Local.postman_environment.json).

### Baterías de Prueba Incluidas en la Colección

```
📁 DevSculptor Backend - Sprint 1 Integration Tests
├── 📁 01 - Health Check
│   └── 🟢 GET /health (Status 200, status: ok)
├── 📁 02 - Auth
│   ├── 🟢 POST /auth/register (Status 201, captura token dinámico)
│   ├── 🔴 POST /auth/register con email duplicado (Status 409 Conflict)
│   ├── 🟢 POST /auth/login con credenciales válidas (Status 200, actualiza token)
│   └── 🔴 POST /auth/login con credenciales inválidas (Status 401 Unauthorized)
├── 📁 03 - Security & Access Control
│   ├── 🔴 GET /projects sin token (Status 401)
│   └── 🔴 GET /projects con token malformado (Status 401)
├── 📁 04 - Projects CRUD
│   ├── 🟢 POST /projects (Status 201, captura projectId)
│   ├── 🔴 POST /projects nombre duplicado para el mismo usuario (Status 409)
│   ├── 🟢 GET /projects (Status 200, valida estructura meta de paginación)
│   ├── 🟢 GET /projects/:projectId (Status 200)
│   └── 🟢 PUT /projects/:projectId (Status 200)
├── 📁 05 - Requirements CRUD
│   ├── 🟢 POST /requirements RF-01 (Status 201, valida regex)
│   ├── 🟢 POST /requirements RNF-01 (Status 201)
│   ├── 🔴 POST /requirements código duplicado (Status 409)
│   └── 🟢 GET /requirements (Status 200, valida al menos 2 requisitos)
├── 📁 06 - Canvas & Audit Logs
│   ├── 🟢 POST /canvas (Status 201, inserta tabla orders)
│   ├── 🟢 PUT /canvas/:canvasId (Status 200, actualiza posición visual)
│   └── 🟢 GET /audit-logs (Status 200, valida que el trigger haya generado eventos INSERT y UPDATE)
├── 📁 07 - Architecture Decisions (ADRs)
│   ├── 🟢 POST /decisions (Status 201, valida estado inicial PROPOSED)
│   ├── 🟢 PATCH /decisions/:decisionId/status -> ACCEPTED (Status 200)
│   └── 🔴 PATCH /decisions/:decisionId/status -> REJECTED (Status 400 por máquina de estados)
└── 📁 08 - Project Metrics (Stored Procedure)
    └── 🟢 GET /metrics (Status 200, valida retorno del SP y maturity_index = 100)
```

Cada request cuenta con scripts en Javascript (`pm.test()`) que validan automáticamente códigos de estado, estructura de envelopes y actualizan variables de colección (`authToken`, `projectId`, `canvasId`, `decisionId`) de forma encadenada.

---

## 8. Guía de Escalabilidad y Playbook para la Adición de Nuevas Features

Para preservar la integridad arquitectónica, la modularidad y el desacoplamiento en los futuros Sprints (Semana 5 a Semana 8), **todo nuevo requerimiento o módulo funcional debe implementar estrictamente el siguiente procedimiento paso a paso**:

```
                              PROTOCOLO DE ADICIÓN DE CARACTERÍSTICAS
                              
    [1. Capa DDL]        ──► Crea archivo SQL numerado en src/database/migrations/
                             Define restricciones UNIQUE, FK con ON DELETE explícito e índices.
                                  │
    [2. Capa Contratos]  ──► Crea {feature}.dto.ts en src/modules/{feature}/
                             Define schemas Zod para body, params y query con z.infer.
                                  │
    [3. Capa Datos]      ──► Crea {feature}.repository.ts extendiendo BaseRepository<T>
                             Configura tableName e insertableColumns. Agrega queries especializadas.
                                  │
    [4. Capa Lógica]     ──► Crea {feature}.service.ts
                             Inyecta el repositorio. Aplica validaciones de negocio y lanza AppErrors.
                                  │
    [5. Capa Transporte] ──► Crea {feature}.controller.ts
                             Extrae parámetros tipados y responde exclusivamente con sendSuccess/sendCreated.
                                  │
    [6. Capa Enrutado]   ──► Crea {feature}.routes.ts
                             Aplica authenticate y validateRequest({ body, params, query }).
                                  │
    [7. Ensamblaje]      ──► Monta la ruta en src/app.ts bajo /api/v1/{recurso}
                             Ejecuta npm run build (verificando cero errores de compilación).
                                  │
    [8. QA]              ──► Añade la carpeta correspondiente en la colección Postman con tests.
```

### Reglas Inmutables para Desarrolladores (Definition of Done)
1. **Prohibido el uso de `any`:** Todo dato no tipado debe tratarse como `unknown` con type narrowing o validarse mediante Zod.
2. **Prohibido el SQL no parametrizado:** Jamás concatenar variables en cadenas SQL (`query = '... ' + val`). Siempre usar `$1, $2` pasados en el array de valores.
3. **Prohibido responder con `res.json()` directo:** Todas las salidas deben utilizar los formateadores de [`apiResponse.ts`](file:///c:/Users/natha/Documents/Repos/DevSculptor/devsculptor-backend/src/shared/responses/apiResponse.ts).
4. **Prohibido lanzar `Error` genérico:** Siempre usar las clases de [`src/shared/exceptions/`](file:///c:/Users/natha/Documents/Repos/DevSculptor/devsculptor-backend/src/shared/exceptions/).
5. **Aislamiento Horizontal Obligatorio:** Si una entidad pertenece a un proyecto o usuario, la consulta de modificación o eliminación **debe** verificar la propiedad antes de operar.
6. **Migraciones Idempotentes:** Todo script SQL debe incluir cláusulas `IF NOT EXISTS` / `CREATE OR REPLACE` para poder ejecutarse múltiples veces sin errores.

### Potencial de Escalabilidad hacia Microservicios
Si en una fase posterior al portafolio (ej. producción a gran escala) un módulo experimenta una demanda desproporcionada (por ejemplo, el motor de compilación de documentación asistido por IA o el canvas en tiempo real):
- Debido a que cada módulo en `src/modules/` es **autónomo** (posee sus propios DTOs, controladores, servicios y repositorios y no accede a los controladores de otros módulos), el módulo puede ser trasladado a un nuevo repositorio o contenedor independiente con mínima fricción.
- Bastará con reemplazar la llamada directa al servicio local por una llamada HTTP o un mensaje en cola (RabbitMQ / Redis PubSub) sin alterar la capa de persistencia ni los contratos de datos existentes.

---

## 9. Conclusiones del Sprint 1

El desarrollo del Sprint 1 para el backend de **DevSculptor** concluye de manera sobresaliente:
- **100% de la funcionalidad core implementada:** CRUD completo de proyectos, requisitos, canvas con coordenadas, decisiones arquitectónicas y cálculo analítico de métricas.
- **Autenticación adelantada y operativa:** Registro e inicio de sesión seguro con JWT y bcrypt que sientan las bases de seguridad requeridas para todo el ciclo de vida del producto.
- **Cumplimiento exhaustivo de la rúbrica institucional:** Persistencia relacional normalizada, triggers PL/pgSQL reactivos con captura de sesión y stored procedures de analítica.
- **Base de datos en la nube blindada:** Despliegue en Supabase validado con 0 errores de seguridad y 0 advertencias de rendimiento.
- **Preparado para la UI:** El backend se encuentra en estado óptimo, documentado y listo para recibir la interfaz web de React en el Sprint 2 (Semana 5).
