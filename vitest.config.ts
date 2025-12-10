import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],

  test: {
    // Environment
    environment: 'jsdom',
    globals: true,

    // Setup
    setupFiles: ['./src-modern/test/setup.ts'],

    // Coverage
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.spec.ts',
        '**/*.test.ts',
        '**/*.spec.tsx',
        '**/*.test.tsx',
        '**/index.ts',
        '**/*.d.ts',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },

    // Performance
    threads: true,
    isolate: true,

    // Output
    reporters: ['verbose'],
    outputFile: './coverage/test-results.json',

    // Timeout
    testTimeout: 10000,
    hookTimeout: 10000,
  },

  resolve: {
    alias: {
      '@': resolve(__dirname, 'src-modern'),
      '@core': resolve(__dirname, 'src-modern/core'),
      '@features': resolve(__dirname, 'src-modern/features'),
      '@shared': resolve(__dirname, 'src-modern/shared'),
      '@config': resolve(__dirname, 'src-modern/config'),
      '@test': resolve(__dirname, 'src-modern/test'),
    },
  },
});
