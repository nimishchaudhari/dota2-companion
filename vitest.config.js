import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.js'],
    css: true,
    testTimeout: 30000, // Longer timeout for integration tests with real API calls
    include: ['src/__tests__/**/*.test.{js,jsx}'],
    exclude: ['node_modules', 'dist'],
    // Performance benchmarking
    benchmark: {
      include: ['src/__tests__/performance/**/*.bench.{js,jsx}'],
      exclude: ['node_modules'],
    },
    // Reporter configuration for CI
    reporter: ['verbose', 'json', 'html'],
    outputFile: {
      json: './test-results.json',
      html: './test-results.html'
    },
    // Coverage configuration
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/__tests__/',
        '**/*.d.ts',
        '**/*.config.{js,ts}',
        '**/coverage/**'
      ]
    }
  },
  // Environment variables for testing
  define: {
    'import.meta.env.VITE_TEST_MODE': '"true"',
    'import.meta.env.VITE_AUTH_MODE': '"development"',
    'import.meta.env.VITE_DEV_MODE_ENABLED': '"true"'
  }
});