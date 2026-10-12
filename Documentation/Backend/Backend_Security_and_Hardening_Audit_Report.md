# DevSculptor Backend — Informe Consolidado de Auditoría de Seguridad, Hardening y Blindaje Cloud

> **Documento Maestro:** `Documentation/Backend/Backend_Security_and_Hardening_Audit_Report.md`  
> **Proyecto:** DevSculptor Backend Core (`devsculptor-backend`)  
> **Autor / Auditor:** Nathaniel Muller San Martín & AI Pair Programming Architect  
> **Fecha:** Octubre 2026 (Auditoría v2 — Consolidada)  
> **Estado:** COMPLETADO, VERIFICADO EMPÍRICAMENTE Y CERTIFICADO EN `develop`  
> **Base de Datos Cloud:** PostgreSQL 15+ en Supabase (`gtcuhxhwwqzfhleoozlz`)  
> **Pruebas Automatizadas:** 5 suites pasadas, 32/32 tests aprobados  

---

## 📑 Tabla de Contenidos

1. [Resumen Ejecutivo y Postura de Seguridad](#1-resumen-ejecutivo-y-postura-de-seguridad)
2. [Matriz de los 10 Puntos Críticos de Seguridad](#2-matriz-de-los-10-puntos-críticos-de-seguridad)
3. [Remediación de Vulnerabilidades y Controles (SEC-01 a SEC-10)](#3-remediación-de-vulnerabilidades-y-controles-sec-01-a-sec-10)
4. [Trazabilidad Forense y Auditoría Activa (`security_events`)](#4-trazabilidad-forense-y-auditoría-activa-security_events)
5. [Mitigación de Enumeración de Cuentas y Ataques de Timing](#5-mitigación-de-enumeración-de-cuentas-y-ataques-de-timing)
6. [Jerarquía de Rate Limiting y Protección DoS/Fuerza Bruta](#6-jerarquía-de-rate-limiting-y-protección-dosfuerza-bruta)
7. [Auditoría Empírica de Supabase Cloud (RLS, Permisos y Advisors)](#7-auditoría-empírica-de-supabase-cloud-rls-permisos-y-advisors)
8. [Seguridad en Almacenamiento Multi-Tenant (Supabase Storage `okf-vault`)](#8-seguridad-en-almacenamiento-multi-tenant-supabase-storage-okf-vault)
9. [Cabeceras HTTP, CORS y Aislamiento de Secretos](#9-cabeceras-http-cors-y-aislamiento-de-secretos)
10. [Riesgos Aceptados y Hoja de Ruta para Próxima Iteración (Strix)](#10-riesgos-aceptados-y-hoja-de-ruta-para-próxima-iteración-strix)

---

## 1. Resumen Ejecutivo y Postura de Seguridad

El backend de **DevSculptor** implementa una arquitectura de seguridad defensiva en profundidad (*Defense-in-Depth*), diseñada para operar como una plataforma de gobernanza técnica pre-código asistida por IA.

Durante el ciclo de auditoría y hardening integral de octubre de 2026:
- Se verificó empíricamente que el 100% de las 11 tablas del esquema público en Supabase Cloud tienen activado Row Level Security (RLS) y acceso PostgREST cerrado a roles anónimos.
- Se conectó y certificó la trazabilidad forense de atacantes en tiempo real mediante [`SecurityEventService`](file:///c:/Users/natha/Documents/Repos/DevSculptor/devsculptor-backend/src/shared/services/securityEvent.service.ts), cubriendo inicios de sesión, bloqueos, 2FA/MFA y restablecimiento de credenciales con anonimización criptográfica SHA-256 de identificadores desconocidos.
- Se neutralizó la enumeración de usuarios en el portal de login unificando códigos de estado HTTP 401, mensajes y tiempos de procesamiento frente a contraseñas incorrectas, correos inexistentes y cuentas bloqueadas.
- Se expandió la cobertura de pruebas de seguridad automatizadas a **32/32 tests aprobados** bajo Vitest y Supertest.

---

## 2. Matriz de los 10 Puntos Críticos de Seguridad

| # | Control de Seguridad | Estado | Evidencia y Mecanismo Técnico |
| :--- | :--- | :---: | :--- |
| **1** | **Rate Limit en Endpoints** | ✅ Verificado | Limitador global (100 req/15m), login estricto por IP+email (10/15m), 2FA/MFA (5/5m), registro (10/h), forgot-password (5/h), **reset-password dedicado** (10/h) y consultas IA (30/15m por usuario). |
| **2** | **Sin Claves ni APIs en Frontend** | ✅ Verificado | El bundle de producción (`dist/assets/*.js`) fue auditado con 0 claves reales. Las claves BYOK se envían mediante la cabecera efímera `X-User-Ai-Key` sin persistencia en el backend. |
| **3** | **Row Level Security (RLS) en 100% de Tablas** | ✅ Verificado | Consulta directa a `pg_tables` arrojó **exactamente 0 tablas sin RLS** (`rowsecurity = false`) y 11 tablas con RLS activado. |
| **4** | **`.env` fuera de GitHub** | ✅ Verificado | Archivos `.env` ignorados en raíz, backend y frontend. El historial completo de git (`git log -G`) fue escaneado con 0 secretos versionados. |
| **5** | **Validación y Saneamiento de Inputs** | ✅ Verificado | Interceptores Zod estrictos (`validateRequest`) en todos los endpoints de mutación. 100% de consultas SQL parametrizadas con placeholders `$1, $2` (cero concatenaciones). |
| **6** | **Sin Tablas Públicas Desprotegidas** | ✅ Verificado | Acceso directo PostgREST bloqueado. Permisos `anon` y `authenticated` revocados explícitamente en tablas sensibles (`users`, `security_events`, `password_resets`, etc.). |
| **7** | **Autenticación en Rutas Protegidas e IDOR** | ✅ Verificado | Middleware `authenticate` protege todas las rutas de dominio. Aislamiento horizontal estricto: todo acceso valida `req.user.id` y devuelve **404 Not Found** ante recursos ajenos para evitar escaneo de IDs. |
| **8** | **Sin Fuga de Stack Traces al Cliente** | ✅ Verificado | `errorHandler.ts` intercepta excepciones y emite el envelope `{ success: false, error: { code, message, details } }`. Los stack traces se registran exclusivamente en Pino interno y nunca se envían por HTTP. |
| **9** | **Endpoints de Debug o Admin Protegidos** | ✅ Verificado | 0 endpoints de debug o semillas en producción. Rutas `/api/v1/admin/*` exigen rol `SUPERADMIN` y responden con **404 Not Found** ante usuarios no autorizados. |
| **10** | **Logging Activo para Rastrear Atacantes** | ✅ Verificado | `SecurityEventService.record()` conectado en todos los flujos de autenticación. Eventos de fallo, éxito, bloqueo y reset persistidos en `security_events`. |

---

## 3. Remediación de Vulnerabilidades y Controles (SEC-01 a SEC-10)

| Código | Control / Vulnerabilidad Remediada | Implementación Técnica en DevSculptor |
| :--- | :--- | :--- |
| **SEC-01** | **Anti-Enumeración de Usuarios** | Mensaje idéntico y latencia constante en login (`401 Credenciales inválidas o cuenta temporalmente bloqueada`) tanto para usuario inexistente como contraseña errónea o cuenta bloqueada. |
| **SEC-02** | **Protección contra Fuerza Bruta** | Bloqueo temporal automático a los 5 intentos fallidos (`locked_until = NOW() + INTERVAL '15 minutes'`) y rate limiting estricto en Express. |
| **SEC-03** | **Tipado Criptográfico de Tokens JWT** | Tokens con claim de tipo (`typ: 'access' \| 'temp_mfa'`). La autenticación regular rechaza tokens temporales de MFA. |
| **SEC-04** | **Invalidador Global de Sesiones (`token_version`)** | Cada usuario posee un entero `token_version` en base de datos. Ante cambio de contraseña o cierre forzado, se incrementa el contador, invalidando instantáneamente todos los JWT activos. |
| **SEC-05** | **Cifrado en Reposo de Secretos TOTP 2FA** | Secretos TOTP encriptados con **AES-256-GCM** mediante clave derivada del servidor antes de persistir en `users.mfa_secret`. |
| **SEC-06** | **Protección Anti-SSRF en Llamadas a LLMs** | Validación estricta de URLs de destino en motores de IA, impidiendo peticiones a rangos privados (RFC 1918, `169.254.169.254` de metadatos cloud o `localhost`). |
| **SEC-07** | **Aislamiento Multi-Tenant Horizontal** | Ningún parámetro `userId` enviado en el body es confiado. El identificador del propietario se inyecta exclusivamente desde el token validado (`req.user.id`). |
| **SEC-08** | **Seguridad de Cabeceras HTTP (Helmet)** | Inyección forzada de `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Strict-Transport-Security` y `Referrer-Policy: no-referrer`. |
| **SEC-09** | **Limpieza Transaccional de Restablecimiento** | Los tokens de reseteo de contraseña son hashes SHA-256 de 256 bits, un solo uso (`used = true`), expiración de 1 hora y rate limiter dedicado. |
| **SEC-10** | **Auditoría Forense y Telemetría de Seguridad** | Inserción determinista no bloqueante en la tabla `security_events` correlacionando IP, User-Agent, tipo de evento y metadatos forenses. |

---

## 4. Trazabilidad Forense y Auditoría Activa (`security_events`)

### 4.1 Desacoplamiento Arquitectónico
Para cumplir con la arquitectura en capas y evitar acoplar la capa de servicios a Express, se definió la interfaz `RequestContext` en [`securityEvent.service.ts`](file:///c:/Users/natha/Documents/Repos/DevSculptor/devsculptor-backend/src/shared/services/securityEvent.service.ts):

```typescript
export interface RequestContext {
  ip?: string | null;
  userAgent?: string | null;
}
```

Los controladores extraen el contexto mediante el helper `getRequestContext(req)` y lo transmiten opcionalmente al servicio.

### 4.2 Catálogo Cerrado de Eventos Forenses
```typescript
export const SecurityEventType = {
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILED: 'LOGIN_FAILED',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  LOGIN_BLOCKED: 'LOGIN_BLOCKED',
  MFA_REQUIRED: 'MFA_REQUIRED',
  MFA_FAILED: 'MFA_FAILED',
  MFA_ENABLED: 'MFA_ENABLED',
  MFA_DISABLED: 'MFA_DISABLED',
  PASSWORD_RESET_REQUESTED: 'PASSWORD_RESET_REQUESTED',
  PASSWORD_RESET_COMPLETED: 'PASSWORD_RESET_COMPLETED',
  PASSWORD_CHANGED: 'PASSWORD_CHANGED',
} as const;
```

### 4.3 Anonimización Criptográfica de Intentos con Correos Inexistentes
Cuando un atacante intenta autenticarse con un correo no registrado en la base de datos, el sistema no almacena el correo en texto plano (previniendo fugas de PII o envenenamiento de logs). En su lugar, calcula un hash SHA-256 truncado a 16 caracteres hexadecimales:

```typescript
const emailHash = crypto.createHash('sha256').update(email.toLowerCase().trim()).digest('hex').slice(0, 16);
```
Esto permite a los administradores correlacionar si un mismo atacante está probando múltiples contraseñas contra un mismo correo externo, o si un botnet está atacando con diccionarios de correos.

---

## 5. Mitigación de Enumeración de Cuentas y Ataques de Timing

En [`auth.service.ts`](file:///c:/Users/natha/Documents/Repos/DevSculptor/devsculptor-backend/src/modules/auth/auth.service.ts):
1. **Comparación Constante de Contraseña:** Tanto si el correo existe como si no existe, se ejecuta invariablemente el algoritmo bcrypt (con hash simulado en caso de usuario inexistente) para mantener tiempos de respuesta equivalentes.
2. **Unificación de Respuesta de Error:**
   - Usuario inexistente ➔ `401: Credenciales inválidas o cuenta temporalmente bloqueada. Intente nuevamente más tarde.`
   - Contraseña incorrecta ➔ `401: Credenciales inválidas o cuenta temporalmente bloqueada. Intente nuevamente más tarde.`
   - Cuenta bloqueada por fuerza bruta ➔ `401: Credenciales inválidas o cuenta temporalmente bloqueada. Intente nuevamente más tarde.`
3. **Cuentas Suspendidas:** Solo si la contraseña provista es matemáticamente **correcta**, pero la cuenta fue desactivada por un administrador (`!is_active`), se informa el estado de suspensión.

---

## 6. Jerarquía de Rate Limiting y Protección DoS/Fuerza Bruta

Implementado en [`rateLimiter.ts`](file:///c:/Users/natha/Documents/Repos/DevSculptor/devsculptor-backend/src/middlewares/rateLimiter.ts) utilizando cabeceras estándar IETF `RateLimit-*` (Draft-7):

```
┌────────────────────────────────────────────────────────────────────────┐
│ 1. rateLimiter Global (100 req / 15 min por IP)                        │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
       ┌────────────────────────────┼────────────────────────────┐
       ▼                            ▼                            ▼
┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐
│ 2. loginLimiter      │  │ 3. mfaLimiter        │  │ 4. resetPasswordLim. │
│ 10 intentos / 15 min │  │ 5 intentos / 5 min   │  │ 10 solicitudes / 1h  │
│ Clave: IP + Email    │  │ Clave: IP            │  │ Clave: IP            │
└──────────────────────┘  └──────────────────────┘  └──────────────────────┘
       │                            │                            │
       ▼                            ▼                            ▼
┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐
│ 5. registerLimiter   │  │ 6. forgotPasswordLim.│  │ 7. aiLimiter         │
│ 10 registros / 1h    │  │ 5 solicitudes / 1h   │  │ 30 consultas / 15m   │
│ Clave: IP            │  │ Clave: IP            │  │ Clave: userId || IP  │
└──────────────────────┘  └──────────────────────┘  └──────────────────────┘
```

Todos los limitadores emiten el envelope estandarizado de error con código HTTP 429:
```json
{
  "success": false,
  "error": {
    "code": "TOO_MANY_RESET_ATTEMPTS",
    "message": "Demasiados intentos de restablecimiento de contraseña. Intente en 1 hora.",
    "details": []
  }
}
```

---

## 7. Auditoría Empírica de Supabase Cloud (RLS, Permisos y Advisors)

Verificación ejecutada en vivo sobre la base de datos de producción (`gtcuhxhwwqzfhleoozlz`):

### 7.1 Estado de Row Level Security (RLS)
Consulta a `pg_tables`:
```sql
SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
```
**Resultado:** Exactamente **0 tablas públicas con `rowsecurity = false`**.  
Las 11 tablas públicas del sistema cuentan con RLS activo:
1. `_migrations`
2. `architecture_decisions`
3. `audit_logs`
4. `canvas_entities`
5. `global_vault_templates`
6. `okf_documents`
7. `password_resets`
8. `projects`
9. `requirements`
10. `security_events`
11. `users`

### 7.2 Permisos de Roles Anónimos y Autenticados
- Los permisos sobre tablas críticas (`users`, `security_events`, `password_resets`, `global_vault_templates`, `_migrations`) fueron revocados completamente (`REVOKE ALL FROM anon, authenticated`).
- Las tablas de dominio no poseen políticas públicas permisivas, por lo que cualquier acceso no autenticado vía PostgREST es rechazado con `403 Forbidden` a nivel de motor.

### 7.3 Supabase Security Advisors
La herramienta de análisis de seguridad de Supabase (`get_advisors`) certificó:
- **0 Errores de Seguridad.**
- **0 Advertencias de Seguridad.**
- 11 Avisos informativos normales (`rls_enabled_no_policy`), correspondientes a tablas protegidas que no delegan lógica a PostgREST al ser atendidas exclusivamente por Express mediante la conexión de pool directo.

### 7.4 Inmutabilidad de Funciones PL/pgSQL
Verificación de funciones con `SECURITY DEFINER`:
```sql
SELECT p.proname FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public' AND p.prosecdef
  AND NOT EXISTS (SELECT 1 FROM unnest(coalesce(p.proconfig,'{}')) c WHERE c LIKE 'search_path=%');
```
**Resultado:** **0 funciones vulnerables**. Todas las rutinas fijan inmutablemente `search_path = public, pg_temp` para prevenir secuestro de esquemas.

---

## 8. Seguridad en Almacenamiento Multi-Tenant (Supabase Storage `okf-vault`)

Para el almacenamiento de documentación y paquetes OKF:
- **Bucket Privado:** `okf-vault` (`public: false`), con límite de 50 MB por objeto y validación de tipos MIME (Markdown, SQL, JSON, YAML, ZIP).
- **Políticas RLS en `storage.objects`:**
  - `okf_vault_tenant_select`: Solo el dueño (`auth.uid()`) o la carpeta pública de sistema `_global` pueden leer.
  - `okf_vault_tenant_insert`: La escritura está restringida a rutas prefijadas con el propio `auth.uid()`.
  - `okf_vault_tenant_update` y `okf_vault_tenant_delete`: Mutación limitada a los objetos del propio tenant.

---

## 9. Cabeceras HTTP, CORS y Aislamiento de Secretos

### 9.1 Cabeceras de Seguridad y CORS
- **Helmet Middleware:** Activo en `app.ts` inyectando directivas defensivas de cabecera.
- **CORS Estricto:** `CORS_ORIGINS` valida los dominios autorizados de Vercel y localhost. En producción, la validación Zod prohíbe el uso de `*` si las credenciales están habilitadas.

### 9.2 Aislamiento de Secretos
- **Auditoría de Git:** Escaneo con expresiones regulares de patrones de alta entropía (`AIza...`, `sk-or-v1-...`, `postgresql://...`) en todo el árbol de trabajo y en el historial completo de commits confirmó **0 credenciales filtradas**.
- **Auditoría del Bundle de Frontend:** El empaquetado de producción en `devsculptor-frontend/dist/assets/*.js` no contiene llaves privadas del backend ni secretos de infraestructura.

---

## 10. Riesgos Aceptados y Hoja de Ruta para Próxima Iteración (Strix)

### 10.1 Riesgos Aceptados y Mitigados
1. **Almacenamiento de Claves BYOK en `localStorage` (Frontend):** Las claves que el usuario provee voluntariamente para consumir modelos LLM con su propia cuota residen en el almacenamiento local del navegador. Este riesgo se mitiga con saneamiento DOM estricto (`DOMPurify`), modo `strict` en Mermaid y directivas CSP en `vercel.json`.
2. **Rate Limiting en Memoria:** El store de `express-rate-limit` opera en memoria local de la instancia. Es óptimo para la topología actual de un único proceso en Render. Si el backend escala a múltiples instancias distribuidas en el futuro, se migrará a un store distribuido sobre Redis.
3. **Respuesta de Registro Revela Existencia de Correo:** `POST /register` devuelve `ConflictError (409)` si un correo ya existe. Es un compromiso deliberado de experiencia de usuario (UX), protegido contra ataques de fuerza bruta por el limitador `registerLimiter` (10 intentos/hora por IP).

### 10.2 Hoja de Ruta para la Próxima Iteración: Pentesting Automatizado con Strix
Como siguiente hito tras la consolidación documental, se programará una auditoría de penetración dinámica y automatizada asistida por IA utilizando **Strix** (`usestrix/strix`):
- Se desplegará en un entorno local sandboxed con Docker.
- Se configurará contra la API local de desarrollo (`http://localhost:3000`).
- Se cotejarán los hallazgos dinámicos de Strix contra la telemetría en tiempo real de `security_events` para validar la capacidad de detección del sistema ante vectores de inyección, bypass de autorización y abuso de lógica de negocio.
