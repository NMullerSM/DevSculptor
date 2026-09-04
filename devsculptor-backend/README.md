# DevSculptor — Backend Core (Sprint 1)

Backend modular estructurado en capas (Layered MVC Monolith) construido con Node.js, Express, TypeScript y PostgreSQL nativo para la plataforma DevSculptor.

---

## 🛠️ Stack Tecnológico

| Componente | Tecnología |
| :--- | :--- |
| **Runtime** | Node.js (v20+ LTS / v25+) |
| **Lenguaje** | TypeScript 5.7+ con modo estricto |
| **Framework HTTP** | Express 4.x |
| **Base de Datos** | PostgreSQL 15+ (cliente nativo `pg.Pool`) |
| **Validación y DTOs** | Zod 3.x |
| **Seguridad** | Helmet, CORS whitelist, express-rate-limit, JWT, bcrypt (12 rounds) |
| **Observabilidad** | Pino + pino-http (JSON estructurado + pino-pretty en desarrollo) |
| **Gestión de DB** | Migraciones SQL idempotentes con tabla `_migrations`, Triggers PL/pgSQL y Stored Procedures |

---

## 📁 Estructura del Proyecto

```
devsculptor-backend/
├── src/
│   ├── config/             # Variables de entorno (env.ts), DB pool (database.ts), Logger (logger.ts)
│   ├── database/           # Migraciones SQL, Triggers, Stored Procedures, Seeds y Runner
│   │   ├── migrations/     # 001_initial_schema.sql, 002_indexes.sql
│   │   ├── triggers/       # trg_audit_canvas.sql
│   │   ├── procedures/     # sp_project_metrics.sql
│   │   ├── seeds/          # seed_dev.sql, run-seed.ts
│   │   └── migrate.ts      # Ejecutor idempotente de migraciones
│   ├── middlewares/        # authenticate, errorHandler, rateLimiter, requestId, requestLogger, validateRequest, notFoundHandler
│   ├── modules/            # Módulos de dominio (Modular Monolith)
│   │   ├── auth/           # Registro y login con JWT
│   │   ├── projects/       # CRUD de proyectos con aislamiento por usuario
│   │   ├── requirements/   # Requisitos RF y RNF
│   │   ├── canvas/         # Entidades de diagramado ERD y trigger de auditoría
│   │   ├── decisions/      # Decisiones de arquitectura (ADRs) con máquina de estados
│   │   └── metrics/        # Consumo de SP sp_calculate_project_metrics con caché en memoria
│   ├── shared/             # BaseRepository genérico, excepciones tipadas, types, utils (jwt, hash) y apiResponse
│   ├── app.ts              # Configuración y ensamble de Express
│   └── server.ts           # Inicialización del servidor, chequeo de DB y Graceful Shutdown
├── postman/                # Colección y entorno de Postman para pruebas de integración
├── .env.example            # Plantilla documentada de variables de entorno
├── package.json
└── tsconfig.json
```

---

## 🚀 Puesta en Marcha Rápida

### 1. Prerrequisitos
- Node.js >= 18
- PostgreSQL corriendo localmente o en contenedor Docker

### 2. Configurar Variables de Entorno
Copia `.env.example` a `.env` y configura los accesos a tu base de datos:

```bash
cp .env.example .env
```

Ejemplo para PostgreSQL local:
```env
NODE_ENV=development
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=tu_password
DB_NAME=devsculptor_db
JWT_SECRET=clave_secreta_super_segura_de_al_menos_32_caracteres
JWT_EXPIRES_IN=24h
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

### 3. Instalar Dependencias
```bash
npm install
```

### 4. Ejecutar Migraciones y Seeds
```bash
# Ejecuta 001_initial_schema.sql, 002_indexes.sql, trg_audit_canvas.sql y sp_project_metrics.sql
npm run migrate

# (Opcional) Cargar datos semilla de prueba
npm run seed
```

### 5. Iniciar Servidor
```bash
# Modo desarrollo con recarga automática:
npm run dev

# Modo producción:
npm run build
npm start
```

---

## 📡 Catálogo de Endpoints de la API

Todos los endpoints tienen el prefijo `/api/v1`.

### 🩺 Sistema
| Método | Ruta | Auth | Descripción |
| :--- | :--- | :---: | :--- |
| `GET` | `/health` | No | Estado del servicio y timestamp |

### 🔐 Autenticación
| Método | Ruta | Auth | Descripción |
| :--- | :--- | :---: | :--- |
| `POST` | `/auth/register` | No | Registro de nuevo usuario (retorna token) |
| `POST` | `/auth/login` | No | Inicio de sesión con email y password (retorna token) |

### 📁 Proyectos
| Método | Ruta | Auth | Descripción |
| :--- | :--- | :---: | :--- |
| `POST` | `/projects` | Sí | Crea un nuevo proyecto para el usuario autenticado |
| `GET` | `/projects` | Sí | Lista proyectos paginados del usuario |
| `GET` | `/projects/:projectId` | Sí | Obtiene el detalle de un proyecto |
| `PUT` | `/projects/:projectId` | Sí | Actualiza nombre, descripción o estilo de arquitectura |
| `DELETE` | `/projects/:projectId` | Sí | Elimina un proyecto en cascada |

### 📋 Requisitos
| Método | Ruta | Auth | Descripción |
| :--- | :--- | :---: | :--- |
| `POST` | `/projects/:projectId/requirements` | Sí | Crea un requisito (código regex `^(RF\|RNF)-\d{2,3}$`) |
| `GET` | `/projects/:projectId/requirements` | Sí | Lista requisitos filtrando opcionalmente por `?type=RF\|RNF` |
| `GET` | `/projects/:projectId/requirements/:requirementId` | Sí | Obtiene un requisito específico |
| `PUT` | `/projects/:projectId/requirements/:requirementId` | Sí | Actualiza un requisito |
| `DELETE` | `/projects/:projectId/requirements/:requirementId` | Sí | Elimina un requisito |

### 🎨 Canvas y Auditoría
| Método | Ruta | Auth | Descripción |
| :--- | :--- | :---: | :--- |
| `POST` | `/projects/:projectId/canvas` | Sí | Crea tabla en el canvas (activa trigger de auditoría) |
| `GET` | `/projects/:projectId/canvas` | Sí | Lista tablas y columnas del canvas |
| `GET` | `/projects/:projectId/canvas/:canvasId` | Sí | Obtiene una entidad del canvas |
| `PUT` | `/projects/:projectId/canvas/:canvasId` | Sí | Actualiza esquema o coordenadas (activa trigger) |
| `DELETE` | `/projects/:projectId/canvas/:canvasId` | Sí | Elimina entidad del canvas (activa trigger) |
| `GET` | `/projects/:projectId/audit-logs` | Sí | Consulta historial de auditoría de canvas generado por el trigger |

### 📐 Decisiones de Arquitectura (ADRs)
| Método | Ruta | Auth | Descripción |
| :--- | :--- | :---: | :--- |
| `POST` | `/projects/:projectId/decisions` | Sí | Crea un ADR en estado inicial `PROPOSED` |
| `GET` | `/projects/:projectId/decisions` | Sí | Lista ADRs filtrando opcionalmente por `?status=` |
| `GET` | `/projects/:projectId/decisions/:decisionId` | Sí | Obtiene un ADR específico |
| `PUT` | `/projects/:projectId/decisions/:decisionId` | Sí | Actualiza título, contexto o decisión |
| `PATCH` | `/projects/:projectId/decisions/:decisionId/status` | Sí | Cambia estado (`ACCEPTED` o `REJECTED`, validando máquina de estados) |
| `DELETE` | `/projects/:projectId/decisions/:decisionId` | Sí | Elimina un ADR |

### 📊 Métricas de Proyecto (Stored Procedure)
| Método | Ruta | Auth | Descripción |
| :--- | :--- | :---: | :--- |
| `GET` | `/projects/:projectId/metrics` | Sí | Ejecuta `sp_calculate_project_metrics` y calcula el índice de madurez (0-100) con caché en memoria |

---

## 🧪 Pruebas con Postman

La carpeta `postman/` incluye:
1. `DevSculptor_Sprint1.postman_collection.json` — Colección con tests automáticos para todos los flujos.
2. `DevSculptor_Local.postman_environment.json` — Entorno con variables configurables (`baseUrl`, `authToken`, etc.).

Importa ambos archivos en Postman y ejecuta la colección completa en orden para validar todos los endpoints y aserciones.
