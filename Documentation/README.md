# DevSculptor — Catálogo Maestro de Documentación Técnica

Bienvenido al repositorio central de documentación de **DevSculptor**. Este directorio organiza la base de conocimiento de ingeniería, decisiones arquitectónicas (ADRs), especificaciones de requerimientos, auditorías de seguridad y planes de aseguramiento de calidad (QA) bajo una estructura canónica dividida en tres corrientes operativas:

---

## 📂 Estructura de Directorios

```
Documentation/
├── Backend/          # Guías de arquitectura, convenciones, ADRs de backend, DB, auditorías y seguridad
├── Frontend/         # Sistema de diseño visionOS, directrices de UX/UI, specs de cliente, sanitización y stores
└── Consolidated/     # Informes de avance consolidados, requerimientos PTY4479, planes QA y OKF
```

---

## 1. ⚙️ [Documentación Backend](./Backend)

Contiene las especificaciones técnicas del servidor, modelos relacionales, reglas de gobernanza, auditorías de seguridad, RLS y motores de IA:

| Documento | Descripción / Alcance |
| :--- | :--- |
| [`Security_Hardening_and_Audit_Remediation_Report.md`](./Backend/Security_Hardening_and_Audit_Remediation_Report.md) | **Auditoría y Hardening Integral Backend**: Mitigación de vulnerabilidades OWASP, tipado JWT, revocación `token_version`, cifrado AES-256-GCM, protección anti-SSRF, rate limiting y suite Vitest. |
| [`Supabase_Security_and_Performance_Report.md`](./Backend/Supabase_Security_and_Performance_Report.md) | **Auditoría de Seguridad y Rendimiento Supabase**: Cobertura RLS al 100% (11 tablas), índices optimizados y resolución de 0 advertencias / 0 errores en Security Advisors. |
| [`Backend_Conventions_and_Architecture_Guidelines.md`](./Backend/Backend_Conventions_and_Architecture_Guidelines.md) | Convenciones de TypeScript estricto, Monolito Modular Layered MVC, logging estructurado Pino y manejo de excepciones. |
| [`Sprint1ADRs.md`](./Backend/Sprint1ADRs.md) | Las 8 decisiones arquitectónicas fundamentales e irreversibles del backend (Layered MVC, PostgreSQL, Supabase RLS, JWT, etc.). |
| [`Sprint1_Backend_Consolidated_Report.md`](./Backend/Sprint1_Backend_Consolidated_Report.md) | Informe técnico consolidado del backend core, procedimientos almacenados y métricas de madurez. |
| [`Sprint3_AI_Consultant_Engine_Specification.md`](./Backend/Sprint3_AI_Consultant_Engine_Specification.md) | Motor de consultoría arquitectónica con IA, ingeniería de prompts e inyección contextual de proyecto. |
| [`Sprint3_Architectural_Governance_and_ADR_Lifecycle_Specification.md`](./Backend/Sprint3_Architectural_Governance_and_ADR_Lifecycle_Specification.md) | Ciclo de vida y máquina de estados finitos de ADRs (PROPOSED, ACCEPTED, REJECTED, SUPERSEDED). |
| [`Sprint3_MultiDialect_DDL_Requirement.md`](./Backend/Sprint3_MultiDialect_DDL_Requirement.md) | Especificación de generación de DDL relacional multi-dialecto (PostgreSQL, MySQL, SQLite, Oracle). |
| [`Sprint4_Backend_Security_CORS_and_Storage_RLS.md`](./Backend/Sprint4_Backend_Security_CORS_and_Storage_RLS.md) | Políticas de CORS, autorización de subidas a storage y Row Level Security en Supabase. |
| [`Sprint4_StageB_Master_Admin_RBAC_and_Global_Vault.md`](./Backend/Sprint4_StageB_Master_Admin_RBAC_and_Global_Vault.md) | Control de acceso basado en roles (RBAC), middleware `requireSuperAdmin` y endpoints de Bóveda Global. |
| [`Sprint5_Backend_Profile_and_Credential_Management_Specification.md`](./Backend/Sprint5_Backend_Profile_and_Credential_Management_Specification.md) | Gestión de perfil de usuario (`PUT /auth/profile`), rotación segura de credenciales y auditoría. |
| [`Render_Deployment_Guide.md`](./Backend/Render_Deployment_Guide.md) | **Guía de Despliegue en Render**: Instrucciones paso a paso (Blueprint y Manual) para alojar el backend y conectarlo con Vercel y dominio propio. |

---

## 2. 🎨 [Documentación Frontend](./Frontend)

Contiene los estándares de interfaz de usuario, tokens de diseño de vidrio espacial, interactividad del Canvas relacional, sanitización y módulos cliente:

| Documento | Descripción / Alcance |
| :--- | :--- |
| [`Security_Hardening_and_DOM_Sanitization_Report.md`](./Frontend/Security_Hardening_and_DOM_Sanitization_Report.md) | **Hardening Frontend y Sanitización DOM**: Integración de DOMPurify contra XSS, Mermaid en nivel strict, scoping estricto de cabeceras BYOK y Content Security Policy. |
| [`Frontend_Conventions_and_UX_UI_Guidelines.md`](./Frontend/Frontend_Conventions_and_UX_UI_Guidelines.md) | Guía exhaustiva de UX/UI, sistema de diseño Apple visionOS Liquid Glassmorphism, paleta dual y micro-animaciones. |
| [`Sprint2_Frontend_Consolidated_Report.md`](./Frontend/Sprint2_Frontend_Consolidated_Report.md) | Informe de avance consolidado del frontend SPA (React 19 + Vite + Tailwind CSS + Zustand). |
| [`Sprint3_ADR_Human_In_The_Loop_and_Architecture_Selection_Guidelines.md`](./Frontend/Sprint3_ADR_Human_In_The_Loop_and_Architecture_Selection_Guidelines.md) | Flujo interactivo *Human-in-the-Loop* para la ratificación de ADRs y selección arquitectónica. |
| [`Sprint3_Frontend_AI_Integration_Guidelines.md`](./Frontend/Sprint3_Frontend_AI_Integration_Guidelines.md) | Integración del Copiloto IA en la interfaz de usuario, streaming de respuestas y feedback visual. |
| [`Sprint4_Frontend_OKF_Engine_Manifest_and_Vault_Architecture.md`](./Frontend/Sprint4_Frontend_OKF_Engine_Manifest_and_Vault_Architecture.md) | Arquitectura del compilador OKF cliente, tracking reactivo de frescura y manifiesto maestro `/INDEX.md`. |
| [`Sprint4_StageB_Frontend_Master_Admin_Cockpit_and_Vault_Editor.md`](./Frontend/Sprint4_StageB_Frontend_Master_Admin_Cockpit_and_Vault_Editor.md) | Consola maestra de Superadministrador (Bóveda Global, Telemetría, Auditoría y Usuarios). |
| [`Sprint5_Frontend_Platform_Settings_and_User_BYOK_Architecture.md`](./Frontend/Sprint5_Frontend_Platform_Settings_and_User_BYOK_Architecture.md) | Cajón de configuración de plataforma, selector de fondos de pantalla, bóveda local BYOK y motor de visualización Mermaid. |

---

## 3. 📊 [Documentación Consolidada](./Consolidated)

Documentos de alto nivel del proyecto, especificaciones troncales académicas (PTY4479), planes de pruebas y auditoría integral:

| Documento | Descripción / Alcance |
| :--- | :--- |
| [`Project_Sprints_Consolidated_Progress_Report.md`](./Consolidated/Project_Sprints_Consolidated_Progress_Report.md) | **Informe Consolidado Maestro**: Avance técnico de todos los Sprints (1 al 5) y ciclo de Hardening de Seguridad Pre-Producción culminados al 100%. |
| [`DevSculptor_Master_Technical_Architecture_and_Specifications.md`](./Consolidated/DevSculptor_Master_Technical_Architecture_and_Specifications.md) | **Especificación Técnica Maestra**: Arquitectura global, topología de capas, contratos DDL, motor 3FN, OKF y galería visual auditada. |
| [`ProyectCore.md`](./Consolidated/ProyectCore.md) | Definición formal del núcleo del proyecto, alcance técnico, objetivos y restricciones troncales. |
| [`ProyectIdea.md`](./Consolidated/ProyectIdea.md) | Manifiesto fundacional y visión conceptual de DevSculptor contra el fenómeno del *"vibe coding"*. |
| [`Sprint4_OKF_Document_Vault_and_Packaging_Specification.md`](./Consolidated/Sprint4_OKF_Document_Vault_and_Packaging_Specification.md) | Especificación integral de compilación OKF, hashes criptográficos SHA-256 y empaquetado ZIP cliente/servidor. |
| [`Plan_de_Pruebas_Integral_DevSculptor.md`](./Consolidated/Plan_de_Pruebas_Integral_DevSculptor.md) | Plan de pruebas integral exhaustivo de QA (Casos de prueba TC-CANV, TC-ADR, TC-REQ, métricas y criterios de aceptación). |
| `Plan_de_Pruebas_Integral_DevSculptor.{docx,pdf}` | Versiones portables formateadas en Microsoft Word y PDF del Plan de Pruebas Integral. |

---

## 4. 📸 [Galería de Capturas de Pantalla](./screenshots)

Capturas de pantalla de alta fidelidad (1440x900px) que acreditan la operatividad visual y funcional del sistema:

* [`01_auth_portal.png`](./screenshots/01_auth_portal.png): Portal de acceso con estética visionOS.
* [`02_projects_hub.png`](./screenshots/02_projects_hub.png): Hub de proyectos y madurez porcentual.
* [`03_requirements_view.png`](./screenshots/03_requirements_view.png): Matriz de requisitos IEEE-830.
* [`04_decisions_view.png`](./screenshots/04_decisions_view.png): Registro de decisiones arquitectónicas (ADRs).
* [`04b_canvas_relational_modeler.png`](./screenshots/04b_canvas_relational_modeler.png): Lienzo relacional ERD interactivo con conectores Bezier.
* [`05_platform_settings_drawer.png`](./screenshots/05_platform_settings_drawer.png): Cajón portal izquierdo de configuración y wallpapers.
* [`06_user_profile_drawer.png`](./screenshots/06_user_profile_drawer.png): Cajón lateral derecho de usuario y credenciales.
* [`06a_user_profile_tab.png`](./screenshots/06a_user_profile_tab.png): Pestaña de edición de perfil (`PUT /auth/profile`).
* [`06b_user_security_mfa_tab.png`](./screenshots/06b_user_security_mfa_tab.png): Pestaña de seguridad y 2FA TOTP.
* [`06c_user_byok_keys_tab.png`](./screenshots/06c_user_byok_keys_tab.png): Pestaña de gestión de API keys propias (BYOK).
* [`07_copilot_assistant_panel.png`](./screenshots/07_copilot_assistant_panel.png): Copiloto lateral integrado con métricas.
* [`08_minimal_top_bar.png`](./screenshots/08_minimal_top_bar.png): Barra superior minimalista tipo Apple.
* [`09_admin_console_superadmin.png`](./screenshots/09_admin_console_superadmin.png): Consola de Superadministrador y Bóveda Global.
* [`09b_admin_console_ai_models.png`](./screenshots/09b_admin_console_ai_models.png): Pestaña de administración de modelos IA.
* [`10_mermaid_interactive_diagram.png`](./screenshots/10_mermaid_interactive_diagram.png): Visualizador reactivo vectorial Mermaid SVG.
* [`11_executive_document_export.png`](./screenshots/11_executive_document_export.png): Vista previa de exportación ejecutiva multi-formato.
