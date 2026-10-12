# DevSculptor Backend — Convenciones de Arquitectura, Buenas Prácticas de Ingeniería y Guías de Implementación

Este documento constituye el **estándar formal y vinculante** de arquitectura, diseño de servicios, persistencia, seguridad transversal y patrones de codificación para el backend de **DevSculptor**.

Derivado de las lecciones aprendidas durante la construcción del Backend Core (Sprint 1) y el manual metodológico [`devsculptor-architect`](file:///c:/Users/natha/Documents/Repos/DevSculptor/.agents/skills/devsculptor-architect/SKILL.md), establece las directrices que deben gobernar cualquier desarrollo, refactorización o ampliación en el servidor (**Node.js 20+, Express, TypeScript Estricto y PostgreSQL nativo con `pg.Pool`**).

---

## 📑 Tabla de Contenidos

1. [Filosofía Arquitectónica: Monolito Modular Layered MVC](#1-filosofía-arquitectónica-monolito-modular-layered-mvc)
2. [Stack Tecnológico Oficial del Backend](#2-stack-tecnológico-oficial-del-backend)
3. [Estructura Canónica de Directorios y Módulos](#3-estructura-canónica-de-directorios-y-módulos)
4. [Los 8 Pilares de Calidad y Estándar de Código](#4-los-8-pilares-de-calidad-y-estándar-de-código)
5. [Capa de Persistencia y Reglas PostgreSQL](#5-capa-de-persistencia-y-reglas-postgresql)
   - 5.1. [Patrón BaseRepository y Prevención del Gotcha 22P02](#51-patrón-baserepository-y-prevención-del-gotcha-22p02)
   - 5.2. [Consultas Parametrizadas y Listas Blancas](#52-consultas-parametrizadas-y-listas-blancas)
   - 5.3. [Transacciones Deterministas](#53-transacciones-deterministas)
6. [Validación en Tiempo de Ejecución con Zod (SSOT)](#6-validación-en-tiempo-de-ejecución-con-zod-ssot)
7. [Jerarquía de Excepciones y Manejo Centralizado de Errores](#7-jerarquía-de-excepciones-y-manejo-centralizado-de-errores)
8. [Envelope Estándar de Respuesta HTTP (`ApiResponse<T>`)](#8-envelope-estándar-de-respuesta-http-apiresponset)
9. [Seguridad, Autenticación y Multitenancy Horizontal](#9-seguridad-autenticación-y-multitenancy-horizontal)
10. [Observabilidad, Logging con Pino y Correlación `X-Request-Id`](#10-observabilidad-logging-con-pino-y-correlación-x-request-id)
11. [Protocolo Estricto para Creación de Nuevos Módulos (`Feats`)](#11-protocolo-estricto-para-creación-de-nuevos-módulos-feats)
12. [Matriz de Buenas Prácticas (Do's & Don'ts)](#12-matriz-de-buenas-prácticas-dos--donts)

---

## 1. Filosofía Arquitectónica: Monolito Modular Layered MVC

DevSculptor adopta un patrón **Monolito Modular con Separación en Capas (Layered MVC)**.

### ¿Por qué Monolito Modular?
En un proyecto con alta demanda de integridad relacional (requerimientos vinculados a proyectos, ADRs vinculados a proyectos, entidades DDL vinculadas a proyectos, triggers de auditoría y procedimientos de madurez), la fragmentación en microservicios introduciría transacciones distribuidas complejas (2PC o Sagas) y sobrecarga de red innecesaria. 

El Monolito Modular garantiza:
- **Alta cohesión y bajo acoplamiento**: Cada dominio de negocio vive en su propia carpeta modular aislada (`src/modules/{modulo}/`).
- **Transaccionalidad ACID nativa**: Posibilidad de agrupar mutaciones en un único bloque transaccional PostgreSQL (`BEGIN / COMMIT / ROLLBACK`).
- **Velocidad de despliegue**: Un único artefacto compilado desplegable en contenedores o servicios serverless de Node.js.

### Diagrama de Flujo por Capas
```
Petición HTTP Entrante
       │
       ▼
┌────────────────────────────────────────────────────────┐
│ Middlewares Globales                                   │
│  - requestId (UUID v4)                                 │
│  - pino-http (Logger estructurado)                    │
│  - helmet + cors (Seguridad cabeceras)                 │
└──────────────────────┬─────────────────────────────────┘
                       │
                       ▼
┌────────────────────────────────────────────────────────┐
│ Rutas del Módulo (`*.routes.ts`)                       │
│  - authMiddleware (Validación Bearer JWT)              │
│  - validateRequest(zodSchema)                          │
└──────────────────────┬─────────────────────────────────┘
                       │
                       ▼
┌────────────────────────────────────────────────────────┐
│ Controlador (`*.controller.ts`)                        │
│  - Desempaqueta req.body / req.params                  │
│  - Extrae req.user.id (Tenant Context)                 │
│  - Invoca al Servicio                                  │
│  - Responde usando sendSuccess() / sendCreated()       │
└──────────────────────┬─────────────────────────────────┘
                       │
                       ▼
┌────────────────────────────────────────────────────────┐
│ Servicio (`*.service.ts`)                              │
│  - Lógica de negocio y reglas de dominio               │
│  - Verificación de pertenencia y tenencia horizontal   │
│  - Lanza excepciones tipadas (NotFoundError, etc.)     │
└──────────────────────┬─────────────────────────────────┘
                       │
                       ▼
┌────────────────────────────────────────────────────────┐
│ Repositorio (`*.repository.ts` extends BaseRepository) │
│  - Construcción de SQL parametrizado ($1, $2)          │
│  - Serialización preventiva de JSONB                   │
│  - Invocación directa a pool.query()                   │
└──────────────────────┬─────────────────────────────────┘
                       │
                       ▼
┌────────────────────────────────────────────────────────┐
│ Base de Datos (PostgreSQL en Supabase)                 │
│  - Tablas con claves foráneas CASCADE / RESTRICT       │
│  - Triggers de auditoría (tg_audit_projects)           │
│  - Stored Procedures (sp_calculate_project_maturity)  │
│  - RLS (Row Level Security) activo                     │
└────────────────────────────────────────────────────────┘
```

---

## 2. Stack Tecnológico Oficial del Backend

| Componente | Tecnología Seleccionada | Versión | Rol Arquitectónico |
| :--- | :--- | :--- | :--- |
| **Entorno de Ejecución** | Node.js (LTS) | 20.x+ | Runtime del servidor |
| **Framework Web** | Express | 4.19+ | Enrutamiento HTTP ligero |
| **Lenguaje** | TypeScript (`strict: true`) | 5.4+ | Tipado estático de grado estricto, cero `any` |
| **Cliente Base de Datos** | `pg` (`node-postgres`) | 8.11+ | Pool de conexiones nativo (`pg.Pool`) sin ORM pesado |
| **Validación de Esquemas** | Zod | 3.23+ | Única Fuente de Verdad (SSOT) para DTOs y runtime parsing |
| **Autenticación & Hashing** | `jsonwebtoken` + `bcryptjs` | 9.x / 2.4+ | Tokens JWT sin estado y hash con sal de contraseñas |
| **Seguridad HTTP** | Helmet + CORS | 7.x / 2.8+ | Protección contra XSS, sniffing y políticas de origen |
| **Logging & Trazabilidad** | Pino + `pino-http` | 9.x / 10.x+ | Logs JSON de alto rendimiento con correlación UUID v4 |
| **Resolución de Módulos** | `tsc-alias` | 1.8+ | Resuelve paths relativos `@modules/*`, `@shared/*` al compilar |

---

## 3. Estructura Canónica de Directorios y Módulos

El código del backend se organiza bajo la siguiente jerarquía estricta:

```
devsculptor-backend/
├── src/
│   ├── config/                     # Configuración estática y variables de entorno
│   │   ├── database.ts             # Instancia singleton de pg.Pool
│   │   └── env.ts                  # Schema Zod para validación de process.env al arranque
│   │
│   ├── middlewares/                # Interceptores transversales de Express
│   │   ├── auth.middleware.ts      # Verificación Bearer JWT y asignación de req.user
│   │   ├── error.middleware.ts     # Manejador centralizado de errores y sanitización DB
│   │   ├── logging.middleware.ts   # Middleware pino-http
│   │   ├── requestId.middleware.ts # Inyección de UUID v4 en req.requestId y X-Request-Id
│   │   └── validate.middleware.ts  # Validador genérico de DTOs Zod
│   │
│   ├── modules/                    # Módulos de dominio verticalmente encapsulados
│   │   ├── auth/                   # Autenticación y registro de usuarios
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.dto.ts
│   │   │   ├── auth.repository.ts
│   │   │   ├── auth.routes.ts
│   │   │   └── auth.service.ts
│   │   ├── projects/               # Gestión de proyectos de arquitectura
│   │   ├── requirements/           # Matriz IEEE-830 (RF / RNF)
│   │   ├── decisions/              # Registro de ADRs y máquina de estados
│   │   ├── canvas/                 # Nodos de entidades, columnas y diagramas ERD
│   │   └── ai/                     # [Sprint 3 Épica B] Motor de Consultoría Gemini
│   │
│   ├── shared/                     # Abstracciones y utilitarios comunes
│   │   ├── base/
│   │   │   └── BaseRepository.ts   # Repositorio genérico CRUD con protección 22P02
│   │   ├── exceptions/             # Jerarquía de excepciones tipadas (AppError)
│   │   │   ├── AppError.ts
│   │   │   ├── ConflictError.ts
│   │   │   ├── NotFoundError.ts
│   │   │   ├── UnauthorizedError.ts
│   │   │   └── ValidationError.ts
│   │   ├── logger/
│   │   │   └── logger.ts           # Logger Pino singleton
│   │   ├── responses/
│   │   │   └── apiResponse.ts      # Helpers sendSuccess, sendCreated, sendError
│   │   └── types/                  # Tipos globales y extensiones de Express
│   │       └── express.d.ts        # Declaración de req.user y req.requestId
│   │
│   ├── app.ts                      # Configuración de Express, middlewares y montaje de rutas
│   └── server.ts                   # Punto de entrada, arranque de puerto y graceful shutdown
├── database/                       # Migraciones SQL deterministas y procedimientos
│   ├── 01_schema.sql               # DDL de tablas y tipos enum
│   ├── 02_triggers.sql             # Triggers PL/pgSQL y funciones de auditoría
│   └── 03_stored_procedures.sql    # SPs (ej. cálculo de índice de madurez)
├── tsconfig.json                   # Configuración TypeScript strict con path aliases
└── package.json
```

---

## 4. Los 8 Pilares de Calidad y Estándar de Código

1. **TypeScript Estricto**: `strict: true` en `tsconfig.json`. Prohibido el uso de `any`. Toda entrada desconocida se tipa como `unknown` y se parsea con Zod.
2. **SQL Parametrizado Absoluto**: Prohibida la concatenación de cadenas en queries. Todos los valores dinámicos pasan como `$1, $2, $3` en arrays de valores.
3. **Zod como SSOT**: Los tipos de datos de la capa de aplicación se derivan de los esquemas Zod (`z.infer<typeof schema>`).
4. **Excepciones Tipadas**: No se lanza `new Error()`. Se lanzan subclases de `AppError` con códigos de estado HTTP explícitos.
5. **Envelope Uniforme**: Todas las respuestas pasan por `sendSuccess`, `sendCreated` o `sendError`.
6. **Observabilidad por `requestId`**: Cada request es rastreado por un UUID único propagado en logs y en la cabecera `X-Request-Id`.
7. **Aislamiento Horizontal**: Cada operación de lectura/escritura filtra obligatoriamente por el `user_id` del usuario autenticado.
8. **Blindaje RLS**: Tablas protegidas con políticas Row Level Security en PostgreSQL.

---

## 5. Capa de Persistencia y Reglas PostgreSQL

### 5.1. Patrón BaseRepository y Prevención del Gotcha 22P02

Uno de los hallazgos críticos de ingeniería en DevSculptor fue el comportamiento del driver `node-postgres` (`pg`) al interactuar con columnas de tipo `JSONB`.

> [!WARNING]
> **Gotcha PostgreSQL 22P02**:
> Cuando se pasa un array JavaScript (ej. `[{ name: 'id', type: 'UUID' }]`) en el arreglo de parámetros posicionales `$N`, el driver `pg` lo formatea como un **array nativo de PostgreSQL** (`{"{...}"}`) en lugar de un literal JSON. Esto produce un error de base de datos `error: invalid input syntax for type json (code: 22P02)`.

**Solución Canónica Implementada en `BaseRepository.ts`:**
Todo repositorio que persista campos JSONB debe heredar de `BaseRepository` o implementar la serialización preventiva con `JSON.stringify()`:

```typescript
// En BaseRepository.ts
protected serializeJsonFields(data: Record<string, unknown>): Record<string, unknown> {
  const result = { ...data };
  for (const [key, value] of Object.entries(result)) {
    // Detecta claves de esquema JSON o valores que sean objetos/arrays no nulos
    if (
      key.endsWith('_json') ||
      key.endsWith('_payload') ||
      key === 'columns_json' ||
      (typeof value === 'object' && value !== null && !(value instanceof Date))
    ) {
      result[key] = JSON.stringify(value);
    }
  }
  return result;
}
```

### 5.2. Consultas Parametrizadas y Listas Blancas
Para consultas dinámicas (por ejemplo, filtros u ordenamientos), los nombres de campo **nunca** se concatenan directamente del request del usuario. Se contrastan contra una lista blanca rígida:

```typescript
const ALLOWED_SORT_COLUMNS = ['created_at', 'name', 'status', 'code'];

if (!ALLOWED_SORT_COLUMNS.includes(sortBy)) {
  throw new ValidationError(`Columna de ordenamiento inválida: ${sortBy}`);
}
```

### 5.3. Transacciones Deterministas
Toda operación que involucre dos o más escrituras dependientes debe ejecutarse dentro de un bloque transaccional:

```typescript
const client = await pool.connect();
try {
  await client.query('BEGIN');
  // Mutaciones atómicas
  await client.query('COMMIT');
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  client.release();
}
```

---

## 6. Validación en Tiempo de Ejecución con Zod (SSOT)

Cada módulo define sus DTOs en `{modulo}.dto.ts`. Ejemplo canónico:

```typescript
import { z } from 'zod';

export const createProjectSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres').max(100),
  description: z.string().max(500).optional(),
  architecture_style: z.enum(['MONOLITH', 'HEXAGONAL', 'CLEAN_ARCHITECTURE', 'MICROSERVICES'])
    .default('MONOLITH'),
});

export type CreateProjectDto = z.infer<typeof createProjectSchema>;
```

El middleware `validateRequest(createProjectSchema)` intercepta el request antes del controlador. Si la validación falla, genera inmediatamente una `ValidationError (400)` estructurada sin ejecutar lógica de negocio.

---

## 7. Jerarquía de Excepciones y Manejo Centralizado de Errores

Prohibido capturar errores y retornar respuestas ad-hoc con `res.status(500).send(...)`. Toda condición anómala debe lanzar un error tipado:

```typescript
// Jerarquía en src/shared/exceptions/
export class AppError extends Error {
  constructor(
    public readonly message: string,
    public readonly statusCode: number = 500,
    public readonly errorCode: string = 'INTERNAL_ERROR',
    public readonly details: unknown = null
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super(
      id ? `${resource} con ID '${id}' no encontrado` : `${resource} no encontrado`,
      404,
      'NOT_FOUND'
    );
  }
}
```

El `error.middleware.ts` captura globalmente estas excepciones, mapea los códigos de error de PostgreSQL (`23505` a `ConflictError`, `23503` a `ValidationError`) y emite una respuesta uniforme mediante `sendError()`.

---

## 8. Envelope Estándar de Respuesta HTTP (`ApiResponse<T>`)

Todas las respuestas de DevSculptor siguen una estructura JSON invariable:

### Respuesta Exitosa (`200 OK` / `201 Created`):
```json
{
  "success": true,
  "data": {
    "id": "c1f7a2b0-9e4a-4b1a-b3e1-2c0f9a8b7c6d",
    "name": "E-Commerce Core",
    "architecture_style": "HEXAGONAL"
  },
  "meta": {
    "timestamp": "2026-09-16T00:15:00.000Z"
  }
}
```

### Respuesta de Error (`4xx` / `5xx`):
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Datos de entrada inválidos",
    "details": [
      {
        "field": "name",
        "message": "El nombre debe tener al menos 3 caracteres"
      }
    ]
  }
}
```

---

## 9. Seguridad, Autenticación y Multitenancy Horizontal

- **Contraseñas**: Cifradas con `bcryptjs` utilizando un factor de costo (*salt rounds*) de 10.
- **Tokens JWT**: Firmados con algoritmo `HS256` y clave secreta `JWT_SECRET` validada al inicio. Expiración estricta (ej. `7d` o `24h`).
- **Aislamiento Horizontal (Multitenancy)**: El `user_id` extraído del token JWT es inmutable en la sesión. Ninguna consulta SQL puede omitir la condición `WHERE user_id = $N` para recursos con pertenencia de usuario.

---

## 10. Observabilidad, Logging con Pino y Correlación `X-Request-Id`

1. **Cero `console.log`**: Estrictamente prohibido el uso de `console.log` o `console.error` en código de producción. Todo registro debe emitirse a través del logger Pino singleton (`src/shared/logger/logger.ts`).
2. **Correlación de Peticiones**: Cada solicitud recibe un UUID v4 inyectado en `req.requestId` y devuelto en la cabecera HTTP `X-Request-Id`.
3. **Formato Estructurado**: Los logs se emiten en formato JSON estructurado conteniendo `requestId`, `method`, `url`, `statusCode` y `responseTime`.

---

## 11. Protocolo Estricto para Creación de Nuevos Módulos (`Feats`)

Para incorporar una nueva característica o módulo al backend (por ejemplo, el módulo `ai` en el Sprint 3 Épica B), se debe seguir este flujo en 7 pasos sin saltarse ninguno:

1. **Definir Esquema de Datos**: Crear las tablas o migraciones SQL en `database/` con constraints de integridad.
2. **Definir DTOs con Zod**: Crear `{modulo}.dto.ts` con validación de entradas y exportación de tipos inferidos.
3. **Implementar Repositorio**: Crear `{modulo}.repository.ts` extendiendo de `BaseRepository` y usando consultas `$1, $2`.
4. **Implementar Servicio**: Crear `{modulo}.service.ts` con lógica de negocio, validación de permisos de tenencia y lanzamiento de excepciones `AppError`.
5. **Implementar Controlador**: Crear `{modulo}.controller.ts` desempaquetando parámetros y usando `sendSuccess()` / `sendCreated()`.
6. **Configurar Rutas**: Crear `{modulo}.routes.ts` aplicando `authMiddleware` y `validateRequest()`.
7. **Montar en `app.ts`**: Registrar el prefijo de ruta (ej. `/api/v1/ai`) en `app.ts` y validar compilación limpia con `npm run build`.

---

## 12. Matriz de Buenas Prácticas (Do's & Don'ts)

| Área | ✅ Práctica Obligatoria (DO) | ❌ Práctica Prohibida (DON'T) |
| :--- | :--- | :--- |
| **Tipado** | Usar TypeScript en modo estricto e inferir tipos desde schemas Zod | Usar `any` o hacer castings inseguros con `as unknown as Type` |
| **Persistencia** | Usar consultas parametrizadas con `pool.query(sql, [v1, v2])` | Concatenar strings en SQL (`query = '... ' + req.body.id`) |
| **JSONB** | Serializar arrays/objetos con `JSON.stringify` antes de enviar a DB | Enviar arrays JavaScript crudos que provoquen error `22P02` |
| **Controladores** | Responder usando `sendSuccess()`, `sendCreated()`, `sendError()` | Invocar `res.status().json()` directamente con estructuras no estándar |
| **Excepciones** | Lanzar subclases de `AppError` (`NotFoundError`, `ValidationError`) | Lanzar `throw new Error("msg")` o ignorar bloques `catch` vacíos |
| **Logging** | Registrar eventos relevantes mediante el logger Pino con contexto | Usar `console.log()` o `console.error()` |
| **Seguridad** | Filtrar todas las queries por `user_id` del token JWT | Asumir que el cliente envía su propio `userId` en el body sin verificar |
