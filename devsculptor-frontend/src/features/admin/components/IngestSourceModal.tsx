import React, { useState, useRef } from 'react';
import { VisionModal } from '@/components/ui/VisionModal';
import { useAdminStore } from '@/stores/useAdminStore';

interface IngestSourceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const IngestSourceModal: React.FC<IngestSourceModalProps> = ({ isOpen, onClose }) => {
  const { createVaultFile, isSaving } = useAdminStore();

  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [canonicalName, setCanonicalName] = useState('');
  const [previewContent, setPreviewContent] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const sanitizeFilename = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const processFile = async (selectedFile: File) => {
    setIsProcessing(true);
    setError(null);
    setFile(selectedFile);

    try {
      const ext = selectedFile.name.split('.').pop()?.toLowerCase() || '';
      const baseName = selectedFile.name.substring(0, selectedFile.name.lastIndexOf('.')) || selectedFile.name;
      const cleanSlug = sanitizeFilename(baseName);
      const generatedFilename = `${cleanSlug}.md`;

      setCanonicalName(generatedFilename);
      setTitle(baseName.replace(/[-_]/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()));
      setDescription(`Fuente técnica ingestada desde ${selectedFile.name} (${(selectedFile.size / 1024).toFixed(1)} KB)`);

      let extractedBody = '';

      if (ext === 'md' || ext === 'txt' || ext === 'sql' || ext === 'json' || ext === 'yaml' || ext === 'yml') {
        extractedBody = await selectedFile.text();
      } else {
        // Para PDF o documentos binarios, realizamos extracción asistida
        // Leer texto recuperable o estructurar como artefacto de referencia de arquitectura
        const buffer = await selectedFile.arrayBuffer();
        const decoder = new TextDecoder('utf-8', { fatal: false });
        const rawText = decoder.decode(buffer);

        // Extraer cadenas legibles de al menos 4 caracteres
        const readableTokens = rawText.match(/[\x20-\x7E\xA0-\xFF\n\r\t]{4,}/g) || [];
        const filteredTokens = readableTokens
          .filter((t) => !t.startsWith('%PDF') && !t.includes('/Filter') && !t.includes('/Length') && !t.includes('endobj'))
          .slice(0, 150)
          .join('\n')
          .trim();

        extractedBody = `## 1. Metadatos de la Fuente Ingestada
- **Archivo de Origen:** \`${selectedFile.name}\`
- **MIME Type:** \`${selectedFile.type || 'application/octet-stream'}\`
- **Tamaño:** ${(selectedFile.size / 1024).toFixed(2)} KB
- **Formato Nativo:** Documento Binario / PDF Ingestado

---

## 2. Especificación y Contenido de Arquitectura Extraído
${
  filteredTokens.length > 50
    ? `\`\`\`text\n${filteredTokens}\n\`\`\``
    : `*Documento ingestrado formalmente como referencia de arquitectura para el árbol OKF general. Utilice el editor in-situ para completar detalles adicionales si es necesario.*`
}

---

## 3. Directivas de Integración con el Modelo
1. Los componentes descritos en esta fuente deben correlacionarse con las entidades del Canvas ERD.
2. Cualquier decisión arquitectónica derivada debe formalizarse en un ADR correspondiente en \`_global/templates/architecture/\`.
`;
      }

      // Estructurar con YAML Frontmatter canónico OKF
      const frontmatter = `---
template_id: "TPL-SRC-${cleanSlug.toUpperCase()}"
canonical_path: "_global/sources/${generatedFilename}"
document_type: "TECHNICAL_SOURCE_REFERENCE"
standard: "Enterprise Technical Architecture"
title: "${baseName.replace(/"/g, '\\"')}"
source_filename: "${selectedFile.name}"
source_size_bytes: ${selectedFile.size}
source_mime: "${selectedFile.type || 'application/octet-stream'}"
ingested_at: "${new Date().toISOString()}"
tags:
  - "sources"
  - "architecture"
  - "technical-spec"
  - "global-okf"
---`;

      const fullDocument = `${frontmatter}\n\n# Fuente Técnica: ${baseName}\n\n${extractedBody}`;
      setPreviewContent(fullDocument);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al procesar el archivo');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!previewContent) {
      setError('No hay contenido procesado para ingestar.');
      return;
    }
    if (!canonicalName.trim()) {
      setError('El nombre del archivo canónico es obligatorio.');
      return;
    }

    const fullPath = `_global/sources/${canonicalName.trim().replace(/^\/+/, '')}`;

    try {
      await createVaultFile({
        title: title.trim() || canonicalName,
        path: fullPath,
        category: 'sources',
        description: description.trim() || undefined,
        content: previewContent,
      });
      onClose();
      // Reset
      setFile(null);
      setTitle('');
      setDescription('');
      setCanonicalName('');
      setPreviewContent('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al ingestar la fuente en la bóveda.');
    }
  };

  return (
    <VisionModal
      isOpen={isOpen}
      onClose={onClose}
      title="Motor Automatizado de Ingestión de Fuentes Técnicas"
      description="Ingesta documentos PDF, Markdown, Word o esquemas de arquitectura convirtiéndolos automáticamente a especificaciones canónicas OKF con Frontmatter en _global/sources/."
      icon="upload_file"
      size="xl"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 text-xs">
        {error && (
          <div className="p-2.5 rounded-[6px] bg-rose-500/10 border border-rose-500/20 text-rose-400 font-mono text-[11px] flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">error</span>
            <span>{error}</span>
          </div>
        )}

        {/* Zona de Carga / Drag and Drop */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
            dragActive
              ? 'border-cyan-400 bg-cyan-500/10 scale-[1.01]'
              : 'border-white/10 hover:border-cyan-500/40 bg-black/20 hover:bg-black/30'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".md,.txt,.pdf,.docx,.doc,.json,.yaml,.sql"
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="w-10 h-10 rounded-full bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-300">
            <span className="material-symbols-outlined text-xl">
              {isProcessing ? 'progress_activity' : file ? 'task_alt' : 'cloud_upload'}
            </span>
          </div>
          <div className="flex flex-col items-center">
            <span className="font-semibold text-primary text-xs">
              {file ? `Archivo seleccionado: ${file.name}` : 'Arrastra un archivo aquí o haz clic para explorar'}
            </span>
            <span className="text-[10.5px] text-muted font-mono mt-0.5">
              Soporta Markdown (.md), PDF (.pdf), Word (.docx), SQL y texto plano
            </span>
          </div>
        </div>

        {file && (
          <div className="space-y-3 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-muted font-mono font-medium">Título del Documento</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="vision-btn !justify-start bg-black/20 dark:bg-white/[0.05] border border-glass-subtle py-1.5 px-2.5 text-xs text-primary rounded-[6px] outline-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-muted font-mono font-medium">Nombre Canónico Destino</label>
                <input
                  type="text"
                  value={canonicalName}
                  onChange={(e) => setCanonicalName(e.target.value)}
                  className="vision-btn !justify-start bg-black/20 dark:bg-white/[0.05] border border-glass-subtle py-1.5 px-2.5 text-xs text-primary rounded-[6px] outline-none font-mono"
                />
              </div>
            </div>

            <div className="p-2 rounded-[6px] bg-cyan-500/10 border border-cyan-500/20 font-mono text-[11px] text-cyan-300 flex items-center gap-2">
              <span className="material-symbols-outlined text-xs">account_tree</span>
              <span>Rama Destino en Árbol General: <strong>_global/sources/{canonicalName}</strong></span>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-muted font-mono font-medium">Vista Previa OKF Generada Automáticamente</label>
              <textarea
                rows={8}
                value={previewContent}
                onChange={(e) => setPreviewContent(e.target.value)}
                className="w-full bg-black/40 border border-glass-subtle rounded-[6px] p-2.5 font-mono text-[11px] text-slate-200 outline-none resize-y"
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-glass-subtle">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving || isProcessing}
            className="vision-btn py-1.5 px-3"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={!file || isSaving || isProcessing}
            className="vision-btn vision-btn-primary py-1.5 px-4 flex items-center gap-1.5 !bg-gradient-to-r !from-cyan-600 !to-indigo-600"
          >
            {isSaving ? (
              <>
                <span className="material-symbols-outlined text-xs animate-spin">progress_activity</span>
                <span>Ingestando en Bóveda...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-xs">publish</span>
                <span>Ingestar a _global/sources/</span>
              </>
            )}
          </button>
        </div>
      </form>
    </VisionModal>
  );
};
