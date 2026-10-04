# DevSculptor — Catálogo Maestro de Documentación Técnica

Bienvenido al repositorio central de documentación de **DevSculptor**. Este directorio organiza la base de conocimiento de ingeniería, decisiones arquitectónicas (ADRs), especificaciones de requerimientos y planes de aseguramiento de calidad (QA) bajo una estructura canónica dividida en tres corrientes operativas:

---

## 📂 Estructura de Directorios

```
Documentation/
├── Backend/          # Guías de arquitectura, convenciones, ADRs de backend, DB y seguridad
├── Frontend/         # Sistema de diseño visionOS, directrices de UX/UI, specs de cliente y stores
└── Consolidated/     # Informes de avance consolidados, requerimientos PTY4479, planes QA y OKF
```

---

## 1. ⚙️ [Documentación Backend](file:///c:/Users/natha/Documents/Repos/DevSculptor/Documentation/Backend)

Contiene las especificaciones técnicas del servidor, modelos relacionales, reglas de gobernanza, seguridad RLS y motores de IA:

| Documento | Descripción / Alcance |
| :--- | :--- |
| [`Backend_Conventions_and_Architecture_Guidelines.md`](file:///c:/Users/natha/Documents/Repos/DevSculptor/Documentation/Backend/Backend_Conventions_and_Architecture_Guidelines.md) | Convenciones de TypeScript estricto, Monolito Modular Layered MVC, logging estructurado Pino y manejo de excepciones. |
| [`Sprint1ADRs.md`](file:///c:/Users/natha/Documents/Repos/DevSculptor/Documentation/Backend/Sprint1ADRs.md) | Las 8 decisiones arquitectónicas fundamentales e irreversibles del backend (Layered MVC, PostgreSQL, Supabase RLS, JWT, etc.). |
| [`Sprint1_Backend_Consolidated_Report.md`](file:///c:/Users/natha/Documents/Repos/DevSculptor/Documentation/Backend/Sprint1_Backend_Consolidated_Report.md) | Informe técnico consolidado del backend core, procedimientos almacenados y métricas de madurez. |
| [`Sprint3_AI_Consultant_Engine_Specification.md`](file:///c:/Users/natha/Documents/Repos/DevSculptor/Documentation/Backend/Sprint3_AI_Consultant_Engine_Specification.md) | Motor de consultoría arquitectónica con IA, ingeniería de prompts e inyección contextual de proyecto. |
| [`Sprint3_Architectural_Governance_and_ADR_Lifecycle_Specification.md`](file:///c:/Users/natha/Documents/Repos/DevSculptor/Documentation/Backend/Sprint3_Architectural_Governance_and_ADR_Lifecycle_Specification.md) | Ciclo de vida y máquina de estados finitos de ADRs (PROPOSED, ACCEPTED, REJECTED, SUPERSEDED). |
| [`Sprint3_MultiDialect_DDL_Requirement.md`](file:///c:/Users/natha/Documents/Repos/DevSculptor/Documentation/Backend/Sprint3_MultiDialect_DDL_Requirement.md) | Especificación de generación de DDL relacional multi-dialecto (PostgreSQL, MySQL, SQLite, Oracle). |
| [`Sprint4_Backend_Security_CORS_and_Storage_RLS.md`](file:///c:/Users/natha/Documents/Repos/DevSculptor/Documentation/Backend/Sprint4_Backend_Security_CORS_and_Storage_RLS.md) | Políticas de CORS, autorización de subidas a storage y Row Level Security en Supabase. |
| [`Sprint4_StageB_Master_Admin_RBAC_and_Global_Vault.md`](file:///c:/Users/natha/Documents/Repos/DevSculptor/Documentation/Backend/Sprint4_StageB_Master_Admin_RBAC_and_Global_Vault.md) | Control de acceso basado en roles (RBAC), middleware `requireSuperAdmin` y endpoints de Bóveda Global. |
| [`Sprint5_Backend_Profile_and_Credential_Management_Specification.md`](file:///c:/Users/natha/Documents/Repos/DevSculptor/Documentation/Backend/Sprint5_Backend_Profile_and_Credential_Management_Specification.md) | Gestión de perfil de usuario (`PUT /auth/profile`), rotación segura de credenciales y auditoría. |
| [`Supabase_Security_and_Performance_Report.md`](file:///c:/Users/natha/Documents/Repos/DevSculptor/Documentation/Backend/Supabase_Security_and_Performance_Report.md) | Auditoría de seguridad de base de datos PostgreSQL, políticas RLS activadas e indexación optimizada. |
| [`Render_Deployment_Guide.md`](file:///c:/Users/natha/Documents/Repos/DevSculptor/Documentation/Backend/Render_Deployment_Guide.md) | **Guía de Despliegue en Render**: Instrucciones paso a paso (Blueprint y Manual) para alojar el backend y conectarlo con Vercel y dominio propio. |

---

## 2. 🎨 [Documentación Frontend](file:///c:/Users/natha/Documents/Repos/DevSculptor/Documentation/Frontend)

Contiene los estándares de interfaz de usuario, tokens de diseño de vidrio espacial, interactividad del Canvas relacional y módulos cliente:

| Documento | Descripción / Alcance |
| :--- | :--- |
| [`Frontend_Conventions_and_UX_UI_Guidelines.md`](file:///c:/Users/natha/Documents/Repos/DevSculptor/Documentation/Frontend/Frontend_Conventions_and_UX_UI_Guidelines.md) | Guía exhaustiva de UX/UI, sistema de diseño Apple visionOS Liquid Glassmorphism, paleta dual y micro-animaciones. |
| [`Sprint2_Frontend_Consolidated_Report.md`](file:///c:/Users/natha/Documents/Repos/DevSculptor/Documentation/Frontend/Sprint2_Frontend_Consolidated_Report.md) | Informe de avance consolidado del frontend SPA (React 19 + Vite + Tailwind CSS + Zustand). |
| [`Sprint3_ADR_Human_In_The_Loop_and_Architecture_Selection_Guidelines.md`](file:///c:/Users/natha/Documents/Repos/DevSculptor/Documentation/Frontend/Sprint3_ADR_Human_In_The_Loop_and_Architecture_Selection_Guidelines.md) | Flujo interactivo *Human-in-the-Loop* para la ratificación de ADRs y selección arquitectónica. |
| [`Sprint3_Frontend_AI_Integration_Guidelines.md`](file:///c:/Users/natha/Documents/Repos/DevSculptor/Documentation/Frontend/Sprint3_Frontend_AI_Integration_Guidelines.md) | Integración del Copiloto IA en la interfaz de usuario, streaming de respuestas y feedback visual. |
| [`Sprint4_Frontend_OKF_Engine_Manifest_and_Vault_Architecture.md`](file:///c:/Users/natha/Documents/Repos/DevSculptor/Documentation/Frontend/Sprint4_Frontend_OKF_Engine_Manifest_and_Vault_Architecture.md) | Arquitectura del compilador OKF cliente, tracking reactivo de frescura y manifiesto maestro `/INDEX.md`. |
| [`Sprint4_StageB_Frontend_Master_Admin_Cockpit_and_Vault_Editor.md`](file:///c:/Users/natha/Documents/Repos/DevSculptor/Documentation/Frontend/Sprint4_StageB_Frontend_Master_Admin_Cockpit_and_Vault_Editor.md) | Consola maestra de Superadministrador (Bóveda Global, Telemetría, Auditoría y Usuarios). |
| [`Sprint5_Frontend_Platform_Settings_and_User_BYOK_Architecture.md`](file:///c:/Users/natha/Documents/Repos/DevSculptor/Documentation/Frontend/Sprint5_Frontend_Platform_Settings_and_User_BYOK_Architecture.md) | Cajón de configuración de plataforma, selector de fondos de pantalla, bóveda local BYOK y motor de visualización Mermaid. |

---

## 3. 📊 [Documentación Consolidada](file:///c:/Users/natha/Documents/Repos/DevSculptor/Documentation/Consolidated)

Documentos de alto nivel del proyecto, especificaciones troncales académicas (PTY4479), planes de pruebas y auditoría integral:

| Documento | Descripción / Alcance |
| :--- | :--- |
| [`DevSculptor_Master_Technical_Architecture_and_Specifications.md`](file:///c:/Users/natha/Documents/Repos/DevSculptor/Documentation/Consolidated/DevSculptor_Master_Technical_Architecture_and_Specifications.md) | **Especificación Técnica Maestra**: Arquitectura global, topología de capas, contratos DDL, motor 3FN, OKF y galería visual auditada. |
| [`Project_Sprints_Consolidated_Progress_Report.md`](file:///c:/Users/natha/Documents/Repos/DevSculptor/Documentation/Consolidated/Project_Sprints_Consolidated_Progress_Report.md) | Informe consolidado de avance técnico integral a través de todos los Sprints del proyecto. |
| [`ProyectCore.md`](file:///c:/Users/natha/Documents/Repos/DevSculptor/Documentation/Consolidated/ProyectCore.md) | Definición formal del núcleo del proyecto, alcance técnico, objetivos y restricciones troncales. |
| [`ProyectIdea.md`](file:///c:/Users/natha/Documents/Repos/DevSculptor/Documentation/Consolidated/ProyectIdea.md) | Manifiesto fundacional y visión conceptual de DevSculptor contra el fenómeno del *"vibe coding"*. |
| [`Sprint4_OKF_Document_Vault_and_Packaging_Specification.md`](file:///c:/Users/natha/Documents/Repos/DevSculptor/Documentation/Consolidated/Sprint4_OKF_Document_Vault_and_Packaging_Specification.md) | Especificación integral de compilación OKF, hashes criptográficos SHA-256 y empaquetado ZIP cliente/servidor. |
| [`Plan_de_Pruebas_Integral_DevSculptor.md`](file:///c:/Users/natha/Documents/Repos/DevSculptor/Documentation/Consolidated/Plan_de_Pruebas_Integral_DevSculptor.md) | Plan de pruebas integral exhaustivo de QA (Casos de prueba TC-CANV, TC-ADR, TC-REQ, métricas y criterios de aceptación). |
| `Plan_de_Pruebas_Integral_DevSculptor.{docx,pdf}` | Versiones portables formateadas en Microsoft Word y PDF del Plan de Pruebas Integral. |

---

## 4. 📸 [Galería de Capturas de Pantalla](file:///c:/Users/natha/Documents/Repos/DevSculptor/Documentation/screenshots)

Capturas de pantalla de alta fidelidad (1440x900px) que acreditan la operatividad visual y funcional del sistema:

* [`01_auth_portal.png`](file:///c:/Users/natha/Documents/Repos/DevSculptor/Documentation/screenshots/01_auth_portal.png): Portal de acceso con estética visionOS.
* [`02_projects_hub.png`](file:///c:/Users/natha/Documents/Repos/DevSculptor/Documentation/screenshots/02_projects_hub.png): Hub de proyectos y madurez porcentual.
* [`03_requirements_view.png`](file:///c:/Users/natha/Documents/Repos/DevSculptor/Documentation/screenshots/03_requirements_view.png): Matriz de requisitos IEEE-830.
* [`04_decisions_view.png`](file:///c:/Users/natha/Documents/Repos/DevSculptor/Documentation/screenshots/04_decisions_view.png): Registro de decisiones arquitectónicas (ADRs).
* [`04b_canvas_relational_modeler.png`](file:///c:/Users/natha/Documents/Repos/DevSculptor/Documentation/screenshots/04b_canvas_relational_modeler.png): Lienzo relacional ERD interactivo con conectores Bezier.
* [`05_platform_settings_drawer.png`](file:///c:/Users/natha/Documents/Repos/DevSculptor/Documentation/screenshots/05_platform_settings_drawer.png): Cajón portal izquierdo de configuración y wallpapers.
* [`06_user_profile_drawer.png`](file:///c:/Users/natha/Documents/Repos/DevSculptor/Documentation/screenshots/06_user_profile_drawer.png): Cajón lateral derecho de usuario y credenciales.
* [`06a_user_profile_tab.png`](file:///c:/Users/natha/Documents/Repos/DevSculptor/Documentation/screenshots/06a_user_profile_tab.png): Pestaña de edición de perfil (`PUT /auth/profile`).
* [`06b_user_security_mfa_tab.png`](file:///c:/Users/natha/Documents/Repos/DevSculptor/Documentation/screenshots/06b_user_security_mfa_tab.png): Pestaña de seguridad y 2FA TOTP.
* [`06c_user_byok_keys_tab.png`](file:///c:/Users/natha/Documents/Repos/DevSculptor/Documentation/screenshots/06c_user_byok_keys_tab.png): Pestaña de gestión de API keys propias (BYOK).
* [`07_copilot_assistant_panel.png`](file:///c:/Users/natha/Documents/Repos/DevSculptor/Documentation/screenshots/07_copilot_assistant_panel.png): Copiloto lateral integrado con métricas.
* [`08_minimal_top_bar.png`](file:///c:/Users/natha/Documents/Repos/DevSculptor/Documentation/screenshots/08_minimal_top_bar.png): Barra superior minimalista tipo Apple.
* [`09_admin_console_superadmin.png`](file:///c:/Users/natha/Documents/Repos/DevSculptor/Documentation/screenshots/09_admin_console_superadmin.png): Consola de Superadministrador y Bóveda Global.
* [`09b_admin_console_ai_models.png`](file:///c:/Users/natha/Documents/Repos/DevSculptor/Documentation/screenshots/09b_admin_console_ai_models.png): Pestaña de administración de modelos IA.
* [`10_mermaid_interactive_diagram.png`](file:///c:/Users/natha/Documents/Repos/DevSculptor/Documentation/screenshots/10_mermaid_interactive_diagram.png): Visualizador reactivo vectorial Mermaid SVG.
* [`11_executive_document_export.png`](file:///c:/Users/natha/Documents/Repos/DevSculptor/Documentation/screenshots/11_executive_document_export.png): Vista previa de exportación ejecutiva multi-formato.

