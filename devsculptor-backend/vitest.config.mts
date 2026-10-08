import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

const srcDir = fileURLToPath(new URL('./src', import.meta.url));

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
    testTimeout: 15000,
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
