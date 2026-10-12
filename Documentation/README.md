# DevSculptor — Catálogo Maestro de Documentación Técnica

Bienvenido al repositorio central de documentación de **DevSculptor**. Este directorio organiza la base de conocimiento de ingeniería, decisiones arquitectónicas (ADRs), especificaciones de requerimientos, auditorías de seguridad, planes de aseguramiento de calidad (QA) y guías de despliegue cloud.

La documentación se encuentra estructurada bajo un esquema de **Compendios Maestros Consolidados** (máximo 3-4 documentos autoritativos por área), preservando el historial previo en carpetas de archivo dedicadas para máxima trazabilidad institucional y de portafolio académico (PTY4479).

---

## 📂 Estructura Canónica de Directorios

```
Documentation/
├── Backend/          # 4 Documentos Maestros de Servidor, Datos, Seguridad e Infraestructura
│   └── Archive/      # Histórico de especificaciones individuales de Sprints 1 al 6 y reportes preliminares
├── Frontend/         # 3 Documentos Maestros de Sistema de Diseño, Características y Seguridad
│   └── Archive/      # Histórico de especificaciones UI de Sprints 2 al 6 y auditorías cliente
├── Consolidated/     # 3 Documentos Maestros de Arquitectura Global, Evolución y Plan QA
│   └── Archive/      # Histórico de ProyectCore, ProyectIdea, OKF preliminar y formatos DOCX/PDF
├── screenshots/      # 16 Capturas de pantalla de alta fidelidad auditadas del sistema
└── README.md         # Catálogo maestro de navegación (este archivo)
```

---

## 1. ⚙️ [Documentación Backend](./Backend)

Compendio técnico unificado del servidor Express, persistencia relacional PostgreSQL con Supabase, hardening defensivo y despliegue cloud:

| # | Documento Maestro | Descripción / Alcance |
| :-: | :--- | :--- |
| **1** | [`Backend_Architecture_and_Engineering_Guidelines.md`](./Backend/Backend_Architecture_and_Engineering_Guidelines.md) | **Arquitectura y Convenciones de Ingeniería:** Monolito Modular Layered MVC, TypeScript en modo estricto, BaseRepository con `pg.Pool`, validación en runtime con Zod (SSOT), manejo centralizado de excepciones y logging estructurado con Pino y `X-Request-Id`. |
| **2** | [`Backend_Features_and_Sprints_Specification.md`](./Backend/Backend_Features_and_Sprints_Specification.md) | **Especificación Maestra de Características y Sprints (S1 al S6):** Compendio funcional que unifica el núcleo transaccional, las 8 ADRs fundacionales, motor de consultoría IA, máquina de estados finitos de ADRs, DDL multi-dialecto, RBAC Superadmin, Bóveda OKF, perfil, 2FA TOTP con AES-256-GCM y diagramas Mermaid. |
| **3** | [`Backend_Security_and_Hardening_Audit_Report.md`](./Backend/Backend_Security_and_Hardening_Audit_Report.md) | **Auditoría Consolidada de Seguridad, Hardening y Supabase:** Checklist de los 10 puntos críticos, mitigaciones SEC-01 a SEC-10, trazabilidad forense con `security_events`, anti-enumeración de usuarios en login, jerarquía de rate limiting, auditoría empírica de RLS en 11 tablas en Supabase Cloud, 0 errores/warnings en advisors y 32 tests aprobados. |
| **4** | [`Backend_Deployment_and_Cloud_Infrastructure_Guide.md`](./Backend/Backend_Deployment_and_Cloud_Infrastructure_Guide.md) | **Guía de Despliegue e Infraestructura Cloud:** Topología desacoplada, contenedorización Docker multi-etapa (`node:20-slim`), despliegue con Blueprint en Render (`render.yaml`), despliegue alternativo en Railway, variables de entorno `env.ts`, pool tuning en Supabase, healthchecks `/health` y `/ready`, y configuración DNS. |

📁 *Acceso al archivo histórico de especificaciones de backend:* [`Documentation/Backend/Archive/`](./Backend/Archive)

---

## 2. 🎨 [Documentación Frontend](./Frontend)

Compendio técnico unificado de la interfaz de usuario en React 19 + Vite, sistema de diseño espacial visionOS, interactividad del Canvas relacional y seguridad cliente:

| # | Documento Maestro | Descripción / Alcance |
| :-: | :--- | :--- |
| **1** | [`Frontend_Conventions_and_UX_UI_Guidelines.md`](./Frontend/Frontend_Conventions_and_UX_UI_Guidelines.md) | **Guía de UX/UI y Sistema de Diseño Canónico:** Manual exhaustivo de diseño Apple visionOS Liquid Glassmorphism, paleta dual (Cosmic Dark / Clean Light), tokens de Tailwind, refracción óptica, desenfoque de fondo (`backdrop-blur`), adaptabilidad multi-pantalla y micro-animaciones fluidas. |
| **2** | [`Frontend_Features_and_Sprints_Specification.md`](./Frontend/Frontend_Features_and_Sprints_Specification.md) | **Especificación Maestra de Características y Sprints (S2 al S6):** Compendio funcional de pantallas y flujos: Portal de Acceso, Hub de Proyectos con madurez reactiva, Studio Central con muelle de 4 vistas, Canvas Modeler ERD con curvas Bezier, Copiloto IA lateral, ratificación *Human-in-the-Loop*, Bóveda OKF, Consola Admin, cajón de fondos y Bóveda BYOK. |
| **3** | [`Frontend_Security_and_Quality_Audit_Report.md`](./Frontend/Frontend_Security_and_Quality_Audit_Report.md) | **Informe Consolidado de Seguridad, Sanitización y Calidad:** Erradicación de vectores XSS con `DOMPurify` (`sanitizeHtml` y `sanitizeSvg`), Mermaid en nivel de seguridad `strict`, delimitación estricta de cabeceras BYOK (`X-User-Ai-Key`) por regex, cabeceras CSP en `vercel.json`, y auditoría de 0 secretos en el bundle de producción (`dist/`). |

📁 *Acceso al archivo histórico de especificaciones de frontend:* [`Documentation/Frontend/Archive/`](./Frontend/Archive)

---

## 3. 📊 [Documentación Consolidada](./Consolidated)

Documentos maestros de alto nivel del sistema, gobernanza pre-código, evolución del portafolio y aseguramiento integral de calidad:

| # | Documento Maestro | Descripción / Alcance |
| :-: | :--- | :--- |
| **1** | [`DevSculptor_Master_Technical_Architecture.md`](./Consolidated/DevSculptor_Master_Technical_Architecture.md) | **Especificación Técnica y Arquitectura Maestra Global:** Blueprint definitivo de ingeniería de DevSculptor contra el *"vibe coding"*, principios de diseño, topología desacoplada, modelo de datos unificado en 3FN, ciclo de vida de especificaciones OKF y galería técnica auditada. |
| **2** | [`DevSculptor_Project_Evolution_and_Sprints_Report.md`](./Consolidated/DevSculptor_Project_Evolution_and_Sprints_Report.md) | **Informe de Evolución y Avance Consolidado de Sprints:** Trazabilidad integral de compromisos del portafolio PTY4479 a lo largo de todos los Sprints (1 al 6), hitos logrados, métricas de código, porcentaje de cumplimiento y entregables certificados. |
| **3** | [`DevSculptor_Comprehensive_Test_and_Quality_Plan.md`](./Consolidated/DevSculptor_Comprehensive_Test_and_Quality_Plan.md) | **Plan Integral de Pruebas y Aseguramiento de Calidad (QA):** Estrategia de pruebas funcionales e integradas, casos de prueba formales (TC-CANV, TC-ADR, TC-REQ, TC-AUTH), criterios de aceptación, métricas de cobertura y enlaces al informe formal portable en [PDF](./Archive/Plan_de_Pruebas_Integral_DevSculptor.pdf) y [Word](./Archive/Plan_de_Pruebas_Integral_DevSculptor.docx). |

📁 *Acceso al archivo histórico de documentos consolidados:* [`Documentation/Consolidated/Archive/`](./Consolidated/Archive)

---

## 4. 📸 [Galería de Capturas de Pantalla Auditadas](./screenshots)

Capturas de pantalla de alta fidelidad (1440x900px) que certifican la operatividad visual y funcional del sistema en producción:

| Archivo | Pantalla / Módulo | Descripción |
| :--- | :--- | :--- |
| [`01_auth_portal.png`](./screenshots/01_auth_portal.png) | Portal de Acceso | Autenticación y registro con estética glassmórfica visionOS. |
| [`02_projects_hub.png`](./screenshots/02_projects_hub.png) | Hub de Proyectos | Cuadrícula de proyectos con indicador de madurez porcentual. |
| [`03_requirements_view.png`](./screenshots/03_requirements_view.png) | Matriz IEEE-830 | Gestión de requerimientos funcionales y no funcionales tipados. |
| [`04_decisions_view.png`](./screenshots/04_decisions_view.png) | Catálogo de ADRs | Registro de decisiones arquitectónicas con máquina de estados. |
| [`04b_canvas_relational_modeler.png`](./screenshots/04b_canvas_relational_modeler.png) | Lienzo ERD | Modelador relacional visual interactivo con conectores Bezier. |
| [`05_platform_settings_drawer.png`](./screenshots/05_platform_settings_drawer.png) | Cajón de Plataforma | Portal de configuración izquierda y selector de wallpapers. |
| [`06_user_profile_drawer.png`](./screenshots/06_user_profile_drawer.png) | Cajón de Usuario | Perfil de usuario, credenciales y configuración de cuenta. |
| [`06a_user_profile_tab.png`](./screenshots/06a_user_profile_tab.png) | Pestaña Perfil | Edición de datos nominativos del usuario (`PUT /auth/profile`). |
| [`06b_user_security_mfa_tab.png`](./screenshots/06b_user_security_mfa_tab.png) | Pestaña Seguridad | Configuración y activación de segundo factor 2FA TOTP. |
| [`06c_user_byok_keys_tab.png`](./screenshots/06c_user_byok_keys_tab.png) | Pestaña BYOK | Bóveda de gestión de claves de API de IA propias. |
| [`07_copilot_assistant_panel.png`](./screenshots/07_copilot_assistant_panel.png) | Copiloto Lateral | Asistente de arquitectura con streaming y métricas. |
| [`08_minimal_top_bar.png`](./screenshots/08_minimal_top_bar.png) | Barra Superior | Navegación minimalista, selector de proyecto y tema. |
| [`09_admin_console_superadmin.png`](./screenshots/09_admin_console_superadmin.png) | Consola Superadmin | Telemetría global, auditoría en vivo y control de usuarios. |
| [`09b_admin_console_ai_models.png`](./screenshots/09b_admin_console_ai_models.png) | Pestaña Modelos IA | Administración y cuotas de modelos de lenguaje grande. |
| [`10_mermaid_interactive_diagram.png`](./screenshots/10_mermaid_interactive_diagram.png) | Visor Mermaid SVG | Visualizador vectorial interactivo de diagramas de arquitectura. |
| [`11_executive_document_export.png`](./screenshots/11_executive_document_export.png) | Exportación Ejecutiva | Vista previa de compilación y descarga documental multi-formato. |
