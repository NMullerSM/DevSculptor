import React, { useState, useRef, useEffect } from 'react';
import { useAiChatStore } from '@/stores/useAiChatStore';
import { useProjectStore } from '@/stores/useProjectStore';
import { VisionPill } from '@/components/ui/VisionPill';
import { VisionButton } from '@/components/ui/VisionButton';
import { MermaidVisualizer } from '@/components/diagrams/MermaidVisualizer';
import {
  AiChatMessage,
  AiSuggestedRequirement,
  AiSuggestedEntity,
  AiSuggestedDecision,
  AiSuggestedDiagram,
  DevSculptorActions,
} from '@/types/ai.types';

interface ChatConsultantViewProps {
  onNavigateStep?: (step: 'view-reqs' | 'view-docs' | 'view-canvas' | 'view-diagrams') => void;
  isCompact?: boolean;
}

export type AiModePreset = 'general' | 'conversation' | 'diagrams' | 'canvas' | 'requirements';

interface ModePresetOption {
  value: AiModePreset;
  label: string;
  shortLabel: string;
  pillVariant: 'indigo' | 'cyan' | 'emerald' | 'amber' | 'rose';
  description: string;
  placeholder: string;
}

const MODE_PRESET_OPTIONS: ModePresetOption[] = [
  {
    value: 'general',
    label: '🏛️ General (Integral)',
    shortLabel: 'General',
    pillVariant: 'indigo',
    description: 'Genera suite técnica completa: requerimientos IEEE-830, entidades relacionales y diagramas UML/BPMN.',
    placeholder: 'Describe un módulo o solicita formalizar la arquitectura...',
  },
  {
    value: 'conversation',
    label: '💬 Conversación (Asesoría)',
    shortLabel: 'Conversación',
    pillVariant: 'cyan',
    description: 'Asesoría técnica y consultoría arquitectónica pura sin generar inyecciones automáticas.',
    placeholder: 'Haz una consulta técnica o debate de diseño arquitectónico...',
  },
  {
    value: 'diagrams',
    label: '📐 Diagramado (UML / BPMN)',
    shortLabel: 'Diagramado',
    pillVariant: 'indigo',
    description: 'Generación exclusiva de diagramas de arquitectura en Mermaid (BPMN, Secuencia, Clases, Estados).',
    placeholder: 'Solicita un diagrama de secuencia, BPMN, flujo transaccional o estados...',
  },
  {
    value: 'canvas',
    label: '🗄️ Canvas ERD (Tablas 3FN)',
    shortLabel: 'Canvas ERD',
    pillVariant: 'emerald',
    description: 'Modelado exclusivo de tablas relacionales en 3FN y claves foráneas para el Canvas.',
    placeholder: 'Describe entidades, atributos o relaciones para el canvas relacional...',
  },
  {
    value: 'requirements',
    label: '📋 Requisitos (IEEE-830)',
    shortLabel: 'Requisitos',
    pillVariant: 'amber',
    description: 'Sintetización exclusiva de requerimientos funcionales (RF) y no funcionales (RNF).',
    placeholder: 'Describe requerimientos funcionales o reglas de negocio bajo norma IEEE-830...',
  },
];

function extractMermaidFromText(text: string): AiSuggestedDiagram[] {
  if (!text || !text.includes('```mermaid')) return [];
  const regex = /`{3,4}mermaid\s*\n([\s\S]*?)\n`{3,4}/gi;
  const list: AiSuggestedDiagram[] = [];
  let match: RegExpExecArray | null;
  let idx = 1;
  while ((match = regex.exec(text)) !== null) {
    const code = match[1].trim();
    if (!code) continue;
    let inferredType: AiSuggestedDiagram['type'] = 'flowchart';
    if (/^sequenceDiagram/i.test(code)) inferredType = 'sequence';
    else if (/^classDiagram/i.test(code)) inferredType = 'class';
    else if (/^erDiagram/i.test(code)) inferredType = 'er';
    else if (/^stateDiagram/i.test(code)) inferredType = 'state';
    else if (/^C4Context|^C4Container/i.test(code) || code.includes('Person(')) inferredType = 'c4';

    list.push({
      code: `DIAG-EXT-${idx}`,
      title: code.toLowerCase().includes('subgraph') || code.toLowerCase().includes('lane')
        ? 'Diagrama de Procesos BPMN / Flujo'
        : `Diagrama ${inferredType.toUpperCase()} de Arquitectura`,
      type: inferredType,
      format: 'mermaid',
      mermaidCode: code,
      description: 'Diagrama Mermaid detectado en el mensaje del copiloto',
    });
    idx++;
  }
  return list;
}

export const ChatConsultantView: React.FC<ChatConsultantViewProps> = ({ onNavigateStep, isCompact = false }) => {
  const { activeProject } = useProjectStore();
  const {
    messages,
    isLoading,
    error,
    sendMessage,
    injectRequirement,
    injectEntity,
    injectDecision,
    injectDiagram,
    injectAllActions,
    isItemInjected,
    clearHistory,
    switchProject,
  } = useAiChatStore();

  const [activeMode, setActiveMode] = useState<AiModePreset>('general');
  const [inputVal, setInputVal] = useState('');
  const [injectionFeedback, setInjectionFeedback] = useState<string | null>(null);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [expandedDiagramCodes, setExpandedDiagramCodes] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastSentTextRef = useRef<string>('');

  const currentPreset = MODE_PRESET_OPTIONS.find((p) => p.value === activeMode) || MODE_PRESET_OPTIONS[0];

  const handleCopyText = async (id: string, text: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopiedMsgId(id);
      setTimeout(() => setCopiedMsgId(null), 2000);
    } catch {
      // Fallback
    }
  };

  const formatMessageForCopy = (m: AiChatMessage): string => {
    let text = m.content;

    if (m.actions) {
      const parts: string[] = [];

      if (m.actions.requirements && m.actions.requirements.length > 0) {
        parts.push(
          '\n\n### Requisitos Sugeridos (IEEE-830):\n' +
            m.actions.requirements
              .map(
                (r: AiSuggestedRequirement) =>
                  `* **[${r.code}] ${r.title}** (${r.type} | Prioridad: ${r.priority})\n  ${r.description || ''}`
              )
              .join('\n')
        );
      }

      if (m.actions.entities && m.actions.entities.length > 0) {
        parts.push(
          '\n\n### Entidades Relacionales Sugeridas:\n' +
            m.actions.entities
              .map((e: AiSuggestedEntity) => {
                const cols = (e.columns || [])
                  .map((c) => {
                    const colRecord = c as unknown as Record<string, unknown>;
                    const isPk = c.isPrimary || colRecord.isPk || colRecord.is_pk;
                    const isFk = Boolean(colRecord.isFk || colRecord.is_fk);
                    const ref = colRecord.referencesTable || colRecord.references_table || c.references;
                    return `  - \`${c.name}\` (${c.type}${isPk ? ', PK' : ''}${isFk ? `, FK -> ${ref || ''}` : ''})`;
                  })
                  .join('\n');
                return `* **Tabla \`${e.tableName}\`**:\n${cols}`;
              })
              .join('\n\n')
        );
      }

      if (m.actions.decisions && m.actions.decisions.length > 0) {
        parts.push(
          '\n\n### Decisiones de Arquitectura (ADR):\n' +
            m.actions.decisions
              .map(
                (d: AiSuggestedDecision) =>
                  `* **[${d.code}] ${d.title}**\n  - Contexto: ${d.context || 'N/A'}\n  - Decisión: ${d.decision || 'N/A'}\n  - Consecuencias: ${d.consequences || 'N/A'}`
              )
              .join('\n')
        );
      }

      if (m.actions.diagrams && m.actions.diagrams.length > 0) {
        parts.push(
          '\n\n### Diagramas de Arquitectura (Mermaid UML):\n' +
            m.actions.diagrams
              .map(
                (d: AiSuggestedDiagram) =>
                  `* **[${d.code}] ${d.title}** (${d.type})${d.description ? `\n  ${d.description}` : ''}\n\`\`\`mermaid\n${d.mermaidCode}\n\`\`\``
              )
              .join('\n\n')
        );
      }

      if (parts.length > 0) {
        text += parts.join('');
      }
    }

    return text;
  };

  // Auto-scroll al final del stream de mensajes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Aislamiento y conmutación reactiva de la sesión de chat por proyecto activo
  useEffect(() => {
    if (activeProject?.id) {
      switchProject(activeProject.id);
    }
  }, [activeProject?.id, switchProject]);

  const showToast = (msg: string) => {
    setInjectionFeedback(msg);
    setTimeout(() => setInjectionFeedback(null), 3500);
  };

  const handleSend = async (textToSend?: string) => {
    if (!activeProject) return;
    const text = textToSend || inputVal;
    if (!text.trim() || isLoading) return;

    lastSentTextRef.current = text;
    if (!textToSend) setInputVal('');
    const actionContext = activeMode === 'general' ? undefined : activeMode;
    await sendMessage(activeProject.id, text, actionContext);
  };

  const handleInjectRequirement = async (req: AiSuggestedRequirement) => {
    if (!activeProject) return;
    try {
      await injectRequirement(activeProject.id, req);
      showToast(`Requisito ${req.code} inyectado exitosamente`);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Error al inyectar requisito');
    }
  };

  const handleInjectEntity = async (entity: AiSuggestedEntity) => {
    if (!activeProject) return;
    try {
      await injectEntity(activeProject.id, entity);
      showToast(`Entidad "${entity.tableName}" inyectada al Canvas`);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Error al inyectar entidad');
    }
  };

  const handleInjectDecision = async (decision: AiSuggestedDecision) => {
    if (!activeProject) return;
    try {
      await injectDecision(activeProject.id, decision);
      showToast(`Decisión ${decision.code} inyectada en Actas`);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Error al inyectar decisión');
    }
  };

  const handleInjectDiagram = async (diagram: AiSuggestedDiagram) => {
    if (!activeProject) return;
    try {
      await injectDiagram(activeProject.id, diagram);
      showToast(`Diagrama "${diagram.title}" registrado en el proyecto`);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Error al registrar diagrama');
    }
  };

  const handleInjectAll = async (actions: DevSculptorActions) => {
    if (!activeProject) return;
    try {
      const count = await injectAllActions(activeProject.id, actions);
      showToast(`Se inyectaron ${count} artefactos técnicos en el proyecto`);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Error al inyectar acciones');
    }
  };

  return (
    <div className={`flex-1 flex flex-col h-full ${isCompact ? 'p-2 sm:p-2.5 gap-2' : 'p-2.5 sm:p-4 gap-2.5 sm:gap-3'} select-none min-h-0 overflow-hidden`}>
      {/* 1. Encabezado */}
      <div className="flex items-center justify-between pb-1.5 border-b border-glass-subtle shrink-0 gap-1.5">
        <div className="min-w-0">
          <h2 className="text-xs font-semibold text-primary flex items-center gap-1.5 truncate">
            <span className="truncate">{isCompact ? 'Copiloto de Arquitectura' : 'Copiloto de Arquitectura en Tiempo Real'}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          </h2>
          {!isCompact && (
            <p className="text-[10px] sm:text-[10.5px] text-secondary font-mono truncate">
              Evaluación contextual viva de requisitos IEEE-830, esquema relacional y actas ADR.
            </p>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {injectionFeedback && (
            <div className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-[6px] animate-fade-in flex items-center gap-1">
              <span className="material-symbols-outlined text-[12px]">check_circle</span>
              <span className="truncate max-w-[100px]">{injectionFeedback}</span>
            </div>
          )}

          {/* ComboBox Selector de Modo Preset */}
          <div className="flex items-center gap-1">
            <label htmlFor="ai-mode-selector" className="text-[10px] font-mono text-muted uppercase hidden sm:inline">
              Modo:
            </label>
            <select
              id="ai-mode-selector"
              value={activeMode}
              onChange={(e) => setActiveMode(e.target.value as AiModePreset)}
              className="vision-btn text-[11px] !py-1 !px-2 bg-[var(--glass-input)] text-primary font-mono cursor-pointer border border-glass-subtle focus:border-indigo-500 rounded-[6px]"
              title="Preset de generación del Arquitecto IA"
              aria-label="Preset de generación del Arquitecto IA"
            >
              {MODE_PRESET_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-slate-900 text-white dark:bg-slate-900">
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <VisionButton
            size="sm"
            icon="delete_sweep"
            onClick={clearHistory}
            className="text-muted hover:text-primary !py-0.5 !px-1.5"
            title="Reiniciar conversación"
          >
            <span className="hidden xs:inline">Limpiar</span>
          </VisionButton>

          {!isCompact && (
            <VisionPill variant={currentPreset.pillVariant} className="hidden lg:inline-flex text-[9px] uppercase font-mono">
              MODO {currentPreset.shortLabel.toUpperCase()}
            </VisionPill>
          )}
        </div>
      </div>

      {/* 2. Error Banner si ocurre */}
      {error && (
        <div className="p-2.5 rounded-[8px] bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">warning</span>
            <span>{error}</span>
          </div>
          <button
            onClick={() => handleSend(lastSentTextRef.current)}
            className="text-[10px] underline hover:text-rose-300 cursor-pointer"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* 3. Stream de Mensajes */}
      <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 flex flex-col custom-scrollbar">
        {messages.map((m) => {
          if (m.role === 'assistant') {
            const extractedDiagrams = extractMermaidFromText(m.content);
            const effectiveDiagrams =
              m.actions?.diagrams && m.actions.diagrams.length > 0
                ? m.actions.diagrams
                : extractedDiagrams;

            const effectiveActions: DevSculptorActions = {
              requirements: m.actions?.requirements || [],
              entities: m.actions?.entities || [],
              decisions: m.actions?.decisions || [],
              diagrams: effectiveDiagrams,
            };

            const hasActions =
              (effectiveActions.requirements && effectiveActions.requirements.length > 0) ||
              (effectiveActions.entities && effectiveActions.entities.length > 0) ||
              (effectiveActions.decisions && effectiveActions.decisions.length > 0) ||
              (effectiveActions.diagrams && effectiveActions.diagrams.length > 0);

            return (
              <div
                key={m.id}
                className={`vision-card text-xs text-primary border-glass-subtle ${
                  isCompact ? 'p-2.5 mr-0 space-y-2' : 'p-3 sm:p-4 mr-1 sm:mr-6 md:mr-12 space-y-3'
                }`}
              >
                {/* Cabecera del mensaje de la IA */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 dark:bg-indigo-400 shadow-[0_0_6px_rgba(99,102,241,0.6)]" />
                    <strong className="text-indigo-600 dark:text-indigo-400 font-mono text-[11px] uppercase tracking-wider">
                      Arquitecto Principal DevSculptor
                    </strong>
                  </div>

                  <div className="flex items-center gap-1.5 sm:gap-2">
                    {m.provider && (
                      <div className="text-[9.5px] font-mono text-muted flex items-center gap-1.5 hidden xs:flex">
                        <span className="material-symbols-outlined text-[12px] text-cyan-400">smart_toy</span>
                        <span className="capitalize">{m.provider}</span>
                        {m.model && <span className="opacity-70">({m.model})</span>}
                      </div>
                    )}
                    <button
                      onClick={() => handleCopyText(m.id, formatMessageForCopy(m))}
                      className={`vision-btn !py-0.5 !px-1.5 text-[10px] font-mono flex items-center gap-1 transition-all ${
                        copiedMsgId === m.id
                          ? 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10'
                          : 'text-muted hover:text-primary'
                      }`}
                      title="Copiar propuesta completa (texto, requisitos y entidades)"
                      aria-label="Copiar propuesta completa"
                    >
                      <span className="material-symbols-outlined text-[12px]">
                        {copiedMsgId === m.id ? 'check' : 'content_copy'}
                      </span>
                      <span>{copiedMsgId === m.id ? 'Copiado' : 'Copiar'}</span>
                    </button>
                  </div>
                </div>

                {/* Contenido en Markdown / Texto */}
                <div className="text-[12px] leading-relaxed whitespace-pre-line text-primary/95 font-sans">
                  {m.content}
                </div>

                {/* Bloque de Acciones Inyectables (devsculptor-actions) */}
                {hasActions && (
                  <div className="mt-3 p-3.5 rounded-[8px] bg-black/5 dark:bg-white/[0.03] border border-indigo-500/25 space-y-3">
                    <div className="flex items-center justify-between border-b border-glass-subtle pb-2">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm text-indigo-400">add_task</span>
                        <span className="text-[11px] font-mono font-bold text-primary">
                          Acciones Técnicas Detectadas
                        </span>
                      </div>
                      <VisionButton
                        size="sm"
                        icon="bolt"
                        onClick={() => handleInjectAll(effectiveActions)}
                        className="text-indigo-400 hover:text-indigo-300 font-mono text-[10.5px]"
                      >
                        Inyectar Todo
                      </VisionButton>
                    </div>

                    {/* Requisitos Sugeridos */}
                    {effectiveActions.requirements && effectiveActions.requirements.length > 0 && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="text-[9.5px] font-mono text-muted uppercase tracking-wider">
                            Requisitos IEEE-830 Sugeridos ({effectiveActions.requirements.length})
                          </div>
                          <button
                            onClick={() =>
                              handleCopyText(
                                `reqs-all-${m.id}`,
                                effectiveActions.requirements!
                                  .map(
                                    (r) =>
                                      `* [${r.code}] ${r.title} (${r.type} | Prioridad: ${r.priority})\n  ${r.description || ''}`
                                  )
                                  .join('\n\n')
                              )
                            }
                            className="text-[9.5px] font-mono text-muted hover:text-primary flex items-center gap-1 cursor-pointer transition-colors"
                            title="Copiar lista de requisitos"
                          >
                            <span className="material-symbols-outlined text-[11px]">
                              {copiedMsgId === `reqs-all-${m.id}` ? 'check' : 'content_copy'}
                            </span>
                            <span>{copiedMsgId === `reqs-all-${m.id}` ? 'Copiados' : 'Copiar RFs'}</span>
                          </button>
                        </div>
                        <div className="grid grid-cols-1 gap-1.5">
                          {effectiveActions.requirements.map((req, i) => {
                            const isInjected = isItemInjected(`req:${req.code}`);
                            return (
                              <div
                                key={i}
                                className="flex items-center justify-between p-2 rounded-[6px] bg-black/10 dark:bg-white/[0.04] border border-glass-subtle text-[11px]"
                              >
                                <div className="flex items-center gap-1.5 overflow-hidden">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCopyText(
                                        `req-${m.id}-${i}`,
                                        `[${req.code}] ${req.title} (${req.type} | Prioridad: ${req.priority})\n${req.description || ''}`
                                      );
                                    }}
                                    className="text-muted hover:text-primary p-0.5 rounded cursor-pointer transition-colors shrink-0"
                                    title="Copiar este requisito"
                                  >
                                    <span className="material-symbols-outlined text-[12px]">
                                      {copiedMsgId === `req-${m.id}-${i}` ? 'check' : 'content_copy'}
                                    </span>
                                  </button>
                                  <span className="font-mono font-bold text-amber-500 dark:text-amber-400 shrink-0">
                                    {req.code}
                                  </span>
                                  <span className="truncate text-primary font-medium">{req.title}</span>
                                  <VisionPill
                                    variant={req.type === 'RF' ? 'indigo' : 'amber'}
                                    className="text-[8px] px-1 py-0.2 shrink-0"
                                  >
                                    {req.type}
                                  </VisionPill>
                                </div>
                                <button
                                  onClick={() => handleInjectRequirement(req)}
                                  disabled={isInjected}
                                  className={`ml-2 text-[10px] font-mono px-2 py-1 rounded transition-all cursor-pointer ${
                                    isInjected
                                      ? 'text-emerald-400 bg-emerald-500/10 cursor-default'
                                      : 'text-indigo-400 hover:text-indigo-300 bg-indigo-500/15 hover:bg-indigo-500/25'
                                  }`}
                                >
                                  {isInjected ? 'Inyectado ✓' : '+ Inyectar'}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Entidades Sugeridas */}
                    {effectiveActions.entities && effectiveActions.entities.length > 0 && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="text-[9.5px] font-mono text-muted uppercase tracking-wider">
                            Entidades Relacionales Canvas ({effectiveActions.entities.length})
                          </div>
                          <button
                            onClick={() =>
                              handleCopyText(
                                `entities-all-${m.id}`,
                                JSON.stringify(effectiveActions.entities, null, 2)
                              )
                            }
                            className="text-[9.5px] font-mono text-muted hover:text-primary flex items-center gap-1 cursor-pointer transition-colors"
                            title="Copiar entidades en formato JSON"
                          >
                            <span className="material-symbols-outlined text-[11px]">
                              {copiedMsgId === `entities-all-${m.id}` ? 'check' : 'content_copy'}
                            </span>
                            <span>{copiedMsgId === `entities-all-${m.id}` ? 'Copiado JSON' : 'Copiar JSON'}</span>
                          </button>
                        </div>
                        <div className="grid grid-cols-1 gap-1.5">
                          {effectiveActions.entities.map((ent, i) => {
                            const isInjected = isItemInjected(`entity:${ent.tableName}`);
                            return (
                              <div
                                key={i}
                                className="flex items-center justify-between p-2 rounded-[6px] bg-black/10 dark:bg-white/[0.04] border border-glass-subtle text-[11px]"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="material-symbols-outlined text-xs text-emerald-400">table_chart</span>
                                  <span className="font-mono font-bold text-emerald-500 dark:text-emerald-400">
                                    {ent.tableName}
                                  </span>
                                  <span className="text-[9.5px] text-muted font-mono">
                                    ({ent.columns.length} columnas)
                                  </span>
                                </div>
                                <button
                                  onClick={() => handleInjectEntity(ent)}
                                  disabled={isInjected}
                                  className={`ml-2 text-[10px] font-mono px-2 py-1 rounded transition-all cursor-pointer ${
                                    isInjected
                                      ? 'text-emerald-400 bg-emerald-500/10 cursor-default'
                                      : 'text-emerald-400 hover:text-emerald-300 bg-emerald-500/15 hover:bg-emerald-500/25'
                                  }`}
                                >
                                  {isInjected ? 'En Canvas ✓' : '+ Inyectar'}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Decisiones Sugeridas */}
                    {effectiveActions.decisions && effectiveActions.decisions.length > 0 && (
                      <div className="space-y-1.5">
                        <div className="text-[9.5px] font-mono text-muted uppercase tracking-wider">
                          Actas de Decisión (ADRs) ({effectiveActions.decisions.length})
                        </div>
                        <div className="grid grid-cols-1 gap-1.5">
                          {effectiveActions.decisions.map((dec, i) => {
                            const isInjected = isItemInjected(`decision:${dec.code}`);
                            return (
                              <div
                                key={i}
                                className="flex items-center justify-between p-2 rounded-[6px] bg-black/10 dark:bg-white/[0.04] border border-glass-subtle text-[11px]"
                              >
                                <div className="flex items-center gap-2 overflow-hidden">
                                  <span className="font-mono font-bold text-cyan-500 dark:text-cyan-400 shrink-0">
                                    {dec.code}
                                  </span>
                                  <span className="truncate text-primary font-medium">{dec.title}</span>
                                </div>
                                <button
                                  onClick={() => handleInjectDecision(dec)}
                                  disabled={isInjected}
                                  className={`ml-2 text-[10px] font-mono px-2 py-1 rounded transition-all cursor-pointer ${
                                    isInjected
                                      ? 'text-cyan-400 bg-cyan-500/10 cursor-default'
                                      : 'text-cyan-400 hover:text-cyan-300 bg-cyan-500/15 hover:bg-cyan-500/25'
                                  }`}
                                >
                                  {isInjected ? 'Inyectado ✓' : '+ Inyectar'}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Diagramas Arquitectónicos (Mermaid UML) */}
                    {effectiveActions.diagrams && effectiveActions.diagrams.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="text-[9.5px] font-mono text-muted uppercase tracking-wider flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[13px] text-fuchsia-400">schema</span>
                            <span>Diagramas Arquitectónicos OKF ({effectiveActions.diagrams.length})</span>
                          </div>
                          <button
                            onClick={() =>
                              handleCopyText(
                                `diagrams-all-${m.id}`,
                                effectiveActions.diagrams!
                                  .map((d) => `%% ${d.title} (${d.code})\n${d.mermaidCode}`)
                                  .join('\n\n')
                              )
                            }
                            className="text-[9.5px] font-mono text-muted hover:text-primary flex items-center gap-1 cursor-pointer transition-colors"
                            title="Copiar todos los diagramas en Mermaid"
                          >
                            <span className="material-symbols-outlined text-[11px]">
                              {copiedMsgId === `diagrams-all-${m.id}` ? 'check' : 'content_copy'}
                            </span>
                            <span>{copiedMsgId === `diagrams-all-${m.id}` ? 'Copiados' : 'Copiar Mermaid'}</span>
                          </button>
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                          {effectiveActions.diagrams.map((diag, i) => {
                            const isInjected = isItemInjected(`diagram:${diag.code}`);
                            const isExpanded = !!expandedDiagramCodes[`${m.id}-${diag.code}`];

                            return (
                              <div
                                key={i}
                                className="p-2.5 rounded-[8px] bg-black/10 dark:bg-white/[0.04] border border-glass-subtle text-[11px] space-y-2 transition-all"
                              >
                                <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
                                  <div className="flex items-center gap-2 overflow-hidden min-w-0">
                                    <span className="font-mono font-bold text-fuchsia-400 shrink-0">
                                      {diag.code}
                                    </span>
                                    <span className="truncate text-primary font-medium">{diag.title}</span>
                                    <VisionPill variant="indigo" className="text-[8.5px] px-1 py-0.2 uppercase shrink-0">
                                      {diag.type}
                                    </VisionPill>
                                  </div>
                                  <div className="flex items-center gap-1 shrink-0 ml-auto">
                                    <button
                                      onClick={() =>
                                        setExpandedDiagramCodes((prev) => ({
                                          ...prev,
                                          [`${m.id}-${diag.code}`]: !prev[`${m.id}-${diag.code}`],
                                        }))
                                      }
                                      className="text-[10px] font-mono px-2 py-1 rounded bg-black/20 dark:bg-white/10 hover:bg-black/30 dark:hover:bg-white/15 text-secondary hover:text-primary transition-colors flex items-center gap-1 cursor-pointer"
                                      title={isExpanded ? 'Ocultar renderizado' : 'Previsualizar diagrama interactivo'}
                                    >
                                      <span className="material-symbols-outlined text-[12px]">
                                        {isExpanded ? 'visibility_off' : 'visibility'}
                                      </span>
                                      <span>{isExpanded ? 'Ocultar' : 'Previsualizar'}</span>
                                    </button>

                                    <button
                                      onClick={() => handleCopyText(`diag-${m.id}-${i}`, diag.mermaidCode)}
                                      className="text-[10px] font-mono px-2 py-1 rounded bg-black/20 dark:bg-white/10 hover:bg-black/30 dark:hover:bg-white/15 text-secondary hover:text-primary transition-colors flex items-center gap-1 cursor-pointer"
                                      title="Copiar código Mermaid"
                                    >
                                      <span className="material-symbols-outlined text-[12px]">
                                        {copiedMsgId === `diag-${m.id}-${i}` ? 'check' : 'content_copy'}
                                      </span>
                                      <span>{copiedMsgId === `diag-${m.id}-${i}` ? 'Copiado' : 'Código'}</span>
                                    </button>

                                    <button
                                      onClick={() => handleInjectDiagram(diag)}
                                      disabled={isInjected}
                                      className={`text-[10px] font-mono px-2 py-1 rounded transition-all cursor-pointer ${
                                        isInjected
                                          ? 'text-emerald-400 bg-emerald-500/10 cursor-default'
                                          : 'text-fuchsia-400 hover:text-fuchsia-300 bg-fuchsia-500/15 hover:bg-fuchsia-500/25'
                                      }`}
                                    >
                                      {isInjected ? 'Inyectado ✓' : '+ Inyectar'}
                                    </button>

                                    {onNavigateStep && (
                                      <button
                                        onClick={() => onNavigateStep('view-diagrams')}
                                        className="text-[10px] font-mono px-2 py-1 rounded bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-0.5 cursor-pointer"
                                        title="Abrir este diagrama en el Estudio de Diagramas"
                                      >
                                        <span>Estudio</span>
                                        <span className="material-symbols-outlined text-[11px]">open_in_new</span>
                                      </button>
                                    )}
                                  </div>
                                </div>

                                {diag.description && (
                                  <p className="text-[10.5px] text-secondary leading-relaxed font-sans">
                                    {diag.description}
                                  </p>
                                )}

                                {isExpanded && (
                                  <div className="mt-2 rounded-[6px] border border-glass-subtle overflow-hidden bg-slate-900/40 p-2">
                                    <MermaidVisualizer
                                      code={diag.mermaidCode}
                                      title={diag.title}
                                      standard="OKF Mermaid v10"
                                      showCode={false}
                                    />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          }

          // Mensaje del Usuario
          return (
            <div
              key={m.id}
              className={`vision-card self-end bg-indigo-600/15 dark:bg-indigo-600/20 border-indigo-500/30 text-xs text-primary max-w-xl group ${
                isCompact ? 'p-2.5 ml-2' : 'p-3 ml-2 sm:ml-8 md:ml-20'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-[10px] text-indigo-600 dark:text-indigo-300 font-mono">
                  Tú (Arquitecto de Software):
                </span>
                <button
                  onClick={() => handleCopyText(m.id, m.content)}
                  className={`vision-btn !p-1 text-[9.5px] font-mono flex items-center gap-1 transition-all ${
                    copiedMsgId === m.id
                      ? 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10'
                      : 'text-muted hover:text-primary opacity-60 hover:opacity-100'
                  }`}
                  title="Copiar tu mensaje"
                  aria-label="Copiar tu mensaje"
                >
                  <span className="material-symbols-outlined text-[11px]">
                    {copiedMsgId === m.id ? 'check' : 'content_copy'}
                  </span>
                  <span className="hidden sm:inline">{copiedMsgId === m.id ? 'Copiado' : 'Copiar'}</span>
                </button>
              </div>
              <p className="leading-relaxed text-[11.5px] whitespace-pre-wrap">{m.content}</p>
            </div>
          );
        })}

        {/* Indicador de Carga / Pensamiento del Arquitecto */}
        {isLoading && (
          <div className="vision-card p-3 mr-4 sm:mr-12 text-xs text-primary border-indigo-500/30 flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping shrink-0" />
            <span className="text-[11px] font-mono text-indigo-400">
              El Arquitecto está razonando sobre el contexto vivo de tu proyecto...
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 4. Barra Informativa de Preset Activo y Navegación Rápida */}
      <div className="flex items-center justify-between gap-2 px-1 py-1 shrink-0 border-t border-glass-subtle/50 text-[11px] font-mono">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-[10px] uppercase text-muted tracking-wider hidden xs:inline">Preset:</span>
          <span className="text-primary font-semibold truncate flex items-center gap-1">
            <span>{currentPreset.label.split(' ')[0]}</span>
            <span className="text-secondary">{currentPreset.shortLabel}</span>
          </span>
          <span className="text-[10px] text-muted truncate hidden md:inline">
            — {currentPreset.description}
          </span>
        </div>

        {onNavigateStep && (
          <div className="flex items-center gap-1 shrink-0 ml-auto">
            <button
              type="button"
              onClick={() => onNavigateStep('view-diagrams')}
              className="text-[10px] font-mono text-fuchsia-400 hover:text-fuchsia-300 px-2 py-0.5 rounded bg-fuchsia-500/10 hover:bg-fuchsia-500/20 transition-colors flex items-center gap-1 cursor-pointer"
              title="Abrir Estudio de Diagramas"
            >
              <span className="material-symbols-outlined text-[12px]">schema</span>
              <span>Diagramas ↗</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateStep('view-canvas')}
              className="text-[10px] font-mono text-emerald-400 hover:text-emerald-300 px-2 py-0.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors flex items-center gap-1 cursor-pointer"
              title="Abrir Canvas ERD"
            >
              <span className="material-symbols-outlined text-[12px]">table_chart</span>
              <span>Canvas ↗</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateStep('view-reqs')}
              className="text-[10px] font-mono text-amber-400 hover:text-amber-300 px-2 py-0.5 rounded bg-amber-500/10 hover:bg-amber-500/20 transition-colors flex items-center gap-1 cursor-pointer"
              title="Abrir Requisitos"
            >
              <span className="material-symbols-outlined text-[12px]">checklist</span>
              <span>Requisitos ↗</span>
            </button>
          </div>
        )}
      </div>

      {/* 5. Input de Chat con placeholder contextual */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="relative flex items-center shrink-0 pt-0.5"
      >
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          disabled={isLoading}
          placeholder={currentPreset.placeholder}
          className="vision-input pr-10 text-xs"
        />
        <button
          type="submit"
          disabled={isLoading || !inputVal.trim()}
          className="absolute right-1.5 w-7 h-7 rounded-[6px] bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white flex items-center justify-center transition-transform active:scale-95 cursor-pointer"
          title="Enviar consulta"
        >
          <span className="material-symbols-outlined text-[15px]">arrow_upward</span>
        </button>
      </form>
    </div>
  );
};
