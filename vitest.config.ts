import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
    plugins: [tsconfigPaths(),],

    test: {
        root: './',
        passWithNoTests: true,
        environment: 'node',
        include: ['tests/**/*.{test,spec}.?(c|m)[jt]s?(x)'],
        projects: [
            {
                extends: true,
                test: {
                    name: 'resora',
                    include: ['tests/**/*.{test,spec}.?(c|m)[jt]s?(x)'],
                },
            },
            './packages/plugin-clear-router/vitest.config.ts',
        ],
        env: {
            NODE_ENV: 'test',
        },
        coverage: {
            reporter: ['text', 'json', 'html', 'lcov'],
            reportsDirectory: 'coverage',
            exclude: ['**/node_modules/**', '**/dist/**', '**/cypress/**', '**/.{idea,git,cache,output,temp}/**', '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build,eslint,prettier}.config.*', '**/.h3ravel/**'],
        }
    }
})
