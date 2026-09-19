# Sprint 4 — Especificación Técnica Frontend: Consola de Gobernanza Maestra, Editor In-Situ de Bóveda Global y Reemplazo de Archivos

**Proyecto:** DevSculptor Frontend (visionOS Studio)  
**Sprint:** Sprint 4 — Etapa B (Etapa 4B)  
**Autor:** Nathaniel Muller San Martin  
**Estado:** IMPLEMENTADO Y VERIFICADO EN `develop`  
**Fecha:** Septiembre 2026  
**Componentes Impactados:**
- `devsculptor-frontend/src/types/auth.types.ts`
- `devsculptor-frontend/src/types/admin.types.ts`
- `devsculptor-frontend/src/services/admin.service.ts`
- `devsculptor-frontend/src/stores/useAdminStore.ts`
- `devsculptor-frontend/src/components/layout/AppleTopBar.tsx`
- `devsculptor-frontend/src/App.tsx`
- `devsculptor-frontend/src/features/admin/AdminConsoleView.tsx`
- `devsculptor-frontend/src/features/admin/tabs/GlobalVaultTab.tsx`
- `devsculptor-frontend/src/features/admin/tabs/PlatformStatsTab.tsx`
- `devsculptor-frontend/src/features/admin/tabs/AuditLogsTab.tsx`
- `devsculptor-frontend/src/features/admin/tabs/UserManagementTab.tsx`
- `devsculptor-frontend/src/features/admin/components/CreateVaultFileDialog.tsx`

---

## 1. Resumen Ejecutivo

La **Etapa 4B** dota al frontend de DevSculptor de un **Cockpit de Gobernanza Técnica y Consola de Administrador Maestro** de grado visionOS. Exclusivo para usuarios con rol `SUPERADMIN`, este entorno centraliza:
1. **La edición in-situ y en caliente** de las reglas canónicas de IA y plantillas globales de la plataforma.
2. **Descarga de la Bóveda Global** en paquete ZIP estructurado y descarga de archivos individuales.
3. **Reemplazo del archivo completo** desde el explorador del sistema operativo o mediante arrastre directo (Drag & Drop).
4. **Monitoreo de Telemetría** en tiempo real y verificación de salud de la plataforma.
5. **Auditoría Transversal** con inspección interactiva de mutaciones relacionales en PostgreSQL.
6. **Gestión de Usuarios y Roles (RBAC)** para la administración de accesos y privilegios.

---

## 2. Experiencia de Usuario y Acceso Exclusivo en `AppleTopBar`

### 2.1. Botón Insignia Dorado "Consola Maestra"
* En la barra superior flotante (`AppleTopBar.tsx`), se evalúa la propiedad `user?.role === 'SUPERADMIN'`.
* Si la condición se cumple, se renderiza un botón insignia con estética dorada/ámbar, borde iluminado (`shadow-[0_0_14px_rgba(245,158,11,0.35)]`) y el icono `shield_person`.
* Si un usuario no autorizado intenta forzar el estado de pantalla `currentScreen === 'admin'`, el componente `App.tsx` ejecuta un guardarraíl en cliente que revierte inmediatamente la navegación a `'studio'`.

---

## 3. Arquitectura de las 4 Pestañas del Cockpit

### 3.1. Pestaña 1: Explorador Jerárquico Visual de Bóveda OKF (`_global/`) y Editor In-Situ
* **Explorador Visual Jerárquico de Carpetas OKF:**
  - Estructura visual de carpetas colapsables con badges especializados (`INDEX`, `YAML`, `RULES`, `SKILL`, `DB`, `ADR`, `SRS`).
  - Raíz canónica `/_global (Raíz del Árbol)` con visibilidad directa de `INDEX.md` y `okf.manifest.yaml`.
  - Distribución clara en subcarpetas: `system_skills/`, `rules/`, `templates/requirements/`, `templates/adrs/`, `templates/database/`.
  - Eliminación de la vista dividida permanente para maximizar el área de visualización del árbol jerárquico.
* **Activación del Editor In-Situ por Doble Clic:**
  - Al hacer doble clic sobre cualquier archivo canónico (o presionar el botón "Desplegar"), se abre el editor en un modal visionOS (`VisionModal`).
  - Resaltado monoespaciado, contador reactivo de líneas y caracteres en tiempo real, e indicador visual de estado sucio (*dirty indicator*).
  - Guardado atómico en caliente mediante atajo de teclado **`Ctrl + S` / `Cmd + S`** o botón dedicado.
  - Alternador de modo de edición a previsualización Markdown renderizada.
* **Exportación y Descarga de la Bóveda Global (.zip):**
  - Botón **"Exportar Bóveda OKF (.zip)"** en la barra superior de la bóveda.
  - Generación en cliente con `JSZip` empaquetando todos los archivos con compresión DEFLATE.
  - Descarga robusta con temporizador de revocación de URL de 10 segundos para prevenir cancelaciones tempranas de blob en navegadores Chromium/Blink.
  - Mecanismo de recuperación automática (*fetch fallback*) de contenidos si no estaban en el listado inicial.
* **Descarga Individual de Archivo:**
  - Botón **"Descargar Archivo"** dentro del editor in-situ para bajar el archivo individual a disco local.

### 3.2. Pestaña 2: Telemetría y Salud de la Plataforma
* Cuadrícula de tarjetas KPI con métricas agregadas:
  - Total de proyectos activos.
  - Usuarios registrados.
  - Entidades relacionales modeladas en canvas.
  - Requisitos documentados (SRS).
  - Promedio global de madurez técnica (`avg_maturity_score`).
* Tarjetas de diagnóstico de infraestructura (estado de PostgreSQL Pool, RLS activo y hashes SHA-256).

### 3.3. Pestaña 3: Trazabilidad y Registro de Auditoría
* Tabla reactiva de logs consultando `audit_logs` con selector de filtro por entidad (`projects`, `requirements`, `canvas_entities`, `global_vault_templates`, etc.).
* Modal de inspección de diferencias que presenta en paralelo los payloads JSON de `payload_before` y `payload_after`.

### 3.4. Pestaña 4: Gestión de Usuarios y Roles RBAC
* Listado de cuentas registradas con identificador de estado activo/inactivo.
* Selector interactivo de cambio de rol (`USER`, `ADMIN`, `SUPERADMIN`) con salvaguarda que impide que el superadministrador activo se auto-revoque sus propios privilegios.

---

## 4. Control de Calidad y Verificación

* **Compilación de Producción:** `tsc -b && vite build` finalizado con éxito (código de salida 0).
* **Análisis Estático:** `oxlint` ejecutado sobre 73 archivos sin errores (`0 errors`).
* **Integración API:** Respuestas normalizadas bajo el envelope estándar `{ success: true, data: ... }`.
