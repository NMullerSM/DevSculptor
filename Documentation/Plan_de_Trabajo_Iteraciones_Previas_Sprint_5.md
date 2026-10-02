# Plan de Trabajo — Iteraciones de Refinamiento Previas al Sprint 5
**Proyecto:** DevSculptor — Estudio de Gobernanza Técnica Pre-Coding & Arquitectura  
**Autor:** Nathaniel Muller San Martín (Master Architect) & AI Assistant  
**Fecha:** 02 de Octubre de 2026  
**Estado:** Propuesta de Planificación Estructurada y Aprobación  

---

## 1. Resumen Ejecutivo y Alcance

Este plan de trabajo formaliza y estructura las solicitudes de iteración funcional y diseño ergonómico planteadas previo al inicio formal del **Sprint 5**. Las actividades están concebidas bajo la metodología de **Monolito Modular Layered MVC**, asegurando adherencia a los **8 Pilares de Calidad de DevSculptor**, alta cohesión, desacoplamiento y cero deuda técnica.

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                       PLAN DE TRABAJO — ITERACIONES PREVIAS AL SPRINT 5                     │
├─────────────────────┬─────────────────────┬───────────────────┬─────────────────────────────┤
│ Fase 1: Auth & MFA  │ Fase 2: TopBar UI   │ Fase 3: Sidebar   │ Fase 4: Copilot & Chat Res. │
│ • Password Policies │ • Quitar punto izq. │ • Sin números     │ • Chat lateral en pasos 2-4 │
│ • Password Strength │ • Quitar Arq/PreCod │ • Sin subtítulos  │ • Resizable (hasta 1/3 screen)│
│ • Forgot Password   │ • Quitar PG badge   │ • Iconos iguales  │ • Eliminar tarjeta pre-código│
│ • 2FA (TOTP/App)    │ • Proyecto limpio   │ • Título blanco   │ • Fix Métricas de Cobertura │
├─────────────────────┴─────────────────────┴───────────────────┴─────────────────────────────┤
│ Fase 5: Exportadores Documentales Universales (SRS IEEE-830 & Dossier ADRs en HTML/MD)     │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Desglose Detallado por Fases de Ingeniería

### FASE 1: Seguridad, Políticas de Contraseña, Recuperación y 2FA/MFA

#### 1.1 Políticas y Medidor de Fuerza de Contraseña (Password Security)
* **Backend (`devsculptor-backend`)**:
  - Actualizar el schema Zod en `src/modules/auth/auth.dto.ts` (`registerSchema` y `resetPasswordSchema`) imponiendo validación estricta:
    - Longitud mínima: 8 caracteres (recomendado 10+).
    - Al menos 1 letra mayúscula (`[A-Z]`).
    - Al menos 1 letra minúscula (`[a-z]`).
    - Al menos 1 dígito numérico (`[0-9]`).
    - Al menos 1 carácter especial o puntuación (`[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]`).
  - Mapeo semántico de errores Zod para retroalimentación amigable.
* **Frontend (`devsculptor-frontend`)**:
  - Crear componente `PasswordStrengthIndicator`:
    - Barra de progreso reactiva con 4 niveles (Débil, Regular, Buena, Blindada).
    - Lista de verificación en vivo (Checklist visual) con iconos de confirmación:
      - `8+ caracteres`
      - `Una mayúscula y una minúscula`
      - `Al menos un número`
      - `Al menos un carácter especial o punto`
  - Integrar el medidor tanto en el registro de `AuthPortal` como en el modal de restablecimiento.

#### 1.2 Flujo "¿Has olvidado tu contraseña?" (Password Recovery)
* **Persistencia y Base de Datos**:
  - Migración SQL `007_password_resets.sql`:
    ```sql
    CREATE TABLE password_reset_tokens (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash VARCHAR(64) NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      used_at TIMESTAMPTZ NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX idx_password_resets_token ON password_reset_tokens(token_hash);
    ```
* **Backend**:
  - `POST /api/v1/auth/forgot-password`: Valida si el correo ingresado existe en `users`. Si no existe, devuelve error controlado (`NotFoundError (404)`). Si existe, genera un token criptográfico seguro de un solo uso con ventana de 15 minutos.
  - `POST /api/v1/auth/reset-password`: Valida el token, aplica hash `bcrypt` (12 rounds) a la nueva contraseña y actualiza `password_hash` en `users`.
* **Frontend**:
  - Enlace clickable *"¿Has olvidado tu contraseña?"* en `AuthPortal.tsx`.
  - Modal / pantalla `ForgotPasswordModal`: solicitud de email existente, envío de código/enlace y restablecimiento inmediato con validación de complejidad.

#### 1.3 Autenticación de Dos Factores (2FA / MFA vía TOTP)
* **Persistencia**:
  - Migración SQL `008_user_mfa.sql`:
    ```sql
    ALTER TABLE users ADD COLUMN IF NOT EXISTS mfa_enabled BOOLEAN DEFAULT FALSE;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS mfa_secret VARCHAR(64) NULL;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS mfa_backup_codes JSONB NULL;
    ```
* **Backend**:
  - Endpoints de configuración:
    - `POST /api/v1/auth/mfa/setup`: Genera el secret TOTP (compatible con Google Authenticator, Microsoft Authenticator o Authy) y genera el URI `otpauth://`.
    - `POST /api/v1/auth/mfa/enable`: Valida el primer token de 6 dígitos introducido por el usuario y ratifica la activación.
  - En `POST /api/v1/auth/login`: Si el usuario tiene `mfa_enabled = true`, devuelve respuesta intermedia `{ mfaRequired: true, tempToken: "..." }`.
  - Endpoint de ratificación: `POST /api/v1/auth/mfa/verify` para validar el código de 6 dígitos y emitir el JWT definitivo.
* **Frontend**:
  - Interfaz de entrada de código 2FA de 6 dígitos en `AuthPortal` cuando se detecta el requerimiento secundario.

---

### FASE 2: Rediseño Visual de la Barra Superior (`AppleTopBar`)

* **Objetivo:** Disminuir la sobrecarga cognitiva y lograr un header minimalista y espacial.
* **Cambios Específicos**:
  1. **Izquierda:** Eliminar el punto pulsante (`bg-indigo-500`) ubicado antes de "DevSculptor", alineando toda la barra a la izquierda de forma limpia.
  2. **Centro:**
     - Eliminar la insignia de estilo de arquitectura (`activeProject.architecture_style`), ya que el usuario la visualiza en las tarjetas del Hub.
     - Eliminar la insignia de `Pre-Código`.
     - Mostrar únicamente el nombre del proyecto de forma clara: `Proyecto: {project.name}` (o `{project.name}` directo con estilo semibold).
  3. **Derecha:**
     - Eliminar la etiqueta fija `PostgreSQL pg.Pool`.
     - Mantener el selector de tema (`ThemeToggle`), el avatar y el botón de logout.

---

### FASE 3: Barra Lateral Izquierda (`FlowSidebar`) — Minimalismo y Contraste

* **Objetivo:** Simplificar el panel de navegación eliminando ruido secundario y asegurando legibilidad en modo oscuro.
* **Cambios Específicos**:
  1. **Eliminar numeraciones:**
     - Cambiar `1. Conversación` ➔ `Conversación`
     - Cambiar `2. Requisitos` ➔ `Requisitos`
     - Cambiar `3. Documentos` ➔ `Documentos`
     - Cambiar `4. Modelador & Código` ➔ `Modelador de Código`
  2. **Eliminar subtítulos:**
     - Ocultar textos secundarios (`Entrevista & Alcance`, `Matriz RF y RNF`, `Actas ADRs & Specs`, `ERD, DDL, TS, Py`).
  3. **Homogeneizar colores de los iconos:**
     - Reemplazar la mezcla multicolor (`indigo`, `amber`, `cyan`, `emerald`) por un tono único, uniforme y elegante de la paleta visionOS (`text-indigo-400` para todos los pasos).
  4. **Título "Flujo de Trabajo" en modo noche:**
     - Asignar explícitamente `text-white font-semibold tracking-wider` para que nunca se pierda con fondos oscuros.

---

### FASE 4: Reubicación Dinámica del Copiloto Chat y Panel Resizable

* **Objetivo:** Maximizar el área de trabajo y convertir al copiloto en un asistente omnipresente.
* **Arquitectura Dinámica de Vistas**:
  1. **Cuando el paso activo es "Conversación":**
     - El área central aloja el Chat Principal en formato completo.
     - El panel derecho muestra el inspector clásico de salud arquitectónica (Índice de Madurez SP, 3FN, RLS, resumen cuantitativo y acciones de calidad).
  2. **Cuando el paso activo es "Requisitos", "Documentos" o "Modelador de Código":**
     - El área central se reserva 100% para la edición de requisitos, ADRs o el Canvas ERD.
     - El panel lateral derecho **conmuta automáticamente al Copiloto Chat Asistente**, permitiendo dialogar con la IA e inyectar elementos sin salir de la pantalla activa.
  3. **Capacidad de Redimensionamiento (Resizable hasta 1/3 de pantalla):**
     - Incorporar un tirador/botón de tamaño que permita alternar o arrastrar el ancho del panel derecho entre su ancho base (~320px) y un máximo de **un tercio de la pantalla (33.3vw)**.
  4. **Limpieza del Inspector**:
     - Eliminar la tarjeta inferior fija de *"Pre-código verificado"*.
     - Vincular el botón *"Métricas de Cobertura"* a un modal interactivo con desglose de cobertura real (Requisitos cubiertos por tablas, Requisitos cubiertos por ADRs, Tablas con RLS).

---

### FASE 5: Exportadores Documentales Universales (SRS IEEE-830 y ADRs)

* **Problema Diagnósticado:**
  - Actualmente las funciones de exportación generan archivos `.md` crudos (`SRS_Requisitos_IEEE830.md` y `ADR_INDEX.md`). En sistemas Windows, la extensión `.md` carece de programa predeterminado, impidiendo al usuario abrir el archivo con doble clic. Además, para las decisiones solo se exportaba el índice y no las actas completas.
* **Solución Técnica Dual**:
  1. **Exportación a Documento HTML / Imprimible Autónomo (`.html`):**
     - Generar un documento HTML5 autocontenido con diseño tipográfico impecable (Google Fonts Inter, estilos visuales sobrios para lectura e impresión, tablas contrastadas y badges de estado).
     - Al hacer doble clic, **se abre de inmediato en cualquier navegador web** (Chrome, Edge, Firefox, Safari) y permite imprimir o guardar como PDF (`Ctrl + P`).
  2. **Exportación Markdown (`.md`):**
     - Mantener la descarga en Markdown estructurado para inyección como contexto a asistentes de código (Cursor / Claude / Copilot).
  3. **Catálogo Completo de ADRs:**
     - En lugar de exportar un simple índice tabular, exportar el **Dossier Completo de Decisiones de Arquitectura**, incluyendo cada acta con su contexto, problema, alternativas, decisión ratificada, consecuencias y estado en la máquina finita.
  4. **Menú de Descarga Ergonómico:**
     - En los botones de exportación de Requisitos y ADRs, desplegar opciones directas:
       - 📄 *Descargar Documento Imprimible (.html)* [Recomendado]
       - 📝 *Descargar Markdown Técnico (.md)*

---

## 3. Matriz de Prioridades y Cronograma de Ejecución Sugerido

| Orden | Módulo / Componente | Tareas Clave | Esfuerzo Estimado |
| :---: | :--- | :--- | :---: |
| **1** | **AppleTopBar & FlowSidebar** | Limpieza de cabecera, eliminación de subtítulos y numeraciones, homogeneización de iconos y ajuste de contraste. | **Inmediato (Rápido)** |
| **2** | **Exportación Universal SRS & ADRs** | Generación de plantillas HTML autónomas + Dossier consolidado de decisiones + menú selector (.html / .md). | **Prioridad Alta** |
| **3** | **Copilot Chat Reubicado & Resizable** | Alternancia de chat lateral en pasos 2-4, panel con ancho expandible hasta 1/3 y limpieza de tarjeta pre-código. | **Prioridad Alta** |
| **4** | **Políticas de Contraseña & Fuerza** | Schema Zod estricto en backend + componente visual `PasswordStrengthIndicator` en frontend. | **Prioridad Media** |
| **5** | **Recuperación de Contraseña & 2FA** | Migraciones SQL `007` y `008`, endpoints de forgot/reset password y módulo TOTP de dos factores. | **Prioridad Media-Alta** |

---

## 4. Criterios de Aceptación y Validación

1. **TopBar:** Cabecera limpia sin puntos sobrantes, sin etiquetas innecesarias, con el nombre del proyecto como protagonista.
2. **Sidebar:** Flujo de 4 pasos sin prefijos numéricos, sin subtítulos, iconos uniformes y título "Flujo de Trabajo" visible con cualquier fondo.
3. **Copilot:** En "Conversación" el chat está al centro; en "Requisitos", "Documentos" y "Modelador", el chat se traslada al panel derecho, con opción de redimensionarlo hasta un tercio de la pantalla.
4. **Descargas:** Al pulsar exportar SRS o ADRs, se obtiene un documento `.html` visualizable con un solo clic en Windows y un `.md` para herramientas de IA.
5. **Seguridad:** Contraseñas validadas contra políticas robustas con medidor visual interactivo; flujo de recuperación verificado contra la base de datos y soporte 2FA TOTP funcional.
