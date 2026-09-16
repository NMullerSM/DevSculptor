import { GoogleGenAI } from '@google/genai';
import {
  IAiProvider,
  AiProjectContext,
  AiChatResult,
} from './ai-provider.interface';
import { buildSystemInstruction, parseDevSculptorActions } from '../ai.prompts';

export class GeminiProvider implements IAiProvider {
  public readonly name = 'gemini';
  private ai: GoogleGenAI;
  private model: string;

  constructor(apiKey: string, model: string = 'gemini-2.0-flash') {
    this.ai = new GoogleGenAI({ apiKey });
    this.model = model;
  }

  public async generateChat(
    messages: Array<{ role: 'user' | 'model'; content: string }>,
    context: AiProjectContext,
    options?: { temperature?: number; actionContext?: string }
  ): Promise<AiChatResult> {
    const systemInstruction = buildSystemInstruction(context);

    // Formateo de contenidos conforme al SDK @google/genai
    const contents = messages.map((m) => ({
      role: m.role === 'model' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const response = await this.ai.models.generateContent({
      model: this.model,
      contents,
      config: {
        systemInstruction,
        temperature: options?.temperature ?? 0.4,
      },
    });

    const rawText = response.text || 'Sin respuesta del modelo.';
    const { cleanText, suggestedRequirements, suggestedEntities, suggestedDecisions } =
      parseDevSculptorActions(rawText);

    return {
      content: cleanText,
      provider: this.name,
      model: this.model,
      suggestedRequirements,
      suggestedEntities,
      suggestedDecisions,
    };
  }

  public async analyzeSchema(context: AiProjectContext): Promise<AiChatResult> {
    const systemInstruction = buildSystemInstruction(context);
    const prompt = `Realiza una auditoría exhaustiva del esquema relacional actual del proyecto. Evalúa:
1. Normalización 1FN, 2FN y 3FN (Reglas de Codd).
2. Claves primarias y foráneas (integridad referencial y cardinalidad).
3. Seguridad y tenencia horizontal con PostgreSQL Row Level Security (RLS).
4. Índices y rendimiento estimado.
Entrega un resumen ejecutivo de recomendaciones y, si detectas tablas faltantes o mejoras clave, incluye el bloque json:devsculptor-actions.`;

    const response = await this.ai.models.generateContent({
      model: this.model,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        systemInstruction,
        temperature: 0.2,
      },
    });

    const rawText = response.text || 'Auditoría completada sin observaciones.';
    const { cleanText, suggestedRequirements, suggestedEntities, suggestedDecisions } =
      parseDevSculptorActions(rawText);

    return {
      content: cleanText,
      provider: this.name,
      model: this.model,
      suggestedRequirements,
      suggestedEntities,
      suggestedDecisions,
    };
  }

  public async suggestRequirements(
    userPrompt: string,
    context: AiProjectContext
  ): Promise<AiChatResult> {
    const systemInstruction = buildSystemInstruction(context);
    const prompt = `A partir de la siguiente descripción de necesidad técnica del usuario:
"${userPrompt}"

Sintetiza los requisitos funcionales (RF) y no funcionales (RNF) bajo el estándar IEEE-830.
Debes estructurarlos en el bloque json:devsculptor-actions con campos: code, title, type (RF/RNF), priority (HIGH/MEDIUM/LOW), description.`;

    const response = await this.ai.models.generateContent({
      model: this.model,
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        systemInstruction,
        temperature: 0.3,
      },
    });

    const rawText = response.text || '';
    const { cleanText, suggestedRequirements, suggestedEntities, suggestedDecisions } =
      parseDevSculptorActions(rawText);

    return {
      content: cleanText,
      provider: this.name,
      model: this.model,
      suggestedRequirements,
      suggestedEntities,
      suggestedDecisions,
    };
  }
}
