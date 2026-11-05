import Fastify, { type FastifyInstance } from 'fastify'
import { Resource, ResourceCollection, ServerResponse } from 'src'
import { beforeEach, describe, expect, it } from 'vitest'

let app: FastifyInstance

describe('Fastify Requests', () => {
    beforeEach(() => {
        app = Fastify()
    })

    it('should output correct JSON response', async () => {
        const resource = { id: 1, name: 'Test Resource' }
        app.get('/test', async (_req, reply) => {
            return await new Resource(resource, reply).json()
        })

        const response = await app.inject().get('/test')

        expect(response.json()).toEqual({ data: resource })
    })

    it('should use the reply from a { req, res } context', async () => {
        const resource = { id: 1, name: 'Test Resource' }
        app.get('/test', async (req, reply) => {
            Resource.setCtx({ req, res: reply })

            return await new Resource(resource).response().setStatusCode(202)
        })

        const response = await app.inject().get('/test')

        expect(response.statusCode).toEqual(202)
        expect(response.json()).toEqual({ data: resource })
    })

    it('should use the reply from a clear-router { req, reply } context', async () => {
        app.get('/test', async (req, reply) => {
            return await new Resource({ id: 1 }, { req, reply }).response().setStatusCode(201)
        })

        const response = await app.inject().get('/test')

        expect(response.statusCode).toEqual(201)
        expect(response.json()).toEqual({ data: { id: 1 } })
    })

    it('should allow setting status code, headers and cookies', async () => {
        const resource = { id: 1, name: 'Test Resource' }
        app.get('/test', async (_req, reply) => {
            return await new Resource(resource, reply)
                .response()
                .setStatusCode(201)
                .header('X-Custom-Header', 'CustomValue')
                .setCookie('testCookie', 'testValue', { path: '/' })
        })

        const response = await app.inject().get('/test')

        expect(response.statusCode).toEqual(201)
        expect(response.headers['x-custom-header']).toEqual('CustomValue')
        expect(String(response.headers['set-cookie'])).toContain('testCookie=testValue;')
    })

    it('should read the status text from the raw response', async () => {
        let statusText: string | undefined

        app.get('/test', async (_req, reply) => {
            const response = new Resource({ id: 1 }, reply).response()
            reply.raw.statusMessage = 'Fine'
            statusText = response.statusText()

            return await response
        })

        await app.inject().get('/test')

        expect(statusText).toEqual('Fine')
    })

    it('should include pagination meta with the request path', async () => {
        app.get('/users', async (req, reply) => {
            return await new ResourceCollection({
                data: [{ id: 1 }],
                pagination: { currentPage: 1, total: 10 },
            }, { req, res: reply }).json()
        })

        const response = await app.inject().get('/users')

        expect(response.json()).toEqual({
            data: [{ id: 1 }],
            meta: {
                current_page: 1,
                total: 10,
                path: '/users?page=1',
            },
        })
    })

    it('should allow class-level withResponse hook to customize headers/status/body', async () => {
        class CustomResource extends Resource {
            withResponse(response: ServerResponse) {
                response.header('X-From-Hook', '1').setStatusCode(202)

                this.setBody({ ...this.getBody(), meta: { fromWithResponse: true } })
            }
        }

        app.get('/test', async (_req, reply) => {
            return await new CustomResource({ id: 1 }, reply).json()
        })

        const response = await app.inject().get('/test')

        expect(response.statusCode).toEqual(202)
        expect(response.headers['x-from-hook']).toEqual('1')
        expect(response.json()).toEqual({ data: { id: 1 }, meta: { fromWithResponse: true } })
    })
})
