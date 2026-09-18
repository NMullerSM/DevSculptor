import { ProjectsRepository, Project } from './projects.repository';
import { CreateProjectDto, UpdateProjectDto } from './projects.dto';
import { PaginationParams, PaginatedResult } from '../../shared/types/pagination';
import { ConflictError } from '../../shared/exceptions/ConflictError';
import { NotFoundError } from '../../shared/exceptions/NotFoundError';
import { getPool } from '../../config/database';
import { logger } from '../../config/logger';

export class ProjectsService {
  constructor(
    private readonly projectsRepository: ProjectsRepository = new ProjectsRepository()
  ) {}

  async create(userId: string, dto: CreateProjectDto): Promise<Project> {
    const existing = await this.projectsRepository.findByNameAndUserId(dto.name, userId);
    if (existing) {
      throw new ConflictError('Ya posee un proyecto registrado con ese nombre.');
    }

    return this.projectsRepository.create({
      user_id: userId,
      name: dto.name.trim(),
      description: dto.description?.trim() || null,
      architecture_style: dto.architecture_style?.trim() || 'Por Definir / En Evaluación',
      organization: dto.organization?.trim() || null,
      lead_architect: dto.lead_architect?.trim() || null,
    });
  }

  async findAll(userId: string, params?: PaginationParams): Promise<PaginatedResult<Project>> {
    return this.projectsRepository.findAllByUserId(userId, params);
  }

  async findById(userId: string, projectId: string): Promise<Project> {
    const project = await this.projectsRepository.findByIdAndUserId(projectId, userId);
    if (!project) {
      throw new NotFoundError('Proyecto');
    }
    return project;
  }

  async update(userId: string, projectId: string, dto: UpdateProjectDto): Promise<Project> {
    // Validar existencia y propiedad del proyecto
    const project = await this.findById(userId, projectId);

    // Si se actualiza el nombre, validar unicidad para este usuario
    if (dto.name && dto.name.toLowerCase() !== project.name.toLowerCase()) {
      const existing = await this.projectsRepository.findByNameAndUserId(dto.name, userId);
      if (existing && existing.id !== projectId) {
        throw new ConflictError('Ya posee otro proyecto con ese nombre.');
      }
    }

    const updated = await this.projectsRepository.update(projectId, {
      name: dto.name?.trim(),
      description: dto.description !== undefined ? dto.description.trim() || null : undefined,
      architecture_style:
        dto.architecture_style !== undefined ? dto.architecture_style.trim() || null : undefined,
      organization: dto.organization !== undefined ? dto.organization.trim() || null : undefined,
      lead_architect:
        dto.lead_architect !== undefined ? dto.lead_architect.trim() || null : undefined,
    });

    if (!updated) {
      throw new NotFoundError('Proyecto');
    }

    return updated;
  }

  async delete(userId: string, projectId: string): Promise<void> {
    // Validar existencia y propiedad
    await this.findById(userId, projectId);

    const pool = getPool();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      // 1. Eliminar entidades del canvas mientras el proyecto todavía existe
      // (así cualquier trigger de auditoría inserta con project_id existente sin violar FK)
      await client.query('DELETE FROM canvas_entities WHERE project_id = $1', [projectId]);
      // 2. Limpiar logs de auditoría huérfanos del proyecto
      await client.query('DELETE FROM audit_logs WHERE project_id = $1', [projectId]);
      // 3. Eliminar requisitos y decisiones
      await client.query('DELETE FROM requirements WHERE project_id = $1', [projectId]);
      await client.query('DELETE FROM architecture_decisions WHERE project_id = $1', [projectId]);
      // 4. Eliminar el proyecto raíz
      await client.query('DELETE FROM projects WHERE id = $1', [projectId]);
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      logger.error({ err, projectId, userId }, 'Fallo al eliminar proyecto en cascada');
      throw err;
    } finally {
      client.release();
    }
  }
}
