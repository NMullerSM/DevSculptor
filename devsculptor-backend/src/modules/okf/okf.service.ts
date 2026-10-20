import crypto from 'crypto';
import { OkfRepository, OkfDocumentRecord, VaultStatsRecord } from './okf.repository';
import { ProjectsService } from '../projects/projects.service';
import { AiService } from '../ai/ai.service';
import { AiProviderFactory } from '../ai/providers/provider.factory';
import {
  SyncVaultDto,
  ConvertDocumentDto,
  AiConvertDocumentDto,
  QueryOkfDocsDto,
  VerifyDocumentDto,
} from './okf.dto';
import { NotFoundError } from '../../shared/exceptions/NotFoundError';
import { logger } from '../../config/logger';

export interface ConvertedOkfResult {
  documentId: string;
  documentType: string;
  canonicalPath: string;
  title: string;
  tags: string[];
  contentPreview: string;
  stateHash: string;
  compiledMarkdown: string;
  freshnessStatus: 'FRESH' | 'STALE' | 'DRIFT_DETECTED';
}

export class OkfService {
  constructor(
    private readonly okfRepository: OkfRepository = new OkfRepository(),
    private readonly projectsService: ProjectsService = new ProjectsService(),
    private readonly aiService: AiService = new AiService()
  ) {}

  /**
   * Sincroniza en base de datos la bóveda documental completa de un proyecto.
   */
  async syncVault(
    userId: string,
    projectId: string,
    dto: SyncVaultDto
  ): Promise<{ syncedCount: number; documents: OkfDocumentRecord[]; stats: VaultStatsRecord }> {
    // 1. Validar propiedad del proyecto (Aislamiento Horizontal - Pilar 7)
    await this.projectsService.findById(userId, projectId);

    logger.info(
      { userId, projectId, docCount: dto.documents.length },
      'Iniciando sincronización de bóveda OKF en base de datos'
    );

    // 2. Persistir documentos mediante bulk upsert
    const formattedDocs = dto.documents.map((d) => ({
      document_id: d.documentId,
      document_type: d.documentType,
      canonical_path: d.canonicalPath,
      title: d.title,
      tags: d.tags,
      content_preview: d.contentPreview || null,
      content_markdown: d.contentMarkdown || null,
      state_hash: d.stateHash,
      freshness_status: d.freshnessStatus,
      storage_path: d.storagePath || null,
      verified_by: d.verifiedBy || null,
    }));

    const synced = await this.okfRepository.bulkUpsert(projectId, formattedDocs);
    const stats = await this.okfRepository.getVaultStats(projectId);

    logger.info(
      { userId, projectId, syncedCount: synced.length, stats },
      'Bóveda OKF sincronizada exitosamente en base de datos'
    );

    return {
      syncedCount: synced.length,
      documents: synced,
      stats,
    };
  }

  /**
   * Conversión mecánica determinista de texto o documento externo a formato canónico OKF.
   */
  async convertMechanically(
    userId: string,
    projectId: string,
    dto: ConvertDocumentDto
  ): Promise<ConvertedOkfResult> {
    await this.projectsService.findById(userId, projectId);

    const title = dto.title?.trim() || this.extractTitleFromContent(dto.rawContent);
    const slug = this.generateSlug(title);
    const docId = `DOC-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    let canonicalPath: string;
    if (dto.targetCategory === 'templates') {
      canonicalPath = `00-templates/${slug}.md`;
    } else if (dto.targetCategory === 'patterns') {
      canonicalPath = `03-architecture-adrs/patterns/${slug}.md`;
    } else {
      canonicalPath = `06-knowledge-base/${slug}.md`;
    }

    // Normalizar tags asegurando namespaces recomendados si no existen
    const tags = this.normalizeTags(dto.tags);

    // Limpiar frontmatter previo si el usuario pegó un markdown existente
    const cleanedContent = this.stripExistingFrontmatter(dto.rawContent);

    // Calcular hash del contenido en bruto
    const stateHash = crypto.createHash('sha256').update(cleanedContent.trim()).digest('hex');

    // Ensamblar Frontmatter canónico OKF
    const frontmatter = [
      '---',
      `id: "${docId}"`,
      `title: "${title.replace(/"/g, '\\"')}"`,
      `type: "${dto.documentType}"`,
      `canonical_path: "${canonicalPath}"`,
      `tags: [${tags.map((t) => `"${t}"`).join(', ')}]`,
      `state_hash: "${stateHash}"`,
      `verified_by: "${(dto.author || 'Architect').replace(/"/g, '\\"')}"`,
      `created_at: "${new Date().toISOString()}"`,
      '---',
      '',
    ].join('\n');

    const compiledMarkdown = `${frontmatter}${cleanedContent.trim()}\n`;
    const contentPreview = cleanedContent.trim().slice(0, 300);

    return {
      documentId: docId,
      documentType: dto.documentType,
      canonicalPath,
      title,
      tags,
      contentPreview,
      stateHash,
      compiledMarkdown,
      freshnessStatus: 'FRESH',
    };
  }

  /**
   * Conversión inteligente asistida por IA para papers de arquitectura y directrices técnicas.
   */
  async convertWithAi(
    userId: string,
    projectId: string,
    dto: AiConvertDocumentDto
  ): Promise<ConvertedOkfResult> {
    const project = await this.projectsService.findById(userId, projectId);
    const provider = AiProviderFactory.getProvider();
    const context = await this.aiService.getProjectContext(userId, projectId);

    logger.info(
      { userId, projectId, provider: provider.name },
      'Iniciando conversión asistida por IA a formato OKF'
    );

    const promptMessage = [
      'Actúa como Arquitecto de Software Principal y Especialista en Gobernanza Técnica OKF.',
      'Analiza el siguiente documento/paper técnico y transfórmalo en una especificación estructurada para la base de conocimiento.',
      '',
      `PROYECTO ACTUAL: ${project.name} (${project.architecture_style || 'Monolito Modular'})`,
      dto.contextHint ? `CONTEXTO ADICIONAL DEL ARQUITECTO: ${dto.contextHint}` : '',
      `CATEGORÍA DESTINO: ${dto.targetCategory}`,
      dto.suggestedTags && dto.suggestedTags.length > 0
        ? `TAGS SUGERIDOS: ${dto.suggestedTags.join(', ')}`
        : '',
      '',
      'DOCUMENTO FUENTE A CONVERTIR:',
      '```',
      dto.rawContent.slice(0, 15000), // límite seguro de contexto
      '```',
      '',
      'INSTRUCCIONES DE CONVERSIÓN:',
      '1. Genera un título técnico conciso y profesional.',
      '2. Asigna tags semánticos usando obligatoriamente namespaces de ontología:',
      '   - arch:<monolith|microservices|hexagonal|clean-architecture|event-driven>',
      '   - stack:<tecnología>',
      '   - pattern:<patrón>',
      '   - scale:<mvp|high-concurrency|distributed|acid>',
      '   - domain:<fintech|ecommerce|governance|etc>',
      '3. Redacta el contenido en Markdown técnico estructurado: Resumen Ejecutivo, Principios Clave, Aplicabilidad en el Proyecto, Compromisos (Trade-offs) y Referencias.',
      '4. Responde en formato JSON estricto con la siguiente estructura:',
      '{"title": "...", "tags": ["arch:...", "stack:..."], "summary": "...", "structuredMarkdown": "..."}',
    ].join('\n');

    try {
      const aiResponse = await provider.generateChat(
        [{ role: 'user', content: promptMessage }],
        context,
        { temperature: 0.2 }
      );

      // Intentar extraer el JSON del contenido de la respuesta
      const parsed = this.parseAiJsonResponse(aiResponse.content);
      const title = parsed.title || this.extractTitleFromContent(dto.rawContent);
      const tags = this.normalizeTags(
        parsed.tags && parsed.tags.length > 0 ? parsed.tags : dto.suggestedTags || []
      );
      const slug = this.generateSlug(title);
      const docId = `DOC-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

      let canonicalPath: string;
      if (dto.targetCategory === 'templates') {
        canonicalPath = `00-templates/${slug}.md`;
      } else if (dto.targetCategory === 'patterns') {
        canonicalPath = `03-architecture-adrs/patterns/${slug}.md`;
      } else {
        canonicalPath = `06-knowledge-base/${slug}.md`;
      }

      const bodyContent = parsed.structuredMarkdown || dto.rawContent;
      const stateHash = crypto.createHash('sha256').update(bodyContent.trim()).digest('hex');

      const frontmatter = [
        '---',
        `id: "${docId}"`,
        `title: "${title.replace(/"/g, '\\"')}"`,
        `type: "${dto.targetCategory === 'patterns' ? 'ARCHITECTURE_PATTERN' : 'KNOWLEDGE_BASE'}"`,
        `canonical_path: "${canonicalPath}"`,
        `tags: [${tags.map((t) => `"${t}"`).join(', ')}]`,
        `state_hash: "${stateHash}"`,
        `verified_by: "AI Assistant (Pending Human Ratification)"`,
        `created_at: "${new Date().toISOString()}"`,
        '---',
        '',
      ].join('\n');

      const compiledMarkdown = `${frontmatter}${bodyContent.trim()}\n`;

      return {
        documentId: docId,
        documentType: dto.targetCategory === 'patterns' ? 'ARCHITECTURE_PATTERN' : 'KNOWLEDGE_BASE',
        canonicalPath,
        title,
        tags,
        contentPreview: (parsed.summary || bodyContent).slice(0, 300),
        stateHash,
        compiledMarkdown,
        freshnessStatus: 'FRESH',
      };
    } catch (error) {
      logger.warn(
        { err: error, userId, projectId },
        'Fallo en conversión IA; aplicando fallback a conversión mecánica'
      );
      return this.convertMechanically(userId, projectId, {
        rawContent: dto.rawContent,
        targetCategory: dto.targetCategory,
        tags: dto.suggestedTags || [],
        documentType: dto.targetCategory === 'patterns' ? 'ARCHITECTURE_PATTERN' : 'KNOWLEDGE_BASE',
      });
    }
  }

  /**
   * Obtiene la lista de documentos registrados en la base de datos para el proyecto.
   */
  async getDocuments(
    userId: string,
    projectId: string,
    query?: QueryOkfDocsDto
  ): Promise<OkfDocumentRecord[]> {
    await this.projectsService.findById(userId, projectId);
    return this.okfRepository.findByProject(projectId, query);
  }

  /**
   * Obtiene las estadísticas de frescura de la bóveda del proyecto.
   */
  async getVaultStats(userId: string, projectId: string): Promise<VaultStatsRecord> {
    await this.projectsService.findById(userId, projectId);
    return this.okfRepository.getVaultStats(projectId);
  }

  /**
   * Actualiza el estado de verificación humana del documento.
   */
  async verifyDocument(
    userId: string,
    projectId: string,
    dto: VerifyDocumentDto
  ): Promise<OkfDocumentRecord> {
    await this.projectsService.findById(userId, projectId);

    const updated = await this.okfRepository.verifyDocument(
      projectId,
      dto.canonicalPath,
      dto.verifiedBy,
      dto.freshnessStatus
    );

    if (!updated) {
      throw new NotFoundError(
        `Documento con ruta canónica '${dto.canonicalPath}' no encontrado en el proyecto`
      );
    }

    logger.info(
      { userId, projectId, canonicalPath: dto.canonicalPath, verifiedBy: dto.verifiedBy },
      'Documento OKF verificado por arquitecto'
    );

    return updated;
  }

  // --- Helpers de Formateo y Parsing ---

  private extractTitleFromContent(content: string): string {
    const firstHeader = content.match(/^#\s+(.+)$/m);
    if (firstHeader && firstHeader[1]) {
      return firstHeader[1].trim();
    }
    const firstLine = content.split('\n').find((l) => l.trim().length > 0);
    return firstLine ? firstLine.trim().slice(0, 80) : 'Documento Técnico OKF';
  }

  private generateSlug(text: string): string {
    const clean = text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    return clean || `doc-${Date.now()}`;
  }

  private normalizeTags(rawTags: string[]): string[] {
    const defaultTagSet = new Set<string>();
    for (const tag of rawTags) {
      const trimmed = tag.trim().toLowerCase();
      if (trimmed.length > 0) {
        defaultTagSet.add(trimmed);
      }
    }
    if (defaultTagSet.size === 0) {
      defaultTagSet.add('arch:general');
      defaultTagSet.add('scale:standard');
    }
    return Array.from(defaultTagSet);
  }

  private stripExistingFrontmatter(content: string): string {
    if (content.startsWith('---')) {
      const closingIndex = content.indexOf('---', 3);
      if (closingIndex !== -1) {
        return content.slice(closingIndex + 3).trim();
      }
    }
    return content;
  }

  private parseAiJsonResponse(aiContent: string): {
    title?: string;
    tags?: string[];
    summary?: string;
    structuredMarkdown?: string;
  } {
    try {
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch {
      // Ignorar si el modelo no devolvió JSON puro
    }
    return {};
  }
}
