# Reporte de Auditoría de Base de Datos: Supabase Security & Performance
**Proyecto:** DevSculptor — Technical Governance & AI-Assisted Documentation  
**Módulo:** Persistencia Relacional PostgreSQL (Semana 4 / Sprint 1)  
**Entorno Evaluado:** Supabase Managed Cloud (`gtcuhxhwwqzfhleoozlz`, us-west-2, PostgreSQL 17.6)  
**Fecha de Evaluación:** Septiembre 2026  
**Herramienta de Auditoría:** Supabase Database Linter & Security/Performance Advisors  

---

## 1. Resumen Ejecutivo

Tras el despliegue del esquema relacional base del Sprint 1 (6 tablas DDL, 10 índices de rendimiento, trigger de auditoría y stored procedure de métricas), se ejecutó una inspección exhaustiva utilizando los linters y asesores de seguridad y rendimiento nativos de Supabase.

La auditoría identificó un total de **11 observaciones**:
- **6 Críticas (ERROR - Seguridad):** Tablas públicas con *Row Level Security (RLS)* desactivado expuestas al cliente PostgREST de Supabase.
- **3 Advertencias (WARN - Seguridad):** Funciones y procedimientos PL/pgSQL sin parámetro inmutable `search_path`.
- **1 Advertencia (WARN - Rendimiento):** Índice duplicado redundante en la columna `email` de la tabla `users`.
- **1 Informativa (INFO - Rendimiento):** Clave foránea sin índice de cobertura en `audit_logs(user_id)`.

> [!NOTE]
> Adicionalmente, se reportaron 5 avisos de *Unused Index*, los cuales fueron catalogados como **falsos positivos temporales**, dado que el esquema fue recién instanciado y no acumula volumen de telemetría de producción suficiente para que el optimizador de PostgreSQL registre lecturas en los índices recién creados.

---

## 2. Matriz de Hallazgos Detectados

| ID | Categoría | Severidad | Objeto Afectado | Descripción del Hallazgo |
| :--- | :--- | :---: | :--- | :--- |
| **SEC-01** | Seguridad | **ERROR** | `public.users`<br>`public.projects`<br>`public.requirements`<br>`public.canvas_entities`<br>`public.architecture_decisions`<br>`public.audit_logs` | Row Level Security (RLS) desactivado en esquema `public`. Expone acceso de lectura/escritura a través del API REST público de Supabase (`anon key`). |
| **SEC-02** | Seguridad | **WARN** | `fn_set_updated_at`<br>`fn_audit_canvas_entities`<br>`sp_calculate_project_metrics` | Parámetro `search_path` mutable en funciones PL/pgSQL, permitiendo potenciales ataques de secuestro de esquemas (*Search Path Hijacking*). |
| **PERF-01** | Rendimiento | **WARN** | `public.users` | Coexistencia de índices idénticos: `idx_users_email` y `users_email_key` sobre la misma columna, duplicando el consumo de I/O en escrituras y espacio en disco. |
| **PERF-02** | Rendimiento | **INFO** | `public.audit_logs` | Restricción FK `audit_logs_user_id_fkey` sin índice de cobertura. Puede ocasionar *sequential scans* durante operaciones `ON DELETE SET NULL`. |
| **PERF-03** | Rendimiento | **INFO** | Varios índices | Índices sin lecturas registradas (*Unused Index*). Esperado en bases de datos recién desplegadas. |

---

## 3. Análisis Técnico Detallado

### 3.1 Hallazgo SEC-01: Row Level Security (RLS) Desactivado en Esquema Público
* **Severidad:** `ERROR`
* **Referencia Oficial:** [Supabase Lint 0013: RLS Disabled in Public](https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public)
* **Descripción del Riesgo:**  
  Supabase expone automáticamente el esquema `public` a través de PostgREST (`https://<ref>.supabase.co/rest/v1/`). Cuando las tablas no tienen RLS activado (`rls_enabled = false`), cualquier cliente HTTP que posea la clave pública `anon` (la cual es visible en aplicaciones web del lado del cliente) tiene acceso directo de lectura y modificación sobre todos los registros de dichas tablas, evadiendo por completo la capa de aplicación.
* **Contexto en DevSculptor:**  
  La arquitectura de DevSculptor es un **Monolito Modular con backend Express**. Nuestro backend se conecta a PostgreSQL como superusuario/rol de servicio (`postgres`), el cual posee permisos de bypass nativos (`BYPASSRLS`). Por ende, el backend no necesita interactuar mediante PostgREST.
* **Solución Técnica:**  
  Activar `ROW LEVEL SECURITY` en las 6 tablas del sistema:
  ```sql
  ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.requirements ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.canvas_entities ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.architecture_decisions ENABLE ROW LEVEL SECURITY;
  ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
  ```
  > [!IMPORTANT]
  > Al activar RLS sin declarar políticas públicas (`CREATE POLICY`), PostgreSQL bloquea inmediatamente el acceso a los roles `anon` y `authenticated` de PostgREST, protegiendo la base de datos contra accesos directos de internet, mientras que nuestro backend Node.js mantiene acceso completo irrestricto mediante la conexión TCP directa de pool.

---

### 3.2 Hallazgo SEC-02: Parámetro `search_path` Mutable en Funciones PL/pgSQL
* **Severidad:** `WARN`
* **Referencia Oficial:** [Supabase Lint 0011: Function Search Path Mutable](https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable)
* **Descripción del Riesgo:**  
  Cuando una función o procedimiento almacenado se ejecuta sin fijar explícitamente el parámetro `search_path`, PostgreSQL utiliza la ruta de búsqueda del rol que invoca la función en la sesión actual. Un usuario con permisos de creación de objetos en un esquema secundario podría crear tablas o funciones con nombres homónimos para secuestrar la ejecución de la función (*Search Path Hijacking* / escalamiento de privilegios).
* **Solución Técnica:**  
  Configurar explícitamente `SET search_path = public, pg_temp` en la declaración de cada función:
  ```sql
  ALTER FUNCTION public.fn_set_updated_at() SET search_path = public, pg_temp;
  ALTER FUNCTION public.fn_audit_canvas_entities() SET search_path = public, pg_temp;
  ALTER FUNCTION public.sp_calculate_project_metrics(UUID) SET search_path = public, pg_temp;
  ```

---

### 3.3 Hallazgo PERF-01: Índice Duplicado en `users(email)`
* **Severidad:** `WARN`
* **Referencia Oficial:** [Supabase Lint 0009: Duplicate Index](https://supabase.com/docs/guides/database/database-linter?lint=0009_duplicate_index)
* **Descripción del Riesgo:**  
  En el script `001_initial_schema.sql`, la columna `email` fue declarada con la restricción `UNIQUE`, lo que generó automáticamente el índice único implícito `users_email_key`. Posteriormente, el script `002_indexes.sql` ejecutó `CREATE UNIQUE INDEX idx_users_email ON users(email);`.  
  Tener dos índices B-Tree exactamente iguales en la misma columna penaliza el rendimiento en cada `INSERT` y `UPDATE` de usuarios, requiriendo doble escritura y duplicando el espacio en memoria caché (*buffer pool*).
* **Solución Técnica:**  
  Eliminar el índice redundante y conservar la restricción de clave única del DDL:
  ```sql
  DROP INDEX IF EXISTS public.idx_users_email;
  ```

---

### 3.4 Hallazgo PERF-02: Clave Foránea sin Índice de Cobertura en `audit_logs(user_id)`
* **Severidad:** `INFO`
* **Referencia Oficial:** [Supabase Lint 0001: Unindexed Foreign Keys](https://supabase.com/docs/guides/database/database-linter?lint=0001_unindexed_foreign_keys)
* **Descripción del Riesgo:**  
  La columna `audit_logs.user_id` referencia a `users(id)` con la regla `ON DELETE SET NULL`. En PostgreSQL, las claves foráneas no indexan automáticamente la columna en la tabla hija. Si se elimina un usuario, el motor debe realizar un escaneo secuencial (*sequential scan*) completo sobre la tabla `audit_logs` para actualizar las referencias a `NULL`, lo cual se degrada gravemente a medida que el historial de auditoría crece.
* **Solución Técnica:**  
  Crear el índice de cobertura:
  ```sql
  CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
  ```

---

## 4. Script de Remediación Completo (Migración DDL 003)

Para aplicar todas las correcciones de forma atómica e idempotente en el repositorio y en Supabase, se ha diseñado el siguiente script SQL:

```sql
-- 003_security_and_performance_fixes.sql
-- Remediación de hallazgos identificados por Supabase Linter (Sprint 1)

-- 1. [SEC-01] Habilitación de Row Level Security (RLS) en todas las entidades públicas
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.canvas_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.architecture_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 2. [SEC-02] Fijación de search_path inmutable para funciones y procedimientos
ALTER FUNCTION public.fn_set_updated_at() SET search_path = public, pg_temp;
ALTER FUNCTION public.fn_audit_canvas_entities() SET search_path = public, pg_temp;
ALTER FUNCTION public.sp_calculate_project_metrics(UUID) SET search_path = public, pg_temp;

-- 3. [PERF-01] Eliminación del índice duplicado en users(email)
DROP INDEX IF EXISTS public.idx_users_email;

-- 4. [PERF-02] Creación de índice de cobertura para la FK user_id en audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
```

## 5. Resultados Post-Remediación

La migración de remediación fue aplicada exitosamente en el proyecto de Supabase mediante la herramienta `apply_migration` bajo el identificador `security_and_performance_fixes`. 

Una re-ejecución de los asesores de seguridad y rendimiento de Supabase confirmó la resolución total de los issues:

### Comparativa Antes vs. Después

| Métrica / Hallazgo | Estado Inicial | Estado Post-Remediación | Resultado |
| :--- | :---: | :---: | :---: |
| **`rls_disabled_in_public` (Seguridad)** | 🔴 6 tablas en ERROR | 🟢 0 tablas en ERROR | **Resuelto** |
| **`function_search_path_mutable` (Seguridad)** | 🟡 3 funciones en WARN | 🟢 0 funciones en WARN | **Resuelto** |
| **`duplicate_index` (Rendimiento)** | 🟡 1 índice duplicado en WARN | 🟢 0 índices duplicados | **Resuelto** |
| **`unindexed_foreign_keys` (Rendimiento)** | 🔵 1 FK sin cobertura | 🟢 0 FKs sin cobertura | **Resuelto** |
| **Estado RLS PostgREST** | Desprotegido | 🔒 Protegido (Sin acceso anónimo directo) | **Endurecido** |

---

## 6. Impacto en la Arquitectura y Versionado

1. **Aislamiento Total del API Web:** La activación de RLS asegura que nadie pueda acceder ni alterar la base de datos a través de los endpoints REST públicos generados automáticamente por Supabase, forzando que todo el tráfico transite exclusivamente a través del backend Express donde residen las reglas de negocio, validaciones Zod y auditoría.
2. **Eficiencia en Mutaciones:** Al eliminar el índice duplicado y añadir el índice a `audit_logs.user_id`, se optimizan tanto las escrituras de usuarios como la integridad referencial en eventos de baja.
3. **Inclusión en el Repositorio:** Este script se incorpora formalmente como la migración [`003_security_and_performance_fixes.sql`](file:///c:/Users/natha/Documents/Repos/DevSculptor/devsculptor-backend/src/database/migrations/003_security_and_performance_fixes.sql) para que cualquier nuevo entorno local o de CI/CD incorpore estas mejoras automáticamente.

