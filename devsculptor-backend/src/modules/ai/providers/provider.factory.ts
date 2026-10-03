import { IAiProvider, UserAiOverride } from './ai-provider.interface';
import { GeminiProvider } from './gemini.provider';
import { OpenAiProvider } from './openai.provider';
import { MockAiProvider } from './mock.provider';
import { env } from '../../../config/env';
import { logger } from '../../../config/logger';

export class AiProviderFactory {
  private static instance: IAiProvider | null = null;

  public static getProvider(override?: UserAiOverride): IAiProvider {
    // 1. Si el cliente suministra BYOK (su propia API key)
    if (override && override.apiKey && override.apiKey.trim().length > 0) {
      const provider = (override.provider || 'openrouter').toLowerCase();
      const model = override.model?.trim() || 'openrouter/free';

      logger.info(
        { provider, model, isCustomEndpoint: Boolean(override.baseUrl) },
        'Instanciando proveedor BYOK dinámico para el usuario'
      );

      if (provider === 'gemini') {
        return new GeminiProvider(override.apiKey, model || env.GEMINI_MODEL);
      }

      if (provider === 'openrouter') {
        return new OpenAiProvider(
          override.apiKey,
          model,
          'https://openrouter.ai/api/v1',
          'openrouter'
        );
      }

      if (provider === 'deepseek') {
        return new OpenAiProvider(
          override.apiKey,
          model || 'deepseek-chat',
          'https://api.deepseek.com/v1',
          'deepseek'
        );
      }

      if (provider === 'openai') {
        return new OpenAiProvider(
          override.apiKey,
          model || 'gpt-4o',
          'https://api.openai.com/v1',
          'openai'
        );
      }

      if (provider === 'groq') {
        return new OpenAiProvider(
          override.apiKey,
          model || 'llama-3.3-70b-versatile',
          'https://api.groq.com/openai/v1',
          'groq'
        );
      }

      // Proveedor custom o compatible con OpenAI
      return new OpenAiProvider(
        override.apiKey,
        model,
        override.baseUrl || 'https://api.openai.com/v1',
        'custom'
      );
    }

    if (this.instance) {
      return this.instance;
    }

    const providerType = env.AI_PROVIDER;

    switch (providerType) {
      case 'gemini': {
        if (env.GEMINI_API_KEY && env.GEMINI_API_KEY.trim().length > 0) {
          logger.info(
            { provider: 'gemini', model: env.GEMINI_MODEL },
            'Inicializando proveedor Google Gemini oficial (@google/genai)'
          );
          this.instance = new GeminiProvider(env.GEMINI_API_KEY, env.GEMINI_MODEL);
          return this.instance;
        }

        logger.warn(
          'GEMINI_API_KEY no detectada en .env. Activando MockAiProvider (simulador heurístico de alta fidelidad para desarrollo seguro).'
        );
        this.instance = new MockAiProvider();
        return this.instance;
      }

      case 'openai': {
        if (env.OPENAI_API_KEY && env.OPENAI_API_KEY.trim().length > 0) {
          logger.info({ provider: 'openai' }, 'Inicializando proveedor OpenAI API');
          this.instance = new OpenAiProvider(env.OPENAI_API_KEY, 'gpt-4o');
          return this.instance;
        }

        logger.warn('OPENAI_API_KEY no detectada. Recurriendo a MockAiProvider.');
        this.instance = new MockAiProvider();
        return this.instance;
      }

      case 'deepseek': {
        if (env.DEEPSEEK_API_KEY && env.DEEPSEEK_API_KEY.trim().length > 0) {
          logger.info({ provider: 'deepseek' }, 'Inicializando proveedor DeepSeek API');
          this.instance = new OpenAiProvider(
            env.DEEPSEEK_API_KEY,
            'deepseek-chat',
            'https://api.deepseek.com/v1',
            'deepseek'
          );
          return this.instance;
        }

        logger.warn('DEEPSEEK_API_KEY no detectada. Recurriendo a MockAiProvider.');
        this.instance = new MockAiProvider();
        return this.instance;
      }

      case 'mock':
      default: {
        logger.info('Activando MockAiProvider por configuración explícita');
        this.instance = new MockAiProvider();
        return this.instance;
      }
    }
  }

  /**
   * Permite resetear la instancia (por ejemplo, para pruebas unitarias o recarga de credenciales)
   */
  public static resetInstance(): void {
    this.instance = null;
  }
}
