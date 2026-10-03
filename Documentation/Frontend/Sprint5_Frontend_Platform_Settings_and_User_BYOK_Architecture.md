# Sprint 5 — Arquitectura de Frontend: Configuración de Plataforma y Gestión de Perfil de Usuario (BYOK)

**Estado:** Aprobado & Implementado  
**Fecha:** Octubre 2026  
**Autores:** Nathaniel Muller & Equipo de Arquitectura DevSculptor  
**Contexto:** Refactorización de Experiencia de Usuario (UX/UI), Separación de Responsabilidades y Seguridad de Credenciales de Inferencia.

---

## 1. Contexto y Justificación Arquitectónica

Durante las revisiones de usabilidad y seguridad de DevSculptor Studio, se identificaron las siguientes oportunidades de mejora estructural:

1. **Ambigüedad en el Catálogo de Modelos de IA:**
   - La presentación inicial de un catálogo genérico de modelos creaba la falsa expectativa de que seleccionar un modelo activaba automáticamente tokens sin configuración previa.
   - En plataformas profesionales de gobernanza técnica, solo los modelos provistos directamente por la infraestructura del servidor sin costo adicional pueden clasificarse como *Gratuitos / Incluidos* (`Gemini Flash`). Los modelos de proveedores de terceros (como OpenRouter, DeepSeek u OpenAI) requieren necesariamente que el usuario provea su propia clave privada (**BYOK - Bring Your Own Key**).

2. **Sobrecarga de la Barra Superior (Top Bar):**
   - La barra de navegación superior acumulaba múltiples accesos directos (seguridad, cerrar sesión, selector de modelos) que generaban ruido visual y rompían la estética minimalista inspirada en macOS / visionOS.
   - Se requería que la barra únicamente exhibiera el identificador del usuario (`NM`) y el acceso a la configuración del entorno (`tune`).

3. **Mezcla de Dominios de Configuración:**
   - Se mezclaban configuraciones del sistema (tema claro/oscuro, fondo de pantalla, desenfoque de ventanas, reglas 3FN) con credenciales privadas y datos de identidad del usuario.
   - **Decisión:** Establecer una separación estricta:
     - **Configuración de la Plataforma (Platform Settings):** Cajón deslizante lateral desde la izquierda (Left Slide-Over Drawer) para estética visual, iluminación, fondos y gobernanza pre-coding.
     - **Menú de Usuario y Credenciales (User Profile Popover):** Ventana flotante desacoplada bajo el avatar con perfil personal, actualización de contraseña, seguridad 2FA y bóveda local de API Keys (BYOK).

---

## 2. Componentes y Arquitectura de Implementación

### 2.1. Barra Superior Simplificada (`AppleTopBar.tsx`)
- Se eliminaron los botones redundantes de logout y el icono de escudo de la cabecera.
- La esquina superior derecha ahora cuenta exclusivamente con:
  - Botón de **Configuración de la Plataforma** (`tune` icon).
  - Botón de **Avatar del Usuario** (iniciales calculadas dinámicamente, ej. `NM`).
- Ambos activan sus respectivos paneles de forma independiente y con estado reactivo.

### 2.2. Cajón Deslizante de Configuración (`PlatformSettingsDrawer.tsx`)
- **Renderizado sin Recorte de Contenedor:**  
  Para evitar que las propiedades de `backdrop-filter` o transformaciones del encabezado delimiten el tamaño del contenedor fijo, el drawer y su fondo se montan directamente en el árbol raíz usando `createPortal(drawerContent, document.body)`.
- **Efecto Visual:**  
  Despliegue suave desde el lateral izquierdo (`animate-slide-right`), con backdrop atenuado y desenfoque gausiano.
- **Secciones Integradas:**
  1. **Modo de Iluminación:** Selector interactivo entre Modo Oscuro (Vidrio Ahumado) y Modo Claro (Luz Diurna).
  2. **Fondo de Pantalla del Estudio:**
     - Galería de 6 presets de alta resolución en Unsplash: *Alpinismo Apple, Lago Glaciar, Niebla Nórdica, Aurora Espacial, Yosemite Twilight, Mojave Night*.
     - Entrada de texto para especificar una URL de imagen externa personalizada.
  3. **Efectos de Vidrio y Opacidad:**
     - Slider interactivo para desenfoque de vidrio (Glass Blur de 5px a 45px).
     - Slider interactivo para opacidad de ventanas (Window Opacity del 50% al 98%).
  4. **Gobernanza & Convenciones Pre-Coding:**
     - Toggle de *Normalización Estricta 3FN* para exigir Tercera Forma Normal en el modelador de bases de datos.
     - Selector del *Prefijo Canónico de Requisitos* (`RF`, `REQ`, `US`).

### 2.3. Cajón Deslizante de Usuario y Bóveda BYOK (`UserProfileMenu.tsx`)
- **Despliegue Lateral Derecho (Right Slide-Over Drawer):**  
  En simetría con el drawer de configuración de plataforma (izquierda), el panel de usuario se despliega desde la **derecha hacia la izquierda** (`animate-slide-left`), montado en el `document.body` mediante `createPortal`.
- **Estética Opaca de Alta Densidad:**  
  Fondo oscurecido de alta opacidad (`bg-[#0c1222]/98` / `backdrop-blur-2xl`) con bordes redondeados a la izquierda (`!rounded-l-2xl !rounded-r-none`), garantizando máxima legibilidad y foco para la gestión de seguridad.
- **Navegación por Pestañas:**
  1. **Pestaña Perfil:**
     - Modificación de Nombre Completo conectado al endpoint `PUT /auth/profile`.
     - Visualización del correo institucional del usuario autenticado.
     - Formulario de Actualización de Contraseña conectado al endpoint `PUT /auth/change-password` (contraseña actual + validación de confirmación de nueva clave).
  2. **Pestaña Seguridad & 2FA:**
     - Estado de autenticación en dos factores (RFC 6238 TOTP).
     - Flujo de activación con clave secreta Base32 y verificación de código de 6 dígitos.
     - Desactivación controlada con confirmación de código TOTP activo.
  3. **Pestaña Mis API Keys (BYOK):**
     - Selector de proveedor de inferencia: *Google Gemini, OpenRouter, DeepSeek, OpenAI, Groq, Servidor Personalizado*.
     - Bóveda de persistencia local en navegador (`localStorage` cifrado/aislado mediante Zustand `persist`). Cero retención en base de datos para máxima privacidad.
     - Explicación clara y transparente: Si el usuario no introduce una API key propia, DevSculptor enruta las solicitudes a través del proveedor por defecto del servidor (Google Gemini Flash) sin costo adicional.
     - Botón de prueba de conectividad y latencia (*Ping Test*) en milisegundos contra el backend.
  4. **Pie de Página:**
     - Indicador de versión: `DevSculptor Studio v1.0`.
     - Botón de cierre de sesión seguro (*Logout*).

### 2.4. Limpieza del Encabezado del Copiloto (`CopilotInspector.tsx`)
- Se removió la pastilla redundante `ACTIVO` que colisionaba directamente con el botón de expansión a pantalla completa (`open_in_full`).
- Se incorporó un espaciado de seguridad (`pr-8`) en la cabecera del panel para garantizar una jerarquía visual limpia y sin superposiciones.

### 2.5. Motor de Visualización Dual de Diagramas Arquitectónicos (`MermaidVisualizer.tsx`)
- **Problema Abordado:** Las especificaciones de diagramas (UML 2.5, C4, paquetes, secuencias, ERD, estados) en formato `.mmd` o `mermaid` se visualizaban originalmente solo como bloques de texto plano.
- **Solución Arquitectónica Dual:**  
  1. **Sección Superior (Código Formal):** Muestra el código fuente `.mmd` / Mermaid con tipografía monoespaciada, conteo de líneas, botón de copia rápida y opción de colapsar/desplegar.
  2. **Sección Inferior (Diagrama Visual Interactivo):** Renderiza dinámicamente el diagrama como gráfico vectorial SVG mediante `mermaid.render()`.
  3. **Herramientas de Lienzo:** Controles interactivos de zoom (`-`, `+`, `100%`, `1:1`) y descarga directa del diagrama en formato vectorial `.svg`.
  4. **Exportación Nativa `.mmd`:** Botón dedicado en el espacio de documentos consolidados para descargar directamente la definición formal pura del diagrama (`.mmd`).
  5. **Integración en HTML Universal:** La exportación HTML y la vista ejecutiva inyectan Mermaid.js y estilos para que los diagramas se rendericen tanto en pantalla como al imprimir / guardar como PDF.

---

## 3. Matriz de Componentes y Almacenamiento

| Componente / Store | Responsabilidad | Persistencia |
| :--- | :--- | :--- |
| `AppleTopBar.tsx` | Cabecera minimalista macOS glass | React State |
| `PlatformSettingsDrawer.tsx` | Configuración estética, fondos y gobernanza 3FN (Left Slide-Over) | `useThemeStore` + `useSettingsStore` (`localStorage`) |
| `UserProfileMenu.tsx` | Gestión de cuenta, contraseñas, 2FA y claves BYOK (Right Slide-Over) | `useAuthStore` + `useSettingsStore` |
| `CopilotInspector.tsx` | Métricas de madurez SP, accesos de calidad e IA sin badges colisionantes | Props / `useProjectStore` |
| `MermaidVisualizer.tsx` | Módulo de renderizado dual de diagramas (.mmd + visual SVG interactivo) | React State / Mermaid Runtime |
| `ConsolidatedDocumentsView.tsx` | Explorador y compilador de 13 plantillas OKF con visor dual y exportación .mmd | React State / `okfTemplates.ts` |
| `useSettingsStore.ts` | Estado de API keys, proveedor activo, opacidad y gobernanza | `localStorage` (`devsculptor-settings`) |
| `useThemeStore.ts` | Tema claro/oscuro y wallpaper activo | `localStorage` (`devsculptor-theme-storage`) |
| `auth.service.ts` | Llamadas HTTP a endpoints de perfil y cambio de contraseña | REST API (`/auth/*`) |

---

## 4. Garantías de Seguridad y Rendimiento

1. **Cero Retención de Claves Privadas en BD:** Las API keys introducidas por el usuario no tocan la base de datos relacional de Supabase; residen exclusivamente en el entorno de ejecución del cliente.
2. **Aislamiento de Stacking Contexts:** El uso de `createPortal` asegura que ni el drawer izquierdo ni el drawer derecho sufran deformaciones por contenedores con `overflow`, `filter` o `transform`.
3. **División Dinámica de Paquetes (Chunk Splitting):** Vite divide los módulos pesados de Mermaid en chunks asíncronos (`classDiagram-v2`, `flowDiagram`, `erDiagram`, etc.) manteniendo el bundle inicial liviano.
4. **Validación TypeScript Estricta:** 100% libre de errores de tipado, compilado con `strict: true` y probado de punta a punta con Playwright.
