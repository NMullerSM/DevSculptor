import { getPool } from '../../config/database';
import { ProjectsService } from '../projects/projects.service';
import { AiProviderFactory } from './providers/provider.factory';
import { AiProjectContext, AiChatResult, UserAiOverride } from './providers/ai-provider.interface';
import { ChatRequestDto } from './ai.dto';
import { sanitizeAiResponse } from './ai.validator';
import { logger } from '../../config/logger';

export class AiService {
  constructor(
    private readonly projectsService: ProjectsService = new ProjectsService()
  ) {}

  /**
   * Ensambla el contexto vivo del proyecto desde PostgreSQL con aislamiento estricto (Pilar 7).
   */
  public async getProjectContext(userId: string, projectId: string): Promise<AiProjectContext> {
    const pool = getPool();
    // 1. Validar propiedad y tenencia del proyecto
    const project = await this.projectsService.findById(userId, projectId);

    // 2. Obtener requisitos del proyecto
    const reqsResult = await pool.query(
      `SELECT code, title, type, priority, description, entity_relation 
       FROM requirements 
       WHERE project_id = $1 
       ORDER BY created_at ASC`,
      [projectId]
    );

    // 3. Obtener entidades del canvas
    const entitiesResult = await pool.query(
      `SELECT table_name, columns_json 
       FROM canvas_entities 
       WHERE project_id = $1 
       ORDER BY created_at ASC`,
      [projectId]
    );

    // 4. Obtener decisiones (ADRs)
    const decisionsResult = await pool.query(
      `SELECT code, title, status, context, decision 
       FROM architecture_decisions 
       WHERE project_id = $1 
       ORDER BY created_at ASC`,
      [projectId]
    );

    // 5. Obtener documentos de la bóveda OKF
    const okfResult = await pool.query(
      `SELECT canonical_path, title, document_type, content_preview, content_markdown
       FROM okf_documents
       WHERE project_id = $1
       ORDER BY canonical_path ASC
       LIMIT 40`,
      [projectId]
    );

    const requirements = reqsResult.rows.map((r: {
      code: string;
      title: string;
      type: string;
      priority: string;
      description?: string | null;
      entity_relation?: string[] | null;
    }) => ({
      code: r.code,
      title: r.title,
      type: r.type,
      priority: r.priority,
      description: r.description || undefined,
      entityRelation: Array.isArray(r.entity_relation) ? r.entity_relation : undefined,
    }));

    const entities = entitiesResult.rows.map((e: { table_name: string; columns_json: unknown }) => ({
      tableName: e.table_name,
      columns: Array.isArray(e.columns_json) ? e.columns_json : [],
    }));

    const decisions = decisionsResult.rows.map(
      (
        d: { code?: string | null; title: string; status: string; context?: string | null; decision?: string | null },
        index: number
      ) => ({
        code: d.code || `ADR-${String(index + 1).padStart(2, '0')}`,
        title: d.title,
        status: d.status,
        context: d.context || undefined,
        decision: d.decision || undefined,
      })
    );

    const okfDocuments = okfResult.rows.map((d: {
      canonical_path: string;
      title: string;
      document_type: string;
      content_preview?: string | null;
      content_markdown?: string | null;
    }) => ({
      canonicalPath: d.canonical_path,
      title: d.title,
      documentType: d.document_type,
      preview: d.content_preview || '',
      contentMarkdown: d.content_markdown || undefined,
    }));

    // Cálculo determinista de los siguientes códigos secuenciales
    const extractMax = (items: string[], prefix: string): number => {
      let max = 0;
      const regex = new RegExp(`^${prefix}-(\\d+)$`, 'i');
      for (const item of items) {
        const match = item?.match(regex);
        if (match) {
          const num = parseInt(match[1], 10);
          if (!isNaN(num) && num > max) max = num;
        }
      }
      return max;
    };

    const maxRf = extractMax(requirements.filter((r) => r.type === 'RF').map((r) => r.code), 'RF');
    const maxRnf = extractMax(requirements.filter((r) => r.type === 'RNF').map((r) => r.code), 'RNF');
    const maxAdr = extractMax(decisions.map((d) => d.code), 'ADR');

    return {
      projectName: project.name,
      projectDescription: project.description || undefined,
      organization: project.organization || undefined,
      leadArchitect: project.lead_architect || undefined,
      architectureStyle: project.architecture_style || 'Monolito Modular Layered MVC',
      requirements,
      entities,
      decisions,
      okfDocuments,
      nextRfCode: `RF-${String(maxRf + 1).padStart(2, '0')}`,
      nextRnfCode: `RNF-${String(maxRnf + 1).padStart(2, '0')}`,
      nextAdrCode: `ADR-${String(maxAdr + 1).padStart(2, '0')}`,
    };
  }

  /**
   * Ejecuta una consulta conversacional con el consultor de arquitectura.
   */
  public async chat(
    userId: string,
    projectId: string,
    dto: ChatRequestDto,
    override?: UserAiOverride
  ): Promise<AiChatResult> {
    const context = await this.getProjectContext(userId, projectId);
    const provider = AiProviderFactory.getProvider(override);

    logger.info(
      { userId, projectId, provider: provider.name, messagesCount: dto.messages.length },
      'Invocando motor de consultoría IA'
    );

    const rawResult = await provider.generateChat(
      dto.messages.map((m) => ({
        role: m.role === 'assistant' ? ('model' as const) : ('user' as const),
        content: m.content,
      })),
      context,
      {
        temperature: dto.temperature,
        actionContext: dto.actionContext,
      }
    );

    return sanitizeAiResponse(rawResult, context, dto.actionContext);
  }

  /**
   * Realiza una auditoría heurística / IA del esquema relacional y 3FN.
   */
  public async analyzeSchema(
    userId: string,
    projectId: string,
    override?: UserAiOverride
  ): Promise<AiChatResult> {
    const context = await this.getProjectContext(userId, projectId);
    const provider = AiProviderFactory.getProvider(override);

    logger.info(
      { userId, projectId, provider: provider.name, tablesCount: context.entities.length },
      'Invocando auditoría relacional con IA'
    );

    const rawResult = await provider.analyzeSchema(context);
    return sanitizeAiResponse(rawResult, context, 'canvas');
  }

  /**
   * Sintetiza requisitos IEEE-830 a partir de una descripción o necesidad del usuario.
   */
  public async suggestRequirements(
    userId: string,
    projectId: string,
    prompt: string,
    override?: UserAiOverride
  ): Promise<AiChatResult> {
    const context = await this.getProjectContext(userId, projectId);
    const provider = AiProviderFactory.getProvider(override);

    logger.info(
      { userId, projectId, provider: provider.name, promptLength: prompt.length },
      'Invocando síntesis de requisitos IEEE-830 con IA'
    );

    const rawResult = await provider.suggestRequirements(prompt, context);
    return sanitizeAiResponse(rawResult, context, 'requirements');
  }

  /**
   * Prueba rápida de conexión y latencia (Ping Test) para validar una API Key.
   */
  public async ping(override?: UserAiOverride): Promise<{
    success: boolean;
    latencyMs: number;
    provider: string;
    model: string;
    reply: string;
  }> {
    const start = Date.now();
    const provider = AiProviderFactory.getProvider(override);

    const dummyContext: AiProjectContext = {
      projectName: 'DevSculptor Ping Verification',
      architectureStyle: 'Layered MVC',
      requirements: [],
      entities: [],
      decisions: [],
    };

    const res = await provider.generateChat(
      [{ role: 'user', content: 'Ping de verificación. Responde únicamente con: "OK - Conectado"' }],
      dummyContext,
      { temperature: 0.1 }
    );

    const latencyMs = Date.now() - start;
    return {
      success: true,
      latencyMs,
      provider: res.provider,
      model: res.model,
      reply: res.content.trim(),
    };
  }
}
