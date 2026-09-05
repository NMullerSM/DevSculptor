# DevSculptor Frontend — Convenciones de Arquitectura, UX/UI y Directrices de Prototipado

Este documento constituye el estándar formal de arquitectura frontend, diseño visual y experiencia de usuario (UX/UI) para **DevSculptor**. Define el marco metodológico para la fase de prototipado rápido en tecnologías nativas (HTML/CSS/JS) y establece los lineamientos técnicos inmutables que regirán la construcción de la aplicación web en producción (**React + Vite + TypeScript**), garantizando una integración fluida con la API REST y la persistencia relacional construidas en el **Sprint 1 (Backend Core)**.

---

## 1. Estrategia Metodológica: El Prototipado como Gate de Validación

Para proyectos de alta complejidad visual e interactiva como DevSculptor —que combina gestión documental jerárquica con un **Canvas Interactivo para modelado relacional y generación DDL**— saltar directamente a la codificación de componentes React introduce un alto riesgo de sobreingeniería y refactorización continua del estado.

Por ello, se establece un flujo de dos etapas desacopladas:

```
[ 1. Sandbox de Prototipado ] ────► [ 2. Gate de Validación ] ────► [ 3. Construcción Real ]
  HTML5 Semántico                     Revisión de ergonomía           React 18+ con Vite
  Vanilla CSS (Design Tokens)         Validación UX/UI en vivo        TypeScript Estricto
  JavaScript Nativo (ES6+)            Aprobación funcional            Consumo API REST Backend
  (Carpeta: /Prototype)               (Checklist de Criterios)        (devsculptor-frontend)
```

### Reglas de la Carpeta `/Prototype`
1. **Tecnologías Exclusivas**: Únicamente archivos `.html`, `.css` y `.js` (ES6 modules nativos).
2. **Cero Dependencias y Cero Bundlers**: Prohibido el uso de `npm`, Webpack, Vite o Node.js dentro de `/Prototype`.
3. **Ejecución Inmediata**: Debe poder abrirse directamente en cualquier navegador o mediante una extensión ligera como *Live Server* sin requerir ningún paso de compilación previa.
4. **Propósito**: Probar layout, distribución espacial del canvas, jerarquía tipográfica, micro-interacciones, manipulación del DOM, cálculo trigonométrico/geométrico de conectores de tablas y ergonomía de paneles antes de abstraerlos en componentes React.

### Criterios del Gate de Validación (Checklist para transicionar a React)
Antes de trasladar una pantalla o componente a `devsculptor-frontend`:
- [ ] La ergonomía de interacción es intuitiva (el drag-and-drop no colisiona con el scroll ni genera lag visual).
- [ ] La jerarquía visual distingue sin ambigüedad elementos primarios, secundarios y terciarios.
- [ ] Los estados de interfaz (`Loading`, `Active`, `Empty State`, `Error State`) están conceptualizados.
- [ ] Los tokens de color y espaciado cumplen el estándar de contraste WCAG 2.1 AA (mínimo 4.5:1).
- [ ] Los flujos de modales y formularios contemplan validaciones de entrada correspondientes a los esquemas Zod del backend.

---

## 2. Stack Tecnológico Canónico del Frontend Real

Cuando los prototipos cumplan su ciclo de validación, la implementación de producción se ejecutará bajo el siguiente stack:

| Capa | Tecnología | Justificación Técnica |
| :--- | :--- | :--- |
| **Framework Base** | **React 18+** | Renderizado concurrente, ecosistema de componentes maduro y compatibilidad directa con librerías especializadas de diagramado de nodos (React Flow). |
| **Herramienta de Build** | **Vite** | Instant server start mediante ESM nativo, Hot Module Replacement (HMR) ultrarrápido y compilación de producción optimizada mediante Rollup. |
| **Lenguaje** | **TypeScript (`strict: true`)** | Tipado estricto alineado con los DTOs y tipos del backend (`User`, `Project`, `Requirement`, `ApiResponse<T>`), eliminando bugs en runtime. |
| **Sistema de Estilos** | **Vanilla CSS + Design Tokens** | Control milimétrico de propiedades visuales, animaciones de alto rendimiento mediante aceleración por GPU (`transform`, `opacity`) y cero sobrecarga de CSS-in-JS en runtime. |
| **Gestión de Estado** | **Context API + Zustand** | Context API para estados globales de aplicación (autenticación, usuario activo, tema). Zustand para el estado complejo, serialización y grafos del Canvas ERD. |
| **Cliente HTTP** | **Axios Centralizado** | Configuración de interceptores para inyección de JWT, propagación de `X-Request-Id`, manejo centralizado del envelope de respuesta y desconexión automática ante respuestas 401. |
| **Iconografía** | **Lucide Icons (SVG)** | Iconos vectoriales limpios, consistentes, escalables y con tree-shaking para optimizar el bundle final. |

---

## 3. Sistema de Diseño (Design System) y Estética Visual

DevSculptor debe transmitir una estética **"Cyber-Engineered & Precision Tool"**: moderna, sobria, técnica y orientada a la productividad prolongada sin fatiga visual.

### 3.1. Paleta de Colores (Tokens Semánticos)

Se establece un esquema Dark Mode de alto contraste y balance tonal refinado:

```css
:root {
  /* --- Fondos y Superficies --- */
  --bg-primary: #090d16;          /* Fondo base de la aplicación (Obsidian Deep) */
  --bg-secondary: #0f172a;        /* Superficie de paneles laterales y navegación */
  --bg-tertiary: #1e293b;         /* Fondo de tarjetas, modales y nodos del canvas */
  --bg-canvas: #070a10;           /* Lienzo infinito con patrón de grilla sutil */
  --bg-hover: rgba(255, 255, 255, 0.05);

  /* --- Bordes y Separadores --- */
  --border-subtle: rgba(255, 255, 255, 0.08); /* Delimitador de contenedores */
  --border-active: rgba(99, 102, 241, 0.4);   /* Borde con foco o selección */
  --border-canvas-grid: rgba(255, 255, 255, 0.04);

  /* --- Textos y Tipografía --- */
  --text-primary: #f8fafc;        /* Títulos y datos críticos (100% contraste) */
  --text-secondary: #94a3b8;      /* Párrafos, labels e información secundaria */
  --text-muted: #64748b;          /* Placeholders, metadatos y timestamps */
  --text-accent: #818cf8;         /* Enlaces activos e indicadores */

  /* --- Colores de Acento y Semántica --- */
  --accent-primary: #6366f1;      /* Indigo/Violet: Acciones primarias, botones principales */
  --accent-primary-hover: #4f46e5;
  --accent-cyan: #06b6d4;         /* Cyan: Nodos de tablas, relaciones y esquemas DDL */
  --accent-success: #10b981;      /* Emerald: Estados completados, guardado exitoso */
  --accent-warning: #f59e0b;      /* Amber: Advertencias de gobernanza y deuda técnica */
  --accent-danger: #ef4444;       /* Rose/Red: Eliminación destructiva y errores HTTP */

  /* --- Badges de Modelado Relacional --- */
  --badge-pk-bg: rgba(245, 158, 11, 0.15);
  --badge-pk-color: #fbbf24;      /* Primay Key (Dorado/Ámbar) */
  --badge-fk-bg: rgba(6, 182, 212, 0.15);
  --badge-fk-color: #22d3ee;      /* Foreign Key (Cyan brillante) */

  /* --- Sombras y Efectos de Capa --- */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -2px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 10px 25px -5px rgba(0, 0, 0, 0.6), 0 8px 10px -6px rgba(0, 0, 0, 0.6);
  --glass-bg: rgba(15, 23, 42, 0.75);
  --glass-blur: blur(12px);
}
```

### 3.2. Tipografía
- **Fuente Principal (UI)**: `Inter`, `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`.
  - Excelente legibilidad en densidades pequeñas (badges, tablas de metadatos).
- **Fuente Monoespaciada (Código y Esquemas)**: `JetBrains Mono`, `'Fira Code', 'Courier New', monospace`.
  - Imprescindible para tipos de datos SQL (`VARCHAR(255)`, `UUID`, `TIMESTAMP`), visualización de scripts DDL y preview de paquetes OKF.
- **Jerarquía**:
  - H1 (Títulos de vista): `1.75rem (28px)` / SemiBold (600).
  - H2 (Encabezados de panel/tarjeta): `1.25rem (20px)` / Medium (500).
  - Body (Texto regular): `0.875rem (14px)` / Regular (400).
  - Caption / Metadata / Badges: `0.75rem (12px)` / Medium (500).

### 3.3. Micro-interacciones y Transiciones
- Las animaciones deben ser funcionales, no meramente decorativas:
  - Transición estándar: `transition: all 0.15s cubic-bezier(0.16, 1, 0.3, 1)`.
  - Botones y elementos interactivos: feedback visual con sutil elevación y cambio de luminosidad en `:hover`, reducción ligera de escala en `:active` (`transform: scale(0.98)`).
  - Modales y Tooltips: Entrada con desvanecimiento y traslación vertical suave (`opacity: 0 -> 1`, `translateY(4px) -> translateY(0)`).
  - Skeleton Loaders: Animación shimmer tipo gradiente lineal para indicar carga de listas o tablas sin generar saltos de layout (CLS = 0).

---

## 4. Ergonomía y Arquitectura del Canvas Interactivo (ERD)

El modelador relacional es el núcleo diferencial de DevSculptor. Su experiencia de uso debe compararse a herramientas profesionales de ingeniería visual (Figma, Miro, draw.io).

### 4.1. Controles de Lienzo y Navegación
- **Panning (Desplazamiento)**:
  - Arrastre con botón central del ratón, o mantener pulsada la barra espaciadora + clic izquierdo y arrastrar.
  - Soporte multitáctil y trackpad de dos dedos en laptops.
- **Zooming (Escala)**:
  - Rueda del ratón centrada en la posición exacta del cursor (`transform-origin: mouseX mouseY`).
  - Límites seguros de zoom: mínimo `0.25x` (visión panorámica del esquema), máximo `2.0x` (inspección detallada de columnas y atributos).
- **Minimapa y Controles Rápidos**:
  - Panel flotante inferior con vista en miniatura de todas las entidades dispersas.
  - Botón "Centrar Vista / Zoom to Fit" para re-enfocar todo el modelo en la pantalla.

### 4.2. Anatomía de la Tarjeta de Tabla (Entity Node)
Cada tabla en el canvas se estructura como un nodo atómico:

```
┌─────────────────────────────────────────────────────────────┐
│ 🗄️  users                                      [::] [⋮]     │ ◄── Header (Nombre + Acciones)
├─────────────────────────────────────────────────────────────┤
│ 🔑 id            UUID        NOT NULL                       │ ◄── PK Badge
│    email         VARCHAR     UNIQUE, NOT NULL               │
│    password_hash VARCHAR     NOT NULL                       │
│ 🔗 role_id       UUID        FK -> roles.id                 │ ◄── FK Badge + Connector Port
│    created_at    TIMESTAMPTZ DEFAULT now()                  │
├─────────────────────────────────────────────────────────────┤
│ + Agregar columna...                                        │ ◄── Inline quick-add
└─────────────────────────────────────────────────────────────┘
```

- **Puertos de Conexión (Handles)**:
  - Puntos de anclaje magnéticos laterales para tirar cables de relación entre tablas.
  - Detección de cardinalidad visual: Marcadores en los extremos de la línea (1 a 1, 1 a N, N a M en notación Crow's Foot).
- **Rendimiento de Renderizado**:
  - Uso estricto de transformaciones CSS en GPU (`translate3d(x, y, 0)`).
  - Los cálculos de líneas SVG conectores deben ejecutarse en `requestAnimationFrame` para mantener 60 FPS estables durante el arrastre de tablas.

---

## 5. Principios de UX/UI y Experiencia de Usuario

### 5.1. Regla de los 5 Estados de Interfaz
Ninguna pantalla, lista o contenedor de datos puede implementarse sin definir explícitamente sus 5 estados:

1. **Estado Inicial / En Espera (`Idle`)**: Controles listos para interactuar.
2. **Estado de Carga (`Loading`)**: Skeleton loaders temáticos que replican la forma de las tarjetas o filas que se están trayendo del backend.
3. **Estado Activo / Con Datos (`Success`)**: Datos presentados con jerarquía, paginación o scroll virtualizado si excede 50 elementos.
4. **Estado Vacío (`Empty State`)**:
   - Jamás dejar una pantalla en blanco o solo un mensaje "No hay datos".
   - Debe incluir: Icono ilustrativo sutil, título explicativo ("No tienes proyectos aún"), párrafo orientativo y un **Call To Action (CTA)** destacado ("Crear mi primer proyecto").
5. **Estado de Error (`Error State`)**:
   - Mensaje comprensible para humanos (traduciendo códigos de error de la API).
   - Botón de acción inmediata: "Reintentar" o "Contactar soporte".

### 5.2. Guardado Progresivo y Prevención de Pérdida de Datos
- **Autoguardado con Debounce**: Las modificaciones de texto en requerimientos o cambios de posición en el canvas se envían al backend con un debounce de 800ms.
- **Indicador de Sincronización**: Un badge sutil en la barra superior muestra el estado en tiempo real:
  - 🔄 *Sincronizando cambios...*
  - 🟢 *Todos los cambios guardados*
  - 🔴 *Error al guardar — Reintentando en 5s...*
- **Confirmación Destructiva**: Cualquier eliminación de entidad (Proyecto, Requisito, Tabla) exige confirmación mediante un modal con foco atrapado y descripción clara del impacto ("Esta acción no se puede deshacer").

### 5.3. Accesibilidad Universal (a11y — WCAG 2.1 AA)
- **Ratio de Contraste**: Mínimo 4.5:1 entre el color del texto y su superficie de fondo.
- **Navegación por Teclado**:
  - Indicador de foco visible (`outline: 2px solid var(--accent-primary); outline-offset: 2px`).
  - Soporte de shortcuts intuitivos: `Ctrl + S` (Guardar manual), `Delete / Backspace` (Eliminar nodo seleccionado), `Esc` (Cerrar modales o deseleccionar), `Tab` (Navegación secuencial accesible).
- **Semántica y Atributos ARIA**:
  - Uso estricto de elementos nativos (`<nav>`, `<main>`, `<aside>`, `<header>`, `<footer>`, `<button>`).
  - Atributos dinámicos en componentes flotantes: `aria-expanded="true/false"`, `aria-haspopup="dialog"`, `role="region" aria-label="Lienzo de modelado"`.

---

## 6. Integración con el Backend Core (Sprint 1)

El frontend consumirá los servicios ya construidos y verificados en `devsculptor-backend`. Toda comunicación debe apegarse a los contratos vigentes:

### 6.1. Contrato de Respuesta Unificado (Envelope)

El frontend nunca asume payloads planos. Todos los clientes HTTP deben desempaquetar la estructura estándar:

```typescript
// src/types/api.types.ts

// Respuesta exitosa estándar
export interface ApiResponse<T> {
  success: true;
  data: T;
  meta?: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

// Respuesta de error estándar
export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;       // Ej: "VALIDATION_ERROR", "NOT_FOUND", "UNAUTHORIZED", "CONFLICT"
    message: string;    // Mensaje legible para el usuario
    details?: Array<{   // Errores específicos de campos Zod
      field: string;
      message: string;
    }>;
  };
}
```

### 6.2. Cliente de API Centralizado (Axios Interceptors)

```typescript
// src/services/apiClient.ts
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de Solicitud: Inyección de Token JWT y Request Tracking
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('devsculptor_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Genera o propaga un ID de solicitud para trazabilidad con Pino en backend
  if (!config.headers['X-Request-Id']) {
    config.headers['X-Request-Id'] = crypto.randomUUID();
  }
  return config;
});

// Interceptor de Respuesta: Manejo de Envelopes y Redirección 401
apiClient.interceptors.response.use(
  (response) => {
    // Si la API devuelve el envelope { success: true, data: T }, retornamos la data directamente
    return response.data;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('devsculptor_token');
      window.location.href = '/login';
    }
    return Promise.reject(error.response?.data?.error || {
      code: 'NETWORK_ERROR',
      message: 'No fue posible establecer conexión con el servidor.',
    });
  }
);
```

### 6.3. Mapa de Consumo de Endpoints Disponibles

| Dominio | Método | Ruta del Backend | Uso en Frontend |
| :--- | :--- | :--- | :--- |
| **Auth** | `POST` | `/api/v1/auth/register` | Registro de nuevo usuario en formulario de onboarding. |
| **Auth** | `POST` | `/api/v1/auth/login` | Autenticación, almacenamiento de JWT y perfil de usuario. |
| **Auth** | `GET` | `/api/v1/auth/me` | Validación de sesión activa al recargar la página. |
| **Projects** | `POST` | `/api/v1/projects` | Creación de nuevo proyecto de software. |
| **Projects** | `GET` | `/api/v1/projects` | Listado paginado de proyectos en el Dashboard principal. |
| **Projects** | `GET` | `/api/v1/projects/:id` | Carga de contexto del proyecto activo en el Workspace. |
| **Projects** | `PUT` | `/api/v1/projects/:id` | Actualización de nombre o descripción del proyecto. |
| **Projects** | `DELETE`| `/api/v1/projects/:id` | Eliminación de proyecto previa confirmación modal. |
| **Requirements** | `POST` | `/api/v1/projects/:projectId/requirements` | Creación de Requisito Funcional (RF) o No Funcional (RNF). |
| **Requirements** | `GET` | `/api/v1/projects/:projectId/requirements` | Matriz de requerimientos con filtros por tipo y prioridad. |
| **Requirements** | `PUT` | `/api/v1/projects/:projectId/requirements/:id` | Edición de título, descripción o prioridad con autoguardado. |
| **Requirements** | `DELETE`| `/api/v1/projects/:projectId/requirements/:id` | Eliminación de requisito del backlog técnico. |

---

## 7. Estructura Canónica de Directorios del Frontend Real

Cuando se inicialice el proyecto en producción, se implementará la siguiente estructura modular:

```
devsculptor-frontend/
├── public/                         # Favicon, assets estáticos sin procesar
├── src/
│   ├── assets/                     # SVGs, logotipos y recursos vectoriales
│   ├── components/                 # Componentes UI transversales (Átomo / Molécula)
│   │   ├── ui/                     # Button, Input, Modal, Dropdown, Badge, Spinner
│   │   ├── feedback/               # Toast, Skeleton, Alert, ConfirmDialog
│   │   └── navigation/             # Navbar, Sidebar, Breadcrumb, UserMenu
│   │
│   ├── features/                   # MÓDULOS DE NEGOCIO (Alta cohesión)
│   │   ├── auth/                   # LoginForm, RegisterForm, useAuth
│   │   ├── projects/               # ProjectCard, ProjectList, CreateProjectModal
│   │   ├── requirements/           # RequirementsTable, RequirementDetailDrawer
│   │   ├── canvas/                 # EntityNode, ConnectionLine, CanvasToolbar, Minimap
│   │   └── export/                 # PromptBundlePreview, ZipDownloadButton
│   │
│   ├── layouts/                    # Plantillas estructurales de vista
│   │   ├── AuthLayout.tsx          # Vistas centradas para login/registro
│   │   ├── DashboardLayout.tsx     # Barra superior + navegación lateral
│   │   └── WorkspaceLayout.tsx     # Layout maximizado para el Canvas ERD
│   │
│   ├── hooks/                      # Custom hooks reutilizables
│   │   ├── useDebounce.ts          # Optimización de inputs y autoguardado
│   │   ├── useCanvasTransform.ts   # Matemáticas de pan, zoom y coordenadas relativas
│   │   └── useKeyboardShortcuts.ts # Atajos de teclado accesibles
│   │
│   ├── services/                   # Clientes HTTP y llamadas al backend
│   │   ├── apiClient.ts            # Instancia Axios con interceptores
│   │   ├── auth.service.ts
│   │   ├── projects.service.ts
│   │   └── requirements.service.ts
│   │
│   ├── stores/                     # Estado global con Zustand
│   │   ├── useCanvasStore.ts       # Nodos, conexiones, historial Undo/Redo
│   │   └── useProjectStore.ts      # Proyecto activo y metadatos de sesión
│   │
│   ├── styles/                     # Estilos globales y tokens
│   │   ├── tokens.css              # Variables CSS (paleta, fuentes, sombras)
│   │   ├── reset.css               # Reset moderno de box-sizing y tipografía
│   │   └── globals.css             # Clases utilitarias y estilos base del body
│   │
│   ├── types/                      # Definiciones TypeScript de dominio y API
│   │   ├── api.types.ts
│   │   ├── auth.types.ts
│   │   ├── project.types.ts
│   │   └── canvas.types.ts
│   │
│   ├── App.tsx                     # Enrutador principal de la aplicación
│   └── main.tsx                    # Punto de entrada de Vite
│
├── .env.example                    # VITE_API_URL documentada
├── index.html                      # HTML raíz con tipografía precargada
├── package.json
├── tsconfig.json                   # Strict TypeScript configurado
└── vite.config.ts                  # Configuración de Vite y alias de rutas
```

---

## 8. Matriz de Buenas Prácticas Frontend (Do's & Don'ts)

| Área | Lo que un Ingeniero Frontend HACE (Do) | Lo que un Ingeniero Frontend NUNCA hace (Don't) |
| :--- | :--- | :--- |
| **Estilos & Colores** | Usa variables CSS semánticas (`var(--bg-primary)`). | Jamás escribe valores hexadecimales "hardcodeados" dispersos en hojas de estilo (`#1e293b`). |
| **Tipado TypeScript** | Tipa todas las props, estados y respuestas HTTP con interfaces explícitas. | Prohibido el uso de `any` para salir del paso. |
| **Manejo de Respuestas** | Desempaqueta `response.data` respetando el envelope del backend. | Nunca asume que el backend devuelve un array plano sin verificar `success: true`. |
| **Canvas & Eventos** | Aplica `requestAnimationFrame` y transformaciones GPU (`translate3d`). | Jamás manipula `top` y `left` de forma síncrona en eventos `mousemove` (provoca reflow masivo). |
| **Feedback al Usuario** | Muestra Skeletons y Toasts para confirmar operaciones asíncronas. | Nunca deja la pantalla congelada sin indicador de carga ni feedback. |
| **Formularios** | Valida campos en tiempo real antes de enviar y replica restricciones Zod. | No envía payloads vacíos esperando que el backend descubra los errores. |
| **Seguridad de Tokens** | Limpia el token y redirige a login ante respuestas 401. | Nunca almacena contraseñas en claro ni ignora la expiración del token JWT. |
| **Accesibilidad (a11y)** | Incluye `aria-label`, foco visual navegable y soporte de teclado. | Prohibido usar `<div>` con `onClick` sin `role="button"`, `tabIndex={0}` ni listener de `Enter/Space`. |

---

> **Regla de Oro para el Frontend**:  
> *«Un buen diseño no es solo cómo se ve, sino cómo responde al usuario. Si el Canvas tiene lag, si un botón no da feedback de carga o si un error técnico asusta al usuario, la arquitectura de interfaz ha fallado.»*
