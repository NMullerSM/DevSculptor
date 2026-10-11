import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

const srcDir = fileURLToPath(new URL('./src', import.meta.url));

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
    testTimeout: 15000,
    env: {
      NODE_ENV: 'test',
      JWT_SECRET: 'test_jwt_secret_devsculptor_super_secure_32_characters_minimum',
      MFA_ENCRYPTION_KEY: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
    },
  },
  resolve: {
    alias: {
      '@config': `${srcDir}/config`,
      '@modules': `${srcDir}/modules`,
      '@shared': `${srcDir}/shared`,
      '@middlewares': `${srcDir}/middlewares`,
    },
  },
});
