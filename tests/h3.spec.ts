import { beforeEach, describe, expect, it } from 'vitest'

import { H3 } from 'h3'
import { Resource, ResourceCollection } from 'src'

let app: H3

describe('H3 Requests', () => {
    beforeEach(() => {
        app = new H3()
    })

    it('should output correct JSON response', async () => {
        const resource = { id: 1, name: 'Test Resource' }

        app.use('/test', () => {
            return new Resource(resource)
        })

        const response = await app.fetch(new Request('http://localhost/test', { method: 'GET' }))

        expect(await response.json()).toEqual({ data: resource })
    })

    it('should allow chaining of methods', async () => {
        const resource = { id: 1, name: 'Test Resource' }

        app.use('/test', () => {
            return new Resource(resource).additional({ meta: 'test' })
        })

        const response = await app.fetch(new Request('http://localhost/test', { method: 'GET' }))

        expect(await response.json()).toEqual({
            data: resource,
            meta: 'test',
        })
    })

    it('should allow chaining with async/await', async () => {
        const resource = { id: 1, name: 'Test Resource' }

        app.use('/test', async () => {
            return await new Resource(resource).json()
        })

        const response = await app.fetch(new Request('http://localhost/test', { method: 'GET' }))
        expect(await response.json()).toEqual({ data: resource })
    })

    it('should allow setting response headers', async () => {
        const resource = { id: 1, name: 'Test Resource' }

        app.use('/test', async ({ res }) => {
            return new Resource(resource)
                .response(res)
                .header('X-Custom-Header', 'CustomValue')
        })

        const response = await app.fetch(new Request('http://localhost/test', { method: 'GET' }))
        expect(response.headers.get('X-Custom-Header')).toBe('CustomValue')
    })

    it('should allow setting cookies', async () => {
        const resource = { id: 1, name: 'Test Resource' }

        app.use('/test', async ({ res }) => {
            return new Resource(resource)
                .response(res)
                .setCookie('testCookie', 'testValue', { path: '/', maxAge: 3600 })
        })

        const response = await app.fetch(new Request('http://localhost/test', { method: 'GET' }))
        expect(response.headers.get('Set-Cookie')).toContain('testCookie=testValue')
    })

    it('should allow setting status code', async () => {
        const resource = { id: 1, name: 'Test Resource' }

        app.use('/test', async ({ res }) => {
            return new Resource(resource)
                .response(res)
                .setStatusCode(201)
        })

        const response = await app.fetch(new Request('http://localhost/test', { method: 'GET' }))
        expect(response.status).toBe(201)
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

        app.use('/test', () => {
            return new ResourceCollection(resource)
        })

        const response = await app.fetch(new Request('http://localhost/test', { method: 'GET' }))
        const jsonResponse = await response.json()

        expect(jsonResponse).toEqual({
            data: resource.data,
            links: {
                last: 'https://localhost/users?page=10',
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

        app.use('/test', () => {
            return new Resource(resource)
        })

        const response = await app.fetch(new Request('http://localhost/test', { method: 'GET' }))
        const jsonResponse = await response.json()

        expect(jsonResponse).toEqual({
            data: resource.data,
        })
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

        app.use('/test', () => {
            return new ResourceCollection(resource)
        })

        const response = await app.fetch(new Request('http://localhost/test', { method: 'GET' }))
        const jsonResponse = await response.json()

        expect(jsonResponse).toEqual({
            data: [],
            links: {
                last: 'https://localhost/users?page=1',
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
})
