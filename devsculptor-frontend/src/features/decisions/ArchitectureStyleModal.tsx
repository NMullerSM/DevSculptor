import React, { useState } from 'react';
import { VisionModal } from '@/components/ui/VisionModal';
import { VisionButton } from '@/components/ui/VisionButton';
import { decisionsService } from '@/services/decisions.service';
import { Decision } from '@/types/decision.types';

interface ArchitectureStyleOption {
  name: string;
  badge: string;
  summary: string;
  pros: string[];
  cons: string[];
  context: string;
  decision: string;
  consequences: string;
}

const CANONICAL_OPTIONS: ArchitectureStyleOption[] = [
  {
    name: 'Monolito Modular Layered MVC',
    badge: 'Recomendado para DevSculptor',
    summary: 'Arquitectura cohesionada en un único artefacto desplegable organizada en módulos de dominio desacoplados (DTOs, Repository, Service, Controller).',
    pros: [
      'Máxima velocidad de desarrollo y simplicidad operativa sin latencia de red inter-servicio.',
      'Garantía de integridad transaccional ACID nativa en PostgreSQL (Triggers, SPs, Constraints).',
      'Fácilmente desacoplable hacia microservicios en el futuro si la escala lo exige.',
    ],
    cons: [
      'Escalabilidad en un único proceso/contenedor.',
      'Requiere disciplina estricta de límites modulares para evitar el espagueti.',
    ],
    context: 'Se requiere una arquitectura sólida para un equipo ágil que priorice gobernanza técnica pre-código, rapidez de desarrollo y cumplimiento de integridad relacional en PostgreSQL sin la sobrecarga operativa de una infraestructura distribuida.',
    decision: 'Adoptar una arquitectura de Monolito Modular Layered MVC organizada por módulos de dominio independientes con BaseRepository parametrizado, DTOs Zod y capas estrictas.',
    consequences: 'Alta cohesión interna, baja latencia, cero overhead distribuido y capacidad de evolución gradual.',
  },
  {
    name: 'Microservicios Desacoplados',
    badge: 'Alta Concurrencia & Equipos Grandes',
    summary: 'Descomposición del sistema en servicios autónomos e independientes que se comunican vía APIs REST o gRPC con bases de datos aisladas.',
    pros: [
      'Despliegue y escalabilidad horizontal independiente por cada servicio.',
      'Aislamiento de fallos y libertad tecnológica/políglota por microservicio.',
    ],
    cons: [
      'Alta complejidad operacional (Service Discovery, API Gateway, Distributed Tracing).',
      'Pérdida de integridad referencial ACID nativa; necesidad de transacciones distribuidas (Sagas).',
    ],
    context: 'El sistema presenta múltiples dominios de negocio a gran escala gestionados por equipos autónomos con requerimientos heterogéneos de carga y escalabilidad independiente.',
    decision: 'Adoptar una arquitectura de Microservicios Desacoplados con APIs REST y bases de datos aisladas por servicio.',
    consequences: 'Escalabilidad granular excelente a cambio de mayor complejidad en monitoreo, observabilidad y consistencia eventual.',
  },
  {
    name: 'Clean Architecture / Hexagonal',
    badge: 'Aislamiento de Dominio',
    summary: 'Arquitectura de Puertos y Adaptadores que sitúa las entidades y casos de uso en el núcleo, desacoplándolos absolutamente de bases de datos y frameworks.',
    pros: [
      'Reglas de negocio 100% testeables en memoria sin depender de infraestructura.',
      'Flexibilidad absoluta para sustituir base de datos, ORM o servidor web sin tocar la lógica.',
    ],
    cons: [
      'Mayor número de interfaces, capas de abstracción y código boilerplate inicial.',
    ],
    context: 'La lógica de negocio del dominio es compleja y debe blindarse frente a cambios frecuentes en tecnologías de infraestructura, frameworks o librerías externas.',
    decision: 'Implementar Clean Architecture (Puertos y Adaptadores) aislando el núcleo de dominio de la capa de persistencia y transporte.',
    consequences: 'Independencia tecnológica total y alta cobertura de pruebas a cambio de mayor número de capas de indirección.',
  },
  {
    name: 'Event-Driven Architecture',
    badge: 'Asíncrono & Reactivo',
    summary: 'Arquitectura orientada a eventos con desacoplamiento temporal donde los componentes emiten y reaccionan a eventos a través de un bus o broker de mensajería.',
    pros: [
      'Desacoplamiento temporal total y alta reactividad ante eventos de negocio.',
      'Excelente absorción de picos de tráfico mediante colas de procesamiento asíncronas.',
    ],
    cons: [
      'Dificultad para depurar y rastrear flujos de ejecución en tiempo real.',
      'Gestión de idempotencia y consistencia eventual obligatorias.',
    ],
    context: 'El flujo de la aplicación se fundamenta en eventos concurrentes, procesamiento en segundo plano y notificaciones en tiempo real con alta tasa de ingestión.',
    decision: 'Adoptar una Arquitectura Dirigida por Eventos (EDA) con brokers de mensajería para desacoplar productores de consumidores.',
    consequences: 'Alta resiliencia frente a cargas variables a cambio de mayor disciplina en observabilidad distribuida y diseño idempotente.',
  },
];

interface ArchitectureStyleModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  onCreated: (decision: Decision) => void;
}

export const ArchitectureStyleModal: React.FC<ArchitectureStyleModalProps> = ({
  isOpen,
  onClose,
  projectId,
  onCreated,
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [code, setCode] = useState('ADR-001');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentOption = CANONICAL_OPTIONS[selectedIndex];

  const handleCreateAdr = async () => {
    setError(null);
    setIsSubmitting(true);

    try {
      const created = await decisionsService.create(projectId, {
        code: code.trim(),
        title: `Adopción del Estilo Arquitectónico: ${currentOption.name}`,
        context: currentOption.context,
        decision: currentOption.decision,
        consequences: currentOption.consequences,
        status: 'PROPOSED',
      });

      onCreated(created);
      setIsSubmitting(false);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al registrar propuesta de arquitectura');
      setIsSubmitting(false);
    }
  };

  return (
    <VisionModal
      isOpen={isOpen}
      onClose={onClose}
      title="Evaluación y Selección de Estilo Arquitectónico Canónico"
      icon="architecture"
      maxWidth="lg"
    >
      <div className="space-y-4 text-xs">
        {error && (
          <div className="p-2.5 rounded-[6px] bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px]">
            {error}
          </div>
        )}

        <div className="p-2.5 rounded-[6px] bg-indigo-500/10 border border-indigo-500/20 text-secondary text-[11px] leading-relaxed">
          Evalúa los 4 estilos de arquitectura canónicos. Al generar la propuesta, se creará el acta en estado{' '}
          <strong className="text-amber-300 font-mono">PROPOSED</strong> para que puedas revisarla y posteriormente ratificarla formalmente mediante el protocolo <em>Human-in-the-Loop</em>.
        </div>

        {/* Opciones de Arquitectura */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {CANONICAL_OPTIONS.map((opt, idx) => {
            const isSelected = idx === selectedIndex;
            return (
              <div
                key={opt.name}
                onClick={() => setSelectedIndex(idx)}
                className={`p-3 rounded-[7px] border transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                  isSelected
                    ? 'bg-indigo-500/[0.12] border-indigo-500/60 shadow-[0_0_12px_rgba(99,102,241,0.15)] ring-1 ring-indigo-500/30'
                    : 'bg-black/5 dark:bg-white/[0.02] border-glass-subtle hover:border-indigo-500/30'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-primary text-xs flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm text-indigo-400">
                        {idx === 0 ? 'deployed_code' : idx === 1 ? 'hub' : idx === 2 ? 'layers' : 'bolt'}
                      </span>
                      {opt.name}
                    </span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/[0.06] text-muted">
                      {opt.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-secondary mt-1 leading-relaxed">{opt.summary}</p>
                </div>

                <div className="pt-2 border-t border-glass-subtle flex items-center justify-between text-[10px] font-mono">
                  <span className="text-emerald-500 dark:text-emerald-400">
                    +{opt.pros.length} Ventajas
                  </span>
                  <span className="text-rose-500 dark:text-rose-400">
                    -{opt.cons.length} Trade-offs
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Detalle de la Opción Seleccionada */}
        <div className="vision-card p-3 space-y-2 border-glass-subtle bg-black/5 dark:bg-white/[0.02]">
          <div className="flex items-center justify-between">
            <span className="font-bold text-xs text-primary flex items-center gap-1.5">
              <span className="material-symbols-outlined text-xs text-cyan-400">format_quote</span>
              Detalle del Acta ADR a Generar
            </span>
            <div className="flex items-center gap-2">
              <label className="text-[10px] font-mono text-muted">Código:</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="vision-input !py-0.5 !px-2 text-xs w-24 font-mono uppercase text-center"
              />
            </div>
          </div>

          <div className="space-y-1 text-[11px]">
            <p>
              <strong className="text-muted font-mono uppercase text-[10px]">Contexto:</strong>{' '}
              <span className="text-secondary">{currentOption.context}</span>
            </p>
            <p>
              <strong className="text-indigo-400 font-mono uppercase text-[10px]">Decisión:</strong>{' '}
              <span className="text-primary">{currentOption.decision}</span>
            </p>
            <p>
              <strong className="text-muted font-mono uppercase text-[10px]">Consecuencias:</strong>{' '}
              <span className="text-secondary">{currentOption.consequences}</span>
            </p>
          </div>
        </div>

        {/* Acciones del Modal */}
        <div className="flex items-center justify-between pt-2 border-t border-glass-subtle">
          <span className="text-[10.5px] font-mono text-muted">
            Se generará en estado <strong>PROPOSED</strong> para verificación humana
          </span>

          <div className="flex items-center gap-2">
            <VisionButton type="button" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </VisionButton>
            <VisionButton
              type="button"
              variant="primary"
              icon="post_add"
              onClick={handleCreateAdr}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Registrando...' : 'Crear Propuesta ADR'}
            </VisionButton>
          </div>
        </div>
      </div>
    </VisionModal>
  );
};
