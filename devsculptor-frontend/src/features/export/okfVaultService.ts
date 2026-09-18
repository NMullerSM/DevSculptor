import JSZip from 'jszip';
import {
  ProcessedOkfDocument,
  processProjectOkfVault,
  OkfProcessorInput,
  OkfFreshnessStatus,
} from './okfDocumentProcessor';
import { requirementsService } from '@/services/requirements.service';
import { decisionsService } from '@/services/decisions.service';
import { canvasService } from '@/services/canvas.service';
import { useProjectStore } from '@/stores/useProjectStore';
import { useCanvasStore } from '@/stores/useCanvasStore';
import { SqlDialect } from '@/features/canvas/scriptGenerators';

export interface VaultSummary {
  totalDocuments: number;
  freshDocuments: number;
  staleDocuments: number;
  driftDocuments: number;
  freshnessScore: number; // 0 - 100%
  categories: {
    documentation: number;
    database: number;
    skills: number;
    context: number;
  };
}

const VAULT_SNAPSHOT_PREFIX = 'devsculptor_vault_snapshot_';

export const okfVaultService = {
  /**
   * Compila el árbol completo de la bóveda documental para el proyecto activo.
   */
  async compileVault(
    projectId: string,
    dialect: SqlDialect = 'postgres',
    verifier?: string
  ): Promise<ProcessedOkfDocument[]> {
    const { activeProject, metrics } = useProjectStore.getState();

    if (!activeProject || activeProject.id !== projectId) {
      throw new Error('Proyecto no seleccionado o no coincide con la bóveda solicitada.');
    }

    // 1. Obtener datos en paralelo
    const [requirements, decisions, canvasEntities] = await Promise.all([
      requirementsService.getAllByProject(projectId).catch(() => []),
      decisionsService.getAllByProject(projectId).catch(() => []),
      // Priorizar entidades del canvasStore si están activas y editadas en memoria
      useCanvasStore.getState().entities.length > 0
        ? Promise.resolve(useCanvasStore.getState().entities)
        : canvasService.getAllByProject(projectId).catch(() => []),
    ]);

    // 2. Procesar con el motor determinista OKF
    const input: OkfProcessorInput = {
      project: activeProject,
      requirements,
      entities: canvasEntities,
      decisions,
      metrics,
      sqlDialect: dialect,
      customVerifier: verifier || activeProject.lead_architect || undefined,
    };

    const documents = await processProjectOkfVault(input);

    // 3. Evaluar Freshness comparando con el snapshot previo guardado
    const updatedDocuments = this.evaluateFreshnessWithSnapshot(projectId, documents);

    return updatedDocuments;
  },

  /**
   * Compara los hashes de los documentos con el snapshot previo para detectar Architectural Drift.
   */
  evaluateFreshnessWithSnapshot(
    projectId: string,
    currentDocs: ProcessedOkfDocument[]
  ): ProcessedOkfDocument[] {
    try {
      const raw = localStorage.getItem(`${VAULT_SNAPSHOT_PREFIX}${projectId}`);
      if (!raw) {
        // Primera vez: todos se consideran FRESH y se guarda el snapshot
        this.saveVaultSnapshot(projectId, currentDocs);
        return currentDocs;
      }

      const snapshot: Record<string, string> = JSON.parse(raw);

      return currentDocs.map((doc) => {
        const previousHash = snapshot[doc.path];
        let status: OkfFreshnessStatus = 'FRESH';

        if (!previousHash) {
          // Documento nuevo
          status = 'FRESH';
        } else if (previousHash !== doc.stateHash) {
          // El contenido del recurso cambió desde el último snapshot ratificado
          status = 'STALE';
        }

        return {
          ...doc,
          freshnessStatus: status,
          header: {
            ...doc.header,
            freshness: {
              ...doc.header.freshness,
              status,
            },
          },
        };
      });
    } catch {
      return currentDocs;
    }
  },

  /**
   * Guarda un snapshot de los hashes actuales para referencia de Freshness.
   */
  saveVaultSnapshot(projectId: string, documents: ProcessedOkfDocument[]): void {
    try {
      const snapshot: Record<string, string> = {};
      documents.forEach((doc) => {
        snapshot[doc.path] = doc.stateHash;
      });
      localStorage.setItem(`${VAULT_SNAPSHOT_PREFIX}${projectId}`, JSON.stringify(snapshot));
    } catch {
      // Ignorar si localStorage está restringido
    }
  },

  /**
   * Calcula el resumen cuantitativo de la bóveda y su índice de vigencia.
   */
  calculateSummary(documents: ProcessedOkfDocument[]): VaultSummary {
    const total = documents.length;
    let fresh = 0;
    let stale = 0;
    let drift = 0;

    const categories = {
      documentation: 0,
      database: 0,
      skills: 0,
      context: 0,
    };

    documents.forEach((d) => {
      if (d.freshnessStatus === 'FRESH') fresh++;
      else if (d.freshnessStatus === 'STALE') stale++;
      else if (d.freshnessStatus === 'DRIFT_DETECTED') drift++;

      if (categories[d.category] !== undefined) {
        categories[d.category]++;
      }
    });

    const freshnessScore = total > 0 ? Math.round((fresh / total) * 100) : 100;

    return {
      totalDocuments: total,
      freshDocuments: fresh,
      staleDocuments: stale,
      driftDocuments: drift,
      freshnessScore,
      categories,
    };
  },

  /**
   * Descarga un archivo individual de forma inmediata (Requisito RF11).
   */
  downloadSingleDocument(doc: ProcessedOkfDocument): void {
    const blob = new Blob([doc.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = doc.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  /**
   * Genera el archivo ZIP comprimido en memoria mediante JSZip (< 3s).
   */
  async generateZipBundle(
    documents: ProcessedOkfDocument[],
    _projectName?: string,
    onProgress?: (percent: number) => void
  ): Promise<Blob> {
    const zip = new JSZip();

    if (onProgress) onProgress(10);

    // Mapear cada documento a la estructura de carpetas
    documents.forEach((doc) => {
      zip.file(doc.path, doc.content);
    });

    if (onProgress) onProgress(40);

    const blob = await zip.generateAsync(
      {
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 },
      },
      (metadata) => {
        if (onProgress) {
          const mapped = Math.round(40 + (metadata.percent * 0.6));
          onProgress(mapped);
        }
      }
    );

    return blob;
  },

  /**
   * Dispara la descarga del paquete ZIP en el navegador del usuario.
   */
  downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },
};
