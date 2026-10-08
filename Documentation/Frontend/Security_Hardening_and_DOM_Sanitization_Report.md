# Reporte Técnico: Endurecimiento de Frontend, Sanitización DOM & Seguridad de Sesión
**Proyecto:** DevSculptor — Enterprise Technical Governance & AI-Assisted Documentation  
**Módulo:** Frontend Client (`devsculptor-frontend`)  
**Fecha:** Octubre 2026  
**Autor:** Nathaniel Muller (Master Architect & AI Pair Programming)  
**Estado:** ✅ IMPLEMENTADO Y VERIFICADO (Build 0 Errores, Oxlint 0 Warnings)

---

## 1. Resumen Ejecutivo

Como parte del ciclo de aseguramiento técnico y mitigación de vulnerabilidades de alto impacto (SEC-06, SEC-12), se aplicaron medidas de defensa en profundidad sobre la interfaz de usuario de DevSculptor construida con React, Vite y TailwindCSS.

Los focos principales abordados fueron:
1. **Erradicación de Vectores XSS**: Neutralización de inyecciones HTML en renderizadores de diagramas Mermaid y visores de Markdown.
2. **Sanitización Estricta de SVG y DOM**: Integración de la librería `DOMPurify` con perfiles cerrados.
3. **Aislamiento de Credenciales de IA (BYOK)**: Scoping restrictivo de inyección de encabezados HTTP en Axios.
4. **Flujos Seguros de Autenticación**: Eliminación de exposición de tokens en el modal de recuperación de contraseñas.
5. **Políticas de Encabezados HTTP (CSP)**: Configuración en `vercel.json` y documentos exportados.

---

## 2. Hallazgos Auditados y Soluciones Implementadas

### 2.1. Sanitización de Salida y Prevención XSS (SEC-06)
- **Problema Detectado:**
  - El conversor `convertMarkdownToHtml` interpolaba texto sin escapar en el bloque `<div class="mermaid">${rawCode}</div>`. Si un diagrama contenía etiquetas HTML como `<img src=x onerror=...>`, estas se renderizaban directamente en el DOM mediante `dangerouslySetInnerHTML`.
  - La librería Mermaid se inicializaba con `securityLevel: 'loose'`, permitiendo la ejecución de JavaScript en etiquetas internas de nodos.
- **Solución Implementada:**
  - Se instaló `dompurify` y `@types/dompurify`.
  - Se creó el módulo de utilidades centralizado `src/utils/sanitizeHtml.ts`:
    ```typescript
    export function sanitizeHtml(rawHtml: string): string {
      if (!rawHtml) return '';
      return DOMPurify.sanitize(rawHtml, {
        USE_PROFILES: { html: true, svg: true },
      });
    }

    export function sanitizeSvg(rawSvg: string): string {
      if (!rawSvg) return '';
      return DOMPurify.sanitize(rawSvg, {
        USE_PROFILES: { svg: true, svgFilters: true },
      });
    }
    ```
  - En `MermaidVisualizer.tsx`:
    - Se fijó `securityLevel: 'strict'` en `mermaid.initialize()`.
    - La salida vectorial generada por `mermaid.render()` se procesa obligatoriamente con `sanitizeSvg()` antes de asignarse al estado o al DOM.
  - En `documentExportService.ts`:
    - El bloque `<div class="mermaid">` ahora interpola `${escaped}` en lugar del código en bruto.
    - Se actualizó el `securityLevel` a `'strict'` y se agregó la directiva `crossorigin="anonymous"` al CDN de Mermaid en las plantillas exportadas.
  - En `GlobalVaultTab.tsx`:
    - El HTML ejecutivo procesado desde Markdown se sanitiza estrictamente con `sanitizeHtml()` antes de ser presentado.

---

### 2.2. Delimitación Estricta de Cabeceras BYOK de IA (SEC-12)
- **Problema Detectado:**
  - El interceptor de Axios evaluaba `config.url.includes('/ai')`, lo que provocaba que cualquier petición a un endpoint que contuviera la subcadena `/ai` (por ejemplo `/claim`, `/email`, etc.) adjuntara indebidamente las claves privadas de API de OpenAI o Gemini del usuario.
- **Solución Implementada:**
  - En `src/services/apiClient.ts`, se ajustó la condición mediante una expresión regular que valida que la ruta pertenezca inequívocamente al subrecurso de IA de un proyecto:
    ```typescript
    const isAiEndpoint = Boolean(
      config.url && /^\/?projects\/[0-9a-f-]{36}\/ai(\/|$)/i.test(config.url)
    );

    if (isAiEndpoint) {
      config.timeout = 60000; // Timeout extendido de 60s para procesamiento LLM
    }

    if (activeKey && config.headers && isAiEndpoint) {
      config.headers['X-User-Ai-Key'] = activeKey;
      if (activeProvider) config.headers['X-User-Ai-Provider'] = activeProvider;
      if (activeModel) config.headers['X-User-Ai-Model'] = activeModel;
      if (activeEndpoint) config.headers['X-User-Ai-Endpoint'] = activeEndpoint;
    }
    ```

---

### 2.3. Modal de Recuperación de Contraseña Seguro (SEC-01)
- **Problema Detectado:**
  - La interfaz mostraba un contenedor con un "Token de Recuperación Emitido" simulado, incentivando la creencia de que el token debía ser visible para el cliente durante la solicitud inicial.
- **Solución Implementada:**
  - En `ForgotPasswordModal.tsx`, se retiró el bloque simulado. La vista ahora despliega instrucciones estándar de revisión de correo institucional y permite avanzar directamente al paso de ingreso del código recibido por el canal formal.
  - En entornos locales de desarrollo asistido (`DEV_EXPOSE_RESET_TOKEN=true`), se presenta un aviso informativo discreto indicando que el token fue pre-cargado para facilitar pruebas técnicas, sin romper el flujo seguro de producción.

---

### 2.4. Cabeceras de Seguridad y Content Security Policy (CSP)
- **Vercel (`vercel.json`):**
  Se incorporaron encabezados de seguridad de primer nivel para mitigar clickjacking, MIME sniffing y cross-site scripting:
  - `Content-Security-Policy`: Define orígenes permitidos para scripts, estilos, fuentes de Google Fonts y conexiones WebSocket/REST hacia el backend y Supabase.
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Referrer-Policy: no-referrer`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()`
- **Documentos HTML Exportados:**
  Se incrustó una etiqueta `<meta http-equiv="Content-Security-Policy">` restrictiva que asegura que los archivos `.html` generados localmente por DevSculptor no puedan cargar código arbitrario ni ejecutar scripts maliciosos.

---

## 3. Verificación de Compilación y Calidad

- **Linter de Frontend (Oxlint):** 0 errores, 0 advertencias.
- **Compilador TypeScript & Vite:** Compilación limpia completada en ~2.5 segundos generando bundles optimizados en `dist/`.
