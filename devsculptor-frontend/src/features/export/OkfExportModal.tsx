import React, { useState } from 'react';
import JSZip from 'jszip';
import confetti from 'canvas-confetti';
import { VisionModal } from '@/components/ui/VisionModal';
import { VisionButton } from '@/components/ui/VisionButton';
import { useProjectStore } from '@/stores/useProjectStore';
import { useCanvasStore } from '@/stores/useCanvasStore';
import { generatePostgreSqlDdl } from '@/features/canvas/scriptGenerators';

interface OkfExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OkfExportModal: React.FC<OkfExportModalProps> = ({ isOpen, onClose }) => {
  const { activeProject } = useProjectStore();
  const { entities } = useCanvasStore();

  const [includeDocs, setIncludeDocs] = useState(true);
  const [includeDb, setIncludeDb] = useState(true);
  const [includeSkills, setIncludeSkills] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [exportError, setExportError] = useState<string | null>(null);

  const handleExport = async () => {
    setIsExporting(true);
    setProgress(20);

    const zip = new JSZip();
    const projName = activeProject?.name ? activeProject.name.replace(/\s+/g, '_') : 'Project';

    // 1. /documentation/
    if (includeDocs) {
      const docFolder = zip.folder('documentation');
      if (docFolder) {
        docFolder.file(
          'SRS_Requisitos_IEEE830.md',
          `# ${activeProject?.name || 'Proyecto'} — Requisitos de Ingeniería (IEEE-830)\n\n` +
          `**Estilo Arquitectónico:** ${activeProject?.architecture_style || 'Monolito Modular'}\n\n` +
          `## 1. Requisitos Funcionales (RF)\n` +
          `- RF-01: Autenticación con JWT Bearer y contraseñas cifradas con bcrypt.\n` +
          `- RF-02: Aislamiento horizontal estricto por user_id.\n` +
          `- RF-03: Auditoría atómica de cambios en base de datos mediante trigger.\n\n` +
          `## 2. Requisitos No Funcionales (RNF)\n` +
          `- RNF-01: Latencia de respuesta API inferior a 500ms.\n` +
          `- RNF-02: Row Level Security (RLS) activo y search_path inmutable.\n`
        );

        docFolder.file(
          'ADR_Catalogo_Decisiones.md',
          `# ${activeProject?.name || 'Proyecto'} — Actas de Decisión de Arquitectura (ADRs)\n\n` +
          `## ADR-01: Monolito Modular MVC vs Microservicios\n` +
          `* **Estado:** ACCEPTED\n` +
          `* **Contexto:** Mitigar la sobrecarga de red y mantener alta cohesión.\n` +
          `* **Decisión:** Arquitectura monolítica en capas (Controllers -> Services -> Repositories).\n\n` +
          `## ADR-02: Persistencia Nativa pg.Pool vs ORMs\n` +
          `* **Estado:** ACCEPTED\n` +
          `* **Contexto:** Necesidad de Triggers PL/pgSQL avanzados y Stored Procedures.\n` +
          `* **Decisión:** Cliente nativo PostgreSQL con BaseRepository genérico.\n`
        );
      }
    }

    setProgress(50);

    // 2. /database/
    if (includeDb) {
      const dbFolder = zip.folder('database');
      if (dbFolder) {
        const ddlContent = generatePostgreSqlDdl(entities);
        dbFolder.file('schema_ddl.sql', ddlContent);
        dbFolder.file(
          'triggers_and_procedures.sql',
          `-- Triggers de Auditoría y Stored Procedures\n` +
          `-- fn_audit_canvas_entities y sp_calculate_project_metrics\n`
        );
      }
    }

    setProgress(75);

    // 3. /skills/
    if (includeSkills) {
      const skillsFolder = zip.folder('skills');
      if (skillsFolder) {
        skillsFolder.file(
          'devsculptor-architect.md',
          `# Manual Metodológico DevSculptor Architect\n\n` +
          `Directrices de ingeniería: Cero vibe-coding, TypeScript estricto, Envelope uniforme y trazabilidad X-Request-Id.\n`
        );
      }
    }

    setProgress(90);

    // Generar archivo ZIP en memoria
    try {
      const content = await zip.generateAsync({ type: 'blob' });
      setProgress(100);

      // Disparar descarga en navegador
      const url = URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = url;
      link.download = `DevSculptor_${projName}_OKF_Bundle.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Micro-animación de éxito confetti
      try {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // Confetti opcional
      }

      setTimeout(() => {
        setIsExporting(false);
        setProgress(0);
        onClose();
      }, 700);
    } catch (err: unknown) {
      setExportError(err instanceof Error ? err.message : 'Error al compilar el archivo ZIP');
      setIsExporting(false);
    }
  };

  return (
    <VisionModal
      isOpen={isOpen}
      onClose={onClose}
      title="Compilar y Exportar Paquete OKF (Prompt Bundle)"
      icon="folder_zip"
      maxWidth="md"
    >
      <div className="space-y-3.5 text-xs">
        {exportError && (
          <div className="p-2.5 rounded-[6px] bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px]">
            {exportError}
          </div>
        )}
        <p className="text-secondary text-[11.5px] leading-relaxed">
          Selecciona los artefactos técnicos que conformarán el **Prompt Bundle** para alimentar agentes de IA externos (Cursor, Claude, NotebookLM) sin alucinaciones ni saturación de contexto:
        </p>

        <div className="space-y-2 font-mono">
          <label className="vision-card p-3 flex items-center gap-3 cursor-pointer hover:border-indigo-400/30 transition-all">
            <input
              type="checkbox"
              checked={includeDocs}
              onChange={(e) => setIncludeDocs(e.target.checked)}
              className="rounded accent-indigo-500"
            />
            <div>
              <div className="font-semibold text-primary">/documentation/</div>
              <div className="text-[10px] text-muted font-sans">
                Requisitos IEEE-830, Actas ADRs y especificación técnica OpenAPI
              </div>
            </div>
          </label>

          <label className="vision-card p-3 flex items-center gap-3 cursor-pointer hover:border-indigo-400/30 transition-all">
            <input
              type="checkbox"
              checked={includeDb}
              onChange={(e) => setIncludeDb(e.target.checked)}
              className="rounded accent-indigo-500"
            />
            <div>
              <div className="font-semibold text-primary">/database/</div>
              <div className="text-[10px] text-muted font-sans">
                PostgreSQL DDL (3FN), Triggers de auditoría y políticas RLS
              </div>
            </div>
          </label>

          <label className="vision-card p-3 flex items-center gap-3 cursor-pointer hover:border-indigo-400/30 transition-all">
            <input
              type="checkbox"
              checked={includeSkills}
              onChange={(e) => setIncludeSkills(e.target.checked)}
              className="rounded accent-indigo-500"
            />
            <div>
              <div className="font-semibold text-primary">/skills/</div>
              <div className="text-[10px] text-muted font-sans">
                Manual de ingeniería devsculptor-architect y directrices de arquitectura
              </div>
            </div>
          </label>
        </div>

        {/* Barra de Progreso */}
        {isExporting && (
          <div className="space-y-1 pt-1 fade-in">
            <div className="text-[10px] font-mono text-indigo-400 flex items-center justify-between">
              <span>Empaquetando artefactos deterministas en ZIP...</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
              <div
                className="h-full bg-indigo-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-white/[0.08]">
          <VisionButton type="button" onClick={onClose} disabled={isExporting}>
            Cancelar
          </VisionButton>
          <VisionButton
            type="button"
            variant="primary"
            icon="download"
            onClick={handleExport}
            disabled={isExporting || (!includeDocs && !includeDb && !includeSkills)}
          >
            {isExporting ? 'Compilando...' : 'Descargar Paquete ZIP'}
          </VisionButton>
        </div>
      </div>
    </VisionModal>
  );
};
