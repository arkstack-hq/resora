import { Resource, ServerResponse } from 'src'
import { beforeEach, describe, expect, it } from 'vitest'

import { ResourceCollection } from 'src'
import express from 'express'
import supertest from 'supertest'

let app: express.Application

describe('Connect-style Requests (Express)', () => {
    beforeEach(() => {
        app = express()
    })

    it('should output correct JSON response', async () => {
        const resource = { id: 1, name: 'Test Resource' }
        app.get('/test', async (req, res) => {
            return await new Resource(resource, res).json()
        })

        const response = await supertest(app).get('/test')
        expect(response.body).toEqual({ data: resource })
    })

    it('should can use the global context object', async () => {
        const resource = { id: 1, name: 'Test Resource' }
        app.get('/test', async (req, res) => {
            Resource.setCtx({ res, req })

            return await new Resource(resource)
                .response()
                .setStatusCode(202)
        })

        const response = await supertest(app).get('/test')
        expect(response.body).toEqual({ data: resource })
        expect(response.status).toEqual(202)
    })

    it('should allow chaining of methods', async () => {
        const resource = { id: 1, name: 'Test Resource' }
        app.get('/test', async (req, res) => {
            return await new Resource(resource, res).additional({ meta: 'test' })
        })

        const response = await supertest(app).get('/test')
        expect(response.body).toEqual({
            data: resource,
            meta: 'test',
        })
    })

    it('should allow chaining with async/await', async () => {
        const resource = { id: 1, name: 'Test Resource' }
        app.get('/test', async (req, res) => {
            return await new Resource(resource, res).json()
        })

        const response = await supertest(app).get('/test')
        expect(response.body).toEqual({ data: resource })
    })

    it('should allow setting response headers', async () => {
        const resource = { id: 1, name: 'Test Resource' }
        app.get('/test', async (req, res) => {
            return await new Resource(resource, res)
                .response()
                .header('X-Custom-Header', 'CustomValue')
        })

        const response = await supertest(app).get('/test')
        expect(response.headers['x-custom-header']).toEqual('CustomValue')
    })

    it('should allow setting cookies', async () => {
        const resource = { id: 1, name: 'Test Resource' }
        app.get('/test', async (req, res) => {
            return await new Resource(resource, res)
                .response()
                .setCookie('testCookie', 'testValue', { path: '/', maxAge: 3600 })
        })

        const response = await supertest(app).get('/test')
        expect(response.headers['set-cookie'][0]).toContain('testCookie=testValue')
    })

    it('should allow setting status code', async () => {
        const resource = { id: 1, name: 'Test Resource' }
        app.get('/test', async (req, res) => {
            return await new Resource(resource, res)
                .response()
                .setStatusCode(201)
        })

        const response = await supertest(app).get('/test')
        expect(response.status).toEqual(201)
    })

    it('should include pagination meta if data is an array and pagination is provided', async () => {
        const resource = {
            data: [{ id: 1, name: 'Test Resource' }],
            pagination: {
                total: 100,
                perPage: 10,
                currentPage: 1,
                lastPage: 10,
                path: '/users',
            },
        }

        app.get('/test', async (req, res) => {
            return await new ResourceCollection(resource, res).json()
        })

        const response = await supertest(app).get('/test')
        expect(response.body).toEqual({
            data: resource.data,
            links: {
                last: '/users?page=10',
            },
            meta: {
                total: 100,
                per_page: 10,
                current_page: 1,
                last_page: 10,
                path: '/users',
            },
        })
    })

    it('should not include pagination meta if data is not an array', async () => {
        const resource = { data: { id: 1, name: 'Test Resource' } }

        app.get('/test', async (req, res) => {
            return await new Resource(resource, res).json()
        })

        const response = await supertest(app).get('/test')
        expect(response.body).toEqual({ data: resource.data })
    })

    it('should handle empty data with pagination', async () => {
        const resource = {
            data: [],
            pagination: {
                total: 0,
                perPage: 10,
                currentPage: 1,
                lastPage: 1,
                path: '/users',
            },
        }

        app.get('/test', async (req, res) => {
            return await new ResourceCollection(resource, res).json()
        })

        const response = await supertest(app).get('/test')
        expect(response.body).toEqual({
            data: resource.data,
            links: {
                last: '/users?page=1',
            },
            meta: {
                total: 0,
                per_page: 10,
                current_page: 1,
                last_page: 1,
                path: '/users',
            },
        })
    })

    it('should allow class-level withResponse hook to customize headers/status/body', async () => {
        class CustomResource extends Resource {
            withResponse (response: ServerResponse) {
                response
                    .header('X-From-Hook', '1')
                    .setStatusCode(202)

                this.setBody({
                    ...this.getBody(),
                    meta: {
                        fromWithResponse: true,
                    },
                })
            }
        }

        app.get('/test', async (req, res) => {
            return await new CustomResource({ id: 1, name: 'Test Resource' }, res).json()
        })

        const response = await supertest(app).get('/test')
        expect(response.status).toEqual(202)
        expect(response.headers['x-from-hook']).toEqual('1')
        expect(response.body).toEqual({
            data: { id: 1, name: 'Test Resource' },
            meta: {
                fromWithResponse: true,
            },
        })
    })

    it('should allow class-level withResponse hook on collections', async () => {
        class CustomCollection extends ResourceCollection<{
            data: { id: number; name: string }[]
            pagination?: { currentPage: number; total: number }
        }> {
            withResponse () {
                this.withResponseContext?.response.header('X-Collection-Hook', '1')

                const body = this.getBody()

                this.setBody({
                    ...body,
                    meta: {
                        ...(body.meta || {}),
                        fromWithResponse: true,
                    },
                })
            }
        }

        app.get('/test', async (req, res) => {
            return await new CustomCollection({
                data: [{ id: 1, name: 'Test Resource' }],
                pagination: { currentPage: 1, total: 10 },
            }, res).json()
        })

        const response = await supertest(app).get('/test')
        expect(response.headers['x-collection-hook']).toEqual('1')
        expect(response.body).toEqual({
            data: [{ id: 1, name: 'Test Resource' }],
            meta: {
                current_page: 1,
                total: 10,
                fromWithResponse: true,
            },
        })
    })
})
