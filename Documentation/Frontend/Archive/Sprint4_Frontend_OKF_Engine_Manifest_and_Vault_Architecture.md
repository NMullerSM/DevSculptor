# Sprint 4 — Especificación Técnica Frontend: Motor OKF, Manifiesto INDEX.md y Bóveda Documental

**Proyecto:** DevSculptor Core Frontend  
**Sprint:** Sprint 4 — Etapa A  
**Autor:** Nathaniel Muller San Martin  
**Estado:** IMPLEMENTADO Y VERIFICADO EN `develop`  
**Fecha:** Septiembre 2026  
**Componentes Impactados:**
- `devsculptor-frontend/src/features/export/okfDocumentProcessor.ts`
- `devsculptor-frontend/src/features/export/okfVaultService.ts`
- `devsculptor-frontend/src/features/export/OkfExportModal.tsx`
- `devsculptor-frontend/src/features/canvas/CanvasView.tsx`
- `devsculptor-frontend/src/features/requirements/RequirementsView.tsx`
- `devsculptor-frontend/src/features/decisions/DecisionsView.tsx`
- `devsculptor-frontend/src/components/ui/VisionModal.tsx`

---

## 1. Fundamentos Conceptuales del OKF (One Knowledge Format)

El estándar **OKF (*One Knowledge Format*)** en DevSculptor es una especificación determinista y orientada a máquinas, diseñada para unificar y gobernar todo el conocimiento arquitectónico del software en la era de la **Ingeniería de Software Asistida por Inteligencia Artificial (AIASE)**.

### Mitigación del *"Vibe Coding"* y la Alucinación Arquitectónica:
Los modelos de lenguaje (Cursor, Claude Code, GitHub Copilot, Devin, Gemini CLI) fracasan cuando reciben información fragmentada o desactualizada. El OKF garantiza que cualquier agente de IA que opere sobre el repositorio cuente con:
1. **Un punto único de entrada (`/INDEX.md`):** El manifiesto maestro que instruye al modelo en qué orden secuencial estricto debe procesar los documentos para asimilar el contexto de negocio y arquitectura antes de generar código.
2. **Hashes SHA-256 de Estado e Integridad:** Cada documento cuenta con una firma criptográfica única. Si un desarrollador muta una entidad relacional o altera un requerimiento, el sistema detecta de inmediato el *Architectural Drift* (desvío de documentación vs. realidad).
3. **Encabezados YAML Frontmatter Estrictos:** Metadatos canónicos legibles tanto por humanos como por parsers automatizados.

---

## 2. Las Dos Variantes de Árbol OKF

### 2.1. Árbol General (Bóveda Maestra de Sistema / Nivel Plataforma)
* **Ubicación:** `okf-vault/_global/`
* **Gobierno:** Administrador Maestro (Etapa 4B).
* **Propósito:** Contiene las plantillas canónicas (`TEMPLATE_SRS_IEEE830.md`, `TEMPLATE_ADR_MADR.md`), el manual oficial de ingeniería (`devsculptor-architect.md`) y las configuraciones base de agentes (`master.cursorrules`, `master.claude.md`). Los proyectos nuevos heredan su calidad técnica de esta raíz.

### 2.2. Árbol Personal (Bóveda Viva de Proyecto)
* **Ubicación:** `okf-vault/{user_id}/{project_id}/`
* **Gobierno:** Usuario / Equipo de Proyecto.
* **Propósito:** La representación viva y ejecutable de la verdad técnica de ese proyecto en particular.

```text
.
├── INDEX.md                                       # [RAÍZ] Manifiesto maestro y protocolo de IA
├── documentation/
│   ├── requirements/
│   │   └── SRS_Requisitos_IEEE830.md              # Requisitos de software IEEE-830 clasificados
│   └── adrs/
│       ├── ADR_INDEX.md                           # Índice consolidado de decisiones técnicas
│       └── ADR-001_seleccion_de_monolito.md       # Actas individuales en formato MADR
├── database/
│   ├── schemas/
│   │   └── schema_ddl_postgresql.sql              # DDL físico generado del canvas
│   └── dictionaries/
│       ├── DATA_DICTIONARY.md                     # Diccionario de datos de entidades
│       └── ERD_DIAGRAM.md                         # Diagrama Entidad-Relación en Mermaid
├── skills/
│   └── devsculptor-architect.md                   # Manual de conducta técnica y buenas prácticas
└── context/
    ├── PROMPT_MAESTRO_CONTEXTO.md                 # Contexto unificado y minificado para LLMs
    ├── .cursorrules                               # Configuración de contexto para Cursor AI
    └── CLAUDE.md                                  # Guía de comandos para Claude Code
```

---

## 3. El Manifiesto Maestro y Protocolo de IA (`INDEX.md`)

El archivo `INDEX.md` se genera dinámicamente como el **documento #0** de la bóveda. Incorpora los siguientes bloques indispensables:

### 3.1. Frontmatter YAML con Protocolo de Ingestión
```yaml
---
okf_spec: "1.0.0"
document_id: "OKF-INDEX-001"
document_type: "OKF_INDEX_MANIFEST"
project_id: "..."
project_name: "..."
title: "..."
canonical_path: "INDEX.md"
tags: ["okf", "manifest", "okf-index", "ai-protocol", "reading-order", "governance"]
freshness:
  status: "FRESH"
  last_verified: "2026-09-18T21:40:51Z"
  state_hash: "cd7cbe416e5d..."
  verified_by: "Nathaniel Muller"
ai_reading_order:
  - step: 1
    path: "INDEX.md"
    purpose: "Manifiesto maestro, inventario de integridad criptográfica y mapa de navegación"
  - step: 2
    path: "context/PROMPT_MAESTRO_CONTEXTO.md"
    purpose: "Identidad, stack tecnológico, puertos y restricciones globales del proyecto"
  - step: 3
    path: "skills/devsculptor-architect.md"
    purpose: "Directrices de ingeniería, reglas de codificación estricta y arquitectura transversal"
  - step: 4
    path: "documentation/requirements/SRS_Requisitos_IEEE830.md"
    purpose: "Catálogo oficial de Requisitos Funcionales (RF) y No Funcionales (RNF) bajo IEEE-830"
  - step: 5
    path: "documentation/adrs/ADR_INDEX.md"
    purpose: "Registro consolidado de Decisiones de Arquitectura (ADRs) ratificadas e inmutables"
  - step: 6
    path: "database/schemas/schema_ddl_postgres.sql"
    purpose: "DDL físico relacional, tablas, tipos, claves primarias, foráneas e índices"
  - step: 7
    path: "database/dictionaries/DATA_DICTIONARY.md"
    purpose: "Diccionario exhaustivo de entidades, atributos, cardinalidades y diagramas"
  - step: 8
    path: "context/.cursorrules"
    purpose: "Reglas de comportamiento y contexto de sistema para Cursor AI IDE"
  - step: 9
    path: "context/CLAUDE.md"
    purpose: "Guía de comandos de desarrollo, test y convención de estilo para Claude Code"
---
```

### 3.2. Tabla de Verificación Criptográfica
Incluye una tabla en Markdown calculada en caliente con todos los documentos presentes en el paquete, su categoría, los primeros 16 caracteres de su hash SHA-256 y su estado de vigencia (*FRESH* / *STALE*).

### 3.3. Guardarraíles de Arquitectura
Instrucciones explícitas de gobernanza que prohíben a la IA violar ADRs aceptados o alterar modelos relacionales sin generar la migración DDL correspondiente.

---

## 4. Servicio de Bóveda y Control de Frescura (`okfVaultService.ts`)

El servicio `okfVaultService` gestiona la compilación reactiva y la evaluación de vigencia en el cliente:
* **`compileVault(projectId, dialect, verifier)`:** Recopila concurrentemente mediante `Promise.all` los requisitos, decisiones ADR y entidades del Canvas (priorizando el estado en memoria de `useCanvasStore` para reflejar ediciones no persistidas).
* **`evaluateFreshnessWithSnapshot(projectId, currentDocs)`:** Compara los hashes SHA-256 actuales con la última línea base ratificada en `localStorage`. Si un hash discrepa, marca el documento como `STALE` de forma transparente.
* **`calculateSummary(documents)`:** Calcula la métrica de vigencia (`freshnessScore: 0 - 100%`) y desglosa los conteos por categorías (`manifest`, `documentation`, `database`, `skills`, `context`).
* **`generateZipBundle(documents)`:** Utiliza `JSZip` para estructurar los subdirectorios y comprimir el paquete en un Blob `DEFLATE` en menos de 2 segundos.
* **`downloadSingleDocument(doc)`:** Facilita la descarga individual inmediata de cualquier documento con su nombre canónico.

---

## 5. Interfaz de Usuario y Descargas Granulares (RF11)

### 5.1. Modal de Exportación OKF (`OkfExportModal.tsx`)
* **Explorador de Árbol Estructurado:**
  - Muestra la raíz bajo **`⭐ / (Raíz OKF)`** destacando el archivo `INDEX.md` con un badge distintivo `INDEX` y el icono `auto_awesome`.
  - Subcarpetas colapsables para `/documentation/requirements`, `/documentation/adrs`, `/database/schemas`, `/database/dictionaries`, `/skills` y `/context`.
* **Previsualizador de Código Monospace:** Muestra el contenido completo con syntax highlighting y scroll independiente.
* **Selector de Motor DDL en Caliente:** Permite alternar la generación DDL entre PostgreSQL, MySQL, SQLite y Oracle en tiempo real.
* **Banners de Salud Arquitectónica:** Muestra el índice de frescura cuantitativo y el botón **"Ratificar Bóveda"** cuando existen documentos modificados.

### 5.2. Descargas Granulares Directas
Se habilitaron botones de descarga directa en las barras de herramientas de cada vista:
* **Canvas de Datos (`CanvasView.tsx`):** Botón *"Descargar"* para obtener el script DDL SQL activo con cabecera YAML.
* **Módulo de Requisitos (`RequirementsView.tsx`):** Botón *"Exportar SRS (.md)"* para obtener la especificación IEEE-830.
* **Gobernanza ADR (`DecisionsView.tsx`):** Botón *"Exportar ADRs (.md)"* para obtener el compendio de decisiones de arquitectura.

---

## 6. Verificación y Resultados

* **Suite de Pruebas Unitaria / Integración (`test_okf_processor.ts`):** 11 de 11 documentos compilados satisfactoriamente, verificando rutas canónicas, slugs normalizados y encabezados YAML estrictos.
* **Compilación de Producción (`npm run build`):** `tsc -b && vite build` exitoso en 1.23 segundos con 0 errores.
* **Auditoría de Linter (`npm run lint`):** 0 errores oxlint.
