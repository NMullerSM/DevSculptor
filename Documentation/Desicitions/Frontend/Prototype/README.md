# Sandbox de Prototipado Frontend — DevSculptor

Este directorio está destinado **exclusivamente a prototipos interactivos y pruebas de concepto visuales** construidas en tecnologías web nativas.

---

## 📌 Reglas Estrictas del Entorno

1. **Tecnologías Permitidas Únicamente**:
   - `HTML5` semántico.
   - `CSS3` (utilizando variables/tokens CSS, flexbox, grid, animaciones nativas).
   - `JavaScript` moderno (ES6+ sin transpilación, módulos nativos con `<script type="module">`).

2. **Cero Dependencias y Cero Compilación**:
   - **Prohibido** inicializar `package.json`, instalar paquetes con `npm`, o configurar bundlers (Webpack, Vite, Parcel) dentro de esta carpeta.
   - Todo archivo debe poder ejecutarse abriéndose directamente en el navegador web o levantándose con una extensión ligera como **Live Server**.

3. **Objetivo de los Prototipos**:
   - Experimentar y validar la ergonomía del **Canvas Interactivo** (pan, zoom, arrastre de tablas, trazado de líneas conectores).
   - Probar distribuciones de paneles laterales, barras de herramientas flotantes y modales.
   - Refinar la jerarquía tipográfica, el contraste de color y las micro-interacciones antes de trasladar el diseño a la arquitectura de componentes en React.

---

## 📂 Organización de Carpetas

```
Documentation/Desicitions/Frontend/Prototype/
├── canvas/          # Prototipos del lienzo de modelado ERD interactivo
├── dashboard/       # Prototipos de vistas de gestión (proyectos, requerimientos)
├── shared/          # Hojas de estilo base y utilidades JS comunes del prototipo
└── README.md        # Este manual
```

> [!NOTE]
> Una vez que un prototipo sea validado y cumpla con las directrices descritas en `../Frontend_Conventions_and_UX_UI_Guidelines.md`, se procederá a su implementación definitiva en el proyecto de producción `devsculptor-frontend` (React + Vite + TypeScript).
