# DevSculptor Frontend — Especificación Maestra de Características y Evolución por Sprints

> **Documento Maestro:** `Documentation/Frontend/Frontend_Features_and_Sprints_Specification.md`  
> **Proyecto:** DevSculptor Frontend SPA (`devsculptor-frontend`)  
> **Autor:** Nathaniel Muller San Martín & AI Pair Programming Architect  
> **Fecha:** Octubre 2026 (Consolidación Integral Sprints 2 a 6)  
> **Estado:** COMPLETADO, VERIFICADO Y DOCUMENTADO EN `develop`  
> **Cobertura Funcional:** S2 (Core UI & Canvas) ➔ S3 (Copilot & HITL ADRs) ➔ S4 (OKF Compiler & Admin Cockpit) ➔ S5 (BYOK Drawer & Wallpapers) ➔ S6 (Diagrams Studio & Export)  

---

## 📑 Tabla de Contenidos

1. [Visión General de la Experiencia de Usuario y Arquitectura de Pantallas](#1-visión-general-de-la-experiencia-de-usuario-y-arquitectura-de-pantallas)
2. [Sprint 2: Núcleo SPA, Hub de Proyectos y Canvas Relacional ERD](#2-sprint-2-núcleo-spa-hub-de-proyectos-y-canvas-relacional-erd)
   - 2.1. [Portal de Acceso y Gestión de Sesión (`AuthPortal`)](#21-portal-de-acceso-y-gestión-de-sesión-authportal)
   - 2.2. [Hub de Proyectos y Tarjetas con Cálculo de Madurez](#22-hub-de-proyectos-y-tarjetas-con-cálculo-de-madurez)
   - 2.3. [Studio Central: Barra Superior, Muelle Lateral y Espacio de Trabajo](#23-studio-central-barra-superior-muelle-lateral-y-espacio-de-trabajo)
   - 2.4. [Lienzo Relacional Interactivo ERD (`CanvasModeler`)](#24-lienzo-relacional-interactivo-erd-canvasmodeler)
3. [Sprint 3: Copiloto IA Lateral y Ratificación de ADRs *Human-in-the-Loop*](#3-sprint-3-copiloto-ia-lateral-y-ratificación-de-adrs-human-in-the-loop)
   - 3.1. [Panel del Asistente Copiloto IA (`CopilotDrawer`)](#31-panel-del-asistente-copiloto-ia-copilotdrawer)
   - 3.2. [Flujo Interactivo *Human-in-the-Loop* para Selección de Arquitecturas](#32-flujo-interactivo-human-in-the-loop-para-selección-de-arquitecturas)
   - 3.3. [Visualización Gráfica del Ciclo de Vida de ADRs](#33-visualización-gráfica-del-ciclo-de-vida-de-adrs)
4. [Sprint 4: Compilador OKF en Cliente y Consola de Superadministrador](#4-sprint-4-compilador-okf-en-cliente-y-consola-de-superadministrador)
   - 4.1. [Motor de Manifiestos OKF (*One Knowledge Format*) y Árbol de Documentos](#41-motor-de-manifiestos-okf-one-knowledge-format-y-árbol-de-documentos)
   - 4.2. [Consola Maestra de Superadministrador (`AdminCockpit`)](#42-consola-maestra-de-superadministrador-admincockpit)
   - 4.3. [Editor y Publicador de Bóveda Global (`GlobalVaultEditor`)](#43-editor-y-publicador-de-bóveda-global-globalvaulteditor)
5. [Sprint 5: Cajón de Configuración, Fondos Dinámicos y Bóveda Local BYOK](#5-sprint-5-cajón-de-configuración-fondos-dinámicos-y-bóveda-local-byok)
   - 5.1. [Cajón Portal Izquierdo de Plataforma (`PlatformSettingsDrawer`)](#51-cajón-portal-izquierdo-de-plataforma-platformsettingsdrawer)
   - 5.2. [Selector de Fondos Espaciales y Personalización Visual](#52-selector-de-fondos-espaciales-y-personalización-visual)
   - 5.3. [Bóveda de Claves Propias de IA (BYOK Modal & Scoped Storage)](#53-bóveda-de-claves-propias-de-ia-byok-modal--scoped-storage)
6. [Sprint 6: Estudio de Diagramas Vectoriales y Exportación Multi-Formato](#6-sprint-6-estudio-de-diagramas-vectoriales-y-exportación-multi-formato)
   - 6.1. [Estudio de Diagramas Mermaid SVG (`DiagramsStudio`)](#61-estudio-de-diagramas-mermaid-svg-diagramsstudio)
   - 6.2. [Visor Ejecutivo de Documentación Técnica](#62-visor-ejecutivo-de-documentación-técnica)
   - 6.3. [Motor de Exportación Multi-Formato (Markdown, HTML y ZIP)](#63-motor-de-exportación-multi-formato-markdown-html-y-zip)
7. [Matriz de Estado Global: Zustand Stores y Reactividad](#7-matriz-de-estado-global-zustand-stores-y-reactividad)

---

## 1. Visión General de la Experiencia de Usuario y Arquitectura de Pantallas

La interfaz de usuario de **DevSculptor** está diseñada bajo los principios estéticos de **Apple visionOS Liquid Glassmorphism**, combinando refracción óptica, desenfoque de fondo (*backdrop-blur*), capas translúcidas y retroalimentación táctil/visual inmediata:

```
                                  MAPA DE PANTALLAS (DEVSCULPTOR)
                                  
     [ Pantalla 0: /auth ] ──► [ Pantalla 1: /projects ] ──► [ Pantalla 2: Studio (/projects/:id) ]
     - Portal de Acceso        - Portfolio Hub              ┌─────────────────────────────────────┐
     - Login / Registro        - Crear / Editar Proyecto    │ • TopBar: Switcher, Theme & Perfil  │
     - Recuperación Pass       - Madurez % Ponderada        │ • Left Dock: Pipeline de 4 Vistas   │
     - Verificación 2FA        - Eliminación Segura         │ • Center: Workspace Dinámico        │
                                                            │ • Right: CopilotInspector (IA / SP) │
                                                            └─────────────────────────────────────┘
```

---

## 2. Sprint 2: Núcleo SPA, Hub de Proyectos y Canvas Relacional ERD

### 2.1 Portal de Acceso y Gestión de Sesión (`AuthPortal`)
- **Diseño Glassmórfico de Entrada:** Panel central flotante con efecto de cristal esmerilado y fondo espacial animado.
- **Alternador de Pestañas:** Transición suave entre "Iniciar Sesión" y "Crear Cuenta".
- **Soporte de 2FA TOTP:** Pantalla intercalada para el ingreso del código de 6 dígitos cuando la cuenta tiene MFA habilitado.
- **Modales Secundarios:** Recuperación de contraseña (`ForgotPasswordModal`) y restablecimiento por token (`ResetPasswordModal`).

### 2.2 Hub de Proyectos y Tarjetas con Cálculo de Madurez
- **Vista en Cuadrícula Responsiva:** Tarjetas de proyectos con gradientes de acento, estado de avance y fecha de última modificación.
- **Indicador de Madurez Dinámico:** Presenta el índice porcentual (0% a 100%) calculado por el procedimiento almacenado PostgreSQL `sp_calculate_project_maturity`.
- **Acciones Rápidas:** Creación de nuevo proyecto, edición de metadatos y borrado protegido por diálogo de confirmación destructiva.

### 2.3 Studio Central: Barra Superior, Muelle Lateral y Espacio de Trabajo
- **Barra Superior Minimalista (`TopBar`):** Selector de proyecto activo, botón de regreso al Hub, conmutador de tema claro/oscuro y avatar de perfil con acceso al cajón de credenciales.
- **Muelle Lateral de Navegación (`LeftDock`):** Conecta las 4 vistas troncales del pipeline de gobernanza:
  1. *Requerimientos:* Matriz de requisitos funcionales y no funcionales (IEEE-830).
  2. *Decisiones:* Registro formal de ADRs y máquina de estados.
  3. *Lienzo Relacional:* Editor ERD interactivo visual.
  4. *Documentos:* Visor y compilador de documentación técnica OKF.

### 2.4 Lienzo Relacional Interactivo ERD (`CanvasModeler`)
- **Renderizado de Nodos y Entidades:** Cada tabla se representa como una tarjeta flotante con cabecera de color, columnas, tipos de datos (`UUID`, `VARCHAR`, etc.) y badges de constraints (`PK`, `FK`, `NN`, `UQ`).
- **Conectores Curvos Bezier:** Conexiones visuales SVG dinámicas que representan relaciones relacionales (`1:1`, `1:N`, `N:M`).
- **Optimización de Tráfico:** Durante el arrastre (*drag & drop*), las coordenadas se actualizan localmente a 60 FPS en el store de Zustand (`useCanvasStore`), despachando una única petición PATCH al backend solo al soltar el ratón (`onPointerUp`), eliminando la saturación de red.

---

## 3. Sprint 3: Copiloto IA Lateral y Ratificación de ADRs *Human-in-the-Loop*

### 3.1 Panel del Asistente Copiloto IA (`CopilotDrawer`)
- Despliegue lateral reactivo sin superponer el espacio de trabajo principal.
- Capacidad de consultar dudas arquitectónicas inyectando automáticamente el contexto del proyecto (requerimientos y tablas activas).
- Renderizado de respuestas formateadas con Markdown y bloques de código con sintaxis coloreada.

### 3.2 Flujo Interactivo *Human-in-the-Loop* para Selección de Arquitecturas
- El copiloto propone alternativas arquitectónicas (ej. Monolito vs Microservicios, PostgreSQL vs DynamoDB) detallando pros, contras y compensaciones (*trade-offs*).
- El usuario humano selecciona y ratifica la decisión con un solo clic, convirtiéndola automáticamente en un registro formal de ADR en estado `ACCEPTED`.

### 3.3 Visualización Gráfica del Ciclo de Vida de ADRs
- Badges semánticos para cada estado (`PROPOSED`, `ACCEPTED`, `REJECTED`, `SUPERSEDED`).
- Bloque visual que conecta ADRs obsoletos con su sucesor ratificado.

---

## 4. Sprint 4: Compilador OKF en Cliente y Consola de Superadministrador

### 4.1 Motor de Manifiestos OKF (*One Knowledge Format*) y Árbol de Documentos
- **Explorador Jerárquico de Archivos:** Árbol interactivo que simula una estructura de repositorio (`/architecture/`, `/decisions/`, `/models/`, `/INDEX.md`).
- **Auditoría de Frescura:** Compara el hash SHA-256 de cada sección documental contra la versión más reciente del modelo relacional, indicando con un badge si la documentación está sincronizada o desactualizada (*stale*).

### 4.2 Consola Maestra de Superadministrador (`AdminCockpit`)
Accesible exclusivamente para usuarios con rol `SUPERADMIN`:
- **Tarjetas de Telemetría Global:** Conteo total de proyectos, usuarios registrados y llamadas al motor LLM.
- **Auditoría de Seguridad en Vivo:** Tabla interactiva que consulta `security_events` con filtros por tipo de evento (`LOGIN_FAILED`, `ACCOUNT_LOCKED`, etc.) y rango de fechas.
- **Gestión de Cuentas:** Capacidad de suspender o reactivar usuarios mediante interruptores rápidos.

### 4.3 Editor y Publicador de Bóveda Global (`GlobalVaultEditor`)
Permite redactar, previsualizar y publicar plantillas arquitectónicas maestras con sanitización DOM integrada.

---

## 5. Sprint 5: Cajón de Configuración, Fondos Dinámicos y Bóveda Local BYOK

### 5.1 Cajón Portal Izquierdo de Plataforma (`PlatformSettingsDrawer`)
- Se abre desde el extremo izquierdo de la pantalla utilizando la API de React Portal, garantizando aislamiento de contexto z-index.
- Agrupa ajustes del sistema, preferencias de renderizado de diagramas y opciones de rendimiento visual.

### 5.2 Selector de Fondos Espaciales y Personalización Visual
- Selector interactivo con miniaturas de fondos estelares y paisajes cósmicos de alta resolución.
- Persistencia inmediata de la elección en `localStorage` con hidratación instantánea al recargar la página.

### 5.3 Bóveda de Claves Propias de IA (BYOK Modal & Scoped Storage)
- Permite a los usuarios ingresar sus propias API keys de Google Gemini, DeepSeek u OpenAI.
- **Almacenamiento Seguro en Cliente:** Las credenciales se conservan localmente y solo se adjuntan en la cabecera `X-User-Ai-Key` cuando se realizan consultas al endpoint específico `/projects/:id/ai/*`.

---

## 6. Sprint 6: Estudio de Diagramas Vectoriales y Exportación Multi-Formato

### 6.1 Estudio de Diagramas Mermaid SVG (`DiagramsStudio`)
- Visualizador interactivo de diagramas con controles de zoom, paneo y recentrado.
- Renderizado reactivo de sintaxis Mermaid con nivel de seguridad `strict` y filtrado `sanitizeSvg()`.
- Soporte para diagramas de arquitectura C4, flujo de secuencias, diagramas de estado y modelos relacionales.

### 6.2 Visor Ejecutivo de Documentación Técnica
- Renderizado de documentos completos con soporte para tablas estilizadas, bloques de alertas (Note, Tip, Important, Warning, Caution) y diagramas Mermaid embebidos.

### 6.3 Motor de Exportación Multi-Formato (Markdown, HTML y ZIP)
- Generación de archivos descargables `.md` individuales o paquetes `.zip` estructurados mediante `JSZip`.
- Exportación HTML auto-contenida con hojas de estilo embebidas para presentación ante clientes o evaluadores sin conexión a internet.

---

## 7. Matriz de Estado Global: Zustand Stores y Reactividad

| Store | Archivo | Responsabilidad Principal | Persistencia |
| :--- | :--- | :--- | :---: |
| `useAuthStore` | `src/store/useAuthStore.ts` | Token JWT, perfil del usuario activo, estado 2FA y cierre de sesión | `localStorage` |
| `useProjectStore`| `src/store/useProjectStore.ts` | Lista de proyectos, proyecto seleccionado, requerimientos y ADRs | Memoria |
| `useCanvasStore` | `src/store/useCanvasStore.ts` | Entidades del ERD, posiciones X/Y, conexiones y selecciones | Memoria + API sync |
| `useThemeStore` | `src/store/useThemeStore.ts` | Modo claro/oscuro y fondo de pantalla activo | `localStorage` |
| `useOkfStore` | `src/store/useOkfStore.ts` | Árbol de documentos OKF, estado de compilación y hashes SHA-256 | Memoria |
