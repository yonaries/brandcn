import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    extensions: ['.ts', '.js'],
  },
  test: {
    disableConsoleIntercept: true,
    environment: 'node',
    exclude: ['node_modules', 'dist'],
    globals: true,
    include: ['test/**/*.test.ts'],
    testTimeout: 30_000,
  },
})
