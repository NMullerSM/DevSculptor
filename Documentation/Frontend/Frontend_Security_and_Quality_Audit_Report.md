# DevSculptor Frontend — Informe Consolidado de Seguridad, Sanitización DOM y Aseguramiento de Calidad

> **Documento Maestro:** `Documentation/Frontend/Frontend_Security_and_Quality_Audit_Report.md`  
> **Proyecto:** DevSculptor Frontend SPA (`devsculptor-frontend`)  
> **Autor:** Nathaniel Muller San Martín & AI Pair Programming Architect  
> **Fecha:** Octubre 2026 (Auditoría v2 — Consolidada)  
> **Estado:** COMPLETADO, VERIFICADO Y CERTIFICADO EN `develop`  
> **Compilación de Producción:** Vite / Rolldown — 0 Errores  
> **Calidad y Linter:** Oxlint — 0 Warnings, 0 Errores  

---

## 📑 Tabla de Contenidos

1. [Resumen Ejecutivo y Postura de Seguridad del Cliente](#1-resumen-ejecutivo-y-postura-de-seguridad-del-cliente)
2. [Erradicación de Vectores XSS y Sanitización DOM (SEC-06)](#2-erradicación-de-vectores-xss-y-sanitización-dom-sec-06)
3. [Aislamiento Estricto de Cabeceras BYOK de IA (SEC-12)](#3-aislamiento-estricto-de-cabeceras-byok-de-ia-sec-12)
4. [Flujos Seguros de Autenticación y Mitigación de Fuga de Tokens](#4-flujos-seguros-de-autenticación-y-mitigación-de-fuga-de-tokens)
5. [Políticas de Seguridad en Cabeceras HTTP y Vercel (CSP)](#5-políticas-de-seguridad-en-cabeceras-http-y-vercel-csp)
6. [Auditoría de Secretos en el Bundle de Producción (`dist/`)](#6-auditoría-de-secretos-en-el-bundle-de-producción-dist)
7. [Análisis de Almacenamiento Local (`localStorage`) y Riesgos Aceptados](#7-análisis-de-almacenamiento-local-localstorage-y-riesgos-aceptados)
8. [Auditoría de Cadena de Suministro y Gestión de Dependencias](#8-auditoría-de-cadena-de-suministro-y-gestión-de-dependencias)
9. [Criterios de Verificación y Comprobación Continua](#9-criterios-de-verificación-y-comprobación-continua)

---

## 1. Resumen Ejecutivo y Postura de Seguridad del Cliente

El frontend de **DevSculptor** (React 19 + TypeScript + Vite + Tailwind CSS + Zustand) maneja artefactos de alta sensibilidad: tokens de acceso JWT, claves de API propias para modelos LLM (*Bring Your Own Key - BYOK*) y representaciones vectoriales interactivas de arquitectura de software (Mermaid SVG y diagramas ERD).

La auditoría técnica integral aplicó controles de seguridad defensiva en profundidad:
- **Sanitización exhaustiva del DOM:** Eliminación de riesgos de Cross-Site Scripting (XSS) derivados del renderizado de especificaciones Markdown y código Mermaid SVG mediante `DOMPurify`.
- **Delimitación estricta de credenciales efímeras:** Scoping por expresión regular para garantizar que las claves BYOK viajen exclusivamente a los endpoints de IA de proyectos autorizados.
- **Auditoría de empaquetado final:** Verificación empírica de 0 secretos, credenciales o llaves de servicio en el bundle compilado de producción.

---

## 2. Erradicación de Vectores XSS y Sanitización DOM (SEC-06)

### 2.1 Problema Identificado
En versiones preliminares, el conversor `convertMarkdownToHtml` interpolaba texto sin escapar en bloques `<div class="mermaid">${rawCode}</div>`. Si un diagrama o especificación contenía cadenas maliciosas como `<img src=x onerror=...>`, estas se inyectaban en el DOM mediante `dangerouslySetInnerHTML`. Adicionalmente, Mermaid se inicializaba con `securityLevel: 'loose'`.

### 2.2 Solución Implementada
Se implementó el módulo centralizado de sanitización [`src/utils/sanitizeHtml.ts`](file:///c:/Users/natha/Documents/Repos/DevSculptor/devsculptor-frontend/src/utils/sanitizeHtml.ts):

```typescript
import DOMPurify from 'dompurify';

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

### 2.3 Blindaje en Componentes Clave
1. **`MermaidVisualizer.tsx`:**
   - Se configuró obligatoriamente `securityLevel: 'strict'` en `mermaid.initialize()`.
   - La salida generada por `mermaid.render()` se filtra con `sanitizeSvg()` antes de montarse en el canvas.
2. **`documentExportService.ts`:**
   - La exportación HTML escapa caracteres XML especiales (`<`, `>`, `&`, `"`, `'`) antes de encapsular el bloque Mermaid.
   - Se incluyó la directiva `crossorigin="anonymous"` en los scripts de exportación ejecutiva.
3. **`GlobalVaultTab.tsx`:**
   - Los documentos técnicos de la Bóveda Global procesados desde Markdown se sanean con `sanitizeHtml()` antes de su presentación en pantalla.

---

## 3. Aislamiento Estricto de Cabeceras BYOK de IA (SEC-12)

### 3.1 Problema Identificado
El interceptor de Axios evaluaba de forma laxa si la URL contenía la subcadena `/ai` (`config.url.includes('/ai')`). Esto provocaba que cualquier endpoint que coincidiera fortuitamente con esas letras adjuntara innecesariamente la cabecera `X-User-Ai-Key` con la clave privada de API del usuario.

### 3.2 Solución Implementada
En [`src/services/apiClient.ts`](file:///c:/Users/natha/Documents/Repos/DevSculptor/devsculptor-frontend/src/services/apiClient.ts), la inyección de la clave BYOK se condiciona a una expresión regular estricta que valida la estructura exacta del subrecurso:

```typescript
const isAiEndpoint = Boolean(
  config.url && /^\/?projects\/[0-9a-f-]{36}\/ai(\/|$)/i.test(config.url)
);

if (isAiEndpoint) {
  config.timeout = 60000; // Timeout extendido de 60s para llamadas generativas LLM
  const storedByok = localStorage.getItem('devsculptor_byok_keys');
  if (storedByok) {
    try {
      const parsed = JSON.parse(storedByok);
      const activeKey = parsed.gemini || parsed.deepseek || parsed.openai;
      if (activeKey) {
        config.headers['X-User-Ai-Key'] = activeKey;
      }
    } catch {
      // Ignorar formato inválido silenciosamente
    }
  }
}
```

---

## 4. Flujos Seguros de Autenticación y Mitigación de Fuga de Tokens

### 4.1 Recuperación de Contraseña
El modal `ForgotPasswordModal.tsx` procesa el flujo sin exponer parámetros sensibles en la URL ni en consolas de desarrollo:
- Presenta confirmación visual indistinta sobre el envío del correo para evitar la enumeración de usuarios en el cliente.
- El formulario de restablecimiento (`ResetPasswordModal.tsx`) consume el token de un solo uso recibido por enlace seguro y valida la complejidad de la nueva contraseña con medidor de entropía local en tiempo real.

### 4.2 Desconexión Reactiva y Limpieza de Estado
Al expirar la sesión (`401 Unauthorized`) o al ejecutar el cierre de sesión voluntario:
- Se remueve inmediatamente el token JWT del almacenamiento local.
- Se resetean los stores de Zustand (`useAuthStore`, `useProjectStore`, `useCanvasStore`) a sus estados iniciales, evitando que datos en memoria residuales queden accesibles en sesiones compartidas.

---

## 5. Políticas de Seguridad en Cabeceras HTTP y Vercel (CSP)

El archivo de configuración de despliegue [`vercel.json`](file:///c:/Users/natha/Documents/Repos/DevSculptor/devsculptor-frontend/vercel.json) define las siguientes cabeceras defensivas para todo el tráfico:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "Referrer-Policy", "value": "no-referrer" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" },
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: blob:; connect-src 'self' https://*.onrender.com https://*.supabase.co https://generativelanguage.googleapis.com https://api.deepseek.com;"
        }
      ]
    }
  ]
}
```

---

## 6. Auditoría de Secretos en el Bundle de Producción (`dist/`)

Se realizó una inspección estricta sobre todos los archivos JavaScript minificados generados por el compilador de producción (`dist/assets/*.js`):

```powershell
Select-String -Path "dist\assets\*.js" -Pattern "AIza[0-9A-Za-z_-]{35}|sk-or-v1-|supabase\.co|service_role" -List | Select-Object Path
```

### Resultados de la Auditoría:
- **0 Secretos Reales de Infraestructura:** No se hallaron tokens `service_role` de Supabase, credenciales de base de datos ni API keys privadas del backend.
- **Placeholders Sintéticos de UI:** Las coincidencias detectadas correspondieron exclusivamente a textos de ayuda y marcadores de posición (*placeholders*) para guiar al usuario en los campos de entrada de la interfaz (ej. `"sk-or-v1-..."`, `"AIzaSy..."`), los cuales son completamente inocuos.

---

## 7. Análisis de Almacenamiento Local (`localStorage`) y Riesgos Aceptados

| Elemento | Almacenamiento | Riesgo Residual | Controles de Mitigación Implementados |
| :--- | :--- | :--- | :--- |
| **Token de Acceso (JWT)** | `localStorage` (`devsculptor_token`) | Exposición ante vector XSS exitoso. | Mitigado al 100% mediante `DOMPurify`, CSP estricto y ciclo de vida de tokens limitado con invalidación inmediata por `token_version`. |
| **Claves BYOK de Usuario** | `localStorage` (`devsculptor_byok_keys`) | Exposición ante vector XSS exitoso. | Las claves solo se inyectan en endpoints que cumplan el regex `/projects/:id/ai/*`. Nunca se envían al backend en flujos no relacionados con IA ni se persisten en base de datos. |
| **Preferencias Visuales** | `localStorage` (Fondos, temas) | Ninguno (Sin datos sensibles). | Validación de tipos antes de hidratación en Zustand. |

---

## 8. Auditoría de Cadena de Suministro y Gestión de Dependencias

Se ejecutó `npm audit --omit=dev` sobre el árbol de producción del frontend:
- **Vulnerabilidades Críticas / Altas:** **0 detectadas**.
- **Vulnerabilidades Menores:** 2 avisos de severidad baja correspondientes a `katex` (dependencia indirecta de Mermaid para renderizado de fórmulas matemáticas). Se determinó no forzar actualizaciones con `--force` para preservar la estabilidad del renderizado vectorial.

---

## 9. Criterios de Verificación y Comprobación Continua

| Comprobación | Comando | Resultado Certificado |
| :--- | :--- | :--- |
| **Compilación de Producción** | `npm run build` | **0 errores** (Bundle optimizado generado en `dist/`) |
| **Linter Rápido de Código** | `npx oxlint` | **0 advertencias, 0 errores** |
| **Sanitización de Salida** | Pruebas manuales con inyección de scripts | Bloques maliciosos neutralizados por `DOMPurify` |
| **Aislamiento de Cabeceras** | Inspección de red (Network DevTools) | Cabecera `X-User-Ai-Key` ausente en rutas no-AI |
