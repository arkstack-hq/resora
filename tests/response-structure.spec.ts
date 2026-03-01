import { afterEach, describe, expect, it } from 'vitest'
import {
    GenericResource,
    Resource,
    ResourceCollection,
    setGlobalCase,
    setGlobalResponseFactory,
    setGlobalResponseRootKey,
    setGlobalResponseStructure,
    setGlobalResponseWrap,
} from 'src'

describe('Response Structure', () => {
    afterEach(() => {
        setGlobalResponseStructure(undefined)
        setGlobalResponseRootKey(undefined)
        setGlobalResponseFactory(undefined)
        setGlobalResponseWrap(undefined)
        setGlobalCase(undefined)
    })

    it('uses the default data root key', () => {
        const resource = new Resource({ id: 1, name: 'Test' })

        expect(resource.json().body).toEqual({
            data: { id: 1, name: 'Test' },
        })
    })

    it('supports global custom root key', () => {
        setGlobalResponseRootKey('payload')

        const resource = new Resource({ id: 1, name: 'Test' })

        expect(resource.json().body).toEqual({
            payload: { id: 1, name: 'Test' },
        })
    })

    it('supports per-resource root key override over global root key', () => {
        setGlobalResponseRootKey('payload')

        class UserResource extends Resource {
            static responseStructure = {
                rootKey: 'result',
            }
        }

        const resource = new UserResource({ id: 1, name: 'Test' })

        expect(resource.json().body).toEqual({
            result: { id: 1, name: 'Test' },
        })
    })

    it('merges additional data into custom root key payload', () => {
        setGlobalResponseRootKey('payload')

        const resource = new Resource({ id: 1, name: 'Test' })

        expect(resource.additional({ data: { age: 20 }, meta: 'ok' }).body).toEqual({
            payload: { id: 1, name: 'Test', age: 20 },
            data: { age: 20 },
            meta: 'ok',
        })
    })

    it('supports global custom response factory', () => {
        setGlobalResponseFactory((payload, context) => ({
            result: payload,
            message: 'success',
            type: context.type,
        }))

        const resource = new Resource({ id: 1, name: 'Test' })

        expect(resource.json().body).toEqual({
            result: { id: 1, name: 'Test' },
            message: 'success',
            type: 'resource',
        })
    })

    it('supports per-resource custom response factory override over global factory', () => {
        setGlobalResponseFactory((payload) => ({
            global: payload,
        }))

        class UserResource extends Resource {
            static responseStructure = {
                factory: (payload: any) => ({
                    local: payload,
                    source: 'resource',
                }),
            }
        }

        const resource = new UserResource({ id: 1, name: 'Test' })

        expect(resource.json().body).toEqual({
            local: { id: 1, name: 'Test' },
            source: 'resource',
        })
    })

    it('supports global custom root key for collections and preserves meta', () => {
        setGlobalResponseRootKey('items')

        const collection = new ResourceCollection({
            data: [{ id: 1, name: 'A' }],
            pagination: { currentPage: 1, total: 10 },
        })

        expect(collection.json().body).toEqual({
            items: [{ id: 1, name: 'A' }],
            meta: { current_page: 1, total: 10 },
        })
    })

    it('applies collected resource response structure in Resource.collection()', () => {
        class UserResource extends Resource {
            static responseStructure = {
                rootKey: 'items',
            }

            data () {
                return {
                    id: this.id,
                    fullName: this.fullName,
                }
            }
        }

        const collection = UserResource.collection([
            { id: 1, fullName: 'John Doe' },
        ])

        expect(collection.json().body).toEqual({
            items: [{ id: 1, fullName: 'John Doe' }],
        })
    })

    it('supports per-collection response structure override over collected resource', () => {
        class UserResource extends Resource {
            static responseStructure = {
                rootKey: 'items',
            }
        }

        class UserCollection extends ResourceCollection {
            static responseStructure = {
                rootKey: 'results',
            }

            collects = UserResource
        }

        const collection = new UserCollection([
            { id: 1, name: 'A' },
        ])

        expect(collection.json().body).toEqual({
            results: [{ id: 1, name: 'A' }],
        })
    })

    it('supports global custom root key for generic resources', () => {
        setGlobalResponseRootKey('result')

        const resource = new GenericResource({ id: 1, name: 'Test' })

        expect(resource.json().body).toEqual({
            result: { id: 1, name: 'Test' },
        })
    })

    it('supports global factory on generic resources with context', () => {
        setGlobalResponseFactory((payload, context) => ({
            value: payload,
            kind: context.type,
            root: context.rootKey,
        }))

        const resource = new GenericResource({ id: 1, name: 'Test' })

        expect(resource.json().body).toEqual({
            value: { id: 1, name: 'Test' },
            kind: 'generic',
            root: 'data',
        })
    })

    it('works together with case customization and custom root key', () => {
        setGlobalCase('snake')
        setGlobalResponseRootKey('payload')

        const resource = new Resource({ firstName: 'John', lastName: 'Doe' })

        expect(resource.json().body).toEqual({
            payload: { first_name: 'John', last_name: 'Doe' },
        })
    })

    it('supports disabling wrapping globally for plain resources', () => {
        setGlobalResponseWrap(false)

        const resource = new Resource({ id: 1, name: 'Test' })

        expect(resource.json().body).toEqual({ id: 1, name: 'Test' })
    })

    it('supports per-resource wrap override over global wrap setting', () => {
        setGlobalResponseWrap(false)

        class UserResource extends Resource {
            static responseStructure = {
                wrap: true,
                rootKey: 'result',
            }
        }

        const resource = new UserResource({ id: 1, name: 'Test' })

        expect(resource.json().body).toEqual({
            result: { id: 1, name: 'Test' },
        })
    })

    it('keeps meta while wrap is disabled for plain object payloads', () => {
        setGlobalResponseWrap(false)

        const resource = new Resource({ id: 1, name: 'Test' })
        const body = resource.withMeta({ requestId: 'r-1' }).json().body

        expect(body).toEqual({
            id: 1,
            name: 'Test',
            requestId: 'r-1',
        })
    })

    it('falls back to wrapped output for array payloads with meta when wrap is disabled', () => {
        setGlobalResponseWrap(false)

        const collection = new ResourceCollection({
            data: [{ id: 1, name: 'A' }],
            pagination: { currentPage: 1, total: 10 },
        })

        expect(collection.json().body).toEqual({
            data: [{ id: 1, name: 'A' }],
            meta: { current_page: 1, total: 10 },
        })
    })

    it('returns bare arrays for collections without meta when wrap is disabled', () => {
        setGlobalResponseWrap(false)

        const collection = new ResourceCollection([
            { id: 1, name: 'A' },
            { id: 2, name: 'B' },
        ])

        expect(collection.json().body).toEqual([
            { id: 1, name: 'A' },
            { id: 2, name: 'B' },
        ])
    })
})
