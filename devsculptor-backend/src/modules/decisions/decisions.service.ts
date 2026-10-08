import { DecisionsRepository, ArchitectureDecision } from './decisions.repository';
import {
  CreateDecisionDto,
  UpdateDecisionDto,
  UpdateDecisionStatusDto,
  DecisionStatus,
} from './decisions.dto';
import { ProjectsService } from '../projects/projects.service';
import { PaginationParams, PaginatedResult } from '../../shared/types/pagination';
import { NotFoundError } from '../../shared/exceptions/NotFoundError';
import { logger } from '../../config/logger';

export class DecisionsService {
  constructor(
    private readonly decisionsRepository: DecisionsRepository = new DecisionsRepository(),
    private readonly projectsService: ProjectsService = new ProjectsService()
  ) {}

  async create(
    userId: string,
    projectId: string,
    dto: CreateDecisionDto
  ): Promise<ArchitectureDecision> {
    await this.projectsService.findById(userId, projectId);

    return this.decisionsRepository.create({
      project_id: projectId,
      title: dto.title.trim(),
      context: dto.context?.trim() || null,
      decision: dto.decision.trim(),
      status: dto.status || 'PROPOSED',
    });
  }

  async findAll(
    userId: string,
    projectId: string,
    status?: DecisionStatus,
    params?: PaginationParams
  ): Promise<PaginatedResult<ArchitectureDecision>> {
    await this.projectsService.findById(userId, projectId);
    return this.decisionsRepository.findAllByProjectId(projectId, status, params);
  }

  async findById(
    userId: string,
    projectId: string,
    decisionId: string
  ): Promise<ArchitectureDecision> {
    await this.projectsService.findById(userId, projectId);
    const decision = await this.decisionsRepository.findByIdAndProjectId(decisionId, projectId);
    if (!decision) {
      throw new NotFoundError('Decisión de Arquitectura');
    }
    return decision;
  }

  async update(
    userId: string,
    projectId: string,
    decisionId: string,
    dto: UpdateDecisionDto
  ): Promise<ArchitectureDecision> {
    await this.findById(userId, projectId, decisionId);

    const updated = await this.decisionsRepository.update(decisionId, {
      title: dto.title?.trim(),
      context: dto.context !== undefined ? dto.context.trim() || null : undefined,
      decision: dto.decision?.trim(),
    });

    if (!updated) {
      throw new NotFoundError('Decisión de Arquitectura');
    }

    return updated;
  }

  async updateStatus(
    userId: string,
    projectId: string,
    decisionId: string,
    dto: UpdateDecisionStatusDto
  ): Promise<ArchitectureDecision> {
    const existing = await this.findById(userId, projectId, decisionId);

    if (existing.status === dto.status) {
      return existing;
    }

    logger.info(
      { userId, projectId, decisionId, from: existing.status, to: dto.status },
      'Transición de estado de gobernanza ADR ratificada por arquitecto humano'
    );

    const updated = await this.decisionsRepository.update(decisionId, {
      status: dto.status,
    });

    if (!updated) {
      throw new NotFoundError('Decisión de Arquitectura');
    }

    return updated;
  }

  async delete(userId: string, projectId: string, decisionId: string): Promise<void> {
    await this.findById(userId, projectId, decisionId);
    await this.decisionsRepository.delete(decisionId);
  }
}
