# DevSculptor — Informe Consolidado de Avance de Proyecto por Sprints (Sprints 1 al 5 y Hardening de Seguridad Pre-Producción — 100% Culminados)

**Proyecto:** DevSculptor — Technical Governance & AI-Assisted Documentation  
**Asignatura / Portafolio:** Taller de Integración de Software (PTY4479)  
**Autor:** Nathaniel Muller San Martin  
**Estado de Avance:** Sprint 1 (100%), Sprint 2 (100%), Sprint 3 (100%), Sprint 4 (100%), Sprint 5 (100% — Etapas A y B Culminadas, Hardening y Auditoría Pre-Producción)  
**Fecha de Emisión:** Octubre 2026  
**Rama Activa:** `develop`  
**Repositorios / Directorios:** [`devsculptor-backend/`](../../devsculptor-backend) | [`devsculptor-frontend/`](../../devsculptor-frontend)

---

## 📑 Tabla de Contenidos

1. [Resumen Ejecutivo y Estado General del Proyecto](#1-resumen-ejecutivo-y-estado-general-del-proyecto)
2. [Sprint 1: Backend Core, Persistencia Relacional y Procedimientos Almacenados (100%)](#2-sprint-1-backend-core-persistencia-relacional-y-procedimientos-almacenados-100)
3. [Sprint 2: Frontend Base, Sistema de Diseño visionOS y Flujo Tripartito (100%)](#3-sprint-2-frontend-base-sistema-de-diseño-visionos-y-flujo-tripartito-100)
4. [Sprint 3: Canvas Avanzado, Multi-Motor DDL, Motor de IA y Gobernanza ADR (100% — Épicas A, B y C)](#4-sprint-3-canvas-avanzado-multi-motor-ddl-y-motor-de-ia-100--épicas-a-y-b-completadas)
   - 4.1. [Épica A: Canvas Avanzado, Modelado Relacional y DDL Multi-Dialecto (100%)](#41-épica-a-canvas-avanzado-modelado-relacional-y-ddl-multi-dialecto-100)
   - 4.2. [Épica B: Motor de Consultoría IA y Copiloto de Arquitectura en Tiempo Real (100%)](#42-épica-b-motor-de-consultoría-ia-y-copiloto-de-arquitectura-en-tiempo-real-100)
   - 4.3. [Épica C: Gobernanza Arquitectónica Progresiva, Selección Canónica en ADRs y Protocolo Human-in-the-Loop (100%)](#43-épica-c-gobernanza-arquitectónica-progresiva-selección-canónica-en-adrs-y-protocolo-human-in-the-loop-100)
5. [Sprint 4: Arquitectura OKF Vault, Compilación Dinámica y Freshness Engine (100%)](#5-sprint-4-arquitectura-okf-vault-compilación-dinámica-y-freshness-engine-etapa-a--100)
6. [Sprint 5: Refactorización UX/UI, Identidad, Bóveda BYOK y Plantillas Enterprise (100%)](#6-sprint-5-refactorización-uxui-configuración-de-plataforma-identidad-y-bóveda-byok-etapa-a--100)
7. [Sprint 5 — Etapa B: Hardening de Seguridad, Auditoría Técnica y Suite de Pruebas Automatizadas (100%)](#7-sprint-5--etapa-b-hardening-de-seguridad-auditoría-técnica-y-suite-de-pruebas-automatizadas-100)
8. [Matriz de Cumplimiento de la Definición de Terminado (DoD)](#8-matriz-de-cumplimiento-de-la-definición-de-terminado-dod)

---

## 1. Resumen Ejecutivo y Estado General del Proyecto

**DevSculptor** es una plataforma de ingeniería de software orientada a la **gobernanza técnica pre-código y mitigación del *"vibe coding"***. Permite a arquitectos y desarrolladores capturar formalmente requisitos (IEEE-830), registrar decisiones técnicas inmutables (ADRs), modelar bases de datos relacionales interactivas bajo la teoría de 3FN, interactuar con un Copiloto de Arquitectura conectado al contexto real del proyecto y generar especificaciones deterministas (Open Knowledge Format - OKF) para inyectar en agentes de IA como Cursor o Claude.

### Métricas Globales de Completitud (Culminación Integral de Sprints 1 a 5 y Hardening):
- **Sprint 1 (Backend Core & DB):** 100% ✅ (Completado y blindado).
- **Sprint 2 (Frontend Base & Integración):** 100% ✅ (Completado e integrado).
- **Sprint 3 (Canvas Avanzado, DDL & Motor IA):** 100% ✅ (Completado con Strategy Pattern, Mock Fallback y 1-Click Injection).
- **Sprint 4 (OKF Vault, Dynamic Packaging & Storage RLS):** 100% ✅ (Completado).
- **Sprint 5 — Etapa A (UX/UI Refactor, Settings, Identity & BYOK):** 100% ✅ (Completado).
- **Sprint 5 — Etapa B (Security Hardening, Testing Suite & Pre-Prod Audit):** 100% ✅ (Completado — 25/25 tests passing, 0 lint errors, 0 Supabase advisor warnings).
- **Avance Ponderado Global:** **100% del ciclo de desarrollo y hardening pre-producción**.

```
PROGRESO GENERAL DE SPRINTS Y HARDENING TÉCNICO
┌───────────────────┬───────────────────┬───────────────────┬───────────────────┬───────────────────┐
│  SPRINT 1 (100%)  │  SPRINT 2 (100%)  │  SPRINT 3 (100%)  │  SPRINT 4 (100%)  │  SPRINT 5 (100%)  │
│ - Monolito Mod.   │ - React 19 + Vite │ - Canvas DDL      │ - OKF Dynamic     │ - BYOK & Identity │
│ - Supabase PG RLS │ - visionOS Glass  │ - Motor IA Gemini │ - Supabase Storage│ - Security Audit  │
│ - Triggers & SP   │ - Studio Tripart. │ - Mock Offline    │ - 13 Plantillas   │ - Vitest Suite    │
│ - Zod + Pino      │ - Axios + Zustand │ - Human-in-Loop   │ - SHA-256 Hash    │ - 0 Advisors Warn │
└───────────────────┴───────────────────┴───────────────────┴───────────────────┴───────────────────┘
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
- **Sandbox de Prototipado**: Validación empírica previa en HTML5, CSS3 puro y ES6 modules para asegurar fluidez a 60 FPS, física óptica de vidrio y ergonomía (fase inicial superada y consolidada en el código fuente de producción).
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

### 4.3. Épica C: Gobernanza Arquitectónica Progresiva, Selección Canónica en ADRs y Protocolo Human-in-the-Loop (100%)

Completada para asegurar que el sistema preserve el control y juicio técnico humano frente a las decisiones automatizadas de IA:

#### 1. Desacoplamiento de la Elección de Arquitectura Inicial
- **Modal de Creación (`CreateProjectModal.tsx`)**: Eliminación del selector de arquitectura forzado al crear el proyecto. Reemplazado por metadatos institucionales: *Organización / Empresa* y *Arquitecto Líder / Responsable*. El estilo se inicializa en `'Por Definir / En Evaluación'`.
- **Persistencia en Base de Datos**: Migración DDL `004_project_governance_metadata.sql` en Supabase PostgreSQL agregando las columnas `organization` y `lead_architect` a la tabla `projects`.
- **Portafolio de Proyectos (`ProjectsHub.tsx`)**: Búsqueda multi-criterio y pills de estado en las tarjetas (`En Evaluación (ADR Pendiente)`).

#### 2. Selección de Arquitectura Canónica Guiada en ADRs (`ArchitectureStyleModal.tsx`)
- Panel y banner interactivo de gobernanza en `DecisionsView.tsx`.
- Modal de evaluación técnica de los 4 estilos canónicos (*Monolito Modular*, *Microservicios*, *Clean Architecture / Hexagonal*, *Event-Driven*), comparando ventajas, compromisos y generando la propuesta `ADR-001` en estado `PROPOSED`.

#### 3. Protocolo Estricto de Verificación Human-in-the-Loop (`AdrStatusVerifyModal.tsx`)
- Bloqueo de cambios de estado triviales o accidentales.
- Prohibición explícita de modificaciones de estado ejecutadas de forma autónoma por la IA (`ai.prompts.ts`).
- Certificación obligatoria mediante checkbox del arquitecto humano antes de confirmar transiciones.
- Sincronización automática opcional del estilo arquitectónico del proyecto al ratificar el acta ADR correspondiente.
- Flexibilización en `decisions.service.ts` para permitir la reapertura (`PROPOSED`) o revocación (`REJECTED`) justificada con trazabilidad Pino Logger.

---

### 4.4. Épica D: Responsividad Multi-Pantalla a 60 FPS y Patrón Combobox visionOS (100%)

Completada para garantizar que DevSculptor opere de forma fluida en cualquier factor de forma:

1. **Layout Híbrido Tripartito vs. Slide-Over Glass Drawers (`StudioWorkspace.tsx` y `useLayoutStore.ts`)**:
   - **Escritorio (≥ 1280px)**: 3 columnas estables en pantalla (`FlowSidebar` 240px + Canvas central `flex-1` + `CopilotInspector` 260px).
   - **Tablets y Móviles (< 1280px)**: El lienzo central ocupa el **100% del viewport**. Los paneles laterales se convierten en drawers flotantes sobre un backdrop desenfocado (`backdrop-blur-sm`), controlados por el store reactivo `useLayoutStore`.
2. **Floating Vision Dock en Dispositivos Táctiles**:
   - Barra de control flotante inferior en pantallas `< 1280px` para cambiar en 1 tap entre las 4 vistas (Chat, Requisitos, ADRs, Canvas) y disparar los drawers laterales.
3. **Resiliencia de Viewports Dinámicos y Modales**:
   - Adopción de `h-dvh` en `App.tsx` y `AuthPortal.tsx` para evitar que la barra del navegador corte la interfaz en móviles.
   - Contención `max-h-[calc(100dvh-1.5rem)]` y scroll inercial en `VisionModal.tsx`.
4. **Patrón Combobox en Lienzo ERD (`CanvasView.tsx`)**:
   - En pantallas `< 1536px` (`< 2xl`: laptops y tablets), las 6 subpestañas se agrupan en un selector combobox de cristal líquido con icono dinámico.
   - En el visor DDL, los 4 motores SQL se condensan en un selector tipo pastilla (`Motor:`), neutralizando por completo el solapamiento visual.

---

### 4.5. Épica E: Razonamiento Dinámico del Copiloto IA, Resiliencia 3FN y Copiado Integral (100%)

Perfeccionamiento del motor de arquitectura asistida para eliminar rigideces y garantizar robustez técnica:

1. **Erradicación de Rangos Fijos**:
   - Eliminación de la limitación artificial de "2 a 4 requisitos". El motor formula de manera **100% autónoma y dinámica** la cantidad de requisitos funcionales y no funcionales que demande la complejidad del requerimiento.
2. **Desacoplamiento Relacional 3FN Multi-Entidad**:
   - Generación de esquemas relacionales normalizados complejos (ej. pedidos con cabecera `orders`, detalle `order_items`, destino `shipping_addresses` [1:1] y transacción `payments` [1:1]).
   - Claves foráneas canónicas en plural (`users`, `products`), neutralizando colisiones con palabras reservadas SQL como `user`.
3. **Resiliencia en Inyecciones RNF y Prioridades**:
   - Contadores correlativos independientes para requerimientos funcionales (`maxRf`) y no funcionales (`maxRnf`).
   - Normalización de prioridades a `HIGH | MEDIUM | LOW` para cumplir estrictamente con el constraint de base de datos `CHECK (priority IN ('HIGH', 'MEDIUM', 'LOW'))` y validaciones Zod.
4. **Copiado Integral de Propuestas Técnicas (`ChatConsultantView.tsx`)**:
   - El botón principal de copia en el chat formatea e incluye la propuesta completa: razonamiento arquitectónico, requisitos IEEE-830 (código, título, tipo, prioridad, descripción), tablas relacionales (con columnas, PKs y FKs) y actas ADR.
   - Incorporación de botones de copia específicos: *"Copiar RFs"*, *"Copiar JSON"* y botones individuales por tarjeta de requisito.
5. **Corrección de DDL Multi-Motor (`scriptGenerators.ts`)**:
   - Detección previa de columnas de auditoría (`created_at`, `updated_at`) para evitar duplicaciones sintácticas en PostgreSQL, MySQL, SQLite y Oracle.
   - Inyección automática de `DEFAULT gen_random_uuid()` para claves primarias UUID en PostgreSQL.

---

### 4.6. Épica F: Eliminación Atómica en Cascada y Ticket de Confirmación para Proyectos (100%)

Solución de fondo al problema de persistencia en eliminación de proyectos y refuerzo de seguridad operativa:

1. **Resolución del Conflicto de Claves Foráneas en PostgreSQL (`projects.service.ts`)**:
   - **Diagnóstico**: Al eliminar un proyecto con entidades de Canvas, PostgreSQL ejecutaba el trigger `trg_audit_canvas_changes`, el cual intentaba insertar un registro en `audit_logs` con `project_id` cuando la fila del proyecto padre ya estaba en proceso de borrado, detonando el error `23503: foreign_key_violation`.
   - **Solución Transaccional Atómica**: Se implementó una secuencia de eliminación ordenada y encapsulada en transacción:
     1. Purgar `canvas_entities` mientras el proyecto aún existe (permitiendo la ejecución segura de triggers).
     2. Purgar `audit_logs`.
     3. Purgar `requirements` y `architecture_decisions`.
     4. Eliminar el registro raíz en `projects`.
2. **Ticket de Confirmación Explícito (`ConfirmModal.tsx` y `ProjectsHub.tsx`)**:
   - Se añadió el prop `requireConfirmationTicket` a `ConfirmModal`.
   - Despliegue de una casilla de verificación ("ticket") obligatoria: *"Confirmo que deseo eliminar este proyecto y todos sus artefactos asociados de forma irreversible."*
   - Bloqueo total del botón de confirmación hasta que el usuario marque la casilla, previniendo borrados involuntarios.
   - Manejo y presentación de errores inline dentro del modal ante cualquier eventualidad.

---

## 5. Sprint 4: Arquitectura OKF Vault, Compilación Dinámica y Freshness Engine (Etapa A — 100%)

El Sprint 4 materializa la síntesis final del sistema pre-código mediante la consolidación del estándar **Open Knowledge Framework (OKF)**, permitiendo exportar el conocimiento arquitectónico como código (Doc-as-Code) de forma estructurada, versionada y verificable criptográficamente:

### 5.1. Épica A: Bóveda de Almacenamiento Supabase y Persistencia RLS (`005_okf_vault_and_storage.sql`)
1. **Bucket de Almacenamiento Seguro (`okf-vault`)**:
   - Creación y aprovisionamiento del bucket privado en Supabase Storage.
   - Políticas RLS a nivel de objeto que aseguran el aislamiento estricto por usuario autenticado (`auth.uid()`).
2. **Modelo de Metadatos Documentales (`okf_documents`)**:
   - Tabla relacional vinculada a `projects` que indexa la jerarquía de rutas relativas, categorías (`architecture`, `requirements`, `database`, `governance`), formatos (`md`, `sql`, `json`) y versiones.
   - Inclusión de la columna `content_sha256` para auditoría y verificación de integridad.
   - Políticas RLS transversales que garantizan acceso exclusivo al propietario del proyecto.

### 5.2. Épica B: Compilador Determinista de Documentos OKF (`okfDocumentProcessor.ts`)
1. **Generación Determinista del Árbol de Conocimiento**:
   - `README.md`: Resumen ejecutivo del proyecto, stack tecnológico y guía de inicio.
   - `architecture/system-overview.md`: Visión del sistema, estilo arquitectónico seleccionado y diagrama C4 en Mermaid.
   - `architecture/adrs/ADR-XXX-[slug].md`: Actas de decisión arquitectónica bajo formato estándar Nygard con metadatos YAML Frontmatter.
   - `requirements/srs-specification.md`: Especificación de Requerimientos de Software bajo estándar IEEE 830 (RF y RNF).
   - `requirements/matrix.md`: Matriz de trazabilidad y dependencias cruzadas.
   - `database/schema-[dialect].sql`: DDL multi-motor (PostgreSQL, MySQL, SQLite, Oracle) compilado y normalizado en 3FN.
   - `database/data-dictionary.md`: Diccionario de datos formal con descripción técnica de cada atributo.
   - `database/erd-entities.json`: Representación JSON estructurada para herramientas de modelado externas.
   - `governance/compliance-audit.md`: Auditoría de gobernanza técnica ISO/IEC 25010 y certificaciones Human-in-the-Loop.
2. **Inyección de Frontmatter YAML y Hash SHA-256**:
   - Cada artefacto Markdown incluye encabezados YAML con metadatos de versión, etiquetas semánticas y fecha de generación.
   - Generación de firma criptográfica SHA-256 por cada documento para detectar cualquier discrepancia o modificación no autorizada.

### 5.3. Épica C: Motor de Frescura en Tiempo Real (`okfVaultService.ts`)
1. **Agregación Reactiva en Memoria**:
   - Monitoreo continuo de los cambios en los diagramas de Canvas, el catálogo de requerimientos y las actas ADR.
2. **Evaluación de Estados de Sincronización**:
   - `FRESH`: Los documentos compilados reflejan con exactitud matemática el estado del modelo visual.
   - `DRIFT_DETECTED`: Se detectaron cambios en entidades o requerimientos posteriores al último snapshot.
   - `STALE`: La bóveda requiere una primera compilación o re-indexación.
3. **Empaquetado Dinámico ZIP**:
   - Compilación y empaquetado del archivo comprimido directamente en el cliente para descarga instantánea.

### 5.4. Épica D: Explorador Jerárquico en Árbol y Exportaciones Granulares
1. **Modal de Bóveda Avanzado (`OkfExportModal.tsx`)**:
   - Explorador jerárquico de carpetas y archivos con insignias de categoría y tamaño.
   - Panel de previsualización en vivo con fuente monoespaciada y resaltado de sintaxis.
   - Selector reactivo de dialectos SQL con actualización inmediata del DDL mostrado.
2. **Botones de Descarga Directa Granular**:
   - `CanvasView.tsx`: Botón directo para descargar el script DDL SQL del dialecto seleccionado.
   - `RequirementsView.tsx`: Botón directo para exportar el documento de Requerimientos SRS (.md).
   - `DecisionsView.tsx`: Botón directo para exportar el índice consolidado de ADRs (.md).
   - `VisionModal.tsx`: Escalado de modales con tamaños `2xl`, `3xl` y `4xl` para lectura técnica cómoda.

### 5.5. Épica E: Conectividad y Resiliencia de Red en Desarrollo (`app.ts`)
1. **Soporte de Red Local y Redes Seguras**:
   - Actualización de la política CORS en `devsculptor-backend/src/app.ts` para aceptar orígenes de red privada (`192.168.0.0/16`, `10.0.0.0/8`, `172.16.0.0/12`) y redes privadas Tailscale (`100.64.0.0/10`) durante el modo de desarrollo, facilitando pruebas en múltiples dispositivos sin restricciones.

---

## 6. Sprint 5: Refactorización UX/UI, Configuración de Plataforma, Identidad y Bóveda BYOK (Etapa A — 100%)

El Sprint 5 aborda la separación arquitectónica de dominios de configuración, la seguridad de credenciales de inferencia y la ampliación de la suite documental pre-código:

### 6.1. Separación de Dominios de Configuración y Simplificación de Top Bar
1. **Barra Superior Minimalista (`AppleTopBar.tsx`)**:
   - Eliminación de accesos directos redundantes. Se preserva exclusivamente el acceso a Configuración de la Plataforma (`tune`) y el avatar del usuario (`NM`).
2. **Cajón Deslizante Lateral de Plataforma (`PlatformSettingsDrawer.tsx`)**:
   - Montado directamente en `document.body` mediante `createPortal` para evitar limitaciones de recorte por `backdrop-filter`.
   - Selector de Modo de Iluminación (Modo Oscuro vs. Modo Claro).
   - Galería de 6 fondos de pantalla en alta resolución + soporte para URL externa.
   - Controles deslizantes para desenfoque de vidrio (Glass Blur) y opacidad de ventanas.
   - Reglas de gobernanza pre-coding: Normalización Estricta 3FN y prefijos canónicos de requisitos (`RF`, `REQ`, `US`).

### 6.2. Bóveda de Inferencia Local BYOK y Verdad en Catálogo de Modelos
1. **Transparencia en Costos y Proveedores**:
   - Solo los modelos servidos por el backend (`Gemini Flash`) se etiquetan como gratuitos/incluidos.
   - Los modelos de terceros (OpenRouter, DeepSeek, OpenAI, Groq) se identifican formalmente con la etiqueta *Requiere Clave Privada*.
2. **Menú de Usuario y Credenciales (`UserProfileMenu.tsx`)**:
   - Pestaña Perfil: Edición de nombre para mostrar (`full_name`) y actualización segura de contraseña.
   - Pestaña Seguridad & 2FA: Flujo completo de activación y desactivación de TOTP RFC 6238.
   - Pestaña Mis API Keys (BYOK): Almacenamiento local en cliente (cero persistencia en base de datos), ping test de latencia y conmutación transparente a fallback de servidor.

### 6.3. Endpoints de Backend para Identidad y Contraseñas
1. **`PUT /auth/profile`**: Modificación autenticada de nombre completo con saneamiento y validación.
2. **`PUT /auth/change-password`**: Comprobación criptográfica de contraseña previa mediante `bcrypt.compare` y salting seguro de nueva contraseña (`bcrypt.hash(..., 12)`).

### 6.4. Bóveda Documental OKF con 13 Plantillas Enterprise
- Integración en el Paso 3 del Estudio ("Documentos") de 13 especificaciones técnicas que cubren Requerimientos (SRS, Matriz, Casos de Uso), Arquitectura (Visión C4, ADRs, Topología), Base de Datos (DDL, Diccionario, Migraciones), Calidad & Testing (Plan de Pruebas, Cobertura), Gobernanza (Auditoría ISO/IEC 25010) y Despliegue (Runbook DevOps).

---

## 7. Sprint 5 — Etapa B: Hardening de Seguridad, Auditoría Técnica y Suite de Pruebas Automatizadas (100%)

Esta etapa ejecutó la remediación integral de vulnerabilidades, auditoría de gobernanza arquitectónica y establecimiento de salvaguardas de nivel bancario/empresarial:

### 7.1. Fase 0: Infraestructura de Pruebas Automatizadas y Calidad de Código
1. **Suite de Pruebas Vitest & Supertest**:
   - Integración nativa de **Vitest** en `devsculptor-backend` para ejecución ultrarrápida en memoria con resolución de paths TypeScript (`vite-tsconfig-paths`).
   - 25 pruebas automatizadas pasando al 100% (cero fallos) distribuidas en 4 suites especializadas:
     - `auth.integration.test.ts`: Pruebas de integración de registro, login, token typing, mitigación de enumeración y rechazo de payloads inválidos.
     - `safeUrl.test.ts`: 12 vectores de prueba anti-SSRF (bloqueo de IPv4/IPv6 loopback, rangos RFC 1918 privados, DNS multi-IP y resolución segura).
     - `crypto.test.ts`: Cifrado y descifrado simétrico autenticado AES-256-GCM para secretos TOTP y Bóvedas.
     - `rateLimiter.test.ts`: Control de flujo en memoria y headers estándar IETF (`RateLimit-Limit`, `RateLimit-Remaining`).
2. **Gobernanza de Linting Flat Config**:
   - Migración de ESLint a formato Flat Config (`eslint.config.mjs`) compatible con ESLint 9+ y `@typescript-eslint`.
   - Cero errores y cero advertencias en la totalidad del backend (`0 errors, 0 warnings`).
3. **Pipeline de Integración Continua (CI)**:
   - Configuración del flujo de GitHub Actions en `.github/workflows/ci.yml` ejecutando verificación de tipos (`tsc --noEmit`), linting y suite de pruebas en cada push o pull request.

### 7.2. Fase 1: Autenticación, MFA, Gestión Criptográfica y Ciclo de Sesiones
1. **Tipado Estricto de JWT y Desacoplamiento de Flujo MFA**:
   - Adición del atributo `type: 'access' | 'mfa_pending'` en el payload firmado del token JWT.
   - El middleware `authenticate` rechaza de inmediato tokens intermedios `mfa_pending` para proteger endpoints operativos, eliminando el riesgo de escalada de privilegios o bypass de 2FA.
2. **Revocación de Sesiones en Tiempo Real (`token_version`)**:
   - Adición de la columna `token_version INT DEFAULT 1` a la tabla `users` mediante migración DDL `009_auth_security_hardening.sql`.
   - El middleware de autenticación valida en cada request que el `token_version` del JWT coincida exactamente con la base de datos.
   - Cualquier cambio de credenciales (`PUT /auth/change-password`) o desactivación de 2FA incrementa atómicamente el contador, invalidando todas las sesiones y tokens en circulación de manera instantánea.
3. **Mitigación de Enumeración de Cuentas y Comparación Ficticia**:
   - Unificación de mensajes de error de autenticación: *"Credenciales de acceso inválidas"* tanto para cuentas inexistentes como contraseñas incorrectas.
   - En caso de usuario inexistente, se ejecuta un hash ficticio `bcrypt.compare` con un salt precalculado para igualar el tiempo de cómputo y neutralizar ataques de temporización (timing attacks).
4. **Cifrado Simétrico Autenticado AES-256-GCM para Secretos MFA**:
   - Los secretos TOTP ya no se almacenan en texto claro: se cifran mediante AES-256-GCM utilizando un vector de inicialización (IV) de 12 bytes aleatorio por registro y tag de autenticación de 16 bytes.
   - Algoritmo inmune a manipulaciones de bits y resistente a fugas de base de datos.
5. **Mitigación de Replay Attacks en Códigos TOTP (RFC 6238)**:
   - Persistencia de `last_totp_step` en la tabla `users`.
   - Se prohíbe reutilizar el mismo código OTP dentro de la misma ventana de tiempo de 30 segundos.
6. **Limitadores de Tasa Especializados (Rate Limiters)**:
   - `authLimiter`: 10 peticiones cada 15 minutos en rutas sensibles de login y registro.
   - `aiLimiter`: 20 consultas por minuto por usuario para evitar agotamiento de cuotas y ataques de denegación de servicio.
   - `mfaVerifyLimiter`: 5 intentos por ventana de 5 minutos para prevenir ataques de fuerza bruta en códigos TOTP.

### 7.3. Fase 2: Mitigación de Amenazas Outbound (SSRF) y Gobernanza RLS Supabase
1. **Validador DNS Anti-SSRF (`safeUrl.ts`)**:
   - Verificación de URLs antes de enviar solicitudes HTTP a endpoints externos de inferencia de IA.
   - Resolución DNS previa y filtrado riguroso de direcciones IP privadas y reservadas: IPv4 (`127.0.0.0/8`, `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `169.254.0.0/16`) e IPv6 (`::1`, `fc00::/7`, `fe80::/10`).
   - Política estricta `redirect: 'error'` en `fetch` para impedir que un servidor malicioso redirija hacia la red interna de la nube.
   - Manejo de excepciones con código HTTP 502 `ExternalServiceError` en caso de fallos de conectividad con proveedores de IA.
   - Timeout unificado de 45 segundos en llamadas a modelos de lenguaje en el backend.
2. **Gobernanza de Seguridad en Supabase (Migraciones 009 a 013)**:
   - Migraciones DDL desplegadas y auditadas en la base de datos cloud:
     - `009_auth_security_hardening.sql`: Columnas `token_version` y `last_totp_step`.
     - `010_database_rls_hardening.sql`: Activación de RLS en `app_settings` y funciones con `SET search_path = public`.
     - `011_storage_objects_rls_hardening.sql`: Aislamiento RLS en almacenamiento de archivos.
     - `012_system_logs_and_vault_rls.sql`: Aislamiento en registros del sistema y bóveda global.
     - `013_supabase_security_advisors_hardening.sql`: Corrección final de advertencias del Security Advisor de Supabase.
   - **Resultado Oficial Supabase Advisors**: **0 errores y 0 advertencias**. 100% de las 11 tablas del sistema protegidas con Row Level Security.
   - Restricción estricta de ejecución de funciones sensibles: `REVOKE EXECUTE ON FUNCTION public.is_superadmin(UUID) FROM PUBLIC, anon, authenticated;`, limitando el uso exclusivamente al rol de servicio del backend.

### 7.4. Fase 3: Hardening Frontend, Sanitización DOM y DevOps Contenerizado
1. **Sanitización Estricta de Renderizado DOM (`DOMPurify`)**:
   - Incorporación de `dompurify` en `devsculptor-frontend` para limpiar cualquier contenido HTML dinámico antes de inyectarlo en el DOM (`dangerouslySetInnerHTML`), neutralizando vectores de Cross-Site Scripting (XSS).
   - Modo de seguridad estricto en Mermaid (`securityLevel: 'strict'`), escapando etiquetas peligrosas antes de generar el renderizado vectorial SVG.
2. **Scoping Estricto de Cabeceras BYOK**:
   - El interceptor de Axios en `api.ts` ahora restringe el envío de las cabeceras `X-User-OpenAI-Key`, `X-User-DeepSeek-Key`, etc. **exclusivamente a las rutas de inferencia del proyecto** (`^/projects/[0-9a-f-]{36}/ai/`), impidiendo que credenciales privadas del usuario se transmitan inadvertidamente en peticiones REST convencionales.
3. **Flujo Seguro de Códigos de Recuperación MFA**:
   - Modal dedicado para el despliegue único de códigos de recuperación tras la activación de 2FA, con opción de descarga de archivo `.txt` y copiado seguro.
4. **Políticas de Seguridad en Cabeceras (CSP)**:
   - Configuración de cabeceras de Content Security Policy (CSP), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff` y `Referrer-Policy: strict-origin-when-cross-origin` en `vercel.json` y plantillas de exportación.
5. **DevOps y Empaquetado Docker Producción**:
   - Script de compilación `build:assets` para sincronizar los scripts SQL de migración hacia `dist/database/migrations`.
   - Script automatizado `migrate:prod` para ejecutar migraciones en contenedores de producción sin requerir herramientas de desarrollo.
   - Directiva `HEALTHCHECK` nativa en Node.js dentro del `Dockerfile` para orquestadores Kubernetes / Render.
   - Manejadores globales de `uncaughtException` y `unhandledRejection` en `server.ts` con parada ordenada (Graceful Shutdown) y registro estructurado en Pino Logger.

---

## 8. Matriz de Cumplimiento de la Definición de Terminado (DoD)

| Criterio de Aceptación (DoD) | Estado | Evidencia Técnica |
| :--- | :---: | :--- |
| **Cero Errores de Compilación TypeScript** | ✅ CUMPLIDO | `npm run build` compila con 0 errores en frontend (Vite) y backend (`tsc && tsc-alias`). |
| **Gobernanza de Linting sin Errores** | ✅ CUMPLIDO | `npm run lint` finaliza con 0 errores y 0 advertencias bajo ESLint 9 Flat Config. |
| **Suite de Pruebas Automatizadas** | ✅ CUMPLIDO | 25/25 pruebas unitarias y de integración pasando con Vitest y Supertest. |
| **Gobernanza Supabase Advisors** | ✅ CUMPLIDO | **0 advertencias, 0 errores** en Supabase Security Advisors (100% de tablas protegidas con RLS). |
| **Tipado y Desacoplamiento de JWT** | ✅ CUMPLIDO | Discriminación estricta entre tokens `access` y `mfa_pending`. |
| **Revocación de Sesiones en Vivo** | ✅ CUMPLIDO | Invalidación de tokens mediante `token_version` en rotación de contraseñas y MFA. |
| **Protección contra Ataques de Temporización** | ✅ CUMPLIDO | Comparación ficticia `bcrypt.compare` ante usuarios inexistentes para evitar enumeración. |
| **Cifrado Simétrico de Secretos MFA** | ✅ CUMPLIDO | Secretos TOTP cifrados con AES-256-GCM y autenticación de integridad (Auth Tag). |
| **Protección contra Replay en TOTP** | ✅ CUMPLIDO | Validación RFC 6238 con persistencia de paso temporal (`last_totp_step`). |
| **Mitigación Anti-SSRF en Inferencia IA** | ✅ CUMPLIDO | Validador `safeUrl.ts` bloquea rangos de IP loopback, privadas y metadatos de nube; `redirect: 'error'`. |
| **Sanitización DOM contra XSS** | ✅ CUMPLIDO | Sanitización con `DOMPurify` y Mermaid en nivel de seguridad `strict`. |
| **Aislamiento de Cabeceras BYOK** | ✅ CUMPLIDO | Envío de credenciales restringido por regex exclusivamente a endpoints `/projects/:id/ai/*`. |
| **Arquitectura de IA Provider-Agnostic** | ✅ CUMPLIDO | Patrón Strategy/Adapter implementado (`IAiProvider`, `GeminiProvider`, `MockAiProvider`, `OpenAiProvider`). |
| **Protección de Credenciales de IA** | ✅ CUMPLIDO | API keys aisladas al 100% en backend `.env`; cero exposición en cliente o git. |
| **Bóveda Local BYOK (Bring Your Own Key)** | ✅ CUMPLIDO | Almacenamiento local en cliente (cero retención en BD), soporte multi-proveedor y ping test. |
| **Verdad en Catálogo de Modelos** | ✅ CUMPLIDO | Solo modelos con disponibilidad de servidor etiquetados como gratuitos; terceros requieren clave explícita. |
| **Separación de Dominios de Configuración** | ✅ CUMPLIDO | Drawer lateral izquierdo para estética/fondos/3FN y Popover en avatar para perfil/contraseñas/2FA. |
| **Gestión de Identidad y Contraseña Segura** | ✅ CUMPLIDO | Endpoints `PUT /auth/profile` y `PUT /auth/change-password` con hashing bcrypt salt 12. |
| **Resiliencia y Modo Offline Heurístico** | ✅ CUMPLIDO | `MockAiProvider` analiza contexto real de base de datos sin lanzar errores si no hay API key. |
| **Inyección 1-Click de Artefactos IA** | ✅ CUMPLIDO | Inserción directa de requisitos, entidades y ADRs con actualización de métricas en tiempo real. |
| **Seguridad RLS y Tenencia Horizontal** | ✅ CUMPLIDO | Todas las consultas filtran por `user_id` del token JWT verificado (Pilar 7). |
| **Validación Zod como SSOT** | ✅ CUMPLIDO | DTOs de entrada validados en middleware antes de los controladores. |
| **Rendimiento Visual a 60 FPS** | ✅ CUMPLIDO | Arrastre y Bezier calculados mediante `useRef` mutable y GPU transforms. |
| **Contraste WCAG 2.1 AA Dual Theme** | ✅ CUMPLIDO | Textos legibles y oscuros (`#090d16`) en modo claro y brillantes en modo oscuro. |
| **Bóveda de Documentación OKF (13 Plantillas)**| ✅ CUMPLIDO | Compilación de 13 artefactos normalizados con YAML frontmatter y SHA-256 state hashing. |
| **Detección de Desviación (Drift)** | ✅ CUMPLIDO | `okfVaultService` clasifica el estado en `FRESH`, `DRIFT_DETECTED` y `STALE`. |
| **Exportaciones Granulares Multi-Dialecto** | ✅ CUMPLIDO | Descarga directa de DDL (Postgres, MySQL, SQLite, Oracle), SRS e índice ADR. |
| **Contenerización y DevOps Listos** | ✅ CUMPLIDO | Dockerfile con multi-stage, `migrate:prod`, `build:assets` y `HEALTHCHECK` activo. |
| **Trazabilidad Git en `develop` y `main`** | ✅ CUMPLIDO | Commits atómicos bilingües con convención Conventional Commits y sincronización controlada. |


