import { MetricsRepository } from './metrics.repository';
import { ProjectMetrics } from './metrics.dto';
import { ProjectsService } from '../projects/projects.service';

interface CachedMetrics {
  data: ProjectMetrics;
  cachedAt: number;
}

export class MetricsService {
  private static cache: Map<string, CachedMetrics> = new Map();
  private static readonly TTL_MS = 30 * 1000; // 30 segundos

  constructor(
    private readonly metricsRepository: MetricsRepository = new MetricsRepository(),
    private readonly projectsService: ProjectsService = new ProjectsService()
  ) {}

  async getProjectMetrics(userId: string, projectId: string): Promise<ProjectMetrics> {
    // 1. Validar existencia y propiedad del proyecto
    await this.projectsService.findById(userId, projectId);

    // 2. Verificar caché en memoria
    const cached = MetricsService.cache.get(projectId);
    const now = Date.now();

    if (cached && now - cached.cachedAt < MetricsService.TTL_MS) {
      return cached.data;
    }

    // 3. Ejecutar SP en base de datos
    const freshMetrics = await this.metricsRepository.getProjectMetrics(projectId);

    // 4. Guardar en caché
    MetricsService.cache.set(projectId, {
      data: freshMetrics,
      cachedAt: now,
    });

    return freshMetrics;
  }

  static invalidateCache(projectId: string): void {
    MetricsService.cache.delete(projectId);
  }
}
