import {
    Resource,
    applyRuntimeConfig,
    defineConfig,
    loadRuntimeConfig,
    resetRuntimeConfigForTests,
    setGlobalBaseUrl,
    setGlobalCase,
    setGlobalCursorMeta,
    setGlobalPageName,
    setGlobalPaginatedExtras,
    setGlobalPaginatedLinks,
    setGlobalPaginatedMeta,
    setGlobalResponseStructure,
} from 'src'
import { afterEach, describe, expect, it } from 'vitest'
import { readFile, rename, unlink, writeFile } from 'fs/promises'

import { existsSync } from 'fs'
import path from 'path'

const resetGlobalConfigState = () => {
    setGlobalCase(undefined)
    setGlobalResponseStructure(undefined)
    setGlobalPaginatedExtras(['meta', 'links'])
    setGlobalPaginatedLinks({
        first: 'first',
        last: 'last',
        prev: 'prev',
        next: 'next',
    })
    setGlobalPaginatedMeta({
        to: 'to',
        from: 'from',
        links: 'links',
        path: 'path',
        total: 'total',
        per_page: 'per_page',
        last_page: 'last_page',
        current_page: 'current_page',
    })
    setGlobalCursorMeta({
        previous: 'previous',
        next: 'next',
    })
    setGlobalBaseUrl('https://localhost')
    setGlobalPageName('page')
}

describe('Configuration', () => {
    afterEach(() => {
        resetGlobalConfigState()
        resetRuntimeConfigForTests()
    })

    it('merges nested config values via defineConfig', () => {
        const config = defineConfig({
            resourcesDir: 'custom/resources',
            stubs: {
                resource: 'custom-resource.stub',
            },
            responseStructure: {
                rootKey: 'payload',
            },
            paginatedLinks: {
                next: 'next_page',
            },
            cursorMeta: {
                next: 'after',
            },
        })

        expect(config.resourcesDir).toBe('custom/resources')
        expect(config.stubs.resource).toBe('custom-resource.stub')
        expect(config.stubs.collection).toBe('resource.collection.stub')
        expect(config.responseStructure.wrap).toBe(true)
        expect(config.responseStructure.rootKey).toBe('payload')
        expect(config.paginatedLinks.first).toBe('first')
        expect(config.paginatedLinks.next).toBe('next_page')
        expect(config.cursorMeta.previous).toBe('previous')
        expect(config.cursorMeta.next).toBe('after')
    })

    it('applies runtime config shape to API resources', () => {
        const normalized = defineConfig({
            preferredCase: 'snake',
            responseStructure: {
                rootKey: 'payload',
            },
        })

        applyRuntimeConfig(normalized)

        const body = new Resource({ firstName: 'John', lastName: 'Doe' })
            .withMeta({ traceId: 'cfg-1' })
            .getBody()

        expect(body).toEqual({
            payload: { first_name: 'John', last_name: 'Doe' },
            traceId: 'cfg-1',
        })
    })

    it('loads resora.config.cjs for runtime API resources', async () => {
        const configPath = path.resolve(process.cwd(), 'resora.config.cjs')
        const backupPath = path.resolve(process.cwd(), 'resora.config.cjs.bkp')

        const hadExisting = existsSync(configPath)
        let originalContent = ''

        if (hadExisting) {
            originalContent = await readFile(configPath, 'utf-8')
            await rename(configPath, backupPath)
        }

        try {
            const configContent = `
                module.exports = {
                    preferredCase: 'snake',
                    responseStructure: {
                        rootKey: 'payload',
                    },
                }
            `

            await writeFile(configPath, configContent)

            resetGlobalConfigState()
            resetRuntimeConfigForTests()
            await loadRuntimeConfig()

            const body = new Resource({ firstName: 'John' }).getBody()

            expect(body).toEqual({
                payload: { first_name: 'John' },
            })
        } finally {
            await unlink(configPath)

            if (hadExisting) {
                if (existsSync(backupPath)) {
                    await rename(backupPath, configPath)
                } else {
                    await writeFile(configPath, originalContent)
                }
            }
        }
    })
})
