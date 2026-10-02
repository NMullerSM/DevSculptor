import React, { useState, useRef, useEffect } from 'react';
import { useAiChatStore } from '@/stores/useAiChatStore';
import { useProjectStore } from '@/stores/useProjectStore';
import { VisionPill } from '@/components/ui/VisionPill';
import { VisionButton } from '@/components/ui/VisionButton';
import {
  AiChatMessage,
  AiSuggestedRequirement,
  AiSuggestedEntity,
  AiSuggestedDecision,
  DevSculptorActions,
} from '@/types/ai.types';

interface ChatConsultantViewProps {
  onNavigateStep?: (step: 'view-reqs' | 'view-docs' | 'view-canvas') => void;
  isCompact?: boolean;
}

export const ChatConsultantView: React.FC<ChatConsultantViewProps> = ({ onNavigateStep, isCompact = false }) => {
  const { activeProject } = useProjectStore();
  const {
    messages,
    isLoading,
    error,
    sendMessage,
    analyzeSchema,
    suggestRequirements,
    injectRequirement,
    injectEntity,
    injectDecision,
    injectAllActions,
    isItemInjected,
    clearHistory,
    switchProject,
  } = useAiChatStore();

  const [inputVal, setInputVal] = useState('');
  const [injectionFeedback, setInjectionFeedback] = useState<string | null>(null);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

    if (!textToSend) setInputVal('');
    await sendMessage(activeProject.id, text);
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
            <VisionPill variant="indigo" className="hidden xs:inline-flex">CONSULTOR ACTIVO</VisionPill>
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
            onClick={() => handleSend(inputVal)}
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
            const hasActions =
              m.actions &&
              ((m.actions.requirements && m.actions.requirements.length > 0) ||
                (m.actions.entities && m.actions.entities.length > 0) ||
                (m.actions.decisions && m.actions.decisions.length > 0));

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
                {hasActions && m.actions && (
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
                        onClick={() => handleInjectAll(m.actions!)}
                        className="text-indigo-400 hover:text-indigo-300 font-mono text-[10.5px]"
                      >
                        Inyectar Todo
                      </VisionButton>
                    </div>

                    {/* Requisitos Sugeridos */}
                    {m.actions.requirements && m.actions.requirements.length > 0 && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="text-[9.5px] font-mono text-muted uppercase tracking-wider">
                            Requisitos IEEE-830 Sugeridos ({m.actions.requirements.length})
                          </div>
                          <button
                            onClick={() =>
                              handleCopyText(
                                `reqs-all-${m.id}`,
                                m.actions!.requirements!
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
                          {m.actions.requirements.map((req, i) => {
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
                    {m.actions.entities && m.actions.entities.length > 0 && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="text-[9.5px] font-mono text-muted uppercase tracking-wider">
                            Entidades Relacionales Canvas ({m.actions.entities.length})
                          </div>
                          <button
                            onClick={() =>
                              handleCopyText(
                                `entities-all-${m.id}`,
                                JSON.stringify(m.actions!.entities, null, 2)
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
                          {m.actions.entities.map((ent, i) => {
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
                    {m.actions.decisions && m.actions.decisions.length > 0 && (
                      <div className="space-y-1.5">
                        <div className="text-[9.5px] font-mono text-muted uppercase tracking-wider">
                          Actas de Decisión (ADRs)
                        </div>
                        <div className="grid grid-cols-1 gap-1.5">
                          {m.actions.decisions.map((dec, i) => {
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

      {/* 4. Chips de Acción Rápida */}
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-1 shrink-0">
        <VisionButton
          size="sm"
          icon="search"
          disabled={isLoading}
          onClick={() => {
            if (!activeProject) return;
            analyzeSchema(activeProject.id);
          }}
          className="shrink-0"
        >
          Validar 3FN
        </VisionButton>

        <VisionButton
          size="sm"
          icon="receipt_long"
          disabled={isLoading}
          onClick={() => {
            if (!activeProject) return;
            suggestRequirements(
              activeProject.id,
              'Generar requisitos IEEE-830 para módulo de Pagos con Tarjeta y Autenticación MFA'
            );
          }}
          className="shrink-0"
        >
          Sugerir Requisitos Pagos & Auth
        </VisionButton>

        <VisionButton
          size="sm"
          icon="gavel"
          disabled={isLoading}
          onClick={() =>
            handleSend(
              '¿Qué decisiones de arquitectura (ADRs) deberíamos registrar y formalizar según el estado actual del proyecto?'
            )
          }
          className="shrink-0"
        >
          Auditar ADRs
        </VisionButton>

        <VisionButton
          size="sm"
          icon="table_view"
          disabled={isLoading}
          onClick={() =>
            handleSend(
              'Diseña una tabla de auditoría transversal con columnas id, table_name, record_id, action, old_data, new_data, user_id y timestamp.'
            )
          }
          className="shrink-0"
        >
          Diseñar Tabla Auditoría
        </VisionButton>

        {onNavigateStep && (
          <VisionButton
            size="sm"
            icon="arrow_forward"
            onClick={() => onNavigateStep('view-reqs')}
            className="text-amber-500 dark:text-amber-400 hover:text-amber-300 ml-auto shrink-0"
          >
            Ver Requisitos
          </VisionButton>
        )}
      </div>

      {/* 5. Input de Chat */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="relative flex items-center shrink-0 pt-1"
      >
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          disabled={isLoading}
          placeholder="Describe un requerimiento, entidad relacional o solicita una auditoría..."
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
