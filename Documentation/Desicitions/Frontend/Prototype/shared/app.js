/**
 * DevSculptor — Apple visionOS Prototype Engine
 * Gestión de Estado, Navegación de Flujos, Canvas ERD y Compilación OKF
 */

// Estado Central Reactivo
const state = {
  activeScreen: 'studio', // 'studio' | 'hub' | 'auth'
  activeStudioStep: 'view-chat', // 'view-chat' | 'view-reqs' | 'view-docs' | 'view-canvas'
  activeCanvasTab: 'erd', // 'erd' | 'sql' | 'ts' | 'json' | 'py' | 'audit'
  theme: localStorage.getItem('ds_theme') || 'dark',
  zoom: 1,

  // Proyecto Activo
  project: {
    id: 'proj-001',
    name: 'DevSculptor Core MVP',
    style: 'Monolito Modular Layered MVC',
    version: '1.0.0-rc',
  },

  // Requisitos Funcionales y No Funcionales (Sincronizado con DTOs Zod)
  requirements: [
    { id: 'req-1', code: 'RF-01', title: 'Autenticación Segura & JWT Bearer', type: 'RF', priority: 'HIGH', table: 'users', desc: 'Registro y login con bcrypt (12 rounds) y tokens JWT HMAC-SHA256.' },
    { id: 'req-2', code: 'RF-02', title: 'Aislamiento Horizontal de Proyectos', type: 'RF', priority: 'HIGH', table: 'projects', desc: 'Control estricto de propiedad mediante req.user.id con respuesta 404 ante accesos ajenos.' },
    { id: 'req-3', code: 'RF-03', title: 'Trazabilidad y Trigger de Auditoría en Canvas', type: 'RF', priority: 'MEDIUM', table: 'canvas_entities', desc: 'Captura atómica de OLD y NEW en audit_logs mediante fn_audit_canvas_entities.' },
    { id: 'req-4', code: 'RNF-01', title: 'Latencia de Consulta API < 500ms', type: 'RNF', priority: 'MEDIUM', table: 'pg.Pool', desc: 'Pool tuning de PostgreSQL con max 20 conexiones y consultas parametrizadas.' },
    { id: 'req-5', code: 'RNF-02', title: 'Blindaje RLS & Seguridad Transversal', type: 'RNF', priority: 'HIGH', table: 'Supabase RLS', desc: 'Row Level Security activado en esquema público y search_path inmutable en PL/pgSQL.' },
  ],

  // Decisiones de Arquitectura (ADRs con Máquina de Estados)
  decisions: [
    {
      id: 'adr-1',
      code: 'ADR-01',
      title: 'Monolito Modular MVC vs Microservicios',
      status: 'ACCEPTED',
      context: 'Ciclo de 5 semanas individual. Microservicios introducen latencia de red y sobrecarga operacional distribuida.',
      decision: 'Monolito modular con capas estrictas (Controllers -> Services -> Repositories) en una sola unidad de despliegue.',
    },
    {
      id: 'adr-2',
      code: 'ADR-02',
      title: 'Persistencia Nativa pg.Pool vs ORMs (Prisma/TypeORM)',
      status: 'ACCEPTED',
      context: 'Requerimiento institucional de Triggers PL/pgSQL avanzados y Stored Procedures.',
      decision: 'Uso exclusivo de cliente nativo pg.Pool con DDL SQL determinista y BaseRepository genérico.',
    },
    {
      id: 'adr-3',
      code: 'ADR-03',
      title: 'Zod como Única Fuente de Verdad (SSOT)',
      status: 'ACCEPTED',
      context: 'Evitar divergencia entre interfaces de TypeScript y validación de payloads HTTP en runtime.',
      decision: 'Definir esquemas Zod en {modulo}.dto.ts e inferir tipos mediante z.infer.',
    },
    {
      id: 'adr-4',
      code: 'ADR-04',
      title: 'Adopción de Caché Redis en Memoria para Métricas',
      status: 'PROPOSED',
      context: 'El cálculo de maturity_index mediante Stored Procedure genera lecturas frecuentes.',
      decision: 'Evaluar Redis distribuido o mantener caché en memoria Map con TTL de 30 segundos.',
    }
  ],

  // Nodos del Canvas ERD
  nodes: [
    {
      id: 'node-users',
      table: 'users',
      badge: 'RLS',
      badgeType: 'emerald',
      x: 35,
      y: 55,
      columns: [
        { name: 'id', type: 'UUID PK', isPk: true },
        { name: 'email', type: 'VARCHAR UNIQUE', isPk: false },
        { name: 'password_hash', type: 'VARCHAR', isPk: false },
        { name: 'full_name', type: 'VARCHAR', isPk: false }
      ]
    },
    {
      id: 'node-projects',
      table: 'projects',
      badge: 'FK',
      badgeType: 'indigo',
      x: 330,
      y: 70,
      columns: [
        { name: 'id', type: 'UUID PK', isPk: true },
        { name: 'user_id', type: 'UUID FK → users', isFk: true },
        { name: 'name', type: 'VARCHAR', isPk: false },
        { name: 'architecture_style', type: 'VARCHAR', isPk: false }
      ]
    },
    {
      id: 'node-canvas',
      table: 'canvas_entities',
      badge: 'TRIGGER',
      badgeType: 'cyan',
      x: 630,
      y: 90,
      columns: [
        { name: 'id', type: 'UUID PK', isPk: true },
        { name: 'project_id', type: 'UUID FK → projects', isFk: true },
        { name: 'table_name', type: 'VARCHAR', isPk: false },
        { name: 'columns_json', type: 'JSONB DEFAULT []', isPk: false },
        { name: 'position_x', type: 'INTEGER', isPk: false }
      ]
    }
  ],

  // Historial de Auditoría (Simulación del Trigger de PostgreSQL)
  auditLogs: [
    { id: 'aud-1', time: '17:28:10', action: 'INSERT', table: 'canvas_entities', user: 'nathaniel (dev)', payload: '{ table_name: "canvas_entities", pos: [630, 90] }' },
    { id: 'aud-2', time: '17:29:45', action: 'UPDATE', table: 'canvas_entities', user: 'nathaniel (dev)', payload: '{ position_x: 630, position_y: 90 }' },
    { id: 'aud-3', time: '17:31:02', action: 'INSERT', table: 'projects', user: 'nathaniel (dev)', payload: '{ name: "DevSculptor Core MVP" }' },
  ]
};

// ==========================================================================
// 1. Alternancia de Tema (Dual Theme Sol/Luna)
// ==========================================================================
function initTheme() {
  const html = document.documentElement;
  const body = document.body;
  const icon = document.getElementById('theme-icon');

  function apply(isLight) {
    if (isLight) {
      html.classList.remove('dark');
      html.classList.add('light');
      body.classList.remove('dark');
      body.classList.add('light');
      if (icon) icon.textContent = 'light_mode';
    } else {
      html.classList.remove('light');
      html.classList.add('dark');
      body.classList.remove('light');
      body.classList.add('dark');
      if (icon) icon.textContent = 'dark_mode';
    }
    localStorage.setItem('ds_theme', isLight ? 'light' : 'dark');
    state.theme = isLight ? 'light' : 'dark';
    setTimeout(updateConnectors, 40);
  }

  apply(state.theme === 'light');

  const themeBtn = document.getElementById('theme-toggle');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      apply(state.theme !== 'light');
    });
  }
}

// ==========================================================================
// 1.1 Alternancia de Fondos de Naturaleza y Ondas (Wallpapers Apple visionOS)
// ==========================================================================
const wallpapers = [
  {
    name: 'Montañas de Yosemite (Valle Alpino)',
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=2560&auto=format&fit=crop'
  },
  {
    name: 'Olas Topográficas y Dunas Fluidas',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2560&auto=format&fit=crop'
  },
  {
    name: 'Bosque Nórdico en Niebla Mística',
    url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=2560&auto=format&fit=crop'
  },
  {
    name: 'Picos Nevados bajo Aurora y Cielo Estrellado',
    url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=2560&auto=format&fit=crop'
  }
];

let currentWallpaperIdx = parseInt(localStorage.getItem('ds_wallpaper_idx') || '0', 10);

function initWallpaper() {
  const bgEl = document.getElementById('wallpaper-bg');
  const toggleBtn = document.getElementById('wallpaper-toggle');

  function applyWallpaper(idx) {
    currentWallpaperIdx = idx % wallpapers.length;
    const wp = wallpapers[currentWallpaperIdx];
    if (bgEl) {
      bgEl.style.backgroundImage = `url('${wp.url}')`;
    }
    if (toggleBtn) {
      toggleBtn.title = `Fondo actual: ${wp.name} (Clic para cambiar)`;
    }
    localStorage.setItem('ds_wallpaper_idx', currentWallpaperIdx);
  }

  applyWallpaper(currentWallpaperIdx);

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      applyWallpaper(currentWallpaperIdx + 1);
    });
  }
}

// ==========================================================================
// 2. Conmutación de Pantallas Superiores (Studio vs. Hub)
// ==========================================================================
function switchScreen(screenName) {
  state.activeScreen = screenName;
  const studioEl = document.getElementById('screen-studio');
  const hubEl = document.getElementById('screen-hub');

  const btnStudio = document.getElementById('nav-btn-studio');
  const btnHub = document.getElementById('nav-btn-hub');

  if (screenName === 'studio') {
    studioEl?.classList.remove('hidden');
    hubEl?.classList.add('hidden');
    btnStudio?.classList.add('vision-btn-primary');
    btnHub?.classList.remove('vision-btn-primary');
    setTimeout(updateConnectors, 50);
  } else if (screenName === 'hub') {
    studioEl?.classList.add('hidden');
    hubEl?.classList.remove('hidden');
    btnHub?.classList.add('vision-btn-primary');
    btnStudio?.classList.remove('vision-btn-primary');
  }
}

// ==========================================================================
// 3. Conmutación de Vistas en el Estudio (Workspace Steps)
// ==========================================================================
function switchStudioStep(stepId) {
  state.activeStudioStep = stepId;

  // Actualizar botones del panel izquierdo
  document.querySelectorAll('.nav-step-btn').forEach(btn => {
    if (btn.dataset.target === stepId) {
      btn.classList.add('selected');
      btn.style.background = 'var(--glass-card-selected)';
      btn.style.borderColor = 'var(--border-focus)';
    } else {
      btn.classList.remove('selected');
      btn.style.background = 'var(--glass-card)';
      btn.style.borderColor = 'var(--border-glass-subtle)';
    }
  });

  // Mostrar vista correspondiente
  document.querySelectorAll('.step-view-container').forEach(view => {
    if (view.id === stepId) {
      view.classList.remove('hidden');
      view.classList.add('fade-in');
    } else {
      view.classList.add('hidden');
      view.classList.remove('fade-in');
    }
  });

  if (stepId === 'view-canvas') {
    setTimeout(updateConnectors, 40);
  }
}

// ==========================================================================
// 4. Cálculo Dinámico del Maturity Index (Equivalente a sp_calculate_project_metrics)
// ==========================================================================
function calculateMaturityIndex() {
  const hasRf = state.requirements.some(r => r.type === 'RF');
  const hasRnf = state.requirements.some(r => r.type === 'RNF');
  const hasTable = state.nodes.length > 0;
  const hasAcceptedAdr = state.decisions.some(d => d.status === 'ACCEPTED');

  let score = 0;
  if (hasRf) score += 25;
  if (hasRnf) score += 25;
  if (hasTable) score += 25;
  if (hasAcceptedAdr) score += 25;

  // Actualizar indicadores visuales
  const gaugeEl = document.getElementById('maturity-gauge-value');
  const barEl = document.getElementById('maturity-progress-bar');
  const hubMaturityEl = document.getElementById('hub-maturity-score');

  if (gaugeEl) gaugeEl.textContent = `${score}%`;
  if (barEl) barEl.style.width = `${score}%`;
  if (hubMaturityEl) hubMaturityEl.textContent = `${score}%`;

  return score;
}

// ==========================================================================
// 5. Renderizado y Acciones de Requisitos (RF/RNF)
// ==========================================================================
function renderRequirements(filterType = 'ALL', searchQuery = '') {
  const container = document.getElementById('reqs-list-container');
  if (!container) return;

  const countBadge = document.getElementById('badge-reqs-count');
  if (countBadge) countBadge.textContent = state.requirements.length;

  let filtered = state.requirements;
  if (filterType !== 'ALL') {
    filtered = filtered.filter(r => r.type === filterType);
  }
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(r => r.code.toLowerCase().includes(q) || r.title.toLowerCase().includes(q) || r.desc.toLowerCase().includes(q));
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="p-8 text-center text-secondary">
        <span class="material-symbols-outlined text-3xl text-muted mb-2">find_in_page</span>
        <p class="text-xs">No se encontraron requisitos con ese criterio.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(r => `
    <div class="vision-card p-3 flex items-start justify-between gap-3">
      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-2 mb-1">
          <span class="font-mono text-xs font-bold text-indigo-400">${r.code}</span>
          <span class="vision-pill ${r.type === 'RF' ? 'pill-amber' : 'pill-cyan'}">${r.type}</span>
          <span class="vision-pill ${r.priority === 'HIGH' ? 'pill-rose' : 'pill-indigo'}">${r.priority}</span>
          <span class="text-[10px] font-mono text-muted">→ ${r.table}</span>
        </div>
        <div class="text-xs font-semibold text-primary mb-0.5">${r.title}</div>
        <p class="text-[11px] text-secondary leading-relaxed">${r.desc}</p>
      </div>
      <button class="vision-btn vision-btn-icon text-muted hover:text-rose-400" onclick="deleteRequirement('${r.id}')" title="Eliminar requisito">
        <span class="material-symbols-outlined text-sm">delete</span>
      </button>
    </div>
  `).join('');

  calculateMaturityIndex();
}

function deleteRequirement(id) {
  state.requirements = state.requirements.filter(r => r.id !== id);
  renderRequirements();
}

function addNewRequirement(code, title, type, priority, table, desc) {
  const newReq = {
    id: 'req-' + Date.now(),
    code,
    title,
    type,
    priority,
    table,
    desc
  };
  state.requirements.push(newReq);
  renderRequirements();
  addAuditLog('INSERT', 'requirements', `Requisito ${code} registrado`);
}

// ==========================================================================
// 6. Decisiones de Arquitectura (ADRs con Máquina de Estados)
// ==========================================================================
function renderDecisions(filterStatus = 'ALL') {
  const container = document.getElementById('adrs-list-container');
  if (!container) return;

  const countBadge = document.getElementById('badge-adrs-count');
  if (countBadge) countBadge.textContent = state.decisions.length;

  let filtered = state.decisions;
  if (filterStatus !== 'ALL') {
    filtered = filtered.filter(d => d.status === filterStatus);
  }

  container.innerHTML = filtered.map(d => {
    let statusPill = 'pill-amber';
    if (d.status === 'ACCEPTED') statusPill = 'pill-emerald';
    if (d.status === 'REJECTED') statusPill = 'pill-rose';

    const isResolved = d.status === 'ACCEPTED' || d.status === 'REJECTED';

    return `
      <div class="vision-card p-3.5 flex flex-col gap-2">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="font-mono text-xs font-bold text-cyan-400">${d.code}</span>
            <span class="vision-pill ${statusPill}">${d.status}</span>
          </div>
          ${!isResolved ? `
            <div class="flex items-center gap-1.5">
              <button class="vision-btn text-[10.5px] text-emerald-400 hover:bg-emerald-500/10" onclick="transitionAdrStatus('${d.id}', 'ACCEPTED')">
                <span class="material-symbols-outlined text-xs">check</span> Aprobar
              </button>
              <button class="vision-btn text-[10.5px] text-rose-400 hover:bg-rose-500/10" onclick="transitionAdrStatus('${d.id}', 'REJECTED')">
                <span class="material-symbols-outlined text-xs">close</span> Rechazar
              </button>
            </div>
          ` : `
            <span class="text-[9.5px] font-mono text-muted uppercase">Decisión Inmutable</span>
          `}
        </div>
        <div class="text-xs font-semibold text-primary">${d.title}</div>
        <div class="text-[11px] text-secondary">
          <strong class="text-muted">Contexto:</strong> ${d.context}
        </div>
        <div class="text-[11px] text-primary/90 bg-white/[0.02] p-2 rounded-lg border border-white/[0.04]">
          <strong class="text-indigo-400">Decisión:</strong> ${d.decision}
        </div>
      </div>
    `;
  }).join('');

  calculateMaturityIndex();
}

function transitionAdrStatus(id, newStatus) {
  const adr = state.decisions.find(d => d.id === id);
  if (!adr) return;
  if (adr.status === 'ACCEPTED' || adr.status === 'REJECTED') {
    alert('Regla de Gobernanza: Una decisión ya ratificada es inmutable.');
    return;
  }
  adr.status = newStatus;
  renderDecisions();
  addAuditLog('UPDATE', 'architecture_decisions', `${adr.code} transicionado a ${newStatus}`);
}

// ==========================================================================
// 7. Canvas ERD: Arrastre de Nodos y Conectores Bezier SVG
// ==========================================================================
function renderNodes() {
  const canvasArea = document.getElementById('canvas-content-area');
  if (!canvasArea) return;

  canvasArea.innerHTML = state.nodes.map(n => `
    <div id="${n.id}" class="erd-node" style="left: ${n.x}px; top: ${n.y}px;">
      <div class="erd-node-header">
        <span class="font-mono text-xs font-bold text-primary">${n.table}</span>
        <span class="vision-pill pill-${n.badgeType}">${n.badge}</span>
      </div>
      <div class="erd-node-body">
        ${n.columns.map(c => `
          <div class="erd-row">
            <span class="${c.isPk ? 'text-amber-400 font-semibold' : c.isFk ? 'text-cyan-400' : 'text-secondary'}">
              ${c.isPk ? '🔑 ' : c.isFk ? '🔗 ' : ''}${c.name}
            </span>
            <span class="text-muted text-[9px] font-mono">${c.type}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');

  initNodeDragging();
  updateConnectors();
  calculateMaturityIndex();
}

function initNodeDragging() {
  state.nodes.forEach(nodeData => {
    const el = document.getElementById(nodeData.id);
    if (!el) return;

    let isDragging = false;
    let startX, startY;

    el.onmousedown = (e) => {
      // Ignorar si el clic fue en botones internos
      if (e.target.tagName === 'BUTTON') return;
      isDragging = true;
      startX = e.clientX - nodeData.x;
      startY = e.clientY - nodeData.y;
      el.classList.add('is-selected');

      document.onmousemove = (ev) => {
        if (!isDragging) return;
        nodeData.x = Math.max(10, Math.min(ev.clientX - startX, 1200));
        nodeData.y = Math.max(10, Math.min(ev.clientY - startY, 700));
        el.style.left = `${nodeData.x}px`;
        el.style.top = `${nodeData.y}px`;
        updateConnectors();
      };

      document.onmouseup = () => {
        if (isDragging) {
          isDragging = false;
          el.classList.remove('is-selected');
          document.onmousemove = null;
          document.onmouseup = null;
          addAuditLog('UPDATE', 'canvas_entities', `Posición de ${nodeData.table} guardada (${nodeData.x}, ${nodeData.y})`);
        }
      };
    };
  });
}

function updateConnectors() {
  const svg = document.getElementById('svg-connectors');
  if (!svg) return;

  const usersNode = state.nodes.find(n => n.id === 'node-users');
  const projNode = state.nodes.find(n => n.id === 'node-projects');
  const canvasNode = state.nodes.find(n => n.id === 'node-canvas');

  let paths = '';

  // Conector users -> projects
  if (usersNode && projNode) {
    const p1x = usersNode.x + 220;
    const p1y = usersNode.y + 60;
    const p2x = projNode.x;
    const p2y = projNode.y + 60;
    const dx = Math.abs(p2x - p1x) * 0.5;
    paths += `<path class="bezier-connector" d="M ${p1x} ${p1y} C ${p1x + dx} ${p1y}, ${p2x - dx} ${p2y}, ${p2x} ${p2y}"></path>`;
  }

  // Conector projects -> canvas_entities
  if (projNode && canvasNode) {
    const p1x = projNode.x + 220;
    const p1y = projNode.y + 60;
    const p2x = canvasNode.x;
    const p2y = canvasNode.y + 60;
    const dx = Math.abs(p2x - p1x) * 0.5;
    paths += `<path class="bezier-connector" d="M ${p1x} ${p1y} C ${p1x + dx} ${p1y}, ${p2x - dx} ${p2y}, ${p2x} ${p2y}"></path>`;
  }

  svg.innerHTML = paths;
}

// ==========================================================================
// 8. Generación de Salidas de Código (Scripts Multi-Lenguaje)
// ==========================================================================
function switchCanvasTab(tabName) {
  state.activeCanvasTab = tabName;

  document.querySelectorAll('.canvas-subtab').forEach(b => {
    if (b.dataset.tab === tabName) {
      b.classList.add('vision-btn-primary');
    } else {
      b.classList.remove('vision-btn-primary');
    }
  });

  const visualArea = document.getElementById('canvas-visual-area');
  const codeArea = document.getElementById('canvas-code-area');
  const auditArea = document.getElementById('canvas-audit-area');

  if (tabName === 'erd') {
    visualArea?.classList.remove('hidden');
    codeArea?.classList.add('hidden');
    auditArea?.classList.add('hidden');
    setTimeout(updateConnectors, 30);
  } else if (tabName === 'audit') {
    visualArea?.classList.add('hidden');
    codeArea?.classList.add('hidden');
    auditArea?.classList.remove('hidden');
    renderAuditLogs();
  } else {
    visualArea?.classList.add('hidden');
    codeArea?.classList.remove('hidden');
    auditArea?.classList.add('hidden');
    generateScriptOutput(tabName);
  }
}

function generateScriptOutput(format) {
  const codePre = document.getElementById('code-output-text');
  if (!codePre) return;

  if (format === 'sql') {
    codePre.textContent = `-- ==================================================================
-- DevSculptor — PostgreSQL DDL Normalizado
-- Generado automáticamente desde el Canvas Visual
-- Cumple con: UUID PKs, FK ON DELETE, Triggers y RLS Hardening
-- ==================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Tabla de Usuarios
CREATE TABLE IF NOT EXISTS public.users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabla de Proyectos (Aislamiento Horizontal)
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  architecture_style VARCHAR(100) DEFAULT 'Monolito Modular Layered MVC',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_projects_user_name UNIQUE(user_id, name)
);

-- 3. Entidades del Canvas
CREATE TABLE IF NOT EXISTS public.canvas_entities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  table_name VARCHAR(100) NOT NULL,
  columns_json JSONB NOT NULL DEFAULT '[]',
  position_x INTEGER DEFAULT 0,
  position_y INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_canvas_entities_project_table UNIQUE(project_id, table_name)
);

-- Blindaje RLS para Supabase
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.canvas_entities ENABLE ROW LEVEL SECURITY;`;
  } else if (format === 'ts') {
    codePre.textContent = `// ==================================================================
// DevSculptor — TypeScript DTOs con Zod (Single Source of Truth)
// ==================================================================

import { z } from 'zod';

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email('Email con formato inválido'),
  fullName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  createdAt: z.date().optional()
});

export type UserDto = z.infer<typeof UserSchema>;

export const CreateProjectSchema = z.object({
  name: z.string().min(1).max(255),
  architectureStyle: z.string().default('Monolito Modular Layered MVC')
});

export type CreateProjectDto = z.infer<typeof CreateProjectSchema>;

export const CanvasEntitySchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  tableName: z.string().regex(/^[a-zA-Z_][a-zA-Z0-9_]*$/),
  columnsJson: z.array(z.record(z.unknown())),
  positionX: z.number().int(),
  positionY: z.number().int()
});

export type CanvasEntityDto = z.infer<typeof CanvasEntitySchema>;`;
  } else if (format === 'json') {
    codePre.textContent = `{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "DevSculptorProjectSchema",
  "type": "object",
  "properties": {
    "project": {
      "type": "object",
      "properties": {
        "name": { "type": "string" },
        "architecture_style": { "type": "string" }
      },
      "required": ["name"]
    },
    "requirements": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "code": { "type": "string", "pattern": "^(RF|RNF)-\\\\d{2,3}$" },
          "type": { "type": "string", "enum": ["RF", "RNF"] },
          "priority": { "type": "string", "enum": ["HIGH", "MEDIUM", "LOW"] }
        }
      }
    }
  }
}`;
  } else if (format === 'py') {
    codePre.textContent = `# ==================================================================
# DevSculptor — Python Pydantic v2 Models (AI Agent Compatible)
# ==================================================================

from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
from uuid import UUID
from datetime import datetime

class UserModel(BaseModel):
    id: UUID
    email: EmailStr
    full_name: str
    created_at: Optional[datetime] = None

class ProjectModel(BaseModel):
    id: UUID
    user_id: UUID
    name: str = Field(min_length=1, max_length=255)
    architecture_style: str = "Monolito Modular Layered MVC"

class RequirementModel(BaseModel):
    code: str = Field(pattern=r"^(RF|RNF)-\\d{2,3}$")
    title: str
    type: str
    priority: str`;
  }
}

// ==========================================================================
// 9. Historial de Auditoría en Tiempo Real
// ==========================================================================
function renderAuditLogs() {
  const container = document.getElementById('audit-table-body');
  if (!container) return;

  container.innerHTML = state.auditLogs.map(l => `
    <tr class="border-b border-white/[0.04] hover:bg-white/[0.02]">
      <td class="p-2 font-mono text-[10px] text-muted">${l.time}</td>
      <td class="p-2">
        <span class="vision-pill ${l.action === 'INSERT' ? 'pill-emerald' : 'pill-cyan'}">${l.action}</span>
      </td>
      <td class="p-2 font-mono text-[11px] text-primary">${l.table}</td>
      <td class="p-2 text-[11px] text-secondary">${l.user}</td>
      <td class="p-2 font-mono text-[10px] text-muted truncate max-w-xs">${l.payload}</td>
    </tr>
  `).join('');
}

function addAuditLog(action, table, payload) {
  const now = new Date();
  const timeStr = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
  state.auditLogs.unshift({
    id: 'aud-' + Date.now(),
    time: timeStr,
    action,
    table,
    user: 'nathaniel (dev)',
    payload
  });
  if (state.activeCanvasTab === 'audit') {
    renderAuditLogs();
  }
}

// ==========================================================================
// 10. Conversación Interactiva (Chat con el Arquitecto)
// ==========================================================================
function initChat() {
  const form = document.getElementById('chat-form');
  const input = document.getElementById('chat-input');
  const stream = document.getElementById('chat-stream');

  if (!form || !input || !stream) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const msg = input.value.trim();
    if (!msg) return;

    // Mensaje Usuario
    appendChatMessage('user', msg);
    input.value = '';

    // Respuesta Simulada del Arquitecto IA
    setTimeout(() => {
      let reply = `He procesado tu indicación: "${msg}". `;
      if (msg.toLowerCase().includes('tabla') || msg.toLowerCase().includes('audit')) {
        reply += `He añadido la verificación correspondiente en el Canvas y registrado la entidad de auditoría en audit_logs.`;
        addAuditLog('INSERT', 'canvas_entities', `Mención contextual: ${msg}`);
      } else if (msg.toLowerCase().includes('rnf') || msg.toLowerCase().includes('latencia')) {
        reply += `Registré la regla no funcional de rendimiento (<500ms) conectada al pool tuning de PostgreSQL.`;
      } else {
        reply += `Se ha actualizado la memoria del proyecto. Puedes consultar los artefactos sintetizados en las secciones de Requisitos y Documentación.`;
      }
      appendChatMessage('assistant', reply);
    }, 600);
  });

  // Chips de preguntas rápidas
  document.querySelectorAll('.chat-quick-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const q = chip.dataset.query;
      input.value = q;
      form.dispatchEvent(new Event('submit'));
    });
  });
}

function appendChatMessage(role, text) {
  const stream = document.getElementById('chat-stream');
  if (!stream) return;

  const msgDiv = document.createElement('div');
  if (role === 'user') {
    msgDiv.className = 'vision-card p-3 self-end ml-12 bg-indigo-600/20 border-indigo-500/30 text-xs text-primary rounded-xl';
    msgDiv.textContent = text;
  } else {
    msgDiv.className = 'vision-card p-3.5 mr-12 text-xs text-primary/95 rounded-xl border-white/10';
    msgDiv.innerHTML = `<strong class="text-indigo-400 font-mono">Arquitecto DevSculptor:</strong> <p class="mt-1 leading-relaxed">${text}</p>`;
  }

  stream.appendChild(msgDiv);
  stream.scrollTop = stream.scrollHeight;
}

// ==========================================================================
// 11. Modal de Compilación & Exportación OKF
// ==========================================================================
function initExportModal() {
  const modal = document.getElementById('export-modal');
  const openBtn = document.getElementById('btn-open-export');
  const closeBtn = document.getElementById('btn-close-export');
  const cancelBtn = document.getElementById('btn-cancel-export');
  const confirmBtn = document.getElementById('btn-confirm-export');
  const progressBar = document.getElementById('export-progress-bar');
  const progressContainer = document.getElementById('export-progress-container');

  function open() { modal?.classList.remove('hidden'); }
  function close() { modal?.classList.add('hidden'); }

  openBtn?.addEventListener('click', open);
  closeBtn?.addEventListener('click', close);
  cancelBtn?.addEventListener('click', close);

  confirmBtn?.addEventListener('click', () => {
    if (progressContainer) progressContainer.classList.remove('hidden');
    let pct = 0;
    const interval = setInterval(() => {
      pct += 25;
      if (progressBar) progressBar.style.width = `${pct}%`;
      if (pct >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          triggerDownload();
          close();
          if (progressContainer) progressContainer.classList.add('hidden');
          if (progressBar) progressBar.style.width = '0%';
        }, 400);
      }
    }, 180);
  });

  function triggerDownload() {
    // Generar archivo Prompt Bundle OKF descargable
    const content = `# DevSculptor — Paquete de Gobernanza Técnica Pre-Código (OKF)
Proyecto: ${state.project.name}
Estilo Arquitectónico: ${state.project.style}
Versión: ${state.project.version}
Maturity Index: ${calculateMaturityIndex()}%

## 1. REQUISITOS VÁLIDOS
${state.requirements.map(r => `- [${r.code}] (${r.type} / ${r.priority}): ${r.title} -> ${r.desc}`).join('\n')}

## 2. DECISIONES DE ARQUITECTURA (ADRs)
${state.decisions.map(d => `### ${d.code}: ${d.title} [${d.status}]\nContexto: ${d.context}\nDecisión: ${d.decision}`).join('\n\n')}

## 3. ESQUEMA DE DATOS DDL
Generado determinísticamente para PostgreSQL 17 con RLS y Triggers activos.
`;

    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DevSculptor_${state.project.name.replace(/\s+/g, '_')}_OKF_Bundle.md`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

// ==========================================================================
// 12. Modal "Nuevo Requisito"
// ==========================================================================
function initNewReqModal() {
  const modal = document.getElementById('new-req-modal');
  const openBtn = document.getElementById('btn-open-new-req');
  const closeBtn = document.getElementById('btn-close-new-req');
  const form = document.getElementById('form-new-req');

  openBtn?.addEventListener('click', () => modal?.classList.remove('hidden'));
  closeBtn?.addEventListener('click', () => modal?.classList.add('hidden'));

  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const code = document.getElementById('input-req-code').value.trim();
    const title = document.getElementById('input-req-title').value.trim();
    const type = document.getElementById('select-req-type').value;
    const priority = document.getElementById('select-req-priority').value;
    const table = document.getElementById('input-req-table').value.trim() || 'core';
    const desc = document.getElementById('input-req-desc').value.trim();

    if (!code || !title) return;

    // Validación regex
    const regex = /^(RF|RNF)-\d{2,3}$/;
    if (!regex.test(code)) {
      alert('El código debe cumplir con el formato RF-01 o RNF-01');
      return;
    }

    addNewRequirement(code, title, type, priority, table, desc);
    form.reset();
    modal?.classList.add('hidden');
  });
}

// ==========================================================================
// 13. Modal "Nuevo Proyecto"
// ==========================================================================
function initNewProjectModal() {
  const modal = document.getElementById('new-project-modal');
  const openBtn = document.getElementById('btn-open-new-project');
  const closeBtn = document.getElementById('btn-close-new-project');
  const form = document.getElementById('form-new-project');

  openBtn?.addEventListener('click', () => modal?.classList.remove('hidden'));
  closeBtn?.addEventListener('click', () => modal?.classList.add('hidden'));

  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('input-proj-name').value.trim();
    const style = document.getElementById('select-proj-style').value;

    if (!name) return;

    state.project.name = name;
    state.project.style = style;

    // Actualizar títulos
    document.querySelectorAll('.active-proj-name').forEach(el => el.textContent = name);
    document.querySelectorAll('.active-proj-style').forEach(el => el.textContent = style);

    modal?.classList.add('hidden');
    form.reset();
    switchScreen('studio');
    addAuditLog('INSERT', 'projects', `Nuevo proyecto inicializado: ${name}`);
  });
}

// ==========================================================================
// 14. Inicialización Global
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initWallpaper();
  renderRequirements();
  renderDecisions();
  renderNodes();
  initChat();
  initExportModal();
  initNewReqModal();
  initNewProjectModal();
  calculateMaturityIndex();

  // Escuchadores de Navegación de Flujo
  document.querySelectorAll('.nav-step-btn').forEach(b => {
    b.addEventListener('click', () => switchStudioStep(b.dataset.target));
  });

  // Escuchadores de Subpestañas Canvas
  document.querySelectorAll('.canvas-subtab').forEach(b => {
    b.addEventListener('click', () => switchCanvasTab(b.dataset.tab));
  });

  // Filtros de Requisitos
  const searchReq = document.getElementById('search-req-input');
  const filterReqType = document.getElementById('filter-req-type');
  if (searchReq) searchReq.addEventListener('input', (e) => renderRequirements(filterReqType?.value || 'ALL', e.target.value));
  if (filterReqType) filterReqType.addEventListener('change', (e) => renderRequirements(e.target.value, searchReq?.value || ''));

  // Copiar Código
  const copyBtn = document.getElementById('btn-copy-code');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      const text = document.getElementById('code-output-text')?.textContent || '';
      navigator.clipboard.writeText(text).then(() => {
        const orig = copyBtn.innerHTML;
        copyBtn.innerHTML = '<span class="material-symbols-outlined text-xs">done</span> Copiado';
        setTimeout(() => copyBtn.innerHTML = orig, 1500);
      });
    });
  }

  // Zoom dock
  const btnZoomIn = document.getElementById('btn-zoom-in');
  const btnZoomOut = document.getElementById('btn-zoom-out');
  const zoomInd = document.getElementById('zoom-val');
  const contentArea = document.getElementById('canvas-content-area');

  if (btnZoomIn && btnZoomOut && contentArea) {
    btnZoomIn.addEventListener('click', () => {
      state.zoom = Math.min(state.zoom + 0.15, 1.8);
      contentArea.style.transform = `scale(${state.zoom})`;
      if (zoomInd) zoomInd.textContent = `${Math.round(state.zoom * 100)}%`;
      setTimeout(updateConnectors, 20);
    });
    btnZoomOut.addEventListener('click', () => {
      state.zoom = Math.max(state.zoom - 0.15, 0.4);
      contentArea.style.transform = `scale(${state.zoom})`;
      if (zoomInd) zoomInd.textContent = `${Math.round(state.zoom * 100)}%`;
      setTimeout(updateConnectors, 20);
    });
  }

  // Re-calcular conectores en resize de ventana
  window.addEventListener('resize', () => {
    setTimeout(updateConnectors, 50);
  });
});

// Exponer funciones globales para eventos inline
window.switchScreen = switchScreen;
window.switchStudioStep = switchStudioStep;
window.switchCanvasTab = switchCanvasTab;
window.transitionAdrStatus = transitionAdrStatus;
window.deleteRequirement = deleteRequirement;
