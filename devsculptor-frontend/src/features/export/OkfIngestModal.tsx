import React, { useState } from 'react';
import { VisionModal } from '@/components/ui/VisionModal';
import { VisionButton } from '@/components/ui/VisionButton';
import { VisionInput } from '@/components/ui/VisionInput';
import { okfVaultService } from './okfVaultService';
import { ConvertedOkfResponse } from '@/types/okf.types';
import {
  Sparkles,
  UploadCloud,
  FileCode,
  Tag,
  CheckCircle2,
  AlertCircle,
  Copy,
  Layers,
  FileText,
  RotateCw,
} from 'lucide-react';

interface OkfIngestModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  onDocumentImported?: (doc: ConvertedOkfResponse) => void;
}

const PRESET_TAGS = [
  'arch:monolith',
  'arch:modular-monolith',
  'arch:clean-architecture',
  'arch:hexagonal',
  'arch:microservices',
  'stack:node-express',
  'stack:postgresql',
  'stack:react-vite',
  'pattern:layered-mvc',
  'pattern:repository',
  'pattern:cqrs',
  'scale:high-concurrency',
  'scale:acid-strict',
  'domain:governance',
  'domain:fintech',
];

export const OkfIngestModal: React.FC<OkfIngestModalProps> = ({
  isOpen,
  onClose,
  projectId,
  onDocumentImported,
}) => {
  const [mode, setMode] = useState<'ai' | 'mechanical'>('ai');
  const [targetCategory, setTargetCategory] = useState<'knowledge-base' | 'patterns' | 'templates'>('knowledge-base');
  const [rawContent, setRawContent] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [contextHint, setContextHint] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>(['arch:modular-monolith', 'stack:postgresql']);
  const [customTagInput, setCustomTagInput] = useState('');
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [convertedResult, setConvertedResult] = useState<ConvertedOkfResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  // Manejo de carga de archivo
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setRawContent(content || '');
      if (!customTitle) {
        const inferredName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        setCustomTitle(inferredName);
      }
    };
    reader.readAsText(file);
  };

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const addCustomTag = () => {
    const trimmed = customTagInput.trim().toLowerCase();
    if (trimmed && !selectedTags.includes(trimmed)) {
      setSelectedTags([...selectedTags, trimmed]);
      setCustomTagInput('');
    }
  };

  const handleConvert = async () => {
    if (!rawContent.trim()) {
      setErrorMessage('Por favor ingrese o cargue el contenido a convertir.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const result = await okfVaultService.convertDocument(projectId, rawContent, mode, {
        title: customTitle.trim() || undefined,
        targetCategory,
        tags: selectedTags,
        contextHint: contextHint.trim() || undefined,
      });

      setConvertedResult(result);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Error al procesar y convertir el documento a OKF'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveToVault = async () => {
    if (!convertedResult) return;

    setIsSaving(true);
    setErrorMessage(null);

    try {
      // Guardar directamente en base de datos PostgreSQL via sync
      await okfVaultService.syncWithDatabase(projectId, [
        {
          id: convertedResult.documentId,
          path: convertedResult.canonicalPath,
          filename: convertedResult.canonicalPath.split('/').pop() || 'document.md',
          category: targetCategory === 'templates' ? 'templates' : 'knowledge',
          description: convertedResult.title,
          content: convertedResult.compiledMarkdown,
          header: {
            okf_spec: 'v1.0.0',
            document_id: convertedResult.documentId,
            document_type: convertedResult.documentType,
            project_id: projectId,
            project_name: 'DevSculptor Project',
            title: convertedResult.title,
            canonical_path: convertedResult.canonicalPath,
            tags: convertedResult.tags,
            freshness: {
              status: 'FRESH',
              last_verified: new Date().toISOString(),
              state_hash: convertedResult.stateHash,
              verified_by: 'Architect Verified',
            },
          },
          rawBody: rawContent,
          stateHash: convertedResult.stateHash,
          freshnessStatus: 'FRESH',
        },
      ]);

      if (onDocumentImported) {
        onDocumentImported(convertedResult);
      }
      onClose();
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Error al persistir el documento en la base de datos'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyMarkdown = () => {
    if (convertedResult?.compiledMarkdown) {
      navigator.clipboard.writeText(convertedResult.compiledMarkdown);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  return (
    <VisionModal
      isOpen={isOpen}
      onClose={onClose}
      title="Ingestor y Convertidor a OKF"
      description="Convierte papers, directrices técnicas y plantillas externas en especificaciones OKF estandarizadas."
      icon="📦"
      size="3xl"
    >
      <div className="flex flex-col gap-4 text-xs">
        {/* Selector de Modo */}
        <div className="flex items-center gap-2 p-1.5 rounded-xl bg-glass-surface border border-glass-subtle">
          <button
            type="button"
            onClick={() => setMode('ai')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg font-medium transition-all ${
              mode === 'ai'
                ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40 shadow-sm'
                : 'text-glass-secondary hover:text-glass-primary'
            }`}
          >
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span>Asistido por IA (Copiloto Gemini / Heurístico)</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('mechanical')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg font-medium transition-all ${
              mode === 'mechanical'
                ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-glass-secondary hover:text-glass-primary'
            }`}
          >
            <FileCode className="w-4 h-4 text-emerald-400" />
            <span>Mecánico Directo (Sin IA - Determinista)</span>
          </button>
        </div>

        {/* Formulario Principal */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Columna Izquierda: Entrada */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-glass-primary flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-400" />
                Contenido Fuente o Archivo
              </label>
              <label className="cursor-pointer text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1">
                <UploadCloud className="w-3.5 h-3.5" />
                Cargar (.md, .txt, .sql)
                <input
                  type="file"
                  accept=".md,.txt,.sql,.json"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </label>
            </div>

            <textarea
              className="w-full h-44 p-2.5 rounded-xl bg-glass-surface/80 border border-glass-subtle text-glass-primary font-mono text-[11px] leading-relaxed resize-none focus:outline-none focus:border-blue-500/50 custom-scrollbar"
              placeholder="Pega aquí el contenido de un paper de arquitectura, guía de infraestructura, directriz técnica o plantilla..."
              value={rawContent}
              onChange={(e) => setRawContent(e.target.value)}
            />

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-medium text-glass-secondary mb-1">
                  Categoría Destino OKF
                </label>
                <select
                  value={targetCategory}
                  onChange={(e) => setTargetCategory(e.target.value as unknown as typeof targetCategory)}
                  className="w-full p-2 rounded-lg bg-glass-surface border border-glass-subtle text-glass-primary text-xs focus:outline-none focus:border-blue-500/50"
                >
                  <option value="knowledge-base">06-knowledge-base/ (Papers & Guías)</option>
                  <option value="patterns">03-architecture-adrs/patterns/ (Patrones)</option>
                  <option value="templates">00-templates/ (Plantillas)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-glass-secondary mb-1">
                  Título Sugerido (Opcional)
                </label>
                <VisionInput
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="Ej. Concurrencia en Monolito"
                />
              </div>
            </div>

            {mode === 'ai' && (
              <div>
                <label className="block text-[11px] font-medium text-glass-secondary mb-1">
                  Instrucción / Contexto para la IA
                </label>
                <VisionInput
                  value={contextHint}
                  onChange={(e) => setContextHint(e.target.value)}
                  placeholder="Ej. Enfocar en cómo mitigar cuellos de botella en PostgreSQL"
                />
              </div>
            )}

            {/* Tags Semánticos */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-medium text-glass-secondary flex items-center gap-1">
                  <Tag className="w-3 h-3 text-purple-400" />
                  Tags Semánticos Cruzados
                </label>
                <span className="text-[10px] text-glass-muted">
                  {selectedTags.length} seleccionados
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto p-1.5 rounded-lg bg-glass-surface/50 border border-glass-subtle custom-scrollbar mb-2">
                {PRESET_TAGS.map((tag) => {
                  const active = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`px-2 py-0.5 rounded-md text-[10px] transition-all font-mono ${
                        active
                          ? 'bg-purple-600/40 text-purple-200 border border-purple-400/50 shadow-xs'
                          : 'bg-glass-surface/60 text-glass-secondary hover:text-glass-primary border border-glass-subtle'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  placeholder="Añadir tag custom (ej. arch:event-sourcing)..."
                  value={customTagInput}
                  onChange={(e) => setCustomTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addCustomTag();
                    }
                  }}
                  className="flex-1 px-2.5 py-1.5 rounded-lg bg-glass-surface border border-glass-subtle text-glass-primary text-[11px] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={addCustomTag}
                  className="px-2.5 py-1.5 rounded-lg bg-glass-surface hover:bg-glass-subtle border border-glass-subtle text-glass-primary text-[11px]"
                >
                  +
                </button>
              </div>
            </div>

            <VisionButton
              variant="primary"
              onClick={handleConvert}
              disabled={isProcessing || !rawContent.trim()}
              className="mt-1 flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <RotateCw className="w-4 h-4 animate-spin text-white" />
                  <span>{mode === 'ai' ? 'Consultando IA y Estructurando...' : 'Procesando Frontmatter...'}</span>
                </>
              ) : (
                <>
                  {mode === 'ai' ? <Sparkles className="w-4 h-4" /> : <FileCode className="w-4 h-4" />}
                  <span>{mode === 'ai' ? 'Convertir con Copiloto IA' : 'Ejecutar Conversión Mecánica'}</span>
                </>
              )}
            </VisionButton>
          </div>

          {/* Columna Derecha: Vista Previa OKF */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-glass-primary flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                Especificación OKF Generada
              </label>

              {convertedResult && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyMarkdown}
                    className="text-[11px] text-glass-secondary hover:text-glass-primary flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" />
                    {copySuccess ? 'Copiado!' : 'Copiar'}
                  </button>
                  <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                    SHA-256: {convertedResult.stateHash.slice(0, 10)}...
                  </span>
                </div>
              )}
            </div>

            {convertedResult ? (
              <div className="flex flex-col gap-2 h-full">
                <div className="p-2 rounded-lg bg-glass-surface/90 border border-glass-subtle flex flex-col gap-1 text-[11px]">
                  <div className="flex items-center justify-between text-glass-muted">
                    <span>Ruta Canónica:</span>
                    <span className="font-mono text-blue-300 font-semibold">{convertedResult.canonicalPath}</span>
                  </div>
                  <div className="flex items-center justify-between text-glass-muted">
                    <span>Document ID:</span>
                    <span className="font-mono text-purple-300">{convertedResult.documentId}</span>
                  </div>
                </div>

                <div className="flex-1 min-h-[220px] max-h-[260px] overflow-y-auto p-3 rounded-xl bg-glass-surface/60 border border-glass-subtle font-mono text-[11px] leading-relaxed text-glass-primary custom-scrollbar whitespace-pre-wrap">
                  {convertedResult.compiledMarkdown}
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <VisionButton variant="secondary" onClick={() => setConvertedResult(null)}>
                    Limpiar
                  </VisionButton>
                  <VisionButton
                    variant="primary"
                    onClick={handleSaveToVault}
                    disabled={isSaving}
                    className="flex items-center gap-1.5"
                  >
                    {isSaving ? (
                      <RotateCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    )}
                    <span>Guardar en Bóveda Cloud (Postgres)</span>
                  </VisionButton>
                </div>
              </div>
            ) : (
              <div className="flex-1 min-h-[300px] border border-dashed border-glass-subtle rounded-xl flex flex-col items-center justify-center p-6 text-center text-glass-muted gap-2">
                <UploadCloud className="w-8 h-8 opacity-40 text-blue-400" />
                <p className="text-xs">
                  Aún no has procesado ningún documento. Carga un archivo o escribe contenido a la izquierda y presiona <b>Convertir</b>.
                </p>
                <div className="flex flex-wrap gap-1 justify-center max-w-xs text-[10px] text-glass-muted/80 mt-2">
                  <span>• Genera Frontmatter YAML</span>
                  <span>• Valida Taxonomía</span>
                  <span>• Calcula SHA-256</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mensajes de Alerta */}
        {errorMessage && (
          <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center gap-2 text-red-300">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>
    </VisionModal>
  );
};
