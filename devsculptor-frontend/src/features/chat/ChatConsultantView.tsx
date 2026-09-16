import React, { useState } from 'react';
import { VisionPill } from '@/components/ui/VisionPill';
import { VisionButton } from '@/components/ui/VisionButton';

interface Message {
  id: string;
  sender: 'assistant' | 'user';
  content: string;
  specs?: { code: string; text: string; color: string }[];
}

interface ChatConsultantViewProps {
  onNavigateStep?: (step: 'view-reqs' | 'view-docs' | 'view-canvas') => void;
}

export const ChatConsultantView: React.FC<ChatConsultantViewProps> = ({ onNavigateStep }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'msg-1',
      sender: 'assistant',
      content:
        'Bienvenido a la sesión de gobernanza técnica. Cuéntame qué componentes, modelos o reglas de negocio deseas estructurar. A partir de nuestra conversación sintetizaré los Requisitos IEEE-830, el esquema relacional normalizado y las actas de decisión de arquitectura (ADRs).',
    },
    {
      id: 'msg-2',
      sender: 'user',
      content:
        'Necesitamos que los proyectos de los usuarios tengan aislamiento estricto horizontal y que las entidades del canvas registren mutaciones automáticamente en un historial de auditoría.',
    },
    {
      id: 'msg-3',
      sender: 'assistant',
      content: 'Comprendido. He formalizado dos especificaciones de ingeniería clave para el proyecto:',
      specs: [
        {
          code: '[RF-02]',
          text: 'Aislamiento Horizontal por user_id (Respuesta 404 en consultas ajenas).',
          color: 'text-indigo-400',
        },
        {
          code: '[RF-03]',
          text: 'Trigger fn_audit_canvas_entities hacia tabla audit_logs.',
          color: 'text-cyan-400',
        },
      ],
    },
  ]);

  const [inputVal, setInputVal] = useState('');

  const handleSend = (textToSend?: string) => {
    const text = textToSend || inputVal;
    if (!text.trim()) return;

    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      content: text,
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputVal('');

    // Respuesta analítica guiada del arquitecto
    setTimeout(() => {
      let replyContent = `He analizado tu planteamiento sobre "${text.substring(0, 45)}...".`;
      const replySpecs: { code: string; text: string; color: string }[] = [];

      if (text.toLowerCase().includes('3fn') || text.toLowerCase().includes('normaliz')) {
        replyContent = 'Auditoría relacional completada: las relaciones 1:N entre users -> projects -> canvas_entities cumplen la Tercera Forma Normal (3FN). Sin redundancias transitivas.';
        replySpecs.push({
          code: '[VERIFICADO]',
          text: 'Esquema relacional en 3FN y claves foráneas indexadas.',
          color: 'text-emerald-400',
        });
      } else if (text.toLowerCase().includes('latencia') || text.toLowerCase().includes('500ms')) {
        replyContent = 'Parametrización de Rendimiento: Se formaliza el requisito no funcional de pool tuning con max 20 conexiones para garantizar respuestas sub-500ms.';
        replySpecs.push({
          code: '[RNF-01]',
          text: 'Latencia de consulta API < 500ms con pg.Pool parametrizado.',
          color: 'text-amber-400',
        });
      } else if (text.toLowerCase().includes('trigger') || text.toLowerCase().includes('audit')) {
        replyContent = 'Auditoría Transversal: El trigger PL/pgSQL trg_audit_canvas se ejecuta en AFTER INSERT OR UPDATE OR DELETE, encapsulando OLD y NEW de forma atómica.';
        replySpecs.push({
          code: '[SEGURIDAD]',
          text: 'Función fn_audit_canvas_entities blindada con search_path inmutable.',
          color: 'text-cyan-400',
        });
      } else {
        replySpecs.push({
          code: '[SPEC]',
          text: 'Requisito preliminar incorporado para revisión en el paso 2.',
          color: 'text-indigo-400',
        });
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `msg-resp-${Date.now()}`,
          sender: 'assistant',
          content: replyContent,
          specs: replySpecs,
        },
      ]);
    }, 450);
  };

  return (
    <div className="flex-1 flex flex-col h-full p-4 gap-3 select-none">
      {/* Encabezado */}
      <div className="flex items-center justify-between pb-2 border-b border-glass-subtle shrink-0">
        <div>
          <h2 className="text-xs font-semibold text-primary">Conversación con el Arquitecto de Software</h2>
          <p className="text-[10.5px] text-secondary font-mono">
            Extracción guiada de requerimientos, modelo de datos y decisiones técnicas.
          </p>
        </div>
        <VisionPill variant="indigo">CONSULTOR ACTIVO</VisionPill>
      </div>

      {/* Stream de Mensajes */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 flex flex-col custom-scrollbar">
        {messages.map((m) => {
          if (m.sender === 'assistant') {
            return (
              <div
                key={m.id}
                className="vision-card p-3.5 mr-8 md:mr-16 text-xs text-primary border-glass-subtle space-y-2"
              >
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 dark:bg-indigo-400" />
                  <strong className="text-indigo-600 dark:text-indigo-400 font-mono text-[11px]">
                    Arquitecto DevSculptor:
                  </strong>
                </div>
                <p className="leading-relaxed text-[11.5px]">{m.content}</p>

                {m.specs && m.specs.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-glass-subtle space-y-1 font-mono text-[11px]">
                    {m.specs.map((spec, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className={`font-semibold ${spec.color}`}>{spec.code}</span>
                        <span className="text-primary font-sans text-xs">{spec.text}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          return (
            <div
              key={m.id}
              className="vision-card p-3 self-end ml-8 md:ml-16 bg-indigo-600/15 dark:bg-indigo-600/20 border-indigo-500/30 text-xs text-primary max-w-xl"
            >
              <div className="text-[10px] text-indigo-600 dark:text-indigo-300 font-mono mb-1">Tú (Arquitecto):</div>
              <p className="leading-relaxed text-[11.5px]">{m.content}</p>
            </div>
          );
        })}
      </div>

      {/* Chips Flotantes de Sugerencia Rápida */}
      <div className="flex items-center gap-2 overflow-x-auto py-1 shrink-0">
        <VisionButton
          size="sm"
          icon="search"
          onClick={() => handleSend('Validar integridad 3FN de las tablas del proyecto')}
        >
          Validar 3FN
        </VisionButton>
        <VisionButton
          size="sm"
          icon="bolt"
          onClick={() => handleSend('Añadir regla no funcional de latencia menor a 500ms')}
        >
          RNF Latencia &lt; 500ms
        </VisionButton>
        <VisionButton
          size="sm"
          icon="security"
          onClick={() => handleSend('Verificar trigger de auditoría y parámetro search_path')}
        >
          Auditar Triggers
        </VisionButton>
        {onNavigateStep && (
          <VisionButton
            size="sm"
            icon="arrow_forward"
            onClick={() => onNavigateStep('view-reqs')}
            className="text-amber-400 hover:text-amber-300"
          >
            Ver Requisitos
          </VisionButton>
        )}
      </div>

      {/* Input de Chat */}
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
          placeholder="Describe un nuevo módulo, tabla relacional o regla de negocio..."
          className="vision-input pr-10 text-xs"
        />
        <button
          type="submit"
          className="absolute right-1.5 w-7 h-7 rounded-[6px] bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center transition-transform active:scale-95 cursor-pointer"
          title="Enviar consulta"
        >
          <span className="material-symbols-outlined text-[15px]">arrow_upward</span>
        </button>
      </form>
    </div>
  );
};
