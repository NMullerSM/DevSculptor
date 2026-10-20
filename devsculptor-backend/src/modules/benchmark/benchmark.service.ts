import { AiProviderFactory } from '../ai/providers/provider.factory';
import { sanitizeAiResponse } from '../ai/ai.validator';
import { UserAiOverride } from '../ai/providers/ai-provider.interface';
import { BENCHMARK_SCENARIOS } from './scenarios.data';
import { evaluateScenario } from './benchmark.evaluator';
import {
  BenchmarkScenario,
  EvaluationResult,
  BenchmarkSuiteSummary,
  RunBenchmarkDto,
} from './benchmark.types';
import { logger } from '../../config/logger';

export class BenchmarkService {
  /**
   * Ejecuta la evaluación de un escenario particular.
   */
  public async evaluateSingleScenario(
    scenario: BenchmarkScenario,
    override?: UserAiOverride
  ): Promise<EvaluationResult> {
    const provider = AiProviderFactory.getProvider(override);
    const start = Date.now();

    logger.info(
      { scenarioId: scenario.id, provider: provider.name },
      'Iniciando ejecución de benchmark de afinidad para escenario'
    );

    const messages = [
      {
        role: 'user' as const,
        content: scenario.userPrompt,
      },
    ];

    const rawResult = await provider.generateChat(
      messages,
      scenario.initialContext,
      {
        temperature: 0.1,
        actionContext: scenario.actionContext,
      }
    );

    const sanitizedResult = sanitizeAiResponse(
      rawResult,
      scenario.initialContext,
      scenario.actionContext
    );

    const executionTimeMs = Date.now() - start;
    const evaluation = evaluateScenario(sanitizedResult, scenario, executionTimeMs);

    logger.info(
      {
        scenarioId: scenario.id,
        affinityScore: evaluation.affinityScore,
        executionTimeMs,
      },
      'Evaluación de benchmark completada'
    );

    return evaluation;
  }

  /**
   * Ejecuta la suite completa de escenarios o los filtrados por ID.
   */
  public async runBenchmarkSuite(dto?: RunBenchmarkDto): Promise<BenchmarkSuiteSummary> {
    const scenariosToRun: BenchmarkScenario[] = [];

    if (dto?.customScenario) {
      scenariosToRun.push(dto.customScenario);
    } else if (dto?.scenarioId) {
      const match = BENCHMARK_SCENARIOS.find((s) => s.id === dto.scenarioId);
      if (!match) {
        throw new Error(`Escenario de benchmark con ID "${dto.scenarioId}" no encontrado.`);
      }
      scenariosToRun.push(match);
    } else {
      scenariosToRun.push(...BENCHMARK_SCENARIOS);
    }

    const results: EvaluationResult[] = [];
    for (const scn of scenariosToRun) {
      try {
        const res = await this.evaluateSingleScenario(scn, dto?.providerOverride);
        results.push(res);
      } catch (err: unknown) {
        logger.error({ err, scenarioId: scn.id }, 'Fallo al evaluar escenario de benchmark');
        results.push({
          scenarioId: scn.id,
          scenarioName: scn.name,
          provider: dto?.providerOverride?.provider || 'default',
          model: dto?.providerOverride?.model || 'unknown',
          executionTimeMs: 0,
          affinityScore: 0,
          breakdown: {
            canvas: { passed: false, score: 0, matchedTables: [], missingTables: [], matchedColumns: [], missingColumns: [], droppedColumnsVerified: false, notes: [String(err)] },
            requirements: { passed: false, score: 0, rfCount: 0, rnfCount: 0, topicsCovered: [], topicsMissing: [], mutationsMatched: false, notes: [String(err)] },
            decisions: { passed: false, score: 0, adrCount: 0, foundKeywords: [], missingKeywords: [], isProposedStatus: false, notes: [String(err)] },
            diagrams: { passed: false, score: 0, hasDiagram: false, syntaxValid: false, foundKeywords: [], missingKeywords: [], notes: [String(err)] },
          },
          feedback: [`Error catastrófico en ejecución del benchmark: ${String(err)}`],
          rawResult: { reply: 'Error en ejecución' },
        });
      }
    }

    const totalScore = results.reduce((acc, r) => acc + r.affinityScore, 0);
    const averageAffinityScore = results.length > 0 ? Math.round(totalScore / results.length) : 0;

    return {
      timestamp: new Date().toISOString(),
      totalScenarios: results.length,
      averageAffinityScore,
      provider: results[0]?.provider || 'unknown',
      model: results[0]?.model || 'unknown',
      results,
    };
  }

  /**
   * Obtiene la lista de escenarios disponibles para inspección técnica.
   */
  public listScenarios(): Array<{ id: string; name: string; description: string }> {
    return BENCHMARK_SCENARIOS.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
    }));
  }
}
