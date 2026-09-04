import { CanvasRepository, CanvasEntity, AuditLog } from './canvas.repository';
import { CreateCanvasEntityDto, UpdateCanvasEntityDto } from './canvas.dto';
import { ProjectsService } from '../projects/projects.service';
import { PaginationParams, PaginatedResult } from '../../shared/types/pagination';
import { ConflictError } from '../../shared/exceptions/ConflictError';
import { NotFoundError } from '../../shared/exceptions/NotFoundError';

export class CanvasService {
  constructor(
    private readonly canvasRepository: CanvasRepository = new CanvasRepository(),
    private readonly projectsService: ProjectsService = new ProjectsService()
  ) {}

  async create(
    userId: string,
    projectId: string,
    dto: CreateCanvasEntityDto
  ): Promise<CanvasEntity> {
    // 1. Validar propiedad del proyecto
    await this.projectsService.findById(userId, projectId);

    // 2. Validar nombre de tabla único en el proyecto
    const existing = await this.canvasRepository.findByTableNameAndProjectId(
      dto.table_name,
      projectId
    );
    if (existing) {
      throw new ConflictError(
        `Ya existe una tabla con el nombre '${dto.table_name}' en este proyecto.`
      );
    }

    // 3. Ejecutar dentro de transacción configurando app.current_user_id para el trigger
    return this.canvasRepository.withTransaction(async (client) => {
      await this.canvasRepository.setSessionUserId(client, userId);
      return this.canvasRepository.create(
        {
          project_id: projectId,
          table_name: dto.table_name.toLowerCase().trim(),
          columns_json: dto.columns_json,
          position_x: dto.position_x,
          position_y: dto.position_y,
        },
        client
      );
    });
  }

  async findAll(userId: string, projectId: string): Promise<CanvasEntity[]> {
    await this.projectsService.findById(userId, projectId);
    return this.canvasRepository.findAllByProjectId(projectId);
  }

  async findById(userId: string, projectId: string, canvasId: string): Promise<CanvasEntity> {
    await this.projectsService.findById(userId, projectId);
    const entity = await this.canvasRepository.findByIdAndProjectId(canvasId, projectId);
    if (!entity) {
      throw new NotFoundError('Entidad de Canvas');
    }
    return entity;
  }

  async update(
    userId: string,
    projectId: string,
    canvasId: string,
    dto: UpdateCanvasEntityDto
  ): Promise<CanvasEntity> {
    const existing = await this.findById(userId, projectId, canvasId);

    if (
      dto.table_name &&
      dto.table_name.toLowerCase() !== existing.table_name.toLowerCase()
    ) {
      const conflict = await this.canvasRepository.findByTableNameAndProjectId(
        dto.table_name,
        projectId
      );
      if (conflict && conflict.id !== canvasId) {
        throw new ConflictError(
          `Ya existe otra tabla con el nombre '${dto.table_name}' en este proyecto.`
        );
      }
    }

    return this.canvasRepository.withTransaction(async (client) => {
      await this.canvasRepository.setSessionUserId(client, userId);
      const updated = await this.canvasRepository.update(
        canvasId,
        {
          table_name: dto.table_name ? dto.table_name.toLowerCase().trim() : undefined,
          columns_json: dto.columns_json,
          position_x: dto.position_x,
          position_y: dto.position_y,
        },
        client
      );

      if (!updated) {
        throw new NotFoundError('Entidad de Canvas');
      }

      return updated;
    });
  }

  async delete(userId: string, projectId: string, canvasId: string): Promise<void> {
    await this.findById(userId, projectId, canvasId);

    await this.canvasRepository.withTransaction(async (client) => {
      await this.canvasRepository.setSessionUserId(client, userId);
      await this.canvasRepository.delete(canvasId, client);
    });
  }

  async getAuditLogs(
    userId: string,
    projectId: string,
    params?: PaginationParams
  ): Promise<PaginatedResult<AuditLog>> {
    await this.projectsService.findById(userId, projectId);
    return this.canvasRepository.getAuditLogsByProject(projectId, params);
  }
}
