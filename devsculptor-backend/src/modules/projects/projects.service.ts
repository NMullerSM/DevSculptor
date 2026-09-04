import { ProjectsRepository, Project } from './projects.repository';
import { CreateProjectDto, UpdateProjectDto } from './projects.dto';
import { PaginationParams, PaginatedResult } from '../../shared/types/pagination';
import { ConflictError } from '../../shared/exceptions/ConflictError';
import { NotFoundError } from '../../shared/exceptions/NotFoundError';

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
      architecture_style: dto.architecture_style?.trim() || null,
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
    });

    if (!updated) {
      throw new NotFoundError('Proyecto');
    }

    return updated;
  }

  async delete(userId: string, projectId: string): Promise<void> {
    // Validar existencia y propiedad
    await this.findById(userId, projectId);
    await this.projectsRepository.delete(projectId);
  }
}
