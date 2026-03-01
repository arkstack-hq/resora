import { afterEach, describe, expect, it } from 'vitest'

import { GenericResource, Resource, ResourceCollection, setGlobalResponseRootKey } from 'src'

describe('Metadata with() API', () => {
    afterEach(() => {
        setGlobalResponseRootKey(undefined)
    })

    it('adds metadata to a single resource', () => {
        const resource = new Resource({ id: 1, name: 'John' })
        const body = resource.with({ traceId: 'abc-123' }).json().body

        expect(body).toEqual({
            data: { id: 1, name: 'John' },
            traceId: 'abc-123',
        })
    })

    it('adds metadata via callback on a single resource', () => {
        const resource = new Resource({ id: 1, role: 'admin' })
        const body = resource.withMeta((r) => ({ actor: r.role })).json().body

        expect(body).toEqual({
            data: { id: 1, role: 'admin' },
            actor: 'admin',
        })
    })

    it('merges metadata from multiple with() calls', () => {
        const resource = new Resource({ id: 1 })
        const body = resource
            .with({ request: { id: 'r1', source: 'api' } })
            .with({ request: { source: 'worker' }, debug: true })
            .json().body

        expect(body).toEqual({
            data: { id: 1 },
            request: { id: 'r1', source: 'worker' },
            debug: true,
        })
    })

    it('supports with() called after json()', () => {
        const resource = new Resource({ id: 1 })
        resource.json()

        const body = resource.with({ late: true }).body

        expect(body).toEqual({
            data: { id: 1 },
            late: true,
        })
    })

    it('merges custom metadata with pagination metadata on collections', () => {
        const collection = new ResourceCollection({
            data: [{ id: 1 }],
            pagination: { currentPage: 1, total: 10 },
        })

        const body = collection.with({ requestId: 'r-100' }).json().body

        expect(body).toEqual({
            data: [{ id: 1 }],
            meta: {
                current_page: 1,
                total: 10,
            },
            requestId: 'r-100',
        })
    })

    it('merges custom metadata with cursor metadata on collections', () => {
        const collection = new ResourceCollection({
            data: [{ id: 1 }],
            cursor: { previous: 'p1', next: 'n1' },
        })

        const body = collection.with({ requestId: 'r-200' }).json().body

        expect(body).toEqual({
            data: [{ id: 1 }],
            meta: {
                cursor: { previous: 'p1', next: 'n1' },
            },
            requestId: 'r-200',
        })
    })

    it('works with custom root key and with()', () => {
        setGlobalResponseRootKey('payload')

        const resource = new Resource({ id: 1, name: 'John' })
        const body = resource.with({ requestId: 'req-1' }).json().body

        expect(body).toEqual({
            payload: { id: 1, name: 'John' },
            requestId: 'req-1',
        })
    })

    it('supports with() on GenericResource', () => {
        const resource = new GenericResource({ id: 1, role: 'admin' })
        const body = resource.with({ policy: 'strict' }).json().body

        expect(body).toEqual({
            data: { id: 1, role: 'admin' },
            policy: 'strict',
        })
    })

    it('preserves defaults when subclass defines a no-arg with() hook', () => {
        class CustomResource extends Resource {
            with () {
                return {
                    feature: 'custom-resource-meta',
                }
            }
        }

        const resource = new CustomResource({ id: 1, name: 'John' })

        expect(resource.json().body).toEqual({
            data: { id: 1, name: 'John' },
            feature: 'custom-resource-meta',
        })
    })

    it('preserves pagination defaults when collection subclass defines with() hook', () => {
        class CustomCollection<R extends { data: any[]; pagination: any }> extends ResourceCollection<R> {
            with () {
                return {
                    requestId: 'req-900',
                }
            }
        }

        const collection = new CustomCollection({
            data: [{ id: 1 }],
            pagination: { currentPage: 2, total: 20 },
        })

        expect(collection.json().body).toEqual({
            data: [{ id: 1 }],
            meta: {
                current_page: 2,
                total: 20,
            },
            requestId: 'req-900',
        })
    })

    it('preserves cursor defaults when collection subclass defines with() hook', () => {
        class CustomCollection<R extends { data: any[]; cursor: any }> extends ResourceCollection<R> {
            with () {
                return {
                    trace: 'trace-42',
                }
            }
        }

        const collection = new CustomCollection({
            data: [{ id: 1 }],
            cursor: { previous: 'p1', next: 'n1' },
        })

        expect(collection.json().body).toEqual({
            data: [{ id: 1 }],
            meta: {
                cursor: { previous: 'p1', next: 'n1' },
            },
            trace: 'trace-42',
        })
    })
})
