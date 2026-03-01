import { afterEach, describe, expect, it } from 'vitest'

import {
    Resource,
    ResourceCollection,
    setGlobalBaseUrl,
    setGlobalCursorMeta,
    setGlobalPageName,
    setGlobalPaginatedExtras,
} from 'src'

describe('Resource Pagination', () => {
    afterEach(() => {
        setGlobalBaseUrl('https://localhost')
        setGlobalPageName('page')
        setGlobalPaginatedExtras(['meta', 'links'])
        setGlobalCursorMeta({ previous: 'previous', next: 'next' })
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
        const jsonResponse = jsonResource.json().body

        expect(jsonResponse).toEqual({
            data: [{ id: 1 }, { id: 2 }],
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
        const jsonResponse = jsonResource.json().body
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
        const jsonResponse = jsonResource.json().body

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
        const jsonResponse = jsonResource.json().body

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

        const jsonResponse = new ResourceCollection(resource).json().body

        expect(jsonResponse).toEqual({
            data: [{ id: 1 }, { id: 2 }],
            links: {
                first: 'https://api.example.com/v1/users?p=1',
                next: 'https://api.example.com/v1/users?p=3',
            },
            meta: {
                current_page: 2,
                path: '/users',
            },
        })
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

        const jsonResponse = new ResourceCollection(resource).json().body

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
        const jsonResponse = jsonResource.json().body

        expect(jsonResponse).toEqual({
            data: [{ id: 1 }, { id: 2 }],
        })
    })
})
