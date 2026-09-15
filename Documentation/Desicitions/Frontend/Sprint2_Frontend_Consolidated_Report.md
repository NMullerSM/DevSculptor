# Informe Técnico Consolidado: Arquitectura e Integración Frontend (Sprint 2)

**Proyecto:** DevSculptor — Technical Governance & AI-Assisted Documentation  
**Asignatura / Portafolio:** Taller de Integración de Software (PTY4479)  
**Autor:** Nathaniel Muller San Martin  
**Ciclo de Desarrollo:** Sprint 2 / Semana 5 (Frontend, Autenticación e Integración de Dominio)  
**Fecha de Publicación:** Septiembre 2026  
**Versión del Artefacto:** 2.0.0 (Release Candidate Frontend UI)  
**Ubicación del Código:** [`devsculptor-frontend/`](file:///c:/Users/natha/Documents/Repos/DevSculptor/devsculptor-frontend)

---

## 📑 Tabla de Contenidos

1. [Ficha Técnica del Frontend](#1-ficha-técnica-del-frontend)
2. [Arquitectura de Pantallas y Flujos de Navegación](#2-arquitectura-de-pantallas-y-flujos-de-navegación)
3. [Integración con el Backend Core (Sprint 1)](#3-integración-con-el-backend-core-sprint-1)
4. [Diseño y Componentes: Apple visionOS Liquid Glassmorphism](#4-diseño-y-componentes-apple-visionos-liquid-glassmorphism)
5. [Auditoría de Cierre: Modales de Edición y Primitivas Glassmórficas](#5-auditoría-de-cierre-modales-de-edición-y-primitivas-glassmórficas)
6. [Estado de la Exportación OKF (Open Knowledge Framework)](#6-estado-de-la-exportación-okf-open-knowledge-framework)
7. [Aseguramiento de Calidad y Definición de Terminado (DoD)](#7-aseguramiento-de-calidad-y-definición-de-terminado-dod)
8. [Conclusiones y Preparación para el Sprint 3](#8-conclusiones-y-preparación-para-el-sprint-3)

---

## 1. Ficha Técnica del Frontend

| Parámetro | Definición Técnica |
| :--- | :--- |
| **Nombre del Sistema** | DevSculptor Studio Frontend |
| **Propósito** | Interfaz web de alta fidelidad para gobernanza técnica pre-código, modelado relacional y síntesis documental |
| **Framework & Runtime** | React 19.2+ con Vite 8.3+ |
| **Lenguaje y Tipado** | TypeScript en modo estricto (`strict: true`, `noUnusedLocals: true`, cero `any`) |
| **Gestor de Estado Global** | Zustand 5.0+ (Stores desacoplados: `useAuthStore`, `useProjectStore`, `useCanvasStore`, `useThemeStore`) |
| **Cliente HTTP** | Axios 1.20+ con interceptores de correlación (`X-Request-Id`) y Bearer JWT |
| **Estilizado & Layout** | Tailwind CSS 3.4+ con tokens personalizados de refracción y desenfoque óptico (`backdrop-blur`) |
| **Iconografía y Tipografía** | Google Material Symbols Outlined + Fuentes Inter / Fira Code |
| **Generador de Archivos** | JSZip 3.10+ y canvas-confetti 1.9+ |

---

## 2. Arquitectura de Pantallas y Flujos de Navegación

El frontend se organiza siguiendo el mapa de pantallas definido en el documento de convenciones:

```
                                  MAPA DE PANTALLAS (DEVSCULPTOR)
                                  
     [ Pantalla 0: /auth ] ──► [ Pantalla 1: /projects ] ──► [ Pantalla 2: Studio (/projects/:id) ]
     - Login & Registro        - Portfolio Hub              ┌─────────────────────────────────────┐
     - Validación Zod          - Crear / Editar Proyecto    │ • TopBar: Switcher, Theme & User    │
     - Bearer JWT              - Tarjetas con Métricas      │ • Left Dock: Pipeline de 5 Pasos    │
     - Deslogueo en 401        - Eliminación Segura         │ • Center: Workspace de 4 Vistas     │
                                                            │ • Right: CopilotInspector (SP Metr.)│
                                                            └─────────────────────────────────────┘
```

### 2.1. Pantalla 0: Portal de Acceso y Autenticación (`AuthPortal.tsx`)
* Vistas duales integradas en una tarjeta glassmórfica única: **Iniciar Sesión** y **Crear Cuenta**.
* Validación de email, longitud de contraseña y nombre completo.
* Interceptor de sesión: ante cualquier error HTTP `401 Unauthorized` retornado por el backend, la aplicación limpia el `localStorage` y redirige de forma transparente a esta pantalla mediante un evento desacoplado `auth:unauthorized`.

### 2.2. Pantalla 1: Hub de Proyectos (`ProjectsHub.tsx`)
* Panel de administración de proyectos multi-inquilino.
* Grid responsivo con visualización de nombre, descripción, estilo arquitectónico y fecha de creación.
* Acciones completas:
  - Inicializar nuevo proyecto (`CreateProjectModal.tsx`).
  - Modificar metadatos de proyectos existentes (`EditProjectModal.tsx`).
  - Eliminar proyecto con confirmación modal destructiva (`ConfirmModal.tsx`).
  - Abrir el Estudio de Gobernanza pasando el contexto del proyecto activo a `StudioWorkspace.tsx`.

### 2.3. Pantalla 2: Estudio de Gobernanza Tripartito (`StudioWorkspace.tsx`)
Diseñado bajo el patrón ergonómico **NotebookLM Studio System**, segmentado en tres paneles:
1. **FlowSidebar (Panel Izquierdo - 250px):** Navegación en 5 pasos secuenciales (`view-chat`, `view-reqs`, `view-docs`, `view-canvas`, `export-modal`), con badges numéricos reactivos que reflejan la cantidad de requisitos y ADRs registrados.
2. **Workspace Central (Panel Principal):**
   - *Vista Chat (`ChatConsultantView.tsx`):* Diálogo preliminar de consultoría pre-código.
   - *Vista Requisitos (`RequirementsView.tsx`):* Matriz IEEE-830 de requisitos funcionales y no funcionales.
   - *Vista ADRs (`DecisionsView.tsx`):* Catálogo de decisiones de arquitectura con transiciones de estado.
   - *Vista Canvas (`CanvasView.tsx`):* Lienzo relacional de entidades, generador multi-lenguaje (SQL, TS, JSON, Python) y visor de auditoría.
3. **CopilotInspector (Panel Derecho - 260px):**
   - Tarjeta reactiva del **Índice de Madurez** (0% a 100%) calculado por el Stored Procedure `sp_calculate_project_metrics`.
   - Indicadores de normalización 3FN y blindaje de políticas RLS (6 / 6).
   - Acciones rápidas contextuales.

---

## 3. Integración con el Backend Core (Sprint 1)

El frontend consume la API REST del backend respetando de forma estricta los contratos establecidos en el Sprint 1:

| Módulo Backend | Endpoint Consumido | Método HTTP | Servicio Frontend | Componente UI |
| :--- | :--- | :---: | :--- | :--- |
| **Auth** | `/api/v1/auth/register` | `POST` | `authService.register` | `AuthPortal.tsx` |
| **Auth** | `/api/v1/auth/login` | `POST` | `authService.login` | `AuthPortal.tsx` |
| **Projects** | `/api/v1/projects` | `GET`, `POST` | `projectsService.getAll`, `create` | `ProjectsHub.tsx` |
| **Projects** | `/api/v1/projects/:id` | `PUT`, `DELETE` | `projectsService.update`, `delete` | `ProjectsHub.tsx` |
| **Requirements** | `/api/v1/projects/:id/requirements` | `GET`, `POST` | `requirementsService.getAll`, `create` | `RequirementsView.tsx` |
| **Requirements** | `/api/v1/projects/:id/requirements/:reqId` | `PUT`, `DELETE` | `requirementsService.update`, `delete` | `RequirementsView.tsx` |
| **Decisions** | `/api/v1/projects/:id/decisions` | `GET`, `POST` | `decisionsService.getAll`, `create` | `DecisionsView.tsx` |
| **Decisions** | `/api/v1/projects/:id/decisions/:dId` | `PUT`, `DELETE` | `decisionsService.update`, `delete` | `DecisionsView.tsx` |
| **Decisions** | `/api/v1/projects/:id/decisions/:dId/status` | `PATCH` | `decisionsService.changeStatus` | `DecisionsView.tsx` |
| **Canvas** | `/api/v1/projects/:id/canvas` | `GET`, `POST` | `canvasService.getAll`, `createEntity` | `CanvasView.tsx` |
| **Canvas** | `/api/v1/projects/:id/canvas/:entityId` | `PUT`, `DELETE` | `canvasService.updateEntity`, `delete` | `CanvasView.tsx` |
| **Audit Logs** | `/api/v1/projects/:id/audit-logs` | `GET` | `canvasService.getAuditLogs` | `CanvasAuditView.tsx` |
| **Metrics** | `/api/v1/projects/:id/metrics` | `GET` | `metricsService.getByProject` | `CopilotInspector.tsx` |

### Trazabilidad y Observabilidad Extremo a Extremo
En [`apiClient.ts`](file:///c:/Users/natha/Documents/Repos/DevSculptor/devsculptor-frontend/src/services/apiClient.ts), cada petición genera un identificador UUID v4 que se inyecta en la cabecera `X-Request-Id`. Este identificador es capturado por el middleware de Pino en el backend, permitiendo correlacionar logs de servidor con acciones de usuario en el frontend con precisión de microsegundos.

---

## 4. Diseño y Componentes: Apple visionOS Liquid Glassmorphism

El sistema visual implementa las convenciones detalladas en `Frontend_Conventions_and_UX_UI_Guidelines.md`:
* **Fondo Escénico Multicapa (`WallpaperCanvas.tsx`):** Lienzo de fondo con imágenes escénicas espaciales desenfocadas y capas superpuestas de ruido fractal y gradientes radiales.
* **Tokens de Cristal Líquido:**
  - `vision-window`: `backdrop-blur-xl bg-white/[0.04] border border-white/[0.08] shadow-2xl rounded-2xl`.
  - `vision-card`: Superficies de segundo nivel con `bg-white/[0.03] border border-white/[0.06] rounded-xl`.
  - `vision-btn-primary`: Acento en degradado índigo-cian con efecto de biselado especular.
* **Tema Dual Canónico (`useThemeStore.ts`):** Soporte en caliente de modo Obsidian Crystal (espacial oscuro) y Snow Spatial Glass (luz polar), persistido en `localStorage`.

---

## 5. Auditoría de Cierre: Modales de Edición y Primitivas Glassmórficas

En la fase final de cierre del Sprint 2 se resolvieron todas las asimetrías de interfaz respecto a las capacidades del backend:

### 5.1. Implementación de Modales de Edición (Update)
1. **`EditProjectModal.tsx`:** Permite alterar el nombre del proyecto, la descripción y el estilo arquitectónico canónico mediante `projectsService.update()`.
2. **`EditRequirementModal.tsx`:** Permite actualizar el código formal (`RF-XX` / `RNF-XX`), título, tipo, prioridad y descripción técnica mediante `requirementsService.update()`.
3. **`EditDecisionModal.tsx`:** Permite modificar el título del dilema técnico, contexto de fuerzas en conflicto, decisión adoptada y consecuencias mediante `decisionsService.update()`, preservando intacto el estado inmutable de la máquina de estados.

### 5.2. Erradicación de Primitivas Nativas y Cero Logs
* **Componente `ConfirmModal.tsx`:** Se creó un componente reutilizable de diálogo modal con estética visionOS que reemplaza al 100% las llamadas nativas `confirm(...)` del navegador para operaciones destructivas (eliminar proyectos, requisitos o ADRs).
* **Eliminación de `alert(...)`:** Los errores de transición inválida de estados en ADRs o fallos de red se presentan mediante banners de error reactivos (`actionError`) en la interfaz.
* **Política de Cero Logs:** Se eliminaron todos los `console.error` de depuración en los stores y vistas, registrando los fallos en el estado reactivo `error` de Zustand.

---

## 6. Estado de la Exportación OKF (Open Knowledge Framework)

> [!IMPORTANT]
> **Declaración de Estado y Alcance Técnico de `OkfExportModal.tsx`:**  
> Conforme a la planificación de la asignatura (PTY4479) y lo acordado para el ciclo de desarrollo:
> * El modal [`OkfExportModal.tsx`](file:///c:/Users/natha/Documents/Repos/DevSculptor/devsculptor-frontend/src/features/export/OkfExportModal.tsx) se encuentra implementado funcionalmente en el frontend, demostrando la generación en memoria de archivos comprimidos (`.zip`) mediante la librería `JSZip`.
> * Para este cierre de Sprint 2, el modal incluye una **estructura base de ejemplo** que simula los directorios `/documentation`, `/database` y `/skills`.
> * **La conexión con las especificaciones vivas del árbol OKF, la extracción de plantillas markdown y la compilación de Prompt Bundles dinámicos queda formalmente calendarizada para el Sprint 4 (Semana 7 / S7 - Integración IA y Motor de Exportación)**, una vez que el motor de inferencia esté activo.

---

## 7. Aseguramiento de Calidad y Definición de Terminado (DoD)

### 7.1. Verificación de Compilación Estricta
* **Backend:** Ejecución de `npm run build` (`tsc && tsc-alias`):
  ```
  > devsculptor-backend@1.0.0 build
  > tsc && tsc-alias
  [Código de salida: 0 — Cero errores]
  ```
* **Frontend:** Ejecución de `npm run build` (`tsc -b && vite build`):
  ```
  > devsculptor-frontend@0.0.0 build
  > tsc -b && vite build
  ✓ 116 modules transformed.
  dist/index.html                   1.16 kB │ gzip:   0.65 kB
  dist/assets/index-B6nW3YQI.css   30.55 kB │ gzip:   7.36 kB
  dist/assets/index-NcD9CP59.js   466.97 kB │ gzip: 141.45 kB
  ✓ built in 11.18s
  [Código de salida: 0 — Cero errores]
  ```

### 7.2. Cumplimiento de la Definition of Done (DoD)
- [x] Vistas de autenticación conectadas y protegidas por JWT.
- [x] Vistas de Proyectos, Requisitos y ADRs con operaciones CRUD completas (Crear, Listar, Editar, Eliminar).
- [x] Máquina de estados finitos en ADRs sincronizada con recálculo de métricas en el Stored Procedure.
- [x] Interfaz 100% estilizada bajo tokens glassmórficos, sin primitivas nativas de depuración.
- [x] Cero advertencias ni errores de tipos en TypeScript estricto.
- [x] Documentación técnica consolidada para portafolio académico.

---

## 8. Conclusiones y Preparación para el Sprint 3

El **Sprint 2 (Frontend, Autenticación e Integración de Dominio)** concluye de forma **sobresaliente y completa al 100%**. 

El repositorio cuenta ahora con:
1. Un **Backend Core** blindado, auditado con RLS y probado en Postman (Sprint 1).
2. Un **Frontend Studio** responsivo, tipado y conectado a la API con experiencia visual de vanguardia (Sprint 2).

### Próximo Hito: Sprint 3 (Canvas ERD Avanzado & Motor de IA)
Con el Sprint 2 consolidado, el proyecto se encuentra en condiciones óptimas para realizar el merge hacia la rama principal (`main`) y dar inicio al **Sprint 3 (Semana 6 / S6 y Semana 7 / S7)**, cuyos ejes serán:
- Soporte visual de claves foráneas y relaciones 1:N / N:M con conectores Bezier.
- Modales para alteración y edición profunda de columnas y tipos en tablas del Canvas.
- Creación del módulo de Backend para IA (`src/modules/ai/`) y conexión en tiempo real del consultor conversacional en [`ChatConsultantView.tsx`](file:///c:/Users/natha/Documents/Repos/DevSculptor/devsculptor-frontend/src/features/chat/ChatConsultantView.tsx).
