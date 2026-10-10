# Sprint 6: Frontend Diagrams Studio & Consolidated Document Viewer Refinement

**Fecha:** 2026-10-09  
**Módulo:** `devsculptor-frontend`  
**Estado:** Completado y Verificado  
**Rama:** `feat/diagrams-studio`  

---

## 1. Resumen Ejecutivo y Objetivos

En el marco de la evolución de **DevSculptor**, se implementó una profunda optimización centrada en la **ligereza visual**, la **coherencia del flujo de diseño arquitectónico**, el soporte transversal para **Modo Claro / Modo Oscuro** en los motores de diagramación, y la purificación del catálogo de modelos para responder exclusivamente a la realidad del proyecto activo y sus documentos normativos **OKF (Open Knowledge Framework)**.

### Principales Logros:
1. **Reordenamiento del Flujo de Trabajo en Studio**: La sección *Diagramas* (`view-diagrams`) se ubicó inmediatamente por encima del *Modelador de Código / Canvas ERD* (`view-canvas`), reflejando la progresión de abstracción arquitectónica de alto nivel antes del modelado de entidades y tablas.
2. **Depuración del Catálogo de Diagramas (100% Proyecto y OKF)**: Se eliminaron los diagramas internos de infraestructura de la plataforma DevSculptor (`platformSpecs.ts`). El visor interactivo ahora presenta exclusivamente los 8 diagramas formales derivados de los requisitos, decisiones ADR y entidades del proyecto.
3. **Modo Claro / Oscuro en Motores Vectoriales SVG y Mermaid**:
   - `GraphCanvas.tsx` y `SequenceCanvas.tsx` leen reactivamente `useThemeStore.theme` adaptando fondos de canvas, tramas de grilla, nodos, agrupaciones, aristas, gradientes y partículas animadas.
   - `MermaidVisualizer.tsx` re-inicializa Mermaid reactivamente según el tema actual (`'dark'` vs `'default'`), eliminando incompatibilidades de contraste.
4. **Alivianamiento Visual del Visor Documental (`ConsolidatedDocumentsView.tsx`)**:
   - Eliminación de etiquetas y badges ruidosos al lado del título.
   - Co-localización en una sola fila: Título del documento + Selector de Vista (`[Vista Ejecutiva | Diagrama | YAML & MD]`) inmediatamente a la derecha.
   - Conversión de acciones en micro-botones compactos (`Copiar`, `.md`, `.mmd`, `.html`, `PDF`).
   - Modo Pantalla Completa: Despliegue de un **Dock Flotante Glassmorphic** (`top-4 right-4 z-50`) que libera el 100% del lienzo documental.

---

## 2. Reorganización de Navegación en Studio Workspace

Se actualizó la barra lateral de etapas (`FlowSidebar.tsx`) y el contenedor de vistas (`StudioWorkspace.tsx`) para asegurar el siguiente orden secuencial de desarrollo:

```
[ Requisitos & Historias (SRS) ]
              ↓
[ Decisiones Arquitectónicas (ADR) ]
              ↓
[ Diagramas & Arquitectura (Visualizador OKF) ]  <-- Ubicado inmediatamente sobre el Modelador
              ↓
[ Modelador de Código & Canvas ERD ]
              ↓
[ Documentos Consolidados (OKF Vault) ]
```

### Archivos Modificados:
- `src/features/studio/FlowSidebar.tsx`: Entrada `'view-diagrams'` reordenada entre `view-decisions` y `view-canvas`.
- `src/features/studio/StudioWorkspace.tsx`: Renderizado condicional y dock de navegación móvil sincronizados.

---

## 3. Catálogo de Diagramas de Proyecto Formalizados (OKF)

Se purgó el catálogo para erradicar especificaciones abstractas de la plataforma. Ahora los 8 modelos corresponden estrictamente al proyecto del usuario y se correlacionan 1:1 con las plantillas OKF:

| ID Diagrama | Tipo | Título | Correlación OKF | Datos Reales Enlazados |
| :--- | :--- | :--- | :--- | :--- |
| `project-classes-uml` | `graph` | Modelo de Clases y Dominio | `OKF-004-UML-CLASS` | Entidades Canvas, columnas PK/FK, tipos de datos. |
| `project-packages-modular` | `graph` | Arquitectura de Paquetes Modulares | `OKF-006-UML-COMPONENT` | Módulos del proyecto (`auth`, `projects`, `canvas`, etc.). |
| `project-sequence-e2e` | `sequence` | Flujo de Ejecución E2E | `OKF-005-UML-SEQUENCE` | Actores, Frontend, Gateway, Microservicios, PostgreSQL. |
| `project-state-adrs` | `graph` | Máquina de Estados de Gobernanza ADR | `OKF-007-UML-STATE` | Decisiones en estado `PROPOSED`, `ACCEPTED`, `REJECTED`. |
| `project-c4-components` | `graph` | Diagrama C4 de Contenedores y Servicios | `OKF-008-UML-DEPLOY` | API Gateway, Engine, Database, Vault, Audit. |
| `project-cloud-deployment` | `graph` | Topología de Despliegue Cloud | `OKF-009-UML-ACTIVITY` | Nginx Ingress, Pods Kubernetes, Cloud SQL, Almacenamiento. |
| `project-erd-canvas` | `graph` | Relacional de Entidades ERD | `OKF-010-UML-PACKAGE` | Esquemas relacionales modelados en el Canvas. |
| `project-traceability-flow` | `sequence` | Trazabilidad Requisito → Código | `OKF-002-SRS` | Cadena Requisitos → ADR → Esquema DB → Contrato API. |

### Archivos Modificados:
- `src/features/diagrams/catalog/projectBuilders.ts`: 8 constructores deterministas enlazados con `ProjectDiagramContext`.
- `src/features/diagrams/catalog/diagramCatalog.ts`: Catálogo consolidado con tipo `kind: 'graph' | 'sequence'` y filtro temático.
- *Eliminado:* `src/features/diagrams/catalog/platformSpecs.ts`.

---

## 4. Adaptabilidad Modo Claro / Modo Oscuro en Motores Vectoriales

Se parametrizaron todos los tokens gráficos para responder a `theme === 'dark'`:

### A. Tokens y Paletas (`diagramTheme.ts`)
- **Modo Oscuro**: Fondo `#070b16`, grilla radial `rgba(255,255,255,0.06)`, nodos `#0d1527` con bordes de cristal y texto `#f8fafc`.
- **Modo Claro**: Fondo `#f8fafc`, grilla radial `rgba(99, 102, 241, 0.20)`, nodos `#ffffff` con sombras suaves, bordes con tinte semántico y texto `#0f172a`.
- **Aristas y Partículas**: Opacidades y colores de halo ajustados para garantizar legibilidad y contraste > 4.5:1 (WCAG AA).

### B. Secuencias Interactivas (`SequenceCanvas.tsx`)
- Líneas de vida verticales, tarjetas de mensajes y animaciones de paquetes con temporizador de playback adaptadas para ambos temas.
- Corrección del manejador de arrastre (`onMouseMove={handleMouseMove}`).

### C. Renderizado Mermaid (`MermaidVisualizer.tsx`)
- Inicialización dinámica de Mermaid ante cambios de tema mediante `mermaid.initialize({ theme: theme === 'dark' ? 'dark' : 'default', ... })`.
- Forzado de re-renderizado reactivo del bloque SVG.

---

## 5. Alivianamiento Visual en `ConsolidatedDocumentsView.tsx`

Para resolver la sobrecarga visual reportada por el usuario en el visor de documentos OKF, se aplicaron las siguientes reformas ergonómicas:

```
ANTES (Sobrecargado):
[Fila 1] [Título Documento] [Badge Standard Cyan]
         [Ruta: /docs/... • Vinculado a Bóveda OKF]
[Fila 2] [Vista Ejecutiva | Diagrama | YAML & MD] ────────── [Copiar] [.md] [.mmd] [.html] [PDF / Imprimir] [Pantalla Completa]

AHORA (Ligereza Visual - Modo Estándar):
[Fila Única] [Título Documento]  [Vista Ejecutiva | Diagrama | YAML & MD] ─── [Copiar] [.md] [.mmd] [.html] [PDF] [⛶]

AHORA (Pantalla Completa Inmersiva):
Lienzo Documental al 100% de Ancho y Alto
                                                                      [ Dock Flotante Glassmorphic ]
                                                                      [Modo: Ejecutiva|YAML] [Copiar] [.md] [PDF] [✕ Salir]
```

### Características del Nuevo Diseño:
1. **Sin etiquetas de colores en cabecera**: Se eliminaron los badges superfluos que generaban distracción visual.
2. **Selector al lado derecho del título**: El control segmentado se aloja inmediatamente al lado del nombre del documento en la misma línea.
3. **Micro-botones de acción**: Botones compactos (`p-1.5`, texto `[10px]` o icono vectorizado) que ocupan un mínimo espacio horizontal.
4. **Dock Flotante en Pantalla Completa**: Permite al lector concentrarse 100% en la lectura sin barras de herramientas fijas en la parte superior.

---

## 6. Panel Lateral de Flujo de Trabajo Colapsable (Espacio Central Maximizado)

Para responder a la solicitud de mayor amplitud en el área de trabajo central (Canvas, Diagramas, Documentos y Requisitos), se implementó un sistema de colapso lateral suave para la barra de navegación de etapas:

```
[ Estado Inicial: Abierto por Defecto (240px) ]
┌─────────────────────────┬────────────────────────────────────────────┬────────────────────────┐
│ Flujo de Trabajo   [⇥] │ Área Central (Canvas / Diagramas / Docs)   │ Copiloto IA (260px)    │
│ 1. Conversación         │                                            │                        │
│ 2. Requisitos           │                                            │                        │
│ 3. Documentos           │                                            │                        │
│ 4. Diagramas            │                                            │                        │
│ 5. Modelador Canvas     │                                            │                        │
└─────────────────────────┴────────────────────────────────────────────┴────────────────────────┘

[ Estado Colapsado hacia la Izquierda (Ganancia +240px de Lienzo) ]
┌──┬───────────────────────────────────────────────────────────────────┬────────────────────────┐
│  │                                                                   │                        │
│⇤ │ Área Central Expandida (100% de Ancho Disponible)                 │ Copiloto IA (260px)    │
│F │                                                                   │                        │
│l │                                                                   │                        │
│u │                                                                   │                        │
│j │                                                                   │                        │
│o │                                                                   │                        │
└──┴───────────────────────────────────────────────────────────────────┴────────────────────────┘
```

### Características Técnicas del Colapso:
1. **Abierto por Defecto al Inicio**: El estado `isFlowSidebarOpen` se inicializa siempre en `true` al acceder al estudio o recargar la página.
2. **Botón de Colapso en Cabecera (`FlowSidebar.tsx`)**: Se incorporó un botón con el icono `first_page` en la barra superior del panel que pliega la barra hacia la izquierda con animación fluida `transition-all duration-300 ease-in-out`.
3. **Lengüeta Vertical de Reapertura ("Flujo")**: Al estar colapsada, se despliega en el margen izquierdo una pestaña ultra-delgada de cristal con el icono `last_page` y texto vertical `Flujo`. Ocupa apenas 24 px, devolviendo inmediatamente el 100% de la visibilidad y tamaño al lienzo central.
4. **Atajo de Teclado Rápido (`Ctrl + B` / `Cmd + B`)**: Permite alternar la barra lateral al instante mediante teclado, respetando la entrada activa si el usuario está tipeando en un input o textarea.

---

## 7. Refinamiento del Copiloto de Arquitectura y Presets en ComboBox

Se eliminó la sobrecarga de consultas automáticas de la IA y se estructuró una experiencia de generación asertiva y granular:

1. **ComboBox de Modo Preset en la Cabecera (`ChatConsultantView.tsx`)**:
   - Reemplazó los 4 botones ejecutores inferiores con un selector desplegable con 5 modos:
     - 🏛️ `General (Integral)`: Generación multidimensional completa (Requisitos, Tablas Canvas, Diagramas UML y ADRs).
     - 💬 `Conversación (Asesoría)`: Asesoría técnica y consultoría pura sin generar inyecciones automáticas.
     - 📐 `Diagramado (UML / BPMN)`: Generación exclusiva de diagramas arquitectónicos y de procesos.
     - 🗄️ `Canvas ERD (Tablas 3FN)`: Modelado de entidades relacionales para el Canvas.
     - 📋 `Requisitos (IEEE-830)`: Síntesis de requerimientos funcionales y no funcionales.
   - El *placeholder* del campo de texto se sincroniza dinámicamente con el modo activo.
2. **Barra Inferior Rediseñada**:
   - Ahora actúa como indicador del preset activo y provee accesos rápidos directos (`Diagramas ↗`, `Canvas ↗`, `Requisitos ↗`), permitiendo saltar a las vistas del proyecto sin disparar prompts involuntarios.
3. **Inyección de Diagramas en Chat y Sincronización en el Estudio**:
   - Corrección de la condición `hasActions` para mostrar las tarjetas de diagrama cuando la IA responde solo con diagramas.
   - Botón directo `+ Inyectar` que cambia a `Inyectado ✓` con notificación *toast* sin interrumpir el hilo de chat ni redirigir involuntariamente.
   - Botón independiente `Estudio ↗` para abrir el Estudio de Diagramas a demanda.
   - Los diagramas inyectados se sincronizan reactivamente en `DiagramsView.tsx` (`injectedAiDiagrams`) bajo la pestaña **UML OKF (Mermaid)** con la insignia `OKF IA`.

---

## 8. Validación de Calidad y Compilación

- **Linting (`npm run lint` / `oxlint`)**: 0 errores en 105 archivos.
- **TypeScript (`tsc -b`)**: 0 errores con verificación estricta (`strict: true`, zero `any`).
- **Build de Producción (`vite build`)**: Generación de bundles exitosa en 2.38s.
- **Pruebas de Navegador Automatizadas**:
  - Verificado el colapso del panel de flujo hacia la izquierda y su reapertura con la lengüeta vertical.
  - Verificada la inyección de diagramas en chat (`+ Inyectar` $\to$ `Inyectado ✓`).
  - Verificado el ComboBox de modos de arquitectura.
  - Verificada la visualización de diagramas BPMN y UML en el Estudio de Diagramas.
- **Servidores en Vivo**:
  - Frontend: `http://localhost:5173`
  - Backend: `http://localhost:3000`
- **Control de Versiones**: Sin commits ni merges según instrucción explícita del usuario.
