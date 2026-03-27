import {
    GenericResource,
    Resource,
    ResourceCollection,
    createArkormCurrentPageResolver,
    resolveCurrentPage,
    setGlobalBaseUrl,
    setGlobalCursorMeta,
    setGlobalPageName,
    setGlobalPaginatedExtras,
    setRequestUrl,
} from 'src'
import { afterEach, describe, expect, it } from 'vitest'

describe('Resource Pagination', () => {
    afterEach(() => {
        setGlobalBaseUrl('')
        setGlobalPageName('page')
        setGlobalPaginatedExtras(['meta', 'links'])
        setGlobalCursorMeta({ previous: 'previous', next: 'next' })
        setRequestUrl(undefined)
    })

    it('should handle pagination data correctly', () => {
        const resource = {
            data: [{ id: 1 }, { id: 2 }],
            pagination: {
                total: 100,
                perPage: 10,
                currentPage: 1,
                lastPage: 10,
                path: '/users',
            },
        }

        const jsonResource = new ResourceCollection(resource)
        const jsonResponse = jsonResource.getBody()

        expect(jsonResponse).toEqual({
            data: [{ id: 1 }, { id: 2 }],
            links: {
                last: '/users?page=10',
            },
            meta: {
                total: 100,
                per_page: 10,
                current_page: 1,
                last_page: 10,
                path: '/users?page=1',
            },
        })
    })

    it('should not include pagination meta for non-collection resources', () => {
        const resource = {
            id: 1,
            name: 'Test Resource',
            pagination: {
                total: 100,
                perPage: 10,
                currentPage: 1,
                lastPage: 10,
            },
        }

        const jsonResource = new Resource(resource)
        const jsonResponse = jsonResource.getBody()
        expect(jsonResponse).toEqual({ data: resource })
    })

    it('should not include pagination meta if data is not an array', () => {
        const resource = {
            data: { id: 1, name: 'Test Resource' },
            pagination: {
                total: 100,
                perPage: 10,
                currentPage: 1,
                lastPage: 10,
            },
        }

        const jsonResource = new Resource(resource)
        const jsonResponse = jsonResource.getBody()

        expect(jsonResponse).toEqual({ data: resource.data })
    })

    it('should handle empty data with pagination', () => {
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

        const jsonResource = new ResourceCollection(resource)
        const jsonResponse = jsonResource.getBody()

        expect(jsonResponse).toEqual({
            data: [],
            links: {
                last: '/users?page=1',
            },
            meta: {
                total: 0,
                per_page: 10,
                current_page: 1,
                last_page: 1,
                path: '/users?page=1',
            },
        })
    })

    it('should build links with custom baseUrl and pageName config', () => {
        setGlobalBaseUrl('https://api.example.com/v1')
        setGlobalPageName('p')

        const resource = {
            data: [{ id: 1 }, { id: 2 }],
            pagination: {
                firstPage: 1,
                currentPage: 2,
                nextPage: 3,
                path: '/users',
            },
        }

        const jsonResponse = new ResourceCollection(resource).getBody()

        expect(jsonResponse).toEqual({
            data: [{ id: 1 }, { id: 2 }],
            links: {
                first: 'https://api.example.com/v1/users?p=1',
                next: 'https://api.example.com/v1/users?p=3',
            },
            meta: {
                current_page: 2,
                path: 'https://api.example.com/v1/users?p=2',
            },
        })
    })

    it('resolves the current page from the stored request URL using the configured pageName', () => {
        setGlobalPageName('p')
        Resource.setCtx({ req: { originalUrl: '/users?filter=active&p=3' } })

        expect(resolveCurrentPage()).toBe(3)
    })

    it('creates an Arkorm-compatible current-page resolver from request context', () => {
        const resolvePage = createArkormCurrentPageResolver({
            req: { originalUrl: '/users?cursor=4&sort=name' },
        })

        expect(resolvePage('cursor')).toBe(4)
        expect(resolvePage('page')).toBeUndefined()
    })

    it('should support cursor as a configured paginated extra with cursorMeta mapping', () => {
        setGlobalPaginatedExtras({ meta: 'meta', links: 'links', cursor: 'cursor' })
        setGlobalCursorMeta({ previous: 'before', next: 'after' })

        const resource = {
            data: [{ id: 1 }],
            cursor: {
                previous: 'cursor_prev',
                next: 'cursor_next',
            },
        }

        const jsonResponse = new ResourceCollection(resource).getBody()

        expect(jsonResponse).toEqual({
            data: [{ id: 1 }],
            cursor: {
                before: 'cursor_prev',
                after: 'cursor_next',
            },
        })
    })

    it('should not include pagination meta if pagination is missing', () => {
        const resource = {
            data: [{ id: 1 }, { id: 2 }],
        }

        const jsonResource = new ResourceCollection(resource)
        const jsonResponse = jsonResource.getBody()

        expect(jsonResponse).toEqual({
            data: [{ id: 1 }, { id: 2 }],
        })
    })

    it('should generate full URLs when baseUrl is configured', () => {
        setGlobalBaseUrl('http://localhost:3000')

        const resource = {
            data: [{ id: 1 }],
            pagination: {
                currentPage: 2,
                lastPage: 5,
                nextPage: 3,
                prevPage: 1,
                firstPage: 1,
                path: '/users',
            },
        }

        const jsonResponse = new ResourceCollection(resource).getBody()

        expect(jsonResponse.links).toEqual({
            first: 'http://localhost:3000/users?page=1',
            last: 'http://localhost:3000/users?page=5',
            prev: 'http://localhost:3000/users?page=1',
            next: 'http://localhost:3000/users?page=3',
        })
    })

    it('should generate path-relative URLs when no baseUrl is configured', () => {
        setGlobalBaseUrl('')

        const resource = {
            data: [{ id: 1 }],
            pagination: {
                currentPage: 2,
                lastPage: 5,
                nextPage: 3,
                prevPage: 1,
                firstPage: 1,
                path: '/users',
            },
        }

        const jsonResponse = new ResourceCollection(resource).getBody()

        expect(jsonResponse.links).toEqual({
            first: '/users?page=1',
            last: '/users?page=5',
            prev: '/users?page=1',
            next: '/users?page=3',
        })
    })

    it('should fall back to bare /?page=X when neither baseUrl nor path is available', () => {
        setGlobalBaseUrl('')

        const resource = {
            data: [{ id: 1 }],
            pagination: {
                currentPage: 2,
                lastPage: 5,
                nextPage: 3,
                prevPage: 1,
                firstPage: 1,
            },
        }

        const jsonResponse = new ResourceCollection(resource).getBody()

        expect(jsonResponse.links).toEqual({
            first: '/?page=1',
            last: '/?page=5',
            prev: '/?page=1',
            next: '/?page=3',
        })
    })

    it('should use path directly when it is already a full URL', () => {
        setGlobalBaseUrl('')

        const resource = {
            data: [{ id: 1 }],
            pagination: {
                currentPage: 1,
                lastPage: 3,
                nextPage: 2,
                firstPage: 1,
                path: 'http://api.example.com/v2/users',
            },
        }

        const jsonResponse = new ResourceCollection(resource).getBody()

        expect(jsonResponse.links).toEqual({
            first: 'http://api.example.com/v2/users?page=1',
            last: 'http://api.example.com/v2/users?page=3',
            next: 'http://api.example.com/v2/users?page=2',
        })
    })

    it('should generate full URLs in GenericResource when baseUrl is configured', () => {
        setGlobalBaseUrl('https://myapp.test')

        const resource = {
            data: [{ id: 1 }],
            pagination: {
                currentPage: 3,
                lastPage: 10,
                nextPage: 4,
                prevPage: 2,
                firstPage: 1,
                path: '/articles',
            },
        }

        const jsonResponse = new GenericResource(resource).getBody()

        expect(jsonResponse.links).toEqual({
            first: 'https://myapp.test/articles?page=1',
            last: 'https://myapp.test/articles?page=10',
            prev: 'https://myapp.test/articles?page=2',
            next: 'https://myapp.test/articles?page=4',
        })
    })

    it('should generate full URLs with baseUrl and no path', () => {
        setGlobalBaseUrl('https://api.example.com')

        const resource = {
            data: [{ id: 1 }],
            pagination: {
                currentPage: 1,
                lastPage: 3,
                nextPage: 2,
                firstPage: 1,
            },
        }

        const jsonResponse = new ResourceCollection(resource).getBody()

        expect(jsonResponse.links).toEqual({
            first: 'https://api.example.com/?page=1',
            last: 'https://api.example.com/?page=3',
            next: 'https://api.example.com/?page=2',
        })
    })

    it('should prefer absolute path URL over baseUrl', () => {
        setGlobalBaseUrl('https://ignored.com')

        const resource = {
            data: [{ id: 1 }],
            pagination: {
                currentPage: 1,
                lastPage: 2,
                nextPage: 2,
                firstPage: 1,
                path: 'https://actual.com/users',
            },
        }

        const jsonResponse = new ResourceCollection(resource).getBody()

        expect(jsonResponse.links).toEqual({
            first: 'https://actual.com/users?page=1',
            last: 'https://actual.com/users?page=2',
            next: 'https://actual.com/users?page=2',
        })
    })

    it('should auto-detect path from Express {req, res} context', () => {
        const expressCtx = {
            req: { originalUrl: '/api/users' },
            res: { send: () => { } },
        }

        const resource = {
            data: [{ id: 1 }],
            pagination: {
                currentPage: 1,
                lastPage: 3,
                nextPage: 2,
                firstPage: 1,
            },
        }

        // Bare res without req — no URL to detect, falls back
        const jsonResponse = new ResourceCollection(resource, expressCtx.res as any).getBody()
        expect(jsonResponse.links?.first).toBe('/?page=1')

        // With {req, res} context, auto-detects URL from req.originalUrl
        setRequestUrl(undefined)
        const jsonResponse2 = new ResourceCollection(resource, expressCtx as any).getBody()
        expect(jsonResponse2.links).toEqual({
            first: '/api/users?page=1',
            last: '/api/users?page=3',
            next: '/api/users?page=2',
        })
    })

    it('should auto-detect path from H3 {req, res} context', () => {
        // H3 HTTPEvent: req is a Web standard Request with a full URL
        const h3Ctx = {
            req: { url: 'http://localhost:3000/articles' },
            res: {},
        }

        const resource = {
            data: [{ id: 1 }],
            pagination: {
                currentPage: 2,
                lastPage: 5,
                nextPage: 3,
                prevPage: 1,
                firstPage: 1,
            },
        }

        const jsonResponse = new ResourceCollection(resource, h3Ctx as any).getBody()
        expect(jsonResponse.links).toEqual({
            first: '/articles?page=1',
            last: '/articles?page=5',
            prev: '/articles?page=1',
            next: '/articles?page=3',
        })
    })

    it('should use setCtx to set request URL from middleware', () => {
        // setCtx accepts any {req}-shaped object
        ResourceCollection.setCtx({ req: { originalUrl: '/products' } })

        const resource = {
            data: [{ id: 1 }],
            pagination: {
                currentPage: 1,
                lastPage: 2,
                nextPage: 2,
                firstPage: 1,
            },
        }

        const jsonResponse = new ResourceCollection(resource).getBody()
        expect(jsonResponse.links).toEqual({
            first: '/products?page=1',
            last: '/products?page=2',
            next: '/products?page=2',
        })
    })

    it('should prefer auto-detected URL over explicit pagination path', () => {
        ResourceCollection.setCtx({ req: { originalUrl: '/ignored' } })

        const resource = {
            data: [{ id: 1 }],
            pagination: {
                currentPage: 1,
                lastPage: 2,
                nextPage: 2,
                firstPage: 1,
                path: '/explicit-path',
            },
        }

        const jsonResponse = new ResourceCollection(resource).getBody()
        expect(jsonResponse.links).toEqual({
            first: '/ignored?page=1',
            last: '/ignored?page=2',
            next: '/ignored?page=2',
        })
        expect(jsonResponse.meta?.path).toBe('/ignored?page=1')
    })

    it('should maintain backward compatibility with bare response parameter', () => {
        const expressRes = { send: () => { } }

        const resource = {
            data: [{ id: 1 }],
            pagination: {
                currentPage: 1,
                lastPage: 2,
                nextPage: 2,
                firstPage: 1,
                path: '/users',
            },
        }

        const jsonResponse = new ResourceCollection(resource, expressRes as any).getBody()
        expect(jsonResponse.links).toEqual({
            first: '/users?page=1',
            last: '/users?page=2',
            next: '/users?page=2',
        })
    })

    it('should preserve existing query string from auto-detected Express URL', () => {
        const expressCtx = {
            req: { originalUrl: '/api/users?search=foo&sort=name' },
            res: { send: () => { } },
        }

        const resource = {
            data: [{ id: 1 }],
            pagination: {
                currentPage: 1,
                lastPage: 3,
                nextPage: 2,
                firstPage: 1,
            },
        }

        const jsonResponse = new ResourceCollection(resource, expressCtx as any).getBody()
        expect(jsonResponse.links).toEqual({
            first: '/api/users?search=foo&sort=name&page=1',
            last: '/api/users?search=foo&sort=name&page=3',
            next: '/api/users?search=foo&sort=name&page=2',
        })
    })

    it('should preserve query string from H3 event with Web Request URL', () => {
        const h3Ctx = {
            req: { url: 'http://localhost:3000/posts?tag=js' },
            res: {},
        }

        const resource = {
            data: [{ id: 1 }],
            pagination: {
                currentPage: 2,
                lastPage: 4,
                nextPage: 3,
                prevPage: 1,
                firstPage: 1,
            },
        }

        const jsonResponse = new ResourceCollection(resource, h3Ctx as any).getBody()
        expect(jsonResponse.links).toEqual({
            first: '/posts?tag=js&page=1',
            last: '/posts?tag=js&page=4',
            prev: '/posts?tag=js&page=1',
            next: '/posts?tag=js&page=3',
        })
    })

    it('should preserve query string with baseUrl configured', () => {
        setGlobalBaseUrl('https://api.example.com')
        setRequestUrl('/users?role=admin')

        const resource = {
            data: [{ id: 1 }],
            pagination: {
                currentPage: 1,
                lastPage: 2,
                nextPage: 2,
                firstPage: 1,
            },
        }

        const jsonResponse = new ResourceCollection(resource).getBody()
        expect(jsonResponse.links).toEqual({
            first: 'https://api.example.com/users?role=admin&page=1',
            last: 'https://api.example.com/users?role=admin&page=2',
            next: 'https://api.example.com/users?role=admin&page=2',
        })
    })

    it('should preserve query string when path is a full URL', () => {
        const resource = {
            data: [{ id: 1 }],
            pagination: {
                currentPage: 1,
                lastPage: 2,
                nextPage: 2,
                firstPage: 1,
                path: 'http://api.example.com/v2/users?status=active',
            },
        }

        const jsonResponse = new ResourceCollection(resource).getBody()
        expect(jsonResponse.links).toEqual({
            first: 'http://api.example.com/v2/users?status=active&page=1',
            last: 'http://api.example.com/v2/users?status=active&page=2',
            next: 'http://api.example.com/v2/users?status=active&page=2',
        })
    })
})
