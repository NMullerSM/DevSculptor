import {
  IAiProvider,
  AiProjectContext,
  AiChatResult,
} from './ai-provider.interface';
import { buildSystemInstruction, parseDevSculptorActions } from '../ai.prompts';

/**
 * Proveedor compatible con OpenAI / DeepSeek API (Arquitectura Abierta a Futuro).
 * Permite conmutar transparentemente a modelos de OpenAI (gpt-4o, o1, o3) o DeepSeek (deepseek-chat, deepseek-reasoner).
 */
export class OpenAiProvider implements IAiProvider {
  public readonly name: string;
  private apiKey: string;
  private model: string;
  private baseUrl: string;

  constructor(
    apiKey: string,
    model: string = 'gpt-4o',
    baseUrl: string = 'https://api.openai.com/v1',
    providerName: string = 'openai'
  ) {
    this.apiKey = apiKey;
    this.model = model;
    this.baseUrl = baseUrl;
    this.name = providerName;
  }

  public async generateChat(
    messages: Array<{ role: 'user' | 'model'; content: string }>,
    context: AiProjectContext,
    options?: { temperature?: number; actionContext?: string }
  ): Promise<AiChatResult> {
    const systemInstruction = buildSystemInstruction(context);

    // Mapeo canónico a formato chat completions (OpenAI / DeepSeek compatible)
    const formattedMessages = [
      { role: 'system', content: systemInstruction },
      ...messages.map((m) => ({
        role: m.role === 'model' ? 'assistant' : 'user',
        content: m.content,
      })),
    ];

    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: formattedMessages,
        temperature: options?.temperature ?? 0.4,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`[${this.name.toUpperCase()} API Error] HTTP ${res.status}: ${errText}`);
    }

    const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const rawText = data.choices?.[0]?.message?.content || 'Sin respuesta.';
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
    return this.generateChat(
      [
        {
          role: 'user',
          content: 'Audita el esquema relacional actual bajo 3FN, claves foráneas, RLS y rendimiento.',
        },
      ],
      context,
      { temperature: 0.2 }
    );
  }

  public async suggestRequirements(
    userPrompt: string,
    context: AiProjectContext
  ): Promise<AiChatResult> {
    return this.generateChat(
      [
        {
          role: 'user',
          content: `Genera requisitos IEEE-830 a partir de: "${userPrompt}". Incluye el bloque json:devsculptor-actions.`,
        },
      ],
      context,
      { temperature: 0.3 }
    );
  }
}
