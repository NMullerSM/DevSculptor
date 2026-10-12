# Reporte Técnico: Auditoría de Seguridad, Calidad de Código y Hardening de Arquitectura
**Proyecto:** DevSculptor — Enterprise Technical Governance & AI-Assisted Documentation  
**Módulo:** Backend Core (`devsculptor-backend`) & Persistencia Relacional  
**Fecha:** Octubre 2026  
**Autor:** Nathaniel Muller (Master Architect & AI Pair Programming)  
**Estado:** ✅ IMPLEMENTADO, VERIFICADO Y AUDITADO (100% Tests Pass, 0 Warnings Linter)

---

## 1. Resumen Ejecutivo

Durante el ciclo de gobernanza técnica y auditoría previa a producción, se realizó una inspección estricta de seguridad, arquitectura y resiliencia sobre el backend de DevSculptor, contrastándolo con el manual de conducta arquitectónica del proyecto (`.agents/skills/devsculptor-architect/SKILL.md`).

Se identificaron y resolvieron de forma exhaustiva vectores de vulnerabilidad en autenticación, autorización, manejo de sesiones, inyecciones SSRF, políticas RLS en base de datos cloud y gestión de contenedores Docker.

### Indicadores de Calidad Post-Hardening
- **Pruebas de Integración y Seguridad (Vitest + Supertest):** 25/25 tests ejecutados satisfactoriamente (100% passing).
- **Linter de Backend (ESLint Flat Config):** 0 errores, 0 advertencias.
- **Compilación TypeScript (`tsc && tsc-alias`):** Código de salida 0 con tipado estricto (`strict: true`, cero `any`).
- **Supabase Security Advisors:** 0 advertencias, 0 errores críticos (todas las 11 tablas con RLS activado y `search_path` inmutable).
- **Integración Continua:** Pipeline GitHub Actions configurado con jobs paralelos para Backend y Frontend.

---

## 2. Matriz de Vulnerabilidades Auditadas y Mitigadas

| Código | Severidad | Área | Vulnerabilidad Original | Mitigación Implementada |
| :--- | :---: | :--- | :--- | :--- |
| **SEC-01** | 🔴 **Crítica** | Auth / Resets | Fuga de `resetToken` y `resetUrl` en la respuesta JSON de `/auth/forgot-password`. Enumeración de emails vía mensajes dispares. | Respuestas unificadas indistinguibles; comparación dummy constante con bcrypt contra timing attacks; tokens solo despachados por canal seguro (`IMailer`). |
| **SEC-02** | 🔴 **Crítica** | Auth / MFA | El `tempToken` de 2FA compartía clave y algoritmo con tokens de sesión, permitiendo bypass de MFA consumiendo rutas protegidas directamente. | Tipado estricto en JWT (`typ: 'access' \| 'mfa_pending'`). `authenticate` rechaza tokens que no sean de acceso con 401. |
| **SEC-03** | 🔴 **Crítica** | Sesiones / DB | JWTs emitidos carecían de mecanismo de revocación. Cuentas suspendidas o roles degradados mantenían acceso hasta 24h. | Columna `token_version` en PostgreSQL; verificación en tiempo real en `authenticate`. Invalidación instantánea al cambiar clave, rol o suspender usuario. |
| **SEC-04** | 🔴 **Crítica** | Auth / Fuerza Bruta | Ausencia de rate limiters específicos en login, MFA y reset. TOTP en claro en DB, vulnerable a replay y timing attacks. | Rate limiters dedicados por IP y cuenta; bloqueo temporal tras 5 fallos; cifrado simétrico AES-256-GCM de secretos en DB; validación TOTP en tiempo constante y anti-repetición de paso. |
| **SEC-05** | 🔴 **Alta** | IA / Outbound | SSRF potencial mediante cabecera `X-User-Ai-Endpoint` hacia IPs privadas, loopback o metadatos de nube (`169.254.169.254`). | Validador `safeUrl.ts` con resolución DNS restrictiva; `redirect: 'error'` en fetch; mapeo tipado con `ExternalServiceError` (502). |
| **SEC-07** | 🔴 **Alta** | Base de Datos | Tablas `password_resets`, `global_vault_templates` y `_migrations` sin RLS. Función `is_superadmin()` ejecutable por PostgREST público. | RLS activado en todas las tablas; permisos de API PostgREST revocados para `anon` y `authenticated`; función con `search_path` inmutable y permisos revocados. |
| **BUG-02** | 🟠 Media | Middlewares | Payloads malformados, ZodErrors y CORS terminaban en errores 500 no controlados. | Mapeo estructurado en `errorHandler.ts`: Zod (400), JSON parse (400), Payload 1MB (413), CORS (`ForbiddenError` 403) y códigos PG sanitizados. |
| **OPS-01** | 🟠 Media | DevOps / Docker | Contenedor de producción no empaquetaba artefactos `.sql` ni podía correr migraciones sin devDependencies. | Script `build:assets` copia SQL a `dist/database/`; `migrate:prod` corre con Node nativo; healthcheck de contenedor y arranque automático de migraciones. |

---

## 3. Detalle de Arquitectura y Componentes Implementados

### 3.1. Autenticación y Control de Sesiones en Tiempo Real
- **Envelope JWT Tipado (`src/shared/utils/jwt.ts`):**  
  ```typescript
  export type TokenType = 'access' | 'mfa_pending';
  export interface TokenPayload {
    id: string;
    email: string;
    role: UserRole;
    typ: TokenType;
    tv: number;
  }
  ```
- **Middleware Asíncrono de Autenticación (`src/middlewares/authenticate.ts`):**  
  Verifica la firma criptográfica y luego consulta en tiempo real en PostgreSQL (`is_active`, `role`, `token_version`). Si el usuario fue suspendido o su `token_version` difiere del token, la solicitud se rechaza inmediatamente con `UnauthorizedError (401)`.

### 3.2. Criptografía y Protección Anti-Fuerza Bruta
- **AES-256-GCM (`src/shared/utils/crypto.ts`):**  
  Todos los secretos TOTP (`mfa_secret` y `mfa_pending_secret`) se cifran en reposo utilizando una clave de 256 bits derivada de `env.MFA_ENCRYPTION_KEY`. El formato de almacenamiento es `iv:authTag:ciphertext` en Base64.
- **Algoritmo TOTP RFC 6238 (`src/shared/utils/totp.ts`):**  
  Comparación en tiempo constante con `crypto.timingSafeEqual` y control de paso temporal (`mfa_last_used_step`). Se incluyeron pruebas de regresión con los 5 vectores de prueba oficiales del RFC 6238.

### 3.3. Servicio de Despacho de Correo y Anti-Enumeración
- **Desacoplamiento Mailer (`src/shared/mailer/index.ts`):**  
  Interfaz `IMailer` con dos implementaciones:
  - `ConsoleMailer`: Activo exclusivamente en desarrollo local. Registra enlaces mediante logs estructurados de Pino.
  - `SmtpMailer`: Implementación para producción mediante proveedores SMTP/API. `env.ts` prohíbe el arranque en modo producción si `MAIL_PROVIDER === 'console'`.

### 3.4. Protección de Salida y Red de IA (Anti-SSRF)
- **Validador de URLs (`src/shared/utils/safeUrl.ts`):**  
  Previene ataques Server-Side Request Forgery al resolver direcciones DNS e interceptar cualquier rango IPv4 o IPv6 reservado:
  - Rango privado RFC 1918 (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`)
  - Loopback (`127.0.0.0/8`, `::1`)
  - Carrier-Grade NAT (`100.64.0.0/10`)
  - Link-Local & AWS/Cloud Metadata (`169.254.0.0/16`, `fe80::/10`)
  - Multicast y broadcast (`224.0.0.0/4`, `0.0.0.0`)
- **Control de Redirecciones:** Todas las invocaciones hacia APIs externas de IA operan con `redirect: 'error'` para neutralizar bypasses basados en HTTP 301/302.

### 3.5. Auditoría de Seguridad Transversal
- **Servicio de Eventos (`src/shared/services/securityEvent.service.ts`):**  
  Persistencia no bloqueante de intentos de login, bloqueos, cambios de contraseña y activaciones 2FA en la tabla `security_events`. Los metadatos son sanitizados automáticamente para nunca registrar contraseñas, tokens ni secretos.
- **Endpoints Administrativos:**  
  - `PATCH /api/v1/admin/users/:id/status` (suspensión/reactivación con incremento de `token_version`).
  - `GET /api/v1/admin/security-events` (consulta histórica de auditoría de seguridad).

---

## 4. Migraciones de Base de Datos Aplicadas

| Migración | Objeto | Propósito |
|---|---|---|
| `009_auth_hardening.sql` | `users` | Añade `token_version`, `failed_login_attempts`, `locked_until`, `mfa_last_used_step`, `mfa_pending_secret`. |
| `010_rls_hardening.sql` | Varios | Activa RLS en `password_resets`, `global_vault_templates`, `_migrations`. Revoca permisos directos a `anon` y `authenticated`. Inmutabiliza `search_path` en `is_superadmin()`. |
| `011_security_events.sql` | `security_events` | Tabla con RLS e índices para pistas de auditoría de seguridad. |
| `012_align_global_vault_categories.sql` | `global_vault_templates` | Expande la restricción `CHECK` de categorías a las 9 soportadas por el catálogo. |
| `013_supabase_security_advisors_hardening.sql` | Funciones | Revoca permiso `EXECUTE` sobre `is_superadmin()` a roles públicos y fija `search_path` en `sp_calculate_project_metrics` y `fn_audit_canvas_entities`. |

---

## 5. Pruebas Automatizadas y Verificación

Se implementaron 4 suites de pruebas en `devsculptor-backend/src/test/`:
1. `auth-security.test.ts`: Pruebas de integración con Supertest sobre bypass de 2FA, token tampering, anti-enumeración, resiliencia del body-parser y envelopes estándar de salud.
2. `totp.test.ts`: Validación de algoritmos Base32 y vectores oficiales RFC 6238.
3. `crypto.test.ts`: Validación de cifrado simétrico AES-256-GCM y detección de manipulaciones de autenticación (auth tag).
4. `okf.test.ts`: Pruebas del motor Open Knowledge Framework.

```bash
# Ejecución de Pruebas
npm test

# Resultado (Línea base v2 post-hardening)
Test Files  5 passed (5)
Tests       32 passed (32)
Duration    ~3.9s
```

---

## 6. Auditoría y Hardening de Seguridad — Ciclo Octubre 2026 (v2)

### 6.1 Matriz de Hallazgos y Remediación v2
| Código | Severidad | Área | Hallazgo | Estado | Mitigación Implementada |
|---|---|---|---|:---:|---|
| **H-01** | 🔴 **Crítica** | Auditoría / Forense | `SecurityEventService` y tabla `security_events` sin llamadores activos (auditoría forense inoperante). | ✅ Corregido | Conexión de `SecurityEventService.record()` en `AuthService` para `LOGIN_SUCCESS`, `LOGIN_FAILED`, `ACCOUNT_LOCKED`, `LOGIN_BLOCKED`, `MFA_REQUIRED`, `MFA_FAILED`, `MFA_ENABLED`, `MFA_DISABLED`, `PASSWORD_RESET_REQUESTED`, `PASSWORD_RESET_COMPLETED` y `PASSWORD_CHANGED`. |
| **H-02** | 🔴 **Alta** | Auth / Enumeración | `login` evaluaba `!is_active` y `locked_until` antes de la contraseña con mensajes dispares. | ✅ Corregido | Reordenamiento en `AuthService.login`: comparación de contraseña primero con bcrypt, y unificación de mensaje genérico para usuarios inexistentes, contraseñas erróneas y cuentas bloqueadas. |
| **H-03** | 🟠 **Media** | Auth / DoS | `POST /reset-password` sin rate limit dedicado. | ✅ Corregido | Implementación y montaje de `resetPasswordLimiter` (10 intentos / hora por IP) en `rateLimiter.ts` y `auth.routes.ts`. |
| **H-04** | 🟠 **Media** | Rate Limiting | `RATE_LIMIT_MAX=100` global por IP en memoria; medición de canvas ERD. | 📋 Medido y Documentado | Operaciones drag & drop operan en memoria local (Zustand) y solo despachan 1 mutación HTTP al soltar la entidad. Para despliegues en producción se recomienda calibrar `RATE_LIMIT_MAX` vía env en Render. Store en memoria documentado como válido para réplica única. |
| **H-05** | 🟡 **Baja** | Auth / MFA | Limitador MFA opera a nivel IP. | 📋 Mitigado / Aceptado | Eventos `MFA_FAILED` registrados en base de datos para análisis forense correlacionado por `userId`. |
| **H-06** | 🟡 **Baja** | Auth / Registro | `register` devuelve `ConflictError` si el correo existe. | 📋 Riesgo Aceptado | Trade-off estándar de usabilidad; protegido por `registerLimiter` (10 registros / hora por IP). |
| **H-07** | 🟡 **Baja** | Frontend / Storage | Tokens JWT y claves BYOK residen en `localStorage`. | 📋 Riesgo Aceptado | Protegido en cliente por sanitización estricta con DOMPurify, Mermaid `securityLevel: 'strict'`, CSP estricto en `vercel.json` y headers contra clickjacking (`X-Frame-Options: DENY`). |

### 6.2 Verificación Empírica de Métricas (Línea Base v2)
- **Suites de Prueba (Vitest):** 5 suites ejecutadas (4 originales + `security-events.test.ts`), 32/32 tests aprobados (100% pass).
- **Linter (ESLint Flat Config):** 0 errores, 0 advertencias.
- **Compilación TypeScript (`tsc && tsc-alias`):** Exit code 0, tipado estricto sin `any`.
- **Inspección de Secretos en Repositorio e Historial:** 0 claves expuestas.

