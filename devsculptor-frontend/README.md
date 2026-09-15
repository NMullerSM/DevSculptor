# DevSculptor — Frontend Canónico (React 18+ / Vite / TypeScript)

Aplicación web para la plataforma **DevSculptor (Gobernanza Técnica Pre-Coding & Compilación Documental OKF Asistida por IA)**.

Implementa el sistema de diseño **Apple visionOS Liquid Glassmorphism (v2)** integrado con el **Estudio Tripartito de Google NotebookLM**, consumiendo de forma desacoplada la API REST de `devsculptor-backend`.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología | Justificación |
| :--- | :--- | :--- |
| **Framework Base** | **React 18+** | Concurrencia, componentes modulares y gestión reactiva de DOM. |
| **Build Tool** | **Vite** | Arranque ESM nativo, HMR sub-segundo y empaquetado Rollup optimizado. |
| **Lenguaje** | **TypeScript (`strict: true`)** | Cero `any`. Tipado simétrico con los DTOs y envelopes del Backend. |
| **Sistema de Estilos** | **Vanilla CSS Tokens + Tailwind CSS** | Física óptica de cristal (`backdrop-filter: blur(...) saturate(...)`), biseles *sheen inset* y aceleración GPU. |
| **Gestión de Estado** | **Zustand** | Stores ligeros sin boilerplate para Auth, Tema, Proyectos y Canvas ERD. |
| **Cliente HTTP** | **Axios Centralizado** | Inyección de JWT, propagación de `X-Request-Id` UUID v4 y desempaquetado de envelope. |
| **Generador OKF** | **JSZip** | Compilación y empaquetado de artefactos deterministas en archivo `.zip`. |

---

## 📁 Estructura del Proyecto

```
devsculptor-frontend/
├── public/                 # Assets públicos y favicon
├── src/
│   ├── components/         # Componentes UI transversales
│   │   ├── layout/         # WallpaperCanvas (4 capas), AppleTopBar
│   │   └── ui/             # VisionButton, VisionInput, VisionPill, VisionModal, ThemeToggle
│   ├── features/           # Módulos de dominio de alta cohesión
│   │   ├── auth/           # AuthPortal (Login, Registro con validación)
│   │   ├── projects/       # ProjectsHub (Grid de proyectos, CreateProjectModal)
│   │   ├── studio/         # StudioWorkspace (Layout tripartito, FlowSidebar, CopilotInspector)
│   │   ├── chat/           # ChatConsultantView (Conversación y extracción guiada)
│   │   ├── requirements/   # RequirementsView (Matriz IEEE-830, CreateRequirementModal)
│   │   ├── decisions/      # DecisionsView (Actas ADR con máquina de estados)
│   │   ├── canvas/         # CanvasView (Lienzo ERD, EntityNode, BezierConnectors, scripts DDL/TS/JSON/Py, auditoría)
│   │   └── export/         # OkfExportModal (Empaquetador y descarga de ZIP determinista)
│   ├── services/           # Clientes HTTP hacia devsculptor-backend
│   │   ├── apiClient.ts    # Instancia Axios con interceptores de seguridad y X-Request-Id
│   │   ├── auth.service.ts
│   │   ├── projects.service.ts
│   │   ├── requirements.service.ts
│   │   ├── decisions.service.ts
│   │   ├── canvas.service.ts
│   │   └── metrics.service.ts
│   ├── stores/             # Stores globales con Zustand
│   │   ├── useAuthStore.ts
│   │   ├── useThemeStore.ts
│   │   ├── useProjectStore.ts
│   │   └── useCanvasStore.ts
│   ├── styles/             # Tokens y diseño Glassmorphism
│   │   ├── tokens.css      # visionOS Crystal Obsidian (Dark) vs Snow Spatial Glass (Light)
│   │   ├── glassmorphism.css # Primitivas de cristal (.vision-window, .vision-card, etc.)
│   │   └── index.css       # Entrada global con Tailwind
│   ├── types/              # Tipos TypeScript simétricos con el backend
│   ├── App.tsx             # Orquestador principal de pantallas y autenticación
│   └── main.tsx            # Punto de entrada
├── .env.example
├── package.json
├── tsconfig.app.json       # Strict mode activado
└── vite.config.ts          # Alias @/* y ESM resolution
```

---

## 🚀 Puesta en Marcha

### 1. Variables de Entorno
Copia `.env.example` a `.env`:
```bash
cp .env.example .env
```
Contenido por defecto:
```env
VITE_API_URL=http://localhost:3000/api/v1
```

### 2. Iniciar Servidor de Desarrollo
```bash
npm run dev
```
La aplicación se abrirá en `http://localhost:5173`.

### 3. Compilar para Producción
```bash
npm run build
```
Genera los artefactos optimizados en la carpeta `dist/`.
