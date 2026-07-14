import { ServerResponse, definePlugin, registerPlugin, resetPluginsForTests } from 'src'
import { afterEach, describe, expect, it, vi } from 'vitest'

describe('ServerResponse', () => {
    afterEach(() => {
        resetPluginsForTests()
    })

    it('creates a non-thenable response snapshot without a raw response', () => {
        const response = new ServerResponse(undefined, {
            data: {
                id: 1,
            },
        })
            .setStatusCode(201)
            .setHeaders({
                'Content-Type': 'application/json',
                'X-Resource': 'user',
            })

        const data = response.toResponseData()

        expect(data).toEqual({
            body: {
                data: {
                    id: 1,
                },
            },
            status: 201,
            headers: {
                'Content-Type': 'application/json',
                'X-Resource': 'user',
            },
        })
        expect(data).not.toHaveProperty('then')
    })

    it('applies beforeSend plugins once when a snapshot is later dispatched', () => {
        const beforeSend = vi.fn((event) => {
            event.status = 202
            event.headers['X-Plugin'] = 'active'
            event.body = {
                ...event.body,
                plugin: true,
            }
        })

        registerPlugin(definePlugin({
            name: 'response-snapshot',
            beforeSend,
        }))

        const rawResponse = {
            send: vi.fn(),
            status: vi.fn(),
            setHeader: vi.fn(),
        } as any
        const response = new ServerResponse(rawResponse, { data: { id: 1 } })

        expect(response.toResponseData()).toEqual({
            body: {
                data: {
                    id: 1,
                },
                plugin: true,
            },
            status: 202,
            headers: {
                'X-Plugin': 'active',
            },
        })

        response.send()

        expect(beforeSend).toHaveBeenCalledTimes(1)
        expect(rawResponse.status).toHaveBeenCalledWith(202)
        expect(rawResponse.send).toHaveBeenCalledWith({
            data: {
                id: 1,
            },
            plugin: true,
        })
    })

    it('prefers framework header methods over generic context setters', () => {
        const rawResponse = {
            header: vi.fn(),
            set: vi.fn(),
        } as any

        // @ts-expect-error just for this test
        new ServerResponse(rawResponse, undefined)
            .header('X-Resource', 'user')

        expect(rawResponse.header).toHaveBeenCalledWith('X-Resource', 'user')
        expect(rawResponse.set).not.toHaveBeenCalled()
    })
})
