# DevSculptor — Informe Consolidado de Avance de Proyecto por Sprints (Sprint 1, 2 y 3 Completados - 100%)

**Proyecto:** DevSculptor — Technical Governance & AI-Assisted Documentation  
**Asignatura / Portafolio:** Taller de Integración de Software (PTY4479)  
**Autor:** Nathaniel Muller San Martin  
**Estado de Avance:** Sprint 1 (100%), Sprint 2 (100%), Sprint 3 (100% — Épicas A, B y C Culminadas)  
**Fecha de Emisión:** Septiembre 2026  
**Rama Activa:** `develop`  
**Repositorios / Directorios:** [`devsculptor-backend/`](file:///c:/Users/natha/Documents/Repos/DevSculptor/devsculptor-backend) | [`devsculptor-frontend/`](file:///c:/Users/natha/Documents/Repos/DevSculptor/devsculptor-frontend)

---

## 📑 Tabla de Contenidos

1. [Resumen Ejecutivo y Estado General del Proyecto](#1-resumen-ejecutivo-y-estado-general-del-proyecto)
2. [Sprint 1: Backend Core, Persistencia Relacional y Procedimientos Almacenados (100%)](#2-sprint-1-backend-core-persistencia-relacional-y-procedimientos-almacenados-100)
3. [Sprint 2: Frontend Base, Sistema de Diseño visionOS y Flujo Tripartito (100%)](#3-sprint-2-frontend-base-sistema-de-diseño-visionos-y-flujo-tripartito-100)
4. [Sprint 3: Canvas Avanzado, Multi-Motor DDL, Motor de IA y Gobernanza ADR (100% — Épicas A, B y C)](#4-sprint-3-canvas-avanzado-multi-motor-ddl-y-motor-de-ia-100--épicas-a-y-b-completadas)
   - 4.1. [Épica A: Canvas Avanzado, Modelado Relacional y DDL Multi-Dialecto (100%)](#41-épica-a-canvas-avanzado-modelado-relacional-y-ddl-multi-dialecto-100)
   - 4.2. [Épica B: Motor de Consultoría IA y Copiloto de Arquitectura en Tiempo Real (100%)](#42-épica-b-motor-de-consultoría-ia-y-copiloto-de-arquitectura-en-tiempo-real-100)
   - 4.3. [Épica C: Gobernanza Arquitectónica Progresiva, Selección Canónica en ADRs y Protocolo Human-in-the-Loop (100%)](#43-épica-c-gobernanza-arquitectónica-progresiva-selección-canónica-en-adrs-y-protocolo-human-in-the-loop-100)
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

## 6. Sprint 5: Hardening de Seguridad, Despliegue y Entrega Portafolio PTY4479 (Roadmap)

- **Auditoría de Seguridad Final**: Rate limiting granular, políticas CSP estrictas y sanitización contra inyecciones.
- **Contenerización y CI/CD**: Empaquetado Docker multicapa para backend y frontend con despliegue Cloud automatizado.
- **Consolidación Documental PTY4479**: Manual de usuario final, informe de arquitectura de software para titulación y video demostrativo de gobernanza técnica pre-código.

---

## 7. Matriz de Cumplimiento de la Definición de Terminado (DoD)

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
| **Bóveda de Documentación OKF** | ✅ CUMPLIDO | Compilación de 9 artefactos normalizados con YAML frontmatter y SHA-256 state hashing. |
| **Detección de Desviación (Drift)** | ✅ CUMPLIDO | `okfVaultService` clasifica el estado en `FRESH`, `DRIFT_DETECTED` y `STALE`. |
| **Exportaciones Granulares Multi-Dialecto** | ✅ CUMPLIDO | Descarga directa de DDL (Postgres, MySQL, SQLite, Oracle), SRS e índice ADR. |
| **Trazabilidad Git en `develop` y `main`** | ✅ CUMPLIDO | Commits atómicos bilingües con convención Conventional Commits y sincronización controlada. |

