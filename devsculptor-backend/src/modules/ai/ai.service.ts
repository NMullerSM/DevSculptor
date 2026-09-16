import { getPool } from '../../config/database';
import { ProjectsService } from '../projects/projects.service';
import { AiProviderFactory } from './providers/provider.factory';
import { AiProjectContext, AiChatResult } from './providers/ai-provider.interface';
import { ChatRequestDto } from './ai.dto';
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
      `SELECT code, title, type, priority, description 
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
      `SELECT title, status, context, decision 
       FROM architecture_decisions 
       WHERE project_id = $1 
       ORDER BY created_at ASC`,
      [projectId]
    );

    const requirements = reqsResult.rows.map((r: { code: string; title: string; type: string; priority: string; description?: string | null }) => ({
      code: r.code,
      title: r.title,
      type: r.type,
      priority: r.priority,
      description: r.description || undefined,
    }));

    const entities = entitiesResult.rows.map((e: { table_name: string; columns_json: unknown }) => ({
      tableName: e.table_name,
      columns: Array.isArray(e.columns_json) ? e.columns_json : [],
    }));

    const decisions = decisionsResult.rows.map(
      (
        d: { title: string; status: string; context?: string | null; decision?: string | null },
        index: number
      ) => ({
        code: `ADR-${String(index + 1).padStart(3, '0')}`,
        title: d.title,
        status: d.status,
        context: d.context || undefined,
        decision: d.decision || undefined,
      })
    );

    return {
      projectName: project.name,
      projectDescription: project.description || undefined,
      architectureStyle: project.architecture_style || 'Monolito Modular Layered MVC',
      requirements,
      entities,
      decisions,
    };
  }

  /**
   * Ejecuta una consulta conversacional con el consultor de arquitectura.
   */
  public async chat(
    userId: string,
    projectId: string,
    dto: ChatRequestDto
  ): Promise<AiChatResult> {
    const context = await this.getProjectContext(userId, projectId);
    const provider = AiProviderFactory.getProvider();

    logger.info(
      { userId, projectId, provider: provider.name, messagesCount: dto.messages.length },
      'Invocando motor de consultoría IA'
    );

    return provider.generateChat(
      dto.messages.map((m) => ({
        role: m.role === 'assistant' ? 'model' : m.role,
        content: m.content,
      })),
      context,
      {
        temperature: dto.temperature,
        actionContext: dto.actionContext,
      }
    );
  }

  /**
   * Realiza una auditoría heurística / IA del esquema relacional y 3FN.
   */
  public async analyzeSchema(userId: string, projectId: string): Promise<AiChatResult> {
    const context = await this.getProjectContext(userId, projectId);
    const provider = AiProviderFactory.getProvider();

    logger.info(
      { userId, projectId, provider: provider.name, tablesCount: context.entities.length },
      'Invocando auditoría relacional con IA'
    );

    return provider.analyzeSchema(context);
  }

  /**
   * Sintetiza requisitos IEEE-830 a partir de una descripción o necesidad del usuario.
   */
  public async suggestRequirements(
    userId: string,
    projectId: string,
    prompt: string
  ): Promise<AiChatResult> {
    const context = await this.getProjectContext(userId, projectId);
    const provider = AiProviderFactory.getProvider();

    logger.info(
      { userId, projectId, provider: provider.name, promptLength: prompt.length },
      'Invocando síntesis de requisitos IEEE-830 con IA'
    );

    return provider.suggestRequirements(prompt, context);
  }
}
