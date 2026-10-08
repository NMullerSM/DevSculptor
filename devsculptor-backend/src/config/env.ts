import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load .env from project root
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const booleanPreprocess = (def: boolean = false) =>
  z.preprocess((val) => {
    if (typeof val === 'boolean') return val;
    if (typeof val === 'string') {
      const lower = val.trim().toLowerCase();
      if (lower === 'true' || lower === '1') return true;
      if (lower === 'false' || lower === '0') return false;
    }
    return def;
  }, z.boolean().default(def));

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().default(3000),
    DATABASE_URL: z.string().optional(),
    DB_HOST: z.string().default('localhost'),
    DB_PORT: z.coerce.number().default(5432),
    DB_USER: z.string().default('postgres'),
    DB_PASSWORD: z.string().default(''),
    DB_NAME: z.string().default('postgres'),
    DB_SSL: booleanPreprocess(false),
    JWT_SECRET: z.string().min(32, 'JWT_SECRET debe tener al menos 32 caracteres'),
    JWT_EXPIRES_IN: z.string().default('8h'),
    CORS_ORIGINS: z.string().default('http://localhost:3000,http://localhost:5173'),
    RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000),
    RATE_LIMIT_MAX: z.coerce.number().default(100),

    // Seguridad, Proxy & Redirecciones (Fase 1 & Fase 2)
    FRONTEND_URL: z.string().default('http://localhost:5173'),
    MAIL_PROVIDER: z.enum(['console', 'smtp']).default('console'),
    TRUST_PROXY_HOPS: z.coerce.number().default(1),
    MFA_ENCRYPTION_KEY: z
      .string()
      .default('0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'),
    ALLOW_CUSTOM_AI_ENDPOINTS: booleanPreprocess(false),
    DEV_EXPOSE_RESET_TOKEN: booleanPreprocess(false),
    AI_TIMEOUT_MS: z.coerce.number().default(45000),

    // Configuración de Motor de IA (Agnóstica de Proveedor)
    AI_PROVIDER: z.enum(['gemini', 'openai', 'deepseek', 'mock']).default('gemini'),
    GEMINI_API_KEY: z.string().optional(),
    GEMINI_MODEL: z.string().default('gemini-2.5-flash'),
    OPENAI_API_KEY: z.string().optional(),
    DEEPSEEK_API_KEY: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.NODE_ENV === 'production') {
      const lowerSecret = data.JWT_SECRET.toLowerCase();
      if (
        lowerSecret.includes('your_jwt') ||
        lowerSecret.includes('changeme') ||
        lowerSecret.includes('secret_here')
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'JWT_SECRET inseguro o con valor de plantilla en producción.',
          path: ['JWT_SECRET'],
        });
      }

      if (data.JWT_SECRET.length < 48) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'JWT_SECRET debe tener al menos 48 caracteres en producción.',
          path: ['JWT_SECRET'],
        });
      }

      if (data.MAIL_PROVIDER === 'console') {
        // En producción se requiere un proveedor real de correo
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'MAIL_PROVIDER no puede ser "console" en entorno de producción.',
          path: ['MAIL_PROVIDER'],
        });
      }
    }
  });

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Error de validación en variables de entorno:');
  console.error(JSON.stringify(parsed.error.format(), null, 2));
  process.exit(1);
}

export const env = parsed.data;
export type Env = z.infer<typeof envSchema>;
