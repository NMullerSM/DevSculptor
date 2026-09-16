import { IAiProvider } from './ai-provider.interface';
import { GeminiProvider } from './gemini.provider';
import { OpenAiProvider } from './openai.provider';
import { MockAiProvider } from './mock.provider';
import { env } from '../../../config/env';
import { logger } from '../../../config/logger';

export class AiProviderFactory {
  private static instance: IAiProvider | null = null;

  public static getProvider(): IAiProvider {
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
