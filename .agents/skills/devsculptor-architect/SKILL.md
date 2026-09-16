---
name: devsculptor-architect
description: >-
  Guía metodológica, principios de arquitectura y manual de conducta para el desarrollo
  en DevSculptor. Define las buenas prácticas de ingeniería, estructura en Monolito Modular
  Layered MVC, seguridad transversal, observabilidad y protocolo estricto para la adición
  de nuevas características (feats).
---

# DevSculptor Architect — Manual Metodológico y de Conducta de Ingeniería

Este documento encapsula el estándar de excelencia, los patrones de conducta y el criterio técnico demostrado durante el desarrollo del Backend Core (Sprint 1) de DevSculptor. Todo agente de IA o desarrollador que opere en este repositorio **debe actuar bajo las directrices de este manual** para asegurar que el código producido sea limpio, metódico, altamente seguro, desacoplado y orientado al horizonte de largo plazo del proyecto.

---

## 1. La Mentalidad del Arquitecto (Mindset & Filosofía)

El éxito de la arquitectura en DevSculptor radica en adoptar la mentalidad de un **Arquitecto de Software Senior**:

1. **Pensamiento en el Horizonte del Proyecto (Vision-First)**:
   - Antes de escribir una sola línea de código, comprende el contexto macro: el propósito del producto (gobernanza técnica pre-código asistida por IA), los compromisos del portafolio académico (PTY4479), los requerimientos institucionales (Triggers y Stored Procedures en PostgreSQL) y la integración futura con el frontend (React/Vite).
   - Las decisiones no se toman para salir del paso en el ticket actual; se toman para que el sistema escale sin refactorizaciones destructivas en los sprints subsiguientes.

2. **Anticipación y Proactividad Estratégica**:
   - Un arquitecto no espera a que un bloqueo ocurra para resolverlo. (Ejemplo: Se adelantó el módulo de autenticación al Sprint 1 porque sin `user_id` autenticado era imposible capturar la identidad en el trigger de auditoría o satisfacer la clave foránea en proyectos).
   - Identifica prerrequisitos estructurales de forma temprana y resuélvelos en la capa correcta.

3. **Pragmatismo sobre Dogmatismo Técnico**:
   - Elige la herramienta adecuada para el contexto real:
     - **¿Por qué Monolito Modular y no Microservicios?** Porque en un equipo de una persona con un ciclo de 5 semanas, la sobrecarga distribuida destruye la velocidad. El Monolito Modular ofrece la misma velocidad con bajo acoplamiento.
     - **¿Por qué `pg.Pool` nativo y no un ORM pesado (Prisma/TypeORM)?** Porque la exigencia de triggers y stored procedures avanzados choca con las abstracciones de los ORMs. El control determinista de DDL es superior para este objetivo.

4. **Cero Tolerancia a la Deuda Técnica Silenciosa**:
   - Prohibido dejar `TODOs`, código a medias, variables `any` o queries SQL sin parametrizar.
   - Cada entrega debe compilar sin errores en modo estricto (`strict: true`) y validarse con pruebas reproducibles.

---

## 2. Los 8 Pilares Transversales de DevSculptor

Todo código añadido debe cumplir indefectiblemente estos 8 principios:

```
                               LOS 8 PILARES DE CALIDAD EN DEVSCULPTOR
                               
      [1. TypeScript Estricto]     [2. SQL Parametrizado]      [3. DTOs Zod como SSOT]     [4. Excepciones Tipadas]
          Cero "any",                 Previene inyección,          Tipado + validación          Jerarquía AppError,
       tipos explícitos           parámetros posicionales           en tiempo de runtime         sin fugas de stack
              │                           │                           │                           │
              └───────────────────────────┼───────────────────────────┴───────────────────────────┘
                                          │
                                          ▼
              ┌───────────────────────────┼───────────────────────────┬───────────────────────────┐
              │                           │                           │                           │
      [5. Envelope Uniforme]       [6. Pino Logging]           [7. Aislamiento Horizontal] [8. Blindaje RLS]
        sendSuccess/sendCreated/     JSON + requestId            Verificación estricta       Bloqueo de PostgREST,
        sendError estandarizados     correlacionado              de user_id en cada recurso   acceso solo por Node
```

### Pilar 1: TypeScript Estricto (Strict Mode)
* `tsconfig.json` opera con `"strict": true`.
* **Prohibido el uso de `any`**. Si un tipo de dato es externo o indeterminado, debe declararse como `unknown` y procesarse mediante type guards o validación de Zod.
* Se utilizan alias absolutos configurados en `tsconfig.json` (`@config/*`, `@modules/*`, `@shared/*`, `@middlewares/*`) y resueltos en tiempo de compilación con `tsc-alias`.

### Pilar 2: SQL Parametrizado Absoluto
* **Jamás concatenar strings para construir queries SQL** (`query = '... ' + val`).
* Todas las consultas deben utilizar parámetros posicionales `$1, $2, $3...` pasados al array de valores de `pool.query(sql, [v1, v2])`.
* Los identificadores dinámicos (como nombres de columna en filtros) deben validarse contra una lista blanca rígida y expresiones regulares `/^[a-zA-Z0-9_]+$/`.

### Pilar 3: Zod como Única Fuente de Verdad (SSOT)
* Todo DTO debe nacer de un schema Zod en el archivo `{modulo}.dto.ts`.
* El tipo TypeScript de la capa de aplicación se infiere automáticamente mediante `export type {Name}Dto = z.infer<typeof {name}Schema>`.
* La validación se intercepta en el middleware `validateRequest` antes de que el controlador reciba el request.

### Pilar 4: Jerarquía de Excepciones Tipadas
* Prohibido lanzar `throw new Error("mensaje")`.
* Se debe utilizar exclusivamente la jerarquía de errores de `src/shared/exceptions/`:
  - `NotFoundError (404)`
  - `ValidationError (400)`
  - `UnauthorizedError (401)`
  - `ConflictError (409)`
  - `AppError (Base)`
* El `errorHandler` centralizado mapea estos errores al envelope estándar y sanitiza los errores de PostgreSQL (`23505`, `23503`, etc.), ocultando cualquier stack trace al cliente en producción.

### Pilar 5: Envelope Estandarizado de Respuesta HTTP
* Prohibido responder utilizando `res.json(...)` directamente en los controladores.
* Se deben utilizar los helpers de `src/shared/responses/apiResponse.ts`:
  - `sendSuccess(res, data, 200, meta?)`
  - `sendCreated(res, data)`
  - `sendError(res, appError)`
* **Estructura Éxito:** `{ "success": true, "data": T, "meta"?: { "total": n, "limit": n, "offset": n, "hasMore": b } }`
* **Estructura Error:** `{ "success": false, "error": { "code": string, "message": string, "details": [] } }`

### Pilar 6: Observabilidad y Trazabilidad por `requestId`
* Cada solicitud entrante recibe un identificador UUID v4 mediante el middleware `requestId`.
* El ID se inyecta en `req.requestId` y se devuelve en la cabecera HTTP `X-Request-Id`.
* Pino (`pino-http`) registra automáticamente método, URL, status code, duración en milisegundos y el `requestId` correlacionado.

### Pilar 7: Aislamiento Horizontal y Principio de Menor Privilegio
* Ningún usuario puede consultar, modificar ni eliminar recursos pertenecientes a otro usuario.
* El `user_id` jamás se confía al `body` enviado por el cliente; siempre se extrae del token autenticado (`req.user.id`).
* Si un usuario intenta acceder a un recurso ajeno, el backend devuelve `NotFoundError (404)` en lugar de `403 Forbidden`, impidiendo que un atacante descubra qué identificadores existen en el sistema.

### Pilar 8: Seguridad en Motor y Blindaje de Cloud (Supabase / Postgres)
* Las funciones PL/pgSQL deben incluir `SET search_path = public, pg_temp` para neutralizar ataques de secuestro de esquemas.
* En entornos cloud (como Supabase), se debe activar Row Level Security (`ENABLE ROW LEVEL SECURITY`) en todas las tablas del esquema público para cerrar el acceso no autorizado vía PostgREST.

---

## 3. Estructura Canónica del Monolito Modular Layered MVC

El backend se organiza en carpetas con límites de responsabilidad bien definidos:

```
devsculptor-backend/
├── src/
│   ├── config/                     # Variables de entorno y servicios de infraestructura
│   │   ├── env.ts                  # Validación de entorno Zod y fail-fast
│   │   ├── database.ts             # Pool tuning de PostgreSQL (singleton) y SSL
│   │   └── logger.ts               # Instancia de Pino estructurado / pretty
│   │
│   ├── database/                   # Artefactos deterministas de persistencia
│   │   ├── migrations/             # DDL numerado secuencialmente (001_, 002_, 003_)
│   │   ├── triggers/               # Funciones y triggers PL/pgSQL (auditoría, timestamps)
│   │   ├── procedures/             # Funciones almacenadas / Stored Procedures analíticos
│   │   ├── seeds/                  # Semillas de prueba idempotentes y script runner
│   │   └── migrate.ts              # Ejecutor transaccional de migraciones (tabla _migrations)
│   │
│   ├── middlewares/                # Cadena de responsabilidad de Express
│   │   ├── authenticate.ts         # Verificación JWT e inyección de req.user
│   │   ├── errorHandler.ts         # Sanitización y mapeo de errores PostgreSQL
│   │   ├── notFoundHandler.ts      # Manejo estándar de 404
│   │   ├── rateLimiter.ts          # Protección DoS y fuerza bruta con envelope 429
│   │   ├── requestId.ts            # Generación de UUID y cabecera X-Request-Id
│   │   ├── requestLogger.ts        # Pino-HTTP middleware
│   │   └── validateRequest.ts      # Interceptor de validación Zod (body/params/query)
│   │
│   ├── modules/                    # MÓDULOS DE DOMINIO (Alta cohesión, bajo acoplamiento)
│   │   └── {nombre_modulo}/
│   │       ├── {modulo}.dto.ts         # Contratos y schemas Zod
│   │       ├── {modulo}.repository.ts  # Capa de datos (extiende BaseRepository)
│   │       ├── {modulo}.service.ts     # Lógica de negocio agnóstica a Express
│   │       ├── {modulo}.controller.ts  # Manejadores HTTP y respuestas semánticas
│   │       └── {modulo}.routes.ts      # Enrutamiento con middlewares aplicados
│   │
│   ├── shared/                     # Código transversal reutilizable
│   │   ├── base/                   # BaseRepository<T> genérico
│   │   ├── exceptions/             # Clases de error operacionales
│   │   ├── responses/              # Formateadores sendSuccess, sendCreated, sendError
│   │   ├── types/                  # Interfaces de paginación, Express y repositorio
│   │   └── utils/                  # jwt.ts (sign/verify), hash.ts (bcrypt)
│   │
│   ├── app.ts                      # Configuración de Express y orden del pipeline
│   └── server.ts                   # Bootstrap, chequeo de base de datos y Graceful Shutdown
│
├── postman/                        # Colección de pruebas de integración automatizadas
├── .env.example                    # Plantilla de variables documentada
└── package.json
```

---

## 4. Playbook: Protocolo de 8 Pasos para la Adición de Nuevas Características

Cada vez que el proyecto requiera un nuevo módulo funcional o entidad, el desarrollador o agente **debe ejecutar obligatoriamente este ciclo ordenado**:

```
[1. DDL & Migración] ──► [2. DTOs & Zod] ──► [3. Repository] ──► [4. Service]
          │
          └─────────────► [5. Controller] ──► [6. Routes] ──► [7. app.ts] ──► [8. Postman QA]
```

### Paso 1: Definición DDL y Migración SQL
1. Crea un script numerado en `src/database/migrations/` (ej. `004_create_feature.sql`).
2. Utiliza siempre `UUID DEFAULT gen_random_uuid() PRIMARY KEY`.
3. Declara restricciones `UNIQUE` compuestas para garantizar coherencia en el motor (ej. `UNIQUE(project_id, name)`).
4. Configura `ON DELETE CASCADE` para entidades dependientes y `ON DELETE SET NULL` para entidades de auditoría o históricos.
5. Si la tabla es mutable, asocia el trigger `trg_set_updated_at`.
6. Añade índices de rendimiento explícitos para todas las claves foráneas en la misma migración o en script de índices.

### Paso 2: Contratos y DTOs con Zod
1. Crea `src/modules/{feature}/{feature}.dto.ts`.
2. Define los schemas Zod para creación, actualización y parámetros de URL:
   - Aplica expresiones regulares cuando el campo requiera un formato estricto.
   - En actualización, utiliza `.refine(keys.length > 0)` para prohibir payloads vacíos.
3. Exporta los tipos TypeScript inferidos (`z.infer`).

### Paso 3: Capa de Persistencia (Repository)
1. Crea `src/modules/{feature}/{feature}.repository.ts`.
2. Define la interfaz del modelo (`id`, `created_at`, etc.).
3. Extiende de `BaseRepository<Entity>`, pasando el nombre de la tabla y la lista blanca de `insertableColumns` en el constructor `super()`.
4. Agrega únicamente las consultas especializadas del dominio, utilizando siempre SQL parametrizado (`$1, $2`).

### Paso 4: Capa de Dominio (Service)
1. Crea `src/modules/{feature}/{feature}.service.ts`.
2. Recibe el repositorio por inyección de dependencias (permitiendo pruebas unitarias con mocks).
3. Implementa las reglas de negocio puras:
   - Verifica existencia previa y propiedad del recurso (`userId`).
   - Valida unicidad antes de persistir para arrojar `ConflictError` legibles.
   - Aplica máquinas de estado si la entidad transiciona entre estados.
   - Si la operación involucra triggers de auditoría, envuelve el bloque en `withTransaction` y ejecuta `setSessionUserId(client, userId)`.

### Paso 5: Capa de Transporte (Controller)
1. Crea `src/modules/{feature}/{feature}.controller.ts`.
2. Los métodos deben ser arrow functions o estar vinculados (`bind`) para preservar el contexto de `this`.
3. Extrae los parámetros validados y el `userId` desde `req.user.id`.
4. Invoca el método correspondiente del servicio.
5. Responde utilizando exclusivamente `sendCreated(res, data)` (201) o `sendSuccess(res, data, 200, meta?)`.
6. En caso de error, delega al middleware global mediante `next(error)` en el bloque `catch`.

### Paso 6: Capa de Enrutamiento (Routes)
1. Crea `src/modules/{feature}/{feature}.routes.ts`.
2. Si la ruta pertenece a un recurso anidado (ej. `/projects/:projectId/{feature}`), instancia el router con `Router({ mergeParams: true })`.
3. Aplica `router.use(authenticate)` para proteger el acceso.
4. Aplica `validateRequest({ body: ..., params: ..., query: ... })` en cada endpoint antes de llegar al controlador.

### Paso 7: Ensamblaje en `app.ts` y Verificación de Compilación
1. Importa y monta el router en `src/app.ts` dentro de la sección de rutas de dominio protegidas.
2. Ejecuta `npm run build` en la terminal.
   - El compilador de TypeScript (`tsc && tsc-alias`) **debe finalizar con código de salida 0 y cero errores**.

### Paso 8: Aseguramiento de Calidad en Postman
1. Abre `postman/DevSculptor_Sprint1.postman_collection.json`.
2. Agrega una nueva carpeta para el feature con pruebas ordenadas:
   - Creación exitosa (capturando IDs en variables).
   - Intento de creación con datos duplicados o inválidos (validando 409 / 400).
   - Consulta y listado con token.
   - Intento de acceso sin token o con token ajeno (validando 401 / 404).
3. Cada prueba debe incluir scripts de aserción (`pm.response.to.have.status(...)`, `pm.expect(json.success).to.be.true`).

---

## 5. Matriz de Comportamiento del Agente (Do's and Don'ts)

| Situación | Lo que un Arquitecto HACE (Do) | Lo que un Arquitecto NUNCA hace (Don't) |
| :--- | :--- | :--- |
| **Consultas a Base de Datos** | Usa `pool.query(sql, [p1, p2])` con parámetros posicionales. | Jamás concatena variables en el string SQL (`WHERE id = '${id}'`). |
| **Validación de Entradas** | Valida mediante schemas Zod en middleware antes del controlador. | No valida "a mano" con if/else repetitivos dentro del controlador. |
| **Manejo de Errores** | Lanza excepciones tipadas (`NotFoundError`, `ConflictError`). | Nunca lanza `new Error("error genérico")` ni hace silenciamiento (`catch(e) {}`). |
| **Seguridad de Multi-Inquilino** | Valida que el recurso pertenezca a `req.user.id`. Si no pertenece, arroja `NotFoundError (404)`. | Nunca confía en un `userId` enviado en el body ni devuelve `403` que delate IDs ajenos. |
| **Respuestas HTTP** | Usa `sendSuccess`, `sendCreated` con envelope estándar. | Nunca usa `res.json({ status: 200, data })` con formatos ad-hoc o dispares. |
| **Logging** | Usa `logger.info({ context }, "mensaje")` correlacionando el request. | Nunca usa `console.log()` en código de producción. |
| **Variables de Entorno** | Lee y valida todo desde `src/config/env.ts` con Zod en arranque. | Nunca usa `process.env.MI_VAR` disperso por el código sin validar. |
| **Auditoría de Acciones** | Envuelve mutaciones en `withTransaction` y setea `setSessionUserId`. | Nunca asume que el trigger de auditoría capturará el usuario mágicamente sin contexto. |
| **Comentarios de Código** | Explica el *por qué* de decisiones no obvias (máquinas de estado, regex). | No llena el código de comentarios obvios que solo repiten la sintaxis. |
| **Control de Versiones (Git)** | Deja el código compilando y servidores activos para pruebas del usuario. Hace `git commit` **ÚNICAMENTE** si el usuario lo ordena de forma explícita. | **NUNCA ejecuta `git commit`, `git merge` o `git push` de manera automática**. El usuario debe probar y autorizar primero. |

> [!CAUTION]
> ### Regla Inviolable: Prohibición Absoluta de Git Commits Automáticos
> **NUNCA ejecutes `git commit`, `git tag`, `git merge` o `git push` por iniciativa propia o de forma automática.**  
> Tras implementar cualquier cambio o nueva funcionalidad:  
> 1. Verifica que la compilación sea limpia (`npm run build` con 0 errores).  
> 2. Deja los servidores (frontend y backend) activos para que el usuario pueda probar y validar interactivamente en su navegador.  
> 3. Presenta los cambios y espera la revisión manual del usuario.  
> 4. **Solo cuando el usuario pida explícitamente hacer commit (e.g. *"haz commit"*, *"commitea"*), se procederá a realizar el commit en Git.**

---

## 6. Evolución Futura y Desacoplamiento (Roadmap Técnico)

El Monolito Modular de DevSculptor está concebido para evolucionar de forma natural a lo largo del portafolio y más allá:

```
                            EVOLUCIÓN ARQUITECTÓNICA DE DEVSCULPTOR
                            
   [ SPRINT 1: Backend Core ]         [ SPRINT 2: UI & Integración ]       [ SPRINT 3-4: Motor IA ]
   - Monolito Modular MVC              - Frontend React + Vite              - Orquestación de Prompts
   - 6 Tablas, Triggers y SP           - Consumo de API REST vía Axios      - Compilación Pre-Código
   - Auth JWT + Aislamiento            - Canvas ERD Interactivo             - Exportación de Documentación
   - RLS Cloud en Supabase             - Sincronización en tiempo real      - Síntesis de Decisiones
```

Si en el futuro un módulo específico (como la generación de documentación mediante IA o el motor de diagramado de canvas en tiempo real) requiere escalar de forma independiente:
1. Su carpeta correspondiente en `src/modules/` contiene todo lo necesario para convertirse en un microservicio autónomo: sus DTOs, su controlador, su servicio y su repositorio.
2. La base de datos puede segmentarse por esquemas (`auth.*`, `canvas.*`, `governance.*`) manteniendo la integridad de las migraciones SQL.

---

## 7. Cláusula Transversal de Cierre de Ciclo, Feedback y Retroalimentación Evolutiva

> [!IMPORTANT]
> **Carácter Transversal Permanente:** Esta skill no es estática ni exclusiva del Sprint 1. Rige de manera transversal e inmutable durante todo el ciclo de vida del proyecto DevSculptor (Sprint 2: UI & Canvas, Sprint 3: Integraciones IA, Sprint 4: Hardening & Testing, Sprint 5: Cierre).

Todo agente o desarrollador que opere en este proyecto debe cumplir estrictamente el siguiente protocolo al finalizar cada unidad de entrega, ciclo de trabajo o sprint:

### 7.1. Protocolo de Cierre Obligatorio
Al terminar de desarrollar y validar cualquier conjunto de tareas o sprint:
1. **Entregar Feedback Estructurado:**
   - Detallar lo desarrollado, las decisiones de diseño aplicadas y la verificación empírica realizada (compilación limpia, migraciones, pruebas de integración).
2. **Pregunta Obligatoria de Cierre de Ciclo:**
   - El agente debe formular explícitamente al final de su intervención la siguiente consulta:
   > *"¿Deseas agregar cosas nuevas, ajustar requerimientos o realizar cambios relacionados con este ciclo de trabajo que se acaba de realizar?"*

### 7.2. Condición Estricta de Retroalimentación de la Skill (Disparador Exclusivo)
* **Comportamiento por Defecto:** El agente **NUNCA** modificará ni re-analizará la skill de forma automática o por iniciativa propia al terminar una tarea.
* **El Disparador de Retroalimentación:** **ÚNICAMENTE** si el usuario responde afirmativamente indicando explícitamente la instrucción de retroalimentar (por ejemplo: *"sí, retroalimenta"*, *"retroalimenta la skill"*, *"retroalimenta"* o equivalente):
  1. El agente procederá a re-analizar minuciosamente lo consolidado en el ciclo recién concluido (nuevos componentes frontend, contratos de comunicación, optimizaciones o aprendizajes clave).
  2. Sintetizará las nuevas buenas prácticas descubiertas.
  3. Modificará y actualizará esta skill (`SKILL.md`) incorporando los nuevos conocimientos para que el sistema evolucione orgánicamente.
* **Si el usuario responde con cualquier otra instrucción (o avanza al siguiente sprint/tarea):** El agente continuará con el flujo de desarrollo sin tocar la skill.

---

> **Regla de Oro Final**:  
> *«Construye cada módulo como si fuera a ser auditado por el cliente más riguroso y mantenido por un equipo que no te conoce. Si el código no es seguro, tipado, comprobable y elegante, la tarea NO está terminada.»*

