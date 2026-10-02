import { GoogleGenAI } from '@google/genai';
import {
  IAiProvider,
  AiProjectContext,
  AiChatResult,
} from './ai-provider.interface';
import { buildSystemInstruction, parseDevSculptorActions } from '../ai.prompts';
import { MockAiProvider } from './mock.provider';
import { logger } from '../../../config/logger';

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number = 12000): Promise<T> {
  let timeoutHandle: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(() => {
      reject(new Error(`Tiempo de espera agotado (${timeoutMs}ms) al invocar Google Gemini`));
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    clearTimeout(timeoutHandle);
  });
}

export class GeminiProvider implements IAiProvider {
  public readonly name = 'gemini';
  private ai: GoogleGenAI;
  private model: string;
  private fallback: MockAiProvider;

  constructor(apiKey: string, model: string = 'gemini-3.1-flash-lite') {
    this.ai = new GoogleGenAI({ apiKey });
    this.model = model;
    this.fallback = new MockAiProvider();
  }

  public async generateChat(
    messages: Array<{ role: 'user' | 'model'; content: string }>,
    context: AiProjectContext,
    options?: { temperature?: number; actionContext?: string }
  ): Promise<AiChatResult> {
    try {
      const systemInstruction = buildSystemInstruction(context);

      const contents = messages.map((m) => ({
        role: m.role === 'model' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

      const response = await withTimeout(
        this.ai.models.generateContent({
          model: this.model,
          contents,
          config: {
            systemInstruction,
            temperature: options?.temperature ?? 0.4,
          },
        }),
        12000
      );

      const rawText = response.text || 'Sin respuesta del modelo.';
      const { cleanText, suggestedRequirements, suggestedEntities, suggestedDecisions } =
        parseDevSculptorActions(rawText);

      return {
        content: cleanText,
        reply: cleanText,
        provider: this.name,
        model: this.model,
        actions: {
          requirements: suggestedRequirements,
          entities: suggestedEntities,
          decisions: suggestedDecisions,
        },
        suggestedRequirements,
        suggestedEntities,
        suggestedDecisions,
      };
    } catch (err: unknown) {
      logger.warn(
        { err, model: this.model },
        'Google Gemini API no disponible temporalmente o excedió tiempo límite. Activando respuesta resiliente vía MockAiProvider.'
      );
      const fallbackResult = await this.fallback.generateChat(messages, context, options);
      return {
        ...fallbackResult,
        model: `${this.model} (fallback resiliente)`,
      };
    }
  }

  public async analyzeSchema(context: AiProjectContext): Promise<AiChatResult> {
    try {
      const systemInstruction = buildSystemInstruction(context);
      const prompt = `Realiza una auditoría exhaustiva del esquema relacional actual del proyecto. Evalúa:
1. Normalización 1FN, 2FN y 3FN (Reglas de Codd).
2. Claves primarias y foráneas (integridad referencial y cardinalidad).
3. Seguridad y tenencia horizontal con PostgreSQL Row Level Security (RLS).
4. Índices y rendimiento estimado.
Entrega un resumen ejecutivo de recomendaciones y, si detectas tablas faltantes o mejoras clave, incluye el bloque json:devsculptor-actions.`;

      const response = await withTimeout(
        this.ai.models.generateContent({
          model: this.model,
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          config: {
            systemInstruction,
            temperature: 0.2,
          },
        }),
        12000
      );

      const rawText = response.text || 'Auditoría completada sin observaciones.';
      const { cleanText, suggestedRequirements, suggestedEntities, suggestedDecisions } =
        parseDevSculptorActions(rawText);

      return {
        content: cleanText,
        reply: cleanText,
        provider: this.name,
        model: this.model,
        actions: {
          requirements: suggestedRequirements,
          entities: suggestedEntities,
          decisions: suggestedDecisions,
        },
        suggestedRequirements,
        suggestedEntities,
        suggestedDecisions,
      };
    } catch (err: unknown) {
      logger.warn(
        { err, model: this.model },
        'Google Gemini API no disponible temporalmente en auditoría. Activando respuesta resiliente vía MockAiProvider.'
      );
      return this.fallback.analyzeSchema(context);
    }
  }

  public async suggestRequirements(
    userPrompt: string,
    context: AiProjectContext
  ): Promise<AiChatResult> {
    try {
      const systemInstruction = buildSystemInstruction(context);
      const prompt = `A partir de la siguiente descripción de necesidad técnica del usuario:
"${userPrompt}"

Sintetiza los requisitos funcionales (RF) y no funcionales (RNF) bajo el estándar IEEE-830.
Debes estructurarlos en el bloque json:devsculptor-actions con campos: code, title, type (RF/RNF), priority (HIGH/MEDIUM/LOW), description.`;

      const response = await withTimeout(
        this.ai.models.generateContent({
          model: this.model,
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          config: {
            systemInstruction,
            temperature: 0.3,
          },
        }),
        12000
      );

      const rawText = response.text || '';
      const { cleanText, suggestedRequirements, suggestedEntities, suggestedDecisions } =
        parseDevSculptorActions(rawText);

      return {
        content: cleanText,
        reply: cleanText,
        provider: this.name,
        model: this.model,
        actions: {
          requirements: suggestedRequirements,
          entities: suggestedEntities,
          decisions: suggestedDecisions,
        },
        suggestedRequirements,
        suggestedEntities,
        suggestedDecisions,
      };
    } catch (err: unknown) {
      logger.warn(
        { err, model: this.model },
        'Google Gemini API no disponible temporalmente en sugerencias. Activando respuesta resiliente vía MockAiProvider.'
      );
      return this.fallback.suggestRequirements(userPrompt, context);
    }
  }
}
