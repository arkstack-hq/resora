import Fastify from 'fastify'
import { NestHttpHostLike, Resource, ResourceCollection, ServerResponse } from 'src'
import { afterEach, describe, expect, it } from 'vitest'

import express from 'express'
import request from 'parasito'

/**
 * Builds a host shaped like NestJS's `ExecutionContextHost` for an HTTP request.
 */
const httpHost = (req: unknown, res: unknown): NestHttpHostLike => ({
    switchToHttp: () => ({
        getRequest: <T>() => req as T,
        getResponse: <T>() => res as T,
    }),
})

describe('NestJS', () => {
    afterEach(() => {
        Resource.setCtx(undefined)
        ResourceCollection.setCtx(undefined)
    })

    describe('Express platform', () => {
        it('should dispatch through the response from an ArgumentsHost', async () => {
            const app = express()
            app.get('/users/:id', async (req, res) => {
                await new Resource({ id: 1 }, httpHost(req, res))
                    .response()
                    .setStatusCode(201)
                    .header('X-Resource', 'user')
            })

            const response = await request(app).get('/users/1')

            expect(response.status).toEqual(201)
            expect(response.headers.get('x-resource')).toEqual('user')
            expect(response.body).toEqual({ data: { id: 1 } })
        })

        it('should accept an ArgumentsHost in .response()', async () => {
            const app = express()
            app.get('/test', async (req, res) => {
                await new Resource({ id: 1 }).response(httpHost(req, res)).setStatusCode(202)
            })

            await request(app).get('/test').expect(202).expect({ data: { id: 1 } })
        })

        it('should use an ArgumentsHost set as the global context', async () => {
            const app = express()
            app.get('/test', async (req, res) => {
                Resource.setCtx(httpHost(req, res))

                await new Resource({ id: 1 }).response().setStatusCode(202)
            })

            await request(app).get('/test').expect(202).expect({ data: { id: 1 } })
        })

        it('should include pagination meta with the request path', async () => {
            const app = express()
            app.get('/users', async (req, res) => {
                await new ResourceCollection({
                    data: [{ id: 1 }],
                    pagination: { currentPage: 1, total: 10 },
                }, httpHost(req, res)).response()
            })

            const response = await request(app).get('/users')

            expect(response.body).toEqual({
                data: [{ id: 1 }],
                meta: {
                    current_page: 1,
                    total: 10,
                    path: '/users?page=1',
                },
            })
        })

        it('should pass the platform response to the withResponse hook', async () => {
            let raw: unknown

            class CustomResource extends Resource {
                withResponse(response: ServerResponse, rawResponse?: unknown) {
                    raw = rawResponse
                    response.header('X-From-Hook', '1')
                }
            }

            const app = express()
            let expected: unknown
            app.get('/test', async (req, res) => {
                expected = res

                await new CustomResource({ id: 1 }, httpHost(req, res)).response()
            })

            const response = await request(app).get('/test')

            expect(raw).toBe(expected)
            expect(response.headers.get('x-from-hook')).toEqual('1')
        })
    })

    describe('Fastify platform', () => {
        it('should dispatch through the reply from an ArgumentsHost', async () => {
            const app = Fastify()
            app.get('/users', async (req, reply) => {
                await new ResourceCollection({
                    data: [{ id: 1 }],
                    pagination: { currentPage: 1, total: 10 },
                }, httpHost(req, reply)).response().setStatusCode(201)

                return reply
            })

            const response = await app.inject().get('/users')

            expect(response.statusCode).toEqual(201)
            expect(response.json()).toEqual({
                data: [{ id: 1 }],
                meta: {
                    current_page: 1,
                    total: 10,
                    path: '/users?page=1',
                },
            })
        })
    })
})
