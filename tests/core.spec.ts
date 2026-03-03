import { Collectible, Resource, ResourceCollection, ResourceData } from 'src'
import { describe, expect, it } from 'vitest'

describe('Core', () => {
    it('should create a Resource instance', () => {
        const resource = { id: 1, name: 'Test Resource' }
        const jsonResource = new Resource(resource)

        expect(jsonResource).toBeInstanceOf(Resource)
    })

    it('should return the original resource data', () => {
        const resource = { id: 1, name: 'Test Resource' }
        const jsonResource = new Resource(resource)

        expect(jsonResource.data()).toEqual(resource)
    })

    it('should convert resource to JSON response format', () => {
        const resource = { id: 1, name: 'Test Resource' }
        const jsonResource = new Resource(resource)

        expect(jsonResource.getBody()).toEqual({ data: resource })
    })

    it('should allow chaining of methods', () => {
        const resource = { id: 1, name: 'Test Resource' }
        const jsonResource = new Resource(resource)

        expect(jsonResource.additional({ meta: 'test' }).getBody()).toEqual({
            data: resource,
            meta: 'test',
        })
    })

    it('should build a response object', () => {
        const resource = { id: 1, name: 'Test Resource' }
        const jsonResource = new Resource(resource)

        const response = jsonResource.response({} as any)
        expect(response).toBeInstanceOf(Object)
    })

    it('should allow chaining with async/await', async () => {
        const resource = { id: 1, name: 'Test Resource' }
        const jsonResource = new Resource(resource)

        const response = await jsonResource.then(res => res)
        expect(response).toEqual({ data: resource })
    })

    it('should allow class-level withResponse to mutate final body before dispatch', async () => {
        class CustomResource extends Resource {
            withResponse () {
                this.setBody({
                    ...this.getBody(),
                    meta: {
                        fromWithResponse: true,
                    },
                })
            }
        }

        const resource = { id: 1, name: 'Test Resource' }
        const response = await new CustomResource(resource).json()

        expect(response).toEqual({
            data: resource,
            meta: {
                fromWithResponse: true,
            },
        })
    })
})

describe('Extending Resources', () => {
    it('should allow extending the Resource class', () => {
        class CustomResource extends Resource {
            data () {
                return this.toArray()
            }
        }

        const resource = { id: 1, name: 'Test Resource' }
        const customResource = new CustomResource(resource)

        expect(customResource).toBeInstanceOf(Resource)
        expect(customResource.data()).toEqual(resource)
    })

    it('should handle custom data in the extended class', () => {
        class CustomResource extends Resource {
            data () {
                return {
                    id: this.id,
                    name: this.name,
                    custom: 'data'
                }
            }
        }

        const resource = { id: 1, name: 'Test Resource' }
        const customResource = new CustomResource(resource)

        expect(customResource.data()).toEqual({ id: 1, custom: 'data', name: 'Test Resource' })
    })

    it('should allow chaining of methods in extended classes', () => {
        class CustomResource extends Resource {
            data () {
                return this.toArray()
            }
        }

        const resource = [{ id: 1, name: 'Test Resource' }]
        const customResource = new CustomResource(resource)

        expect(customResource.additional({ meta: 'test' }).getBody()).toEqual({
            data: [{ id: 1, name: 'Test Resource' }],
            meta: 'test',
        })
    })

    it('can make collections from the Resource class', () => {
        class CustomResource extends Resource {
            data () {
                return {
                    id: this.id,
                    name: this.name,
                    custom: 'data'
                }
            }
        }

        const resource = [{ id: 1, name: 'Test Resource' }]
        const collection = CustomResource.collection(resource)

        expect(collection.getBody()).toEqual({ data: [{ id: 1, name: 'Test Resource', custom: 'data' }] })
        expect(collection).toBeInstanceOf(ResourceCollection)
        expect(collection.data()).toEqual(resource)
    })
})

describe('Extending Collections', () => {
    it('should handle non paginated collections', () => {
        class CustomResource extends Resource {
            data () {
                return {
                    id: this.id,
                    name: this.name,
                    custom: 'data'
                }
            }
        }

        class CustomCollection<R extends ResourceData[]> extends ResourceCollection<R> {
            collects = CustomResource

            data () {
                return this.toArray()
            }
        }

        const resource = [{ id: 1, name: 'Test Resource' }]
        const customResource = new CustomCollection(resource)
        expect(customResource.getBody()).toEqual({ data: [{ id: 1, name: 'Test Resource', custom: 'data' }] })
    })

    it('should handle pagination in collections', () => {
        class CustomResource extends Resource {
            data () {
                return {
                    id: this.id,
                    name: this.name,
                    custom: 'data'
                }
            }
        }

        class CustomCollection<R extends Collectible> extends ResourceCollection<R> {
            collects = CustomResource

            data () {
                return this.toArray()
            }
        }

        const resource = { data: [{ id: 1, name: 'Test Resource' }], pagination: { currentPage: 1, total: 10 } }
        const customResource = new CustomCollection(resource)

        expect(customResource.getBody()).toEqual({
            data: [{ id: 1, name: 'Test Resource', custom: 'data' }],
            meta: { current_page: 1, total: 10 },
        })
    })

    it('should handle cursor pagination in collections', () => {
        class CustomResource extends Resource {
            data () {
                return {
                    id: this.id,
                    name: this.name,
                    custom: 'data'
                }
            }
        }

        class CustomCollection<R extends Collectible> extends ResourceCollection<R> {
            collects = CustomResource

            data () {
                return this.toArray()
            }
        }

        const resource = { data: [{ id: 1, name: 'Test Resource' }], cursor: { previous: 'abc', next: 'def' } }
        const customResource = new CustomCollection(resource)

        expect(customResource.getBody()).toEqual({
            data: [{ id: 1, name: 'Test Resource', custom: 'data' }],
            meta: { cursor: resource.cursor },
        })
    })

    it('should handle both pagination and cursor in collections', () => {
        class CustomResource extends Resource {
            data () {
                return {
                    id: this.id,
                    name: this.name,
                    custom: 'data'
                }
            }
        }

        class CustomCollection<R extends Collectible> extends ResourceCollection<R> {
            collects = CustomResource

            data () {
                return this.toArray()
            }
        }

        const resource = {
            data: [{ id: 1, name: 'Test Resource' }],
            pagination: { currentPage: 1, total: 10 },
            cursor: { previous: 'abc', next: 'def' }
        }
        const customResource = new CustomCollection(resource)

        expect(customResource.getBody()).toEqual({
            data: [{ id: 1, name: 'Test Resource', custom: 'data' }],
            meta: { current_page: 1, total: 10, cursor: resource.cursor },
        })
    })

    it('should allow chaining of methods in extended collection classes', () => {
        class CustomResource extends Resource {
            data () {
                return {
                    id: this.id,
                    name: this.name,
                    custom: 'data'
                }
            }
        }

        class CustomCollection<R extends Collectible> extends ResourceCollection<R> {
            collects = CustomResource

            data () {
                return this.toArray()
            }
        }

        const resource = { data: [{ id: 1, name: 'Test Resource' }] }
        const customResource = new CustomCollection(resource)

        expect(customResource.additional({ meta: 'test' }).getBody()).toEqual({
            data: [{ id: 1, name: 'Test Resource', custom: 'data' }],
            meta: 'test',
        })
    })
})