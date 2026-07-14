import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'
import swc from 'unplugin-swc'

export default defineConfig({
  resolve: {
    alias: {
      resora: fileURLToPath(new URL('../../src/index.ts', import.meta.url)),
    },
  },
  plugins: [
    swc.vite({
      jsc: {
        parser: {
          syntax: 'typescript',
          decorators: true,
        },
        transform: {
          decoratorMetadata: true,
          legacyDecorator: true,
        },
        target: 'es2022',
      },
    }),
  ],
  test: {
    name: 'plugin-clear-router',
    environment: 'node',
    setupFiles: ['tests/base/setup.ts'],
  },
})
