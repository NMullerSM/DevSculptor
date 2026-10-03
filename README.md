<div align="center">

# 💎 DevSculptor
### Plataforma de Gobernanza Técnica Pre-Código & Documentación Asistida por IA

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb?logo=react)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green?logo=node.js)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-336791?logo=postgresql)](https://www.postgresql.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Cloud-3ecf8e?logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?logo=tailwind-css)](https://tailwindcss.com/)
[![Status](https://img.shields.io/badge/Status-Release%20Candidate%20(Sprint%201--5)-success)](Documentation/Consolidated/DevSculptor_Master_Technical_Architecture_and_Specifications.md)

<p align="center">
  <b>Mitigando el fenómeno del <i>"vibe coding"</i> mediante disciplina de diseño de software, trazabilidad inmutable y especificaciones deterministas para agentes de IA.</b>
</p>

[📚 Catálogo de Documentación](Documentation/README.md) • [📐 Especificación Técnica Maestra](Documentation/Consolidated/DevSculptor_Master_Technical_Architecture_and_Specifications.md) • [📸 Galería de Capturas](Documentation/screenshots/) • [🧪 Plan Integral de Pruebas](Documentation/Consolidated/Plan_de_Pruebas_Integral_DevSculptor.md)

</div>

---

## 🌟 ¿Qué es DevSculptor?

**DevSculptor** es un entorno de ingeniería de software orientado a la **gobernanza técnica pre-código**. Nace como respuesta a la proliferación del *"vibe coding"* (la generación desestructurada de código mediante LLMs sin validación arquitectónica ni diseño previo).

DevSculptor proporciona a los equipos de desarrollo un flujo riguroso y colaborativo que transforma la ideación conceptual en especificaciones formales inmutables listas para producción:

1. **Captura Jerárquica de Requisitos (IEEE-830)**: Redacción asistida de requisitos funcionales (RF) y no funcionales (RNF) con niveles de severidad y generación automática de tests.
2. **Registro de Decisiones Arquitectónicas (ADRs)**: Catálogo inmutable con máquina de estados finitos (`PROPOSED`, `ACCEPTED`, `REJECTED`, `SUPERSEDED`) y protocolo de ratificación *Human-in-the-Loop*.
3. **Modelador Relacional ERD & Auditor 3FN**: Lienzo interactivo con conectores Bezier dinámicos, notación Crow's Foot, evaluación algorítmica de Tercera Forma Normal (3FN) y generación simultánea de DDL para **PostgreSQL**, **MySQL**, **SQLite** y **Oracle 21c**.
4. **Bóveda OKF (Open Knowledge Framework)**: Generador determinista de documentación viva con hashing criptográfico SHA-256 y manifiesto maestro `/INDEX.md` diseñado para alimentar asistentes de desarrollo (Claude Code, Cursor, Copilot) sin alucinación arquitectónica.
5. **Motor Visualizador Mermaid & Exportación Ejecutiva**: Renderizador SVG vectorial interactivo con zoom (+/-), ajuste 100% y descarga en formatos `.mmd`, `.svg`, HTML imprimible y Markdown.
6. **Bóveda de Credenciales de Usuario (BYOK)**: Almacenamiento seguro en navegador para que el usuario utilice sus propias API Keys de Gemini o OpenAI con comprobador de latencia (*Ping Test*).

---

## 📸 Recorrido Visual de la Plataforma

| Portal de Acceso (visionOS Liquid Glass) | Hub Central de Proyectos & Madurez |
| :---: | :---: |
| ![Portal](Documentation/screenshots/01_auth_portal.png) | ![Proyectos](Documentation/screenshots/02_projects_hub.png) |
| *Acceso seguro con autenticación Argon2id y JWT* | *Listado de proyectos y cálculo dinámico de madurez arquitectónica* |

| Matriz de Requisitos IEEE-830 | Registro Formal de Decisiones (ADRs) |
| :---: | :---: |
| ![Requisitos](Documentation/screenshots/03_requirements_view.png) | ![ADRs](Documentation/screenshots/04_decisions_view.png) |
| *Captura asistida y priorización de requisitos técnicos* | *Máquina de estados finitos con ratificación Human-in-the-Loop* |

| Lienzo Relacional ERD & Motor 3FN | Visualizador de Diagramas Mermaid SVG |
| :---: | :---: |
| ![Canvas ERD](Documentation/screenshots/04b_canvas_relational_modeler.png) | ![Diagrama Mermaid](Documentation/screenshots/10_mermaid_interactive_diagram.png) |
| *Modelado visual, conectores Bezier y multi-dialecto DDL* | *Renderizado vectorial reactivo con zoom escalable y descarga* |

| Cajón de Configuración de Plataforma | Cajón Lateral de Perfil, 2FA y BYOK |
| :---: | :---: |
| ![Plataforma](Documentation/screenshots/05_platform_settings_drawer.png) | ![Usuario](Documentation/screenshots/06_user_profile_drawer.png) |
| *Control de vidrio, temas y wallpapers de alta resolución* | *Slide-over a pantalla completa para perfil, seguridad y API keys* |

---

## 🏛️ Topología y Arquitectura del Sistema

El sistema implementa una arquitectura desacoplada pero de alta cohesión:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    ARQUITECTURA GENERAL DE DEVSCULPTOR                      │
├─────────────────────────────────────────────────────────────────────────────┤
│  FRONTEND (SPA) - React 19 + TypeScript + Vite + Tailwind CSS + Zustand     │
│  ├── Sistema de Diseño visionOS Liquid Glassmorphism (Modo Claro/Oscuro)   │
│  ├── Barra Superior Minimalista (TopBar) & Portales Laterales (Drawers)    │
│  ├── Lienzo Relacional ERD con Conectores Bezier SVG & Auditor 3FN          │
│  ├── Motor Visualizador Vectorial Mermaid SVG & Compilador MMD             │
│  └── Bóveda Local de Claves (BYOK) para Proveedores de IA                   │
├─────────────────────────────────────────────────────────────────────────────┤
│  BACKEND (API REST) - Node.js 20+ con Express & Monolito Modular Layered MVC│
│  ├── Controladores (HTTP Validation Zod)                                   │
│  ├── Servicios (Lógica de Negocio, Criptografía SHA-256 & Transacciones)   │
│  ├── Repositorios (Consultas Parametrizadas SQL)                           │
│  ├── Motor de Consultoría IA (Google Gemini 2.5 Flash / OpenAI GPT-4o)     │
│  ├── Seguridad Transversal (Argon2id, JWT Stateless, TOTP 2FA RFC 6238)    │
│  └── Fail-Safe 404 RBAC para Consola de Superadministrador                 │
├─────────────────────────────────────────────────────────────────────────────┤
│  PERSISTENCIA & STORAGE - PostgreSQL 15+ en Supabase Cloud                 │
│  ├── Procedimiento Almacenado de Madurez (sp_calculate_project_maturity)   │
│  ├── Disparadores y Políticas de Seguridad Row Level Security (RLS)        │
│  └── Buckets Privados de Documentos OKF con Cifrado en Reposo              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Inicio Rápido y Ejecución Local

### Prerrequisitos
* **Node.js** v20.x o superior
* **npm** v10.x o superior
* Proyecto activo en **Supabase** (PostgreSQL 15+)

### 1. Clonar el Repositorio
```bash
git clone https://github.com/NMullerSM/DevSculptor.git
cd DevSculptor
```

### 2. Configuración del Backend
```bash
cd devsculptor-backend
npm install
```

Crea un archivo `.env` en `devsculptor-backend/` basándote en `.env.example`:
```env
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres
JWT_SECRET=tu_clave_secreta_jwt_muy_segura
GEMINI_API_KEY=tu_api_key_de_gemini
SUPABASE_URL=https://[TU_PROYECTO].supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
```

Iniciar servidor de desarrollo:
```bash
npm run dev
# Backend activo en http://localhost:3000
```

### 3. Configuración del Frontend
```bash
cd ../devsculptor-frontend
npm install
```

Iniciar cliente web:
```bash
npm run dev
# Frontend activo en http://localhost:5173
```

---

## 📁 Estructura del Repositorio

```
DevSculptor/
├── Documentation/                    # Catálogo maestro de documentación técnica
│   ├── README.md                     # Índice general de documentación
│   ├── Backend/                      # Convenciones, ADRs, guías MVC y auditoría DB
│   ├── Frontend/                     # Sistema de diseño visionOS, UX/UI y specs cliente
│   ├── Consolidated/                 # Especificación técnica maestra, informes de sprint y QA
│   └── screenshots/                  # Galería completa de capturas de pantalla del sistema
├── devsculptor-backend/              # Servidor API REST Monolito Modular Layered MVC
│   ├── src/
│   │   ├── config/                   # Base de datos, variables de entorno y logger Pino
│   │   ├── middlewares/              # Autenticación JWT, RBAC Fail-Safe 404, CORS y errores
│   │   ├── modules/                  # Módulos: auth, projects, requirements, decisions, canvas, ai, admin, okf
│   │   └── shared/                   # Excepciones tipadas AppError y respuestas API estándar
│   └── package.json
├── devsculptor-frontend/             # Cliente SPA React 19 + TypeScript + Vite
│   ├── src/
│   │   ├── components/               # UI Atómica visionOS, layout AppleTopBar, modales y diagramas
│   │   ├── features/                 # Módulos: auth, studio, requirements, decisions, canvas, settings, export
│   │   ├── services/                 # Clientes API tipados Axios (auth, projects, ai, decisions, etc.)
│   │   ├── stores/                   # Manejadores de estado reactivo Zustand
│   │   └── styles/                   # Tokens de vidrio líquido, micro-animaciones y Tailwind
│   └── package.json
└── README.md                         # Este documento maestro
```

---

## 📑 Catálogo de Documentación Canónica

Para una revisión detallada de la arquitectura, consulte los documentos en [`Documentation/`](Documentation/README.md):

* **[Especificación Técnica Maestra](Documentation/Consolidated/DevSculptor_Master_Technical_Architecture_and_Specifications.md)**: Documento exhaustivo con detalles de diseño, DDL relacionales y protocolos de IA.
* **[Plan Integral de Pruebas (QA)](Documentation/Consolidated/Plan_de_Pruebas_Integral_DevSculptor.md)**: Matriz completa de casos de prueba unitarios, de integración y end-to-end.
* **[Convenciones de Backend](Documentation/Backend/Backend_Conventions_and_Architecture_Guidelines.md)**: Guía metodológica de ingeniería del servidor.
* **[Convenciones de Frontend & UX/UI](Documentation/Frontend/Frontend_Conventions_and_UX_UI_Guidelines.md)**: Guía de tokens de diseño y ergonomía visual.
* **[Catálogo de ADRs Fundacionales](Documentation/Backend/Sprint1ADRs.md)**: Las 8 actas arquitectónicas estructurales de DevSculptor.

---

## 👨‍💻 Autor y Créditos

* **Desarrollador & Arquitecto:** Nathaniel Muller San Martín ([@NMullerSM](https://github.com/NMullerSM))
* **Institución:** Duoc UC — Escuela de Informática y Telecomunicaciones
* **Asignatura:** Taller de Integración de Software (PTY4479)
* **Licencia:** MIT License
