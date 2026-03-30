import { Resource, definePlugin, getUtility, registerPlugin, resetPluginsForTests } from 'src'
import { afterEach, describe, expect, it } from 'vitest'

describe('Plugin System', () => {
    afterEach(() => {
        resetPluginsForTests()
    })

    it('allows plugins to mutate serialized payloads', () => {
        registerPlugin(definePlugin({
            name: 'append-meta',
            afterSerialize (event) {
                event.body = {
                    ...event.body,
                    meta: {
                        plugin: true,
                    },
                }
            },
        }))

        expect(new Resource({ id: 1 }).getBody()).toEqual({
            data: {
                id: 1,
            },
            meta: {
                plugin: true,
            },
        })
    })

    it('allows plugins to register reusable utilities', () => {
        registerPlugin(definePlugin({
            name: 'register-utility',
            setup (api) {
                api.registerUtility('greeting', (name: string) => `hello ${name}`)
            },
        }))

        const greeting = getUtility<(name: string) => string>('greeting')

        expect(greeting?.('ada')).toBe('hello ada')
    })
})