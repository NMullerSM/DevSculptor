# DevSculptor — Informe Consolidado de Avance de Proyecto por Sprints (Hasta Mitad de Sprint 3)

**Proyecto:** DevSculptor — Technical Governance & AI-Assisted Documentation  
**Asignatura / Portafolio:** Taller de Integración de Software (PTY4479)  
**Autor:** Nathaniel Muller San Martin  
**Estado de Avance:** Sprint 1 (100%), Sprint 2 (100%), Sprint 3 — Épica A (100% - Mitad de Sprint 3)  
**Fecha de Emisión:** Septiembre 2026  
**Rama Activa:** `develop`  
**Repositorios / Directorios:** [`devsculptor-backend/`](file:///c:/Users/natha/Documents/Repos/DevSculptor/devsculptor-backend) | [`devsculptor-frontend/`](file:///c:/Users/natha/Documents/Repos/DevSculptor/devsculptor-frontend)

---

## 📑 Tabla de Contenidos

1. [Resumen Ejecutivo y Estado General del Proyecto](#1-resumen-ejecutivo-y-estado-general-del-proyecto)
2. [Sprint 1: Backend Core, Persistencia Relacional y Procedimientos Almacenados (100%)](#2-sprint-1-backend-core-persistencia-relacional-y-procedimientos-almacenados-100)
3. [Sprint 2: Frontend Base, Sistema de Diseño visionOS y Flujo Tripartito (100%)](#3-sprint-2-frontend-base-sistema-de-diseño-visionos-y-flujo-tripartito-100)
4. [Sprint 3: Canvas Avanzado, Multi-Motor DDL y Motor de IA (50% — Épica A Completada)](#4-sprint-3-canvas-avanzado-multi-motor-ddl-y-motor-de-ia-50--épica-a-completada)
   - 4.1. [Épica A: Canvas Avanzado, Modelado Relacional y DDL Multi-Dialecto (Completada)](#41-épica-a-canvas-avanzado-modelado-relacional-y-ddl-multi-dialecto-completada)
   - 4.2. [Épica B: Motor de Consultoría IA y Copiloto de Arquitectura (Siguiente Fase)](#42-épica-b-motor-de-consultoría-ia-y-copiloto-de-arquitectura-siguiente-fase)
5. [Sprint 4 & Sprint 5: Roadmap Futuro y Cierre](#5-sprint-4--sprint-5-roadmap-futuro-y-cierre)
6. [Matriz de Cumplimiento de la Definición de Terminado (DoD)](#6-matriz-de-cumplimiento-de-la-definición-de-terminado-dod)

---

## 1. Resumen Ejecutivo y Estado General del Proyecto

**DevSculptor** es una plataforma de ingeniería de software orientada a la **gobernanza técnica pre-código y mitigación del *"vibe coding"***. Permite a arquitectos y desarrolladores capturar formalmente requisitos (IEEE-830), registrar decisiones técnicas inmutables (ADRs), modelar bases de datos relacionales interactivas bajo la teoría de 3FN y generar especificaciones deterministas (Open Knowledge Format - OKF) para inyectar en agentes de IA como Cursor o Claude.

### Métricas Globales de Completitud (Al 50% de Sprint 3):
- **Sprint 1 (Backend Core & DB):** 100% ✅ (Completado y blindado).
- **Sprint 2 (Frontend Base & Integración):** 100% ✅ (Completado e integrado).
- **Sprint 3 — Épica A (Canvas Avanzado & DDL):** 100% ✅ (Completado: 50% del Sprint 3).
- **Sprint 3 — Épica B (Motor IA Gemini):** 0% ⏳ (Planificado para ejecución inmediata).
- **Avance Ponderado Global:** ~**70% del ciclo total de desarrollo**.

```
PROGRESO GENERAL DE SPRINTS
┌────────────────────────┬────────────────────────┬────────────────────────┬────────────────────────┐
│   SPRINT 1 (100%)      │   SPRINT 2 (100%)      │   SPRINT 3 (50%)       │   SPRINT 4 & 5 (0%)    │
│  - Monolito Modular    │  - React 18 + Vite     │  - Épica A: Canvas DDL │  - OKF Dinámico        │
│  - Supabase PG + RLS   │  - visionOS Glass      │    (COMPLETADA)        │  - Pruebas E2E         │
│  - Triggers & SP       │  - Studio Tripartito   │  - Épica B: Gemini AI  │  - Hardening Final     │
│  - Zod + Pino + Envel. │  - Axios + Zustand     │    (PENDIENTE)         │  - Deploy Producción   │
└────────────────────────┴────────────────────────┴────────────────────────┴────────────────────────┘
```

---

## 2. Sprint 1: Backend Core, Persistencia Relacional y Procedimientos Almacenados (100%)

### 2.1. Objetivos y Entregables Alcanzados
- **Arquitectura**: Monolito Modular Layered MVC construido en Node.js 20+, Express y TypeScript en modo estricto (`strict: true`, cero `any`).
- **Persistencia Nativa**: Conexión a PostgreSQL en Supabase mediante `pg.Pool` sin ORMs pesados para control absoluto de DDL y transaccionalidad ACID.
- **Seguridad Transversal**:
  - Módulo de autenticación con JWT (`HS256`) y hash de contraseñas con `bcryptjs` (salt rounds = 10).
  - Aislamiento horizontal multitenant forzando `user_id` en todas las consultas SQL.
  - Activación de Row Level Security (RLS) en Supabase impidiendo el acceso anónimo vía PostgREST.

### 2.2. Módulos de Dominio Implementados
1. **`auth`**: Registro, inicio de sesión, rotación de tokens y validación de credenciales.
2. **`projects`**: CRUD completo de proyectos de software con selección de estilo arquitectónico (`MONOLITH`, `HEXAGONAL`, `CLEAN_ARCHITECTURE`, `MICROSERVICES`).
3. **`requirements`**: Gestión de requisitos de ingeniería formal (IEEE-830) clasificados en Funcionales (`RF`) y No Funcionales (`RNF`), con prioridades (`HIGH`, `MEDIUM`, `LOW`) y validación regex de códigos (`/^(RF|RNF)-\d{2,3}$/`).
4. **`decisions`**: Registro de Decisiones de Arquitectura (ADRs) gobernadas por una máquina de estados finitos (`PROPOSED` ➔ `ACCEPTED` o `REJECTED`), garantizando inmutabilidad histórica.
5. **`canvas`**: Persistencia de nodos de tablas, esquemas de columnas en JSONB y coordenadas bidimensionales en el lienzo.

### 2.3. Lógica Almacenada en Base de Datos (PostgreSQL PL/pgSQL)
- **Trigger de Auditoría (`tg_audit_projects`)**: Ejecutado ante mutaciones en tablas críticas, serializando en `audit_logs` el estado previo (`payload_before`) y posterior (`payload_after`) junto con el `user_id` responsable.
- **Stored Procedure de Madurez (`sp_calculate_project_maturity`)**: Procedimiento almacenado que calcula el *Índice de Madurez Arquitectónica* (0 a 100%) ponderando la proporción de requisitos documentados, actas ADRs aceptadas y normalización de entidades.

### 2.4. Pilares de Calidad
- Única Fuente de Verdad (SSOT) en Schemas Zod (`validateRequest`).
- Envelope estándar de respuesta HTTP (`sendSuccess`, `sendCreated`, `sendError`).
- Logging estructurado de alto rendimiento con Pino y correlación de solicitudes vía UUID v4 (`X-Request-Id`).

---

## 3. Sprint 2: Frontend Base, Sistema de Diseño visionOS y Flujo Tripartito (100%)

### 3.1. Objetivos y Entregables Alcanzados
- **Sandbox de Prototipado (`/Prototype`)**: Validación empírica previa en HTML5, CSS3 puro y ES6 modules para asegurar fluidez a 60 FPS, física óptica de vidrio y ergonomía antes de codificar en React.
- **Construcción en Producción**: Aplicación SPA construida en **React 18+ con Vite y TypeScript** (`devsculptor-frontend`).
- **Sistema de Diseño Canónico**: **Apple visionOS Liquid Glassmorphism (v2)** integrado con el **Workspace Tripartito de Google NotebookLM Studio**:
  - Refracción angular a 135°, biseles de luz especular (`inset 0 1.5px 1px 0 rgba(255,255,255,0.48)`), desenfoque óptico saturado (`backdrop-filter: blur(...) saturate(...)`) y orbes ambientales cinéticos.
  - Paleta dual de tokens CSS: Modo Oscuro (*Crystal Obsidian*) y Modo Claro (*Snow Spatial Glass*).

### 3.2. Pantallas y Componentes Principales
1. **Pantalla 0 — Portal de Acceso (`AuthPortal.tsx`)**: Iniciar sesión y registro con validación reactiva, feedback visual y redirección desacoplada ante eventos `auth:unauthorized` (HTTP 401).
2. **Pantalla 1 — Hub de Proyectos (`ProjectsHub.tsx`)**: Grid responsivo con buscador en vivo, creación de proyectos (`CreateProjectModal`), edición de metadatos (`EditProjectModal`) y eliminación segura con modal de confirmación (`ConfirmModal`).
3. **Pantalla 2 — Estudio de Gobernanza Tripartito (`StudioWorkspace.tsx`)**:
   - **Barra Superior Apple Glass (`AppleTopBar.tsx`)**: Identidad, conmutador de pantallas (Estudio vs Hub), indicador de telemetría, selector de tema Sol/Luna y perfil.
   - **Panel Izquierdo (`FlowSidebar.tsx`)**: Pipeline guiado en 5 pasos con badges de conteo reactivos y botón inferior anclado de exportación OKF.
   - **Panel Central (Workspace Studio)**: Conmutación fluida entre 4 vistas:
     - *Vista Chat (`ChatConsultantView.tsx`)*: Consultoría inicial.
     - *Vista Requisitos (`RequirementsView.tsx`)*: Matriz formal IEEE-830.
     - *Vista ADRs (`DecisionsView.tsx`)*: Catálogo de decisiones con control de transición de estados.
     - *Vista Canvas (`CanvasView.tsx`)*: Lienzo ERD inicial y salidas multi-lenguaje (SQL, TypeScript, JSON Schema, Python).
   - **Panel Derecho (`CopilotInspector.tsx`)**: Widget de telemetría en tiempo real conectado al Stored Procedure (`maturityScore`, normalización 3FN, políticas RLS, acciones heurísticas de calidad).
4. **Modal de Compilación OKF (`OkfExportModal.tsx`)**: Generador de paquetes ZIP cliente con estructura determinista (`/documentation/`, `/database/`, `/skills/`).

---

## 4. Sprint 3: Canvas Avanzado, Multi-Motor DDL y Motor de IA (50% — Épica A Completada)

El **Sprint 3** se estructuró formalmente en dos grandes épicas de ingeniería:
- **Épica A (Semanas 5-6):** Canvas Avanzado, Modelado Relacional y Generación DDL Multi-Dialecto. *(100% Completada)*.
- **Épica B (Semanas 6-7):** Motor de Consultoría IA (Gemini) y Copiloto de Arquitectura en Tiempo Real. *(Próxima a iniciar)*.

---

### 4.1. Épica A: Canvas Avanzado, Modelado Relacional y DDL Multi-Dialecto (Completada)

Se culminó con éxito la totalidad de los requerimientos de modelado relacional y generación multi-motor:

#### 1. Generador Multi-Motor DDL Puro (`scriptGenerators.ts`)
Arquitectura de generadores puros sin dependencias externas, produciendo sentencias DDL estrictas para 4 motores líderes:
- **PostgreSQL**: `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`, `TIMESTAMPTZ`, `JSONB`, constraints y políticas RLS.
- **MySQL**: `ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`, `CHAR(36)`, `DATETIME`, foreign keys con cláusulas `CONSTRAINT`.
- **SQLite**: Tipado portable (`TEXT`, `INTEGER`, `REAL`, `BLOB`), claves foráneas integradas.
- **Oracle Database**: Tipos corporativos (`RAW(16)`, `VARCHAR2(255)`, `NUMBER(1)`), bloques PL/SQL y constraints con cláusula `ENABLE`.
- Documentado formalmente en [`Sprint3_MultiDialect_DDL_Requirement.md`](file:///c:/Users/natha/Documents/Repos/DevSculptor/Documentation/Desicitions/Backend/Sprint3_MultiDialect_DDL_Requirement.md).

#### 2. Operación Visual ALTER TABLE (`EditEntityModal.tsx`)
Modal de edición interactiva que permite a los arquitectos:
- Renombrar tablas en caliente.
- Agregar, tipar, modificar o eliminar columnas.
- Configurar flags booleanos para `PK`, `FK`, `Nullable` y `Unique`.
- Asignar relaciones foráneas dinámicas eligiendo la tabla destino y su cardinalidad (`1:1`, `1:N`, `N:M`).

#### 3. Motor de Ingeniería Inversa SQL DDL (`SqlImportModal.tsx`)
Capacidad de importar esquemas existentes mediante sentencias SQL `CREATE TABLE`:
- Parser determinista que extrae nombres de tablas, columnas, tipos de datos, PKs y claves foráneas.
- Ubicación automática en grilla (*auto-layout*) para prevenir colisiones en el lienzo.
- Inserción secuencial en el backend garantizando el disparo de los triggers de auditoría.

#### 4. Motor de Auditoría y Verificación Heurística 3FN (`NormalizationCheckerModal.tsx`)
Auditoría matemática y metodológica en tiempo real basada en las reglas de Codd:
- **1FN**: Atomicidad de columnas y existencia de clave primaria (PK).
- **2FN**: Ausencia de dependencias funcionales parciales sobre claves compuestas.
- **3FN**: Detección de dependencias transitivas y campos calculados redundantes.
- Cálculo de score global de normalización porcentual (0% a 100%).

#### 5. Rendimiento a 60 FPS y Notación Crow's Foot (Information Engineering)
- **Zero Stale Closures**: Coordenadas instantáneas gestionadas mediante `useRef` mutable y memoria reactiva en Zustand vía `setTransientPosition`, eliminando lag en el arrastre.
- **Simbología Crow's Foot**: Sustitución de flechas simples por marcadores SVG estándar: doble barra vertical `||` (Uno y sólo uno) en el lado de la PK, y pata de gallo `❯|` (Muchos) en el lado de la FK, con badge interactivo de cardinalidad.

#### 6. Panel de Modelado Desplegable en Acordeones (`CanvasDrawer.tsx`)
- Despeje visual de la barra superior (*Top Bar*), reubicando la acción de creación al interior del panel.
- Organización en acordeones plegables hacia abajo:
  - **Barra de Creación:** Botón principal `+ Añadir Tabla al Lienzo` y accesos rápidos a Importación SQL y Auditoría 3FN.
  - **Acordeón 1 (Tablas):** Buscador reactivo, vista previa inline de columnas (🔑 PK, 🔗 FK), botón ALTER TABLE (`tune`) y **botón de eliminación rápida protegida con [`ConfirmModal.tsx`](file:///c:/Users/natha/Documents/Repos/DevSculptor/devsculptor-frontend/src/components/ui/ConfirmModal.tsx)**.
  - **Acordeón 2 (Conectores y Relaciones):** Leyenda didáctica Crow's Foot y listado en vivo de todas las relaciones del modelo.

#### 7. Adaptabilidad de Alto Contraste en Modo Claro (Snow Spatial Glass)
- Resolución del problema de bajo contraste tipográfico en modo claro:
  - Tokens CSS afinados para `html.light`: `--text-primary: #090d16` (carbón profundo de máxima nitidez), `--text-secondary: #1e293b` (pizarra profunda) y `--text-muted: #334155` (gris oscuro legible).
  - Utilidades tipográficas semánticas expuestas en `tailwind.config.js` (`text-primary`, `text-secondary`, `text-muted`, `text-dim`).
  - Variantes de píldoras (`.vision-pill`) con colores profundos en modo claro para máxima legibilidad.
  - Estilización adaptativa de `.vision-drawer` y `.vision-drawer-subtle`.

#### 8. Resolución del Gotcha PostgreSQL 22P02 en Persistencia
- Corrección estructural permanente en [`BaseRepository.ts`](file:///c:/Users/natha/Documents/Repos/DevSculptor/devsculptor-backend/src/shared/base/BaseRepository.ts) mediante el método `serializeJsonFields`, garantizando que todos los arrays u objetos destinados a columnas JSONB (`columns_json`, `*_json`, `*_payload`) se conviertan a cadenas JSON literales antes de pasarse a `pool.query()`, evitando que `pg` los convierta a arrays nativos de PostgreSQL.

---

### 4.2. Épica B: Motor de Consultoría IA y Copiloto de Arquitectura (Siguiente Fase)

Corresponde al 50% restante del Sprint 3:

| Tarea / Entregable | Alcance Técnico | Estado |
| :--- | :--- | :---: |
| **Módulo Backend `ai`** | Creación de `src/modules/ai/` (Controller, Service, DTOs, Routes) consumiendo la API de Google Gemini (`@google/genai`). | ⏳ Pendiente |
| **Prompt Engineering Arquitectónico** | System prompts especializados en gobernanza técnica, extracción de requisitos IEEE-830 y modelado relacional 3FN. | ⏳ Pendiente |
| **Conexión en Tiempo Real de `ChatConsultantView`** | Sustituir respuestas simuladas por streaming o llamadas reactivas al endpoint `/api/v1/projects/:projectId/ai/chat`. | ⏳ Pendiente |
| **Generación Asistida de Entidades y ADRs** | Acciones en el chat que inyecten automáticamente requisitos al store de requirements y tablas al canvas store. | ⏳ Pendiente |

---

## 5. Sprint 4 & Sprint 5: Roadmap Futuro y Cierre

### Sprint 4: Compilación OKF Dinámica, Pruebas E2E y Carga
- **Compilador OKF en Vivo**: Generación determinista del árbol de carpetas con los requisitos reales en Markdown, los ADRs en formato estándar Nygard, y el archivo DDL unificado del modelo.
- **Suite de Pruebas E2E**: Pruebas automatizadas de flujo completo (Crear proyecto ➔ Diseñar en Canvas ➔ Auditar 3FN ➔ Exportar ZIP).
- **Pruebas de Concurrencia**: Validación de carga sobre el pool de PostgreSQL y endpoints críticos.

### Sprint 5: Hardening de Seguridad, Despliegue y Entrega Portafolio PTY4479
- **Auditoría de Seguridad**: Rate limiting estricto, sanitización XSS, revisión de cabeceras CSP.
- **CI/CD Pipeline**: Empaquetado en Docker de backend y frontend, despliegue en plataforma Cloud.
- **Consolidación Documental PTY4479**: Manual de usuario, informe de arquitectura final y video demostrativo de gobernanza técnica.

---

## 6. Matriz de Cumplimiento de la Definición de Terminado (DoD)

| Criterio de Aceptación (DoD) | Estado | Evidencia Técnica |
| :--- | :---: | :--- |
| **Cero Errores de Compilación TypeScript** | ✅ CUMPLIDO | `npm run build` compila con 0 errores en frontend y backend. |
| **Cero `console.log` / `console.error`** | ✅ CUMPLIDO | Todo registro backend utiliza el logger Pino singleton estructurado. |
| **Seguridad RLS y Tenencia Horizontal** | ✅ CUMPLIDO | Todas las consultas filtran por `user_id` del token JWT verificado. |
| **Validación Zod como SSOT** | ✅ CUMPLIDO | DTOs de entrada validados en middleware antes de los controladores. |
| **Protección contra Pérdida de Datos** | ✅ CUMPLIDO | Eliminación de tablas y proyectos requiere confirmación explícita vía `ConfirmModal`. |
| **Rendimiento Visual a 60 FPS** | ✅ CUMPLIDO | Arrastre y Bezier calculados mediante `useRef` mutable y GPU transforms. |
| **Contraste WCAG 2.1 AA Dual Theme** | ✅ CUMPLIDO | Textos legibles y oscuros (`#090d16`) en modo claro y brillantes en modo oscuro. |
| **Trazabilidad Git** | ✅ CUMPLIDO | Commits atómicos registrados en la rama `develop` siguiendo convención semántica. |
