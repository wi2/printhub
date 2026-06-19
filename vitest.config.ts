import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
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
