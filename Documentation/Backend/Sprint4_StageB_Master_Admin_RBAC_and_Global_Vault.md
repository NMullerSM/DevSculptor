# Sprint 4 — Especificación Técnica Backend: Consola de Administrador Maestro, RBAC y Bóveda OKF Global

**Proyecto:** DevSculptor Core Backend  
**Sprint:** Sprint 4 — Etapa B (Etapa 4B)  
**Autor:** Nathaniel Muller San Martin  
**Estado:** IMPLEMENTADO Y VERIFICADO EN `develop`  
**Fecha:** Septiembre 2026  
**Componentes Impactados:**
- `devsculptor-backend/src/database/migrations/006_add_user_roles_and_master_admin.sql`
- `devsculptor-backend/src/shared/types/express.d.ts`
- `devsculptor-backend/src/shared/utils/jwt.ts`
- `devsculptor-backend/src/middlewares/authenticate.ts`
- `devsculptor-backend/src/middlewares/requireSuperAdmin.ts`
- `devsculptor-backend/src/modules/admin/` (`admin.controller.ts`, `admin.routes.ts`, `admin.schemas.ts`, `admin.service.ts`)
- `devsculptor-backend/src/modules/auth/` (`auth.service.ts`, `auth.repository.ts`)
- `devsculptor-backend/src/app.ts`

---

## 1. Resumen Ejecutivo y Alcance

La **Etapa 4B** dota al backend de DevSculptor de una capa de **Gobernanza y Administración Maestra** basada en Control de Acceso Basado en Roles (**RBAC**). Permite al Superadministrador gobernar de forma dinámica las plantillas canónicas, habilidades de IA (`devsculptor-architect.md`) y reglas de desarrollo (`master.cursorrules`, `CLAUDE.md`) sin necesidad de redespliegues en producción.

Asimismo, introduce el principio de seguridad **Fail-Safe 404** para mitigar ataques de reconocimiento de rutas, la supervisión de telemetría agregada y la consulta estructurada del registro transversal de auditoría (`audit_logs`).

---

## 2. Modelo Relacional y Migración 006

### 2.1. Ampliación de la Tabla `users`
Se incorporaron dos columnas clave en la tabla `users` mediante la migración `006_add_user_roles_and_master_admin.sql`:
* `role VARCHAR(20) NOT NULL DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN', 'SUPERADMIN'))`: Define la jerarquía de privilegios en el sistema.
* `is_active BOOLEAN NOT NULL DEFAULT TRUE`: Permite la desactivación administrativa de cuentas sin eliminar su histórico relacional.
* Se promovieron automáticamente a `SUPERADMIN` las identidades maestras:
  - `nathaniel@devsculptor.io`
  - `nmullersm@gmail.com`
  - `dev@devsculptor.test`

### 2.2. Tabla de Persistencia `global_vault_templates`
Para dotar de alta disponibilidad e integridad criptográfica a las plantillas canónicas de la bóveda global (`_global/`), se creó la tabla:

```sql
CREATE TABLE IF NOT EXISTS global_vault_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  path VARCHAR(255) NOT NULL UNIQUE,
  filename VARCHAR(150) NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN ('templates', 'skills', 'rules', 'archetypes')),
  title VARCHAR(200) NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  state_hash VARCHAR(64) NOT NULL,
  author VARCHAR(100) NOT NULL DEFAULT 'Nathaniel Muller (Master Architect)',
  version VARCHAR(20) NOT NULL DEFAULT '1.0.0',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### 2.3. Semillas Canónicas Aprovisionadas
Se insertaron 6 artefactos canónicos iniciales:
1. `_global/system_skills/devsculptor-architect.md` (Manual de Conducta y Arquitectura Suprema DevSculptor).
2. `_global/rules/master.cursorrules` (Reglas Canónicas de Agente para Cursor AI).
3. `_global/rules/master.claude.md` (Guía Canónica de Comandos y Convenciones para Claude Code).
4. `_global/templates/requirements/TEMPLATE_SRS_IEEE830.md` (Plantilla de Requisitos IEEE-830).
5. `_global/templates/adrs/TEMPLATE_ADR_MADR.md` (Plantilla de Decisiones MADR).
6. `_global/templates/database/TEMPLATE_DATA_DICTIONARY.md` (Plantilla de Diccionario de Datos Relacional).

---

## 3. Seguridad por Diseño: Fail-Safe 404 (Anti-Enumeration)

En observancia del Pilar 7 de DevSculptor (Seguridad Defensiva y Menor Privilegio), el middleware `requireSuperAdmin.ts` intercepta todas las peticiones a `/api/v1/admin/*`:

* Si el usuario no tiene rol `SUPERADMIN`, el sistema **NO** responde con `403 Forbidden` (el cual revelaría que la ruta existe pero está denegada).
* En su lugar, lanza intencionalmente un error de ruta no encontrada:
  ```ts
  if (req.user?.role !== 'SUPERADMIN') {
    throw new NotFoundError('Ruta');
  }
  ```
  Resultando en una respuesta **`HTTP 404 Not Found`** idéntica a la de cualquier endpoint inexistente. Esto previene eficazmente el mapeo y descubrimiento de endpoints por atacantes o usuarios estándar.

---

## 4. API Endpoints del Módulo Admin (`/api/v1/admin`)

| Método | Endpoint | Descripción | Acceso |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/admin/stats` | Telemetría agregada de la plataforma (proyectos, usuarios, entidades, requerimientos, madurez promedio). | `SUPERADMIN` |
| `GET` | `/api/v1/admin/users` | Listado completo de usuarios y su volumen de proyectos asociados. | `SUPERADMIN` |
| `PATCH` | `/api/v1/admin/users/:id/role` | Actualización de privilegios y rol (`USER`, `ADMIN`, `SUPERADMIN`). | `SUPERADMIN` |
| `GET` | `/api/v1/admin/vault/global` | Listado del catálogo canónico de la bóveda global. | `SUPERADMIN` |
| `GET` | `/api/v1/admin/vault/file?path=...` | Lectura del contenido de un archivo de la bóveda global. | `SUPERADMIN` |
| `PUT` | `/api/v1/admin/vault/file` | Guardado y actualización in-situ con recálculo de hash SHA-256. | `SUPERADMIN` |
| `POST` | `/api/v1/admin/vault/file` | Creación y aprovisionamiento de un nuevo artefacto canónico. | `SUPERADMIN` |
| `DELETE` | `/api/v1/admin/vault/file?path=...` | Eliminación de un artefacto de la bóveda global. | `SUPERADMIN` |
| `GET` | `/api/v1/admin/audit-logs` | Consulta estructurada de `audit_logs` con filtro de entidad y paginación. | `SUPERADMIN` |

### 4.1. Cálculo Lateral de Madurez Promedio
Para la telemetría agregada, `getPlatformStats` evalúa el promedio de madurez técnica de todos los proyectos invocando de forma lateral el Stored Procedure `sp_calculate_project_metrics(p.id)`:

```sql
SELECT 
  (SELECT COUNT(*)::int FROM projects) AS total_projects,
  (SELECT COUNT(*)::int FROM users) AS total_users,
  (SELECT COUNT(*)::int FROM canvas_entities) AS total_entities,
  (SELECT COUNT(*)::int FROM requirements) AS total_requirements,
  (SELECT COUNT(*)::int FROM architecture_decisions) AS total_decisions,
  (SELECT COUNT(*)::int FROM okf_documents) AS total_okf_documents,
  (
    SELECT COALESCE(ROUND(AVG(m.maturity_index)::numeric, 1), 0)::float 
    FROM projects p
    CROSS JOIN LATERAL sp_calculate_project_metrics(p.id) m
  ) AS average_maturity_index;
```

---

## 5. Verificación y Resultados E2E

* **Compilación:** `npm run build` (`tsc && tsc-alias`) completado con código 0.
* **Pruebas de Autorización:**
  - Token anónimo ➔ `HTTP 401 Unauthorized`.
  - Token con rol `USER` ➔ `HTTP 404 Not Found` (Fail-safe verificado).
  - Token con rol `SUPERADMIN` ➔ `HTTP 200 OK` en todas las operaciones.
