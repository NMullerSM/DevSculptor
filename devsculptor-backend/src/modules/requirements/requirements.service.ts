import { RequirementsRepository, Requirement } from './requirements.repository';
import { CreateRequirementDto, UpdateRequirementDto } from './requirements.dto';
import { ProjectsService } from '../projects/projects.service';
import { PaginationParams, PaginatedResult } from '../../shared/types/pagination';
import { ConflictError } from '../../shared/exceptions/ConflictError';
import { NotFoundError } from '../../shared/exceptions/NotFoundError';

export class RequirementsService {
  constructor(
    private readonly requirementsRepository: RequirementsRepository = new RequirementsRepository(),
    private readonly projectsService: ProjectsService = new ProjectsService()
  ) {}

  async create(
    userId: string,
    projectId: string,
    dto: CreateRequirementDto
  ): Promise<Requirement> {
    // 1. Validar propiedad y existencia del proyecto
    await this.projectsService.findById(userId, projectId);

    // 2. Validar unicidad del código dentro del proyecto
    const existing = await this.requirementsRepository.findByCodeAndProjectId(
      dto.code,
      projectId
    );
    if (existing) {
      throw new ConflictError(
        `Ya existe un requisito con el código '${dto.code}' en este proyecto.`
      );
    }

    return this.requirementsRepository.create({
      project_id: projectId,
      code: dto.code.toUpperCase().trim(),
      title: dto.title.trim(),
      description: dto.description?.trim() || null,
      type: dto.type,
      priority: dto.priority,
    });
  }

  async findAll(
    userId: string,
    projectId: string,
    type?: 'RF' | 'RNF',
    params?: PaginationParams
  ): Promise<PaginatedResult<Requirement>> {
    await this.projectsService.findById(userId, projectId);
    return this.requirementsRepository.findAllByProjectId(projectId, type, params);
  }

  async findById(userId: string, projectId: string, requirementId: string): Promise<Requirement> {
    await this.projectsService.findById(userId, projectId);
    const requirement = await this.requirementsRepository.findByIdAndProjectId(
      requirementId,
      projectId
    );
    if (!requirement) {
      throw new NotFoundError('Requisito');
    }
    return requirement;
  }

  async update(
    userId: string,
    projectId: string,
    requirementId: string,
    dto: UpdateRequirementDto
  ): Promise<Requirement> {
    const existingReq = await this.findById(userId, projectId, requirementId);

    if (dto.code && dto.code.toUpperCase() !== existingReq.code.toUpperCase()) {
      const codeConflict = await this.requirementsRepository.findByCodeAndProjectId(
        dto.code,
        projectId
      );
      if (codeConflict && codeConflict.id !== requirementId) {
        throw new ConflictError(
          `Ya existe otro requisito con el código '${dto.code}' en este proyecto.`
        );
      }
    }

    const updated = await this.requirementsRepository.update(requirementId, {
      code: dto.code ? dto.code.toUpperCase().trim() : undefined,
      title: dto.title?.trim(),
      description: dto.description !== undefined ? dto.description.trim() || null : undefined,
      type: dto.type,
      priority: dto.priority,
    });

    if (!updated) {
      throw new NotFoundError('Requisito');
    }

    return updated;
  }

  async delete(userId: string, projectId: string, requirementId: string): Promise<void> {
    await this.findById(userId, projectId, requirementId);
    await this.requirementsRepository.delete(requirementId);
  }
}
