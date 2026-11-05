import type { IncomingMessage, ServerResponse as NodeResponse } from 'node:http'
import { NextApiResponseLike, Resource, ResourceCollection, ServerResponse } from 'src'
import { beforeEach, describe, expect, it } from 'vitest'

import request from 'parasito'

type NextApiResponse = NodeResponse & NextApiResponseLike & { json (body: any): void }

/**
 * Wraps a handler the way Next.js Pages Router API routes do, adding
 * `status()`, `send()` and `json()` to the Node response.
 */
const nextApi = (handler: (req: IncomingMessage, res: NextApiResponse) => unknown) => {
    return async (req: IncomingMessage, raw: NodeResponse) => {
        const res = raw as NextApiResponse

        res.status = (statusCode: number) => {
            res.statusCode = statusCode

            return res
        }
        res.json = (body: any) => {
            res.setHeader('Content-Type', 'application/json; charset=utf-8')
            res.end(JSON.stringify(body))
        }
        res.send = (body: any) => {
            if (typeof body === 'object' && body !== null) {
                return res.json(body)
            }

            res.end(String(body))
        }

        await handler(req, res)
    }
}

describe('Next.js Pages Router API routes', () => {
    it('should output correct JSON response', async () => {
        const resource = { id: 1, name: 'Test Resource' }
        const app = nextApi(async (_req, res) => {
            await new Resource(resource, res).response()
        })

        await request(app).get('/api/test').expect(200).expect({ data: resource })
    })

    it('should use the res from a { req, res } context', async () => {
        const app = nextApi(async (req, res) => {
            await new Resource({ id: 1 }, { req, res }).response().setStatusCode(201)
        })

        await request(app).get('/api/test').expect(201).expect({ data: { id: 1 } })
    })

    it('should allow setting status code, headers and cookies', async () => {
        const app = nextApi(async (_req, res) => {
            await new Resource({ id: 1 })
                .response(res)
                .setStatusCode(202)
                .header('X-Custom-Header', 'CustomValue')
                .setCookie('testCookie', 'testValue', { path: '/' })
        })

        const response = await request(app).get('/api/test')

        expect(response.status).toEqual(202)
        expect(response.headers.get('x-custom-header')).toEqual('CustomValue')
        expect(response.headers.get('set-cookie')).toContain('testCookie=testValue;')
    })

    it('should include pagination meta with the request path', async () => {
        const app = nextApi(async (req, res) => {
            await new ResourceCollection({
                data: [{ id: 1 }],
                pagination: { currentPage: 1, total: 10 },
            }, { req, res }).response()
        })

        const response = await request(app).get('/api/users')

        expect(response.body).toEqual({
            data: [{ id: 1 }],
            meta: {
                current_page: 1,
                total: 10,
                path: '/api/users?page=1',
            },
        })
    })

    it('should pass the res to the withResponse hook', async () => {
        class CustomResource extends Resource {
            withResponse(response: ServerResponse, raw?: NextApiResponseLike) {
                response.header('X-From-Hook', String(raw?.headersSent)).setStatusCode(202)
            }
        }

        const app = nextApi(async (_req, res) => {
            await new CustomResource({ id: 1 }, res).response()
        })

        const response = await request(app).get('/api/test')

        expect(response.status).toEqual(202)
        expect(response.headers.get('x-from-hook')).toEqual('false')
    })
})

describe('Next.js App Router route handlers', () => {
    beforeEach(() => {
        Resource.setCtx(undefined)
        ResourceCollection.setCtx(undefined)
    })

    it('should build a Web Response with status and headers', async () => {
        const response = await new Resource({ id: 1 })
            .response()
            .setStatusCode(201)
            .header('X-Resource', 'user')
            .toWebResponse()

        expect(response).toBeInstanceOf(Response)
        expect(response.status).toEqual(201)
        expect(response.headers.get('content-type')).toEqual('application/json')
        expect(response.headers.get('x-resource')).toEqual('user')
        expect(await response.json()).toEqual({ data: { id: 1 } })
    })

    it('should resolve async data before building the Web Response', async () => {
        class AsyncResource extends Resource {
            async data() {
                return { id: this.resource.id, loaded: true }
            }
        }

        const response = await new AsyncResource({ id: 2 }).response().toWebResponse()

        expect(await response.json()).toEqual({ data: { id: 2, loaded: true } })
    })

    it('should keep a custom content type', async () => {
        const response = await new ResourceCollection([{ id: 1 }])
            .response()
            .header('Content-Type', 'application/vnd.api+json')
            .toWebResponse()

        expect(response.headers.get('content-type')).toEqual('application/vnd.api+json')
        expect(await response.json()).toEqual({ data: [{ id: 1 }] })
    })
})
