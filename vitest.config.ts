import { defineConfig } from 'vitest/config';

const coverageExclude = [
  'src/main.tsx',
  'src/App.tsx',
  'playwright.config.ts',
  'scripts/dev.ts',
  'vite.serve-generated.ts',
  'vite.config.ts',
  'vitest.config.ts',
  'dist/**',
  '**/*.test.ts',
  '**/*.test.tsx',
  '**/*.spec.ts',
  'tests/**',
  'src/setupTests.ts',
  'src/vite-env.d.ts',
];

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      reportsDirectory: './coverage',
      exclude: coverageExclude,
      thresholds: {
        statements: 90,
        lines: 90,
        functions: 95,
        branches: 85,
      },
    },
    projects: [
      {
        test: {
          name: 'src',
          globals: true,
          environment: 'jsdom',
          setupFiles: ['./src/setupTests.ts'],
          include: ['src/**/*.{test,spec}.{ts,tsx}'],
        },
      },
      {
        test: {
          name: 'scripts',
          environment: 'node',
          include: ['scripts/**/*.{test,spec}.ts'],
        },
      },
      {
        test: {
          name: 'server',
          environment: 'node',
          include: ['server/**/*.{test,spec}.ts'],
        },
      },
      {
        test: {
          name: 'integration',
          environment: 'node',
          include: [
            'tests/integration/**/*.{test,spec}.ts',
            'tests/ci/**/*.{test,spec}.ts',
          ],
        },
      },
    ],
  },
});
