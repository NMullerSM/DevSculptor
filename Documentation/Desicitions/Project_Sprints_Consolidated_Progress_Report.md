# DevSculptor — Informe Consolidado de Avance de Proyecto por Sprints (Sprint 1, 2 y 3 Completados - 100%)

**Proyecto:** DevSculptor — Technical Governance & AI-Assisted Documentation  
**Asignatura / Portafolio:** Taller de Integración de Software (PTY4479)  
**Autor:** Nathaniel Muller San Martin  
**Estado de Avance:** Sprint 1 (100%), Sprint 2 (100%), Sprint 3 (100% — Épicas A y B Culminadas)  
**Fecha de Emisión:** Septiembre 2026  
**Rama Activa:** `develop`  
**Repositorios / Directorios:** [`devsculptor-backend/`](file:///c:/Users/natha/Documents/Repos/DevSculptor/devsculptor-backend) | [`devsculptor-frontend/`](file:///c:/Users/natha/Documents/Repos/DevSculptor/devsculptor-frontend)

---

## 📑 Tabla de Contenidos

1. [Resumen Ejecutivo y Estado General del Proyecto](#1-resumen-ejecutivo-y-estado-general-del-proyecto)
2. [Sprint 1: Backend Core, Persistencia Relacional y Procedimientos Almacenados (100%)](#2-sprint-1-backend-core-persistencia-relacional-y-procedimientos-almacenados-100)
3. [Sprint 2: Frontend Base, Sistema de Diseño visionOS y Flujo Tripartito (100%)](#3-sprint-2-frontend-base-sistema-de-diseño-visionos-y-flujo-tripartito-100)
4. [Sprint 3: Canvas Avanzado, Multi-Motor DDL y Motor de IA (100% — Épicas A y B Completadas)](#4-sprint-3-canvas-avanzado-multi-motor-ddl-y-motor-de-ia-100--épicas-a-y-b-completadas)
   - 4.1. [Épica A: Canvas Avanzado, Modelado Relacional y DDL Multi-Dialecto (100%)](#41-épica-a-canvas-avanzado-modelado-relacional-y-ddl-multi-dialecto-100)
   - 4.2. [Épica B: Motor de Consultoría IA y Copiloto de Arquitectura en Tiempo Real (100%)](#42-épica-b-motor-de-consultoría-ia-y-copiloto-de-arquitectura-en-tiempo-real-100)
5. [Sprint 4 & Sprint 5: Roadmap Futuro y Cierre](#5-sprint-4--sprint-5-roadmap-futuro-y-cierre)
6. [Matriz de Cumplimiento de la Definición de Terminado (DoD)](#6-matriz-de-cumplimiento-de-la-definición-de-terminado-dod)

---

## 1. Resumen Ejecutivo y Estado General del Proyecto

**DevSculptor** es una plataforma de ingeniería de software orientada a la **gobernanza técnica pre-código y mitigación del *"vibe coding"***. Permite a arquitectos y desarrolladores capturar formalmente requisitos (IEEE-830), registrar decisiones técnicas inmutables (ADRs), modelar bases de datos relacionales interactivas bajo la teoría de 3FN, interactuar con un Copiloto de Arquitectura conectado al contexto real del proyecto y generar especificaciones deterministas (Open Knowledge Format - OKF) para inyectar en agentes de IA como Cursor o Claude.

### Métricas Globales de Completitud (Culminación de Sprint 3):
- **Sprint 1 (Backend Core & DB):** 100% ✅ (Completado y blindado).
- **Sprint 2 (Frontend Base & Integración):** 100% ✅ (Completado e integrado).
- **Sprint 3 — Épica A (Canvas Avanzado & DDL):** 100% ✅ (Completado).
- **Sprint 3 — Épica B (Motor IA Gemini & Copiloto):** 100% ✅ (Completado con Strategy Pattern, Mock Fallback y 1-Click Injection).
- **Avance Ponderado Global:** ~**85% del ciclo total de desarrollo**.

```
PROGRESO GENERAL DE SPRINTS
┌────────────────────────┬────────────────────────┬────────────────────────┬────────────────────────┐
│   SPRINT 1 (100%)      │   SPRINT 2 (100%)      │   SPRINT 3 (100%)      │   SPRINT 4 & 5 (0%)    │
│  - Monolito Modular    │  - React 18 + Vite     │  - Épica A: Canvas DDL │  - OKF Dinámico        │
│  - Supabase PG + RLS   │  - visionOS Glass      │  - Épica B: Motor IA   │  - Pruebas E2E         │
│  - Triggers & SP       │  - Studio Tripartito   │    (Gemini Oficial +   │  - Hardening Final     │
│  - Zod + Pino + Envel. │  - Axios + Zustand     │     Mock Heurístico)   │  - Deploy Producción   │
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

---

## 3. Sprint 2: Frontend Base, Sistema de Diseño visionOS y Flujo Tripartito (100%)

### 3.1. Objetivos y Entregables Alcanzados
- **Sandbox de Prototipado (`/Prototype`)**: Validación empírica previa en HTML5, CSS3 puro y ES6 modules para asegurar fluidez a 60 FPS, física óptica de vidrio y ergonomía antes de codificar en React.
- **Construcción en Producción**: Aplicación SPA construida en **React 18+ con Vite y TypeScript** (`devsculptor-frontend`).
- **Sistema de Diseño Canónico**: **Apple visionOS Liquid Glassmorphism (v2)** integrado con el **Workspace Tripartito de Google NotebookLM Studio**:
  - Refracción angular a 135°, biseles de luz especular (`inset 0 1.5px 1px 0 rgba(255,255,255,0.48)`), desenfoque óptico saturado (`backdrop-filter: blur(...) saturate(...)`) y orbes ambientales cinéticos.
  - Paleta dual de tokens CSS: Modo Oscuro (*Crystal Obsidian*) y Modo Claro (*Snow Spatial Glass*).

### 3.2. Pantallas y Componentes Principales
1. **Portal de Acceso (`AuthPortal.tsx`)**: Iniciar sesión y registro con validación reactiva y manejo de desautorización 401.
2. **Hub de Proyectos (`ProjectsHub.tsx`)**: Grid responsivo con buscador en vivo, creación, edición y eliminación de proyectos.
3. **Estudio de Gobernanza Tripartito (`StudioWorkspace.tsx`)**:
   - Barra Superior Apple Glass (`AppleTopBar.tsx`).
   - Panel Izquierdo (`FlowSidebar.tsx`) con pipeline en 5 pasos.
   - Panel Central con 4 vistas (Chat, Requisitos, Decisiones, Canvas).
   - Panel Derecho (`CopilotInspector.tsx`) con telemetría en tiempo real.
4. **Modal de Compilación OKF (`OkfExportModal.tsx`)**: Generador de paquetes ZIP cliente.

---

## 4. Sprint 3: Canvas Avanzado, Multi-Motor DDL y Motor de IA (100% — Épicas A y B Completadas)

### 4.1. Épica A: Canvas Avanzado, Modelado Relacional y DDL Multi-Dialecto (100%)

1. **Generador Multi-Motor DDL Puro (`scriptGenerators.ts`)**: Producción determinista de sentencias DDL estrictas para 4 motores líderes: PostgreSQL, MySQL, SQLite y Oracle Database.
2. **Operación Visual ALTER TABLE (`EditEntityModal.tsx`)**: Edición en caliente de tablas, tipos de datos, constraints y cardinalidades foráneas (`1:1`, `1:N`, `N:M`).
3. **Motor de Ingeniería Inversa SQL DDL (`SqlImportModal.tsx`)**: Importación de esquemas relacionales a partir de sentencias `CREATE TABLE` con auto-layout determinista.
4. **Auditoría Heurística de Normalización 3FN (`NormalizationCheckerModal.tsx`)**: Comprobación matemática en tiempo real de 1FN, 2FN y 3FN.
5. **Rendimiento a 60 FPS y Simbología Crow's Foot**: Desplazamiento reactivo sin lag y conectores con notación estándar de Ingeniería de Información (IE).
6. **Panel Desplegable en Acordeones (`CanvasDrawer.tsx`)**: Búsqueda reactiva, edición ALTER TABLE y eliminación protegida de tablas.
7. **Adaptabilidad de Alto Contraste en Modo Claro**: Solución de contraste con paleta de textos oscuros (`#090d16`, `#1e293b`).
8. **Resolución de Gotcha PostgreSQL 22P02**: Serialización homogénea de JSONB en `BaseRepository.ts`.

---

### 4.2. Épica B: Motor de Consultoría IA y Copiloto de Arquitectura en Tiempo Real (100%)

Se completó integralmente la segunda mitad del Sprint 3, dotando al sistema de capacidades de consultoría técnica inteligente y automatización:

#### 1. Arquitectura Agnóstica de Proveedor (Strategy / Adapter Pattern)
- Contrato estándar `IAiProvider` (`src/modules/ai/providers/ai-provider.interface.ts`).
- **Proveedor Google Gemini Oficial (`GeminiProvider`)**: Integración con el SDK unificado `@google/genai`, soportando modelos dinámicos configurables mediante la variable de entorno `GEMINI_MODEL` (por defecto `gemini-2.0-flash`).
- **Proveedor OpenAI / DeepSeek (`OpenAiProvider`)**: Adaptador extensible para modelos compatibles.
- **Simulador Heurístico Local de Alta Fidelidad (`MockAiProvider`)**: Motor offline que evalúa las tablas y requisitos reales de la base de datos sin requerir API keys externas, permitiendo desarrollo continuo sin consumo de cuotas ni interrupciones.
- **Factoría Singleton (`AiProviderFactory`)**: Instanciación inteligente del proveedor según la variable `AI_PROVIDER` y presencia de credenciales.

#### 2. Blindaje de Seguridad y Aislamiento de Claves (Zero Frontend Exposure)
- **Principio Zero-Trust**: Ninguna clave de API reside en el frontend ni en repositorios Git. Las credenciales se gestionan exclusivamente en el backend `.env` y se validan mediante Zod en `src/config/env.ts`.
- **Aislamiento Horizontal (Pilar 7)**: El servicio `AiService` valida estrictamente la pertenencia del proyecto al `user_id` del JWT antes de consultar la base de datos o ensamblar el contexto.

#### 3. Ensamblado de Contexto Vivo en Base de Datos
- En cada interacción, el backend extrae en vivo los requisitos IEEE-830, el modelo relacional del canvas y las actas ADRs de PostgreSQL y los inyecta en el System Prompt, garantizando recomendaciones precisas y no alucinadas.

#### 4. Bloques de Acción Estructurados (`devsculptor-actions`)
- El motor IA emite recomendaciones técnicas acompañadas de bloques normalizados ````json:devsculptor-actions```` conteniendo especificaciones formales de:
  - Requisitos funcionales y no funcionales (`[RF-xx]`, `[RNF-xx]`).
  - Entidades relacionales con tipos de columnas y flags (`PK`, `FK`, `Unique`).
  - Actas de decisión técnica (`[ADR-xxx]`).

#### 5. Experiencia Frontend 1-Click e Integración con Stores
- **`useAiChatStore.ts`**: Store centralizado para el chat, estados de carga y orquestación de inyecciones.
- **Inyección 1-Click**:
  - `injectRequirement`: Inserción directa en `requirementsService`.
  - `injectEntity`: Creación y renderizado automático en `useCanvasStore`.
  - `injectDecision`: Registro formal en `decisionsService`.
  - `injectAllActions`: Inyección por lotes con retroalimentación visual inmediata.
- **Sincronización de Métricas en Vivo**: Cada inyección recalcula automáticamente las métricas del proyecto en `useProjectStore.fetchMetrics(projectId)`, actualizando el Índice de Madurez en el inspector lateral.
- **Acción Rápida en Copiloto (`CopilotInspector.tsx`)**: Botón *"Auditoría IA (3FN & ADRs)"* que traslada al usuario al chat y ejecuta la auditoría del esquema relacional en un solo paso.

---

## 5. Sprint 4 & Sprint 5: Roadmap Futuro y Cierre

### Sprint 4: Compilación OKF Dinámica, Pruebas E2E y Rendimiento
- **Compilador OKF en Vivo**: Generación determinista del árbol de carpetas con los requisitos reales en Markdown, los ADRs en formato estándar Nygard, y el archivo DDL unificado del modelo.
- **Suite de Pruebas E2E**: Pruebas automatizadas de flujo completo (Crear proyecto ➔ Diseñar en Canvas ➔ Auditar 3FN ➔ Consultar Copiloto IA ➔ Inyectar Acción ➔ Exportar ZIP).
- **Pruebas de Concurrencia**: Validación de carga sobre el pool de PostgreSQL y endpoints críticos.

### Sprint 5: Hardening de Seguridad, Despliegue y Entrega Portafolio PTY4479
- **Auditoría de Seguridad**: Rate limiting estricto, sanitización XSS, revisión de cabeceras CSP.
- **CI/CD Pipeline**: Empaquetado en Docker de backend y frontend, despliegue en plataforma Cloud.
- **Consolidación Documental PTY4479**: Manual de usuario, informe de arquitectura final y video demostrativo de gobernanza técnica.

---

## 6. Matriz de Cumplimiento de la Definición de Terminado (DoD)

| Criterio de Aceptación (DoD) | Estado | Evidencia Técnica |
| :--- | :---: | :--- |
| **Cero Errores de Compilación TypeScript** | ✅ CUMPLIDO | `npm run build` compila con 0 errores en frontend (Vite) y backend (`tsc && tsc-alias`). |
| **Arquitectura de IA Provider-Agnostic** | ✅ CUMPLIDO | Patrón Strategy/Adapter implementado (`IAiProvider`, `GeminiProvider`, `MockAiProvider`, `OpenAiProvider`). |
| **Protección de Credenciales de IA** | ✅ CUMPLIDO | API keys aisladas al 100% en backend `.env`; cero exposición en cliente o git. |
| **Resiliencia y Modo Offline Heurístico** | ✅ CUMPLIDO | `MockAiProvider` analiza contexto real de base de datos sin lanzar errores si no hay API key. |
| **Inyección 1-Click de Artefactos IA** | ✅ CUMPLIDO | Inserción directa de requisitos, entidades y ADRs con actualización de métricas en tiempo real. |
| **Seguridad RLS y Tenencia Horizontal** | ✅ CUMPLIDO | Todas las consultas filtran por `user_id` del token JWT verificado (Pilar 7). |
| **Validación Zod como SSOT** | ✅ CUMPLIDO | DTOs de entrada validados en middleware antes de los controladores. |
| **Rendimiento Visual a 60 FPS** | ✅ CUMPLIDO | Arrastre y Bezier calculados mediante `useRef` mutable y GPU transforms. |
| **Contraste WCAG 2.1 AA Dual Theme** | ✅ CUMPLIDO | Textos legibles y oscuros (`#090d16`) en modo claro y brillantes en modo oscuro. |
| **Trazabilidad Git en `develop`** | ✅ CUMPLIDO | Commits atómicos registrados exclusivamente en la rama `develop` sin tocar `main`. |
