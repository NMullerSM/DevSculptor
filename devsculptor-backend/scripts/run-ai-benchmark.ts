/**
 * DevSculptor - AI Benchmark & Evaluation Engine Runner
 *
 * Permite ejecutar la suite de pruebas agénticas de afinidad y fidelidad de IA desde la terminal.
 * Evalúa escenarios ambiguos del mundo real y genera un reporte cuantitativo de puntuación (0% - 100%).
 *
 * Uso:
 *   npm run benchmark:ai
 *   npm run benchmark:ai -- --scenario=SCN-01
 *   npm run benchmark:ai -- --provider=mock
 */

import 'dotenv/config';
import { BenchmarkService } from '../src/modules/benchmark/benchmark.service';
import { RunBenchmarkDto } from '../src/modules/benchmark/benchmark.types';

// Parsing de argumentos CLI básicos
const args = process.argv.slice(2);
let scenarioId: string | undefined;
let provider: string | undefined;
let model: string | undefined;

for (const arg of args) {
  if (arg.startsWith('--scenario=')) {
    scenarioId = arg.split('=')[1];
  } else if (arg.startsWith('--provider=')) {
    provider = arg.split('=')[1];
  } else if (arg.startsWith('--model=')) {
    model = arg.split('=')[1];
  }
}

async function runCliBenchmark() {
  console.log('\n' + '='.repeat(80));
  console.log('  🎯 DEVSULPTOR - AI AGENTIC BENCHMARK & EVALUATION ENGINE');
  console.log('='.repeat(80));

  const benchmarkService = new BenchmarkService();
  const dto: RunBenchmarkDto = {
    scenarioId,
    providerOverride: provider
      ? {
          provider: provider as any,
          model,
        }
      : undefined,
  };

  console.log(`\n▶ Iniciando suite de evaluación...`);
  if (scenarioId) console.log(`  - Filtro de Escenario: ${scenarioId}`);
  if (provider) console.log(`  - Proveedor forzado:   ${provider}`);
  if (model) console.log(`  - Modelo forzado:      ${model}`);
  console.log('');

  try {
    const summary = await benchmarkService.runBenchmarkSuite(dto);

    console.log('\n' + '-'.repeat(80));
    console.log(`📊 RESULTADOS DE LA EVALUACIÓN DE AFINIDAD (${summary.results.length} escenarios)`);
    console.log('-'.repeat(80));

    for (const res of summary.results) {
      const scoreBadge = res.affinityScore >= 80 ? '🟢' : res.affinityScore >= 60 ? '🟡' : '🔴';
      console.log(`\n${scoreBadge} [${res.affinityScore}%] ${res.scenarioId}: ${res.scenarioName}`);
      console.log(`   ⏱ Tiempo de inferencia: ${res.executionTimeMs}ms | Motor: ${res.provider} (${res.model})`);

      // Desglose Canvas
      if (res.breakdown.canvas) {
        const c = res.breakdown.canvas;
        const icon = c.passed ? '✓' : '✗';
        console.log(`   ├─ [Canvas: ${c.score}%] ${icon} Tablas ok: [${c.matchedTables.join(', ') || 'ninguna'}]`);
        if (c.missingTables.length > 0) {
          console.log(`   │  └─ Tablas esperadas faltantes: [${c.missingTables.join(', ')}]`);
        }
        if (c.missingColumns.length > 0) {
          console.log(`   │  └─ Columnas faltantes: [${c.missingColumns.join(', ')}]`);
        }
        if (c.notes.length > 0) {
          console.log(`   │  └─ Notas: ${c.notes.join(' | ')}`);
        }
      }

      // Desglose Requisitos
      if (res.breakdown.requirements) {
        const r = res.breakdown.requirements;
        const icon = r.passed ? '✓' : '✗';
        console.log(`   ├─ [Requisitos: ${r.score}%] ${icon} RFs: ${r.rfCount}, RNFs: ${r.rnfCount}`);
        if (r.topicsCovered.length > 0) {
          console.log(`   │  └─ Tópicos clave cubiertos: [${r.topicsCovered.join(', ')}]`);
        }
        if (r.topicsMissing.length > 0) {
          console.log(`   │  └─ Tópicos faltantes: [${r.topicsMissing.join(', ')}]`);
        }
        if (r.notes.length > 0) {
          console.log(`   │  └─ Notas: ${r.notes.join(' | ')}`);
        }
      }

      // Desglose ADR
      if (res.breakdown.decisions) {
        const d = res.breakdown.decisions;
        const icon = d.passed ? '✓' : '✗';
        console.log(`   ├─ [Decisiones/ADR: ${d.score}%] ${icon} ADRs generados: ${d.adrCount}`);
        if (d.missingKeywords.length > 0) {
          console.log(`   │  └─ Palabras clave faltantes en ADR: [${d.missingKeywords.join(', ')}]`);
        }
        if (d.notes.length > 0) {
          console.log(`   │  └─ Notas: ${d.notes.join(' | ')}`);
        }
      }

      // Desglose Diagramas
      if (res.breakdown.diagrams) {
        const diag = res.breakdown.diagrams;
        const icon = diag.passed ? '✓' : '✗';
        console.log(`   ├─ [Diagramas Mermaid: ${diag.score}%] ${icon} Presente: ${diag.hasDiagram}, Sintaxis: ${diag.syntaxValid ? 'Válida' : 'Inválida'}`);
        if (diag.missingKeywords.length > 0) {
          console.log(`   │  └─ Palabras clave faltantes en diagrama: [${diag.missingKeywords.join(', ')}]`);
        }
        if (diag.notes.length > 0) {
          console.log(`   │  └─ Notas: ${diag.notes.join(' | ')}`);
        }
      }

      // Feedback / Sugerencias de Ajuste
      if (res.feedback.length > 0) {
        console.log(`   └─ 💡 Feedback de Ajuste de Prompt:`);
        for (const fb of res.feedback) {
          console.log(`      • ${fb}`);
        }
      }
    }

    console.log('\n' + '='.repeat(80));
    const avgScoreBadge = summary.averageAffinityScore >= 80 ? '🟢' : summary.averageAffinityScore >= 60 ? '🟡' : '🔴';
    console.log(`  ${avgScoreBadge} PUNTUACIÓN DE AFINIDAD PROMEDIO DE LA SUITE: ${summary.averageAffinityScore}%`);
    console.log(`  Total Escenarios: ${summary.totalScenarios} | Fecha: ${summary.timestamp}`);
    console.log('='.repeat(80) + '\n');

    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Error ejecutando la suite de benchmark:', error.message || error);
    process.exit(1);
  }
}

runCliBenchmark();
