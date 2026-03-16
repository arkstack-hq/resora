import { ArkormCollection, LengthAwarePaginator, Model, Paginator } from 'arkormx'
import { GenericResource, Resource, ResourceCollection, setRequestUrl } from 'src'
import { afterEach, beforeAll, describe, expect, it } from 'vitest'

class TestArkormModel extends Model<Record<string, unknown>> {
}

class UserModel extends Model<{ id: number, name: string }> {
}

class UserResource extends Resource {
    public data () {
        return {
            id: this.id,
            name: this.name,
        }
    }
}

class UserCollection extends ResourceCollection {
    collects = UserResource
    public data () {
        return this.toObject()
    }
}

describe('Arkorm integration', () => {
    beforeAll(() => {
        UserModel.query = () => ({
            paginate: (pp: number) => new LengthAwarePaginator<UserModel>([
                new UserModel({ id: 1, name: 'Jane' }),
                new UserModel({ id: 2, name: 'John' }),
            ], 2, pp, 1, { path: '/users' }),
        } as never)
    })

    it('serializes Arkorm-like models without manual mapping', () => {
        const model = new TestArkormModel({ id: 1, name: 'Jane' })

        const resource = new Resource(model)

        expect(resource.getBody()).toEqual({
            data: {
                id: 1,
                name: 'Jane',
            },
        })
    })

    it('serializes eager-loaded Arkorm-like relationships', () => {
        const profile = new TestArkormModel({ id: 10, bio: 'Creator' })
        const posts = new ArkormCollection([
            new TestArkormModel({ id: 100, title: 'First' }),
            new TestArkormModel({ id: 101, title: 'Second' }),
        ])

        const user = new TestArkormModel({
            id: 1,
            name: 'Jane',
            profile,
            posts,
        })

        const resource = new Resource(user)

        expect(resource.getBody()).toEqual({
            data: {
                id: 1,
                name: 'Jane',
                profile: {
                    id: 10,
                    bio: 'Creator',
                },
                posts: [
                    { id: 100, title: 'First' },
                    { id: 101, title: 'Second' },
                ],
            },
        })
    })

    it('serializes eager-loaded Arkorm-like relationships in extended collections', async () => {
        const models = await UserModel.query().paginate(1, 2)

        const collection = new UserCollection(models)

        expect(collection.getBody()).toMatchObject({
            data: [
                { id: 1, name: 'Jane' },
                { id: 2, name: 'John' },
            ],
        })
    })

    it('serializes ArkormCollection directly without casting', () => {
        const models = new ArkormCollection([
            new TestArkormModel({ id: 1, name: 'A' }),
            new TestArkormModel({ id: 2, name: 'B' }),
        ])

        const collection = Resource.collection(models)

        expect(collection.getBody()).toEqual({
            data: [
                { id: 1, name: 'A' },
                { id: 2, name: 'B' },
            ],
        })
    })

    it('serializes LengthAwarePaginator in ResourceCollection', () => {
        const models = new ArkormCollection([
            new TestArkormModel({ id: 1, name: 'A' }),
            new TestArkormModel({ id: 2, name: 'B' }),
        ])

        const paginator = new LengthAwarePaginator(models, 10, 2, 2, { path: '/users' })
        const collection = new ResourceCollection(paginator)

        expect(collection.getBody()).toEqual({
            data: [
                { id: 1, name: 'A' },
                { id: 2, name: 'B' },
            ],
            links: {
                first: '/users?page=1',
                last: '/users?page=5',
                prev: '/users?page=1',
                next: '/users?page=3',
            },
            meta: {
                total: 10,
                per_page: 2,
                current_page: 2,
                last_page: 5,
                from: 3,
                to: 4,
                path: '/users?page=2',
                links: {
                    first: '/users?page=1',
                    last: '/users?page=5',
                    prev: '/users?page=1',
                    next: '/users?page=3',
                },
            },
        })
    })

    it('accepts explicit LengthAwarePaginator<UserModel> without TS errors', () => {
        const models = new ArkormCollection<UserModel>([
            new UserModel({ id: 1, name: 'A' }),
            new UserModel({ id: 2, name: 'B' }),
        ])

        const paginator = new LengthAwarePaginator<UserModel>(
            models,
            10,
            2,
            1,
            { path: '/users' }
        )

        const collection = new ResourceCollection(paginator)
        const body = collection.getBody()

        expect(body.data).toEqual([
            { id: 1, name: 'A' },
            { id: 2, name: 'B' },
        ])
    })

    it('serializes simple Paginator in GenericResource', () => {
        const models = new ArkormCollection([
            new TestArkormModel({ id: 1, name: 'A' }),
            new TestArkormModel({ id: 2, name: 'B' }),
        ])

        const paginator = new Paginator(models, 2, 1, true, { path: '/users' })
        const resource = new GenericResource(paginator)
        const body = JSON.parse(JSON.stringify(resource.getBody()))

        expect(body).toEqual({
            data: [
                { id: 1, name: 'A' },
                { id: 2, name: 'B' },
            ],
            links: {
                prev: null,
                next: '/users?page=2',
            },
            meta: {
                per_page: 2,
                current_page: 1,
                from: 1,
                to: 2,
                path: '/users?page=1',
                links: {
                    prev: null,
                    next: '/users?page=2',
                },
            },
        })
    })

    describe('HTTP context integration', () => {
        afterEach(() => {
            setRequestUrl(undefined)
        })

        it('serializes Arkorm model with { req, res } context', () => {
            const model = new TestArkormModel({ id: 1, name: 'Jane' })
            const ctx = {
                req: { originalUrl: '/api/users/1' },
                res: { send: () => { } },
            }

            const resource = new Resource(model, ctx as any)

            expect(resource.getBody()).toEqual({
                data: { id: 1, name: 'Jane' },
            })
        })

        it('serializes ArkormCollection with { req, res } context', () => {
            const models = new ArkormCollection([
                new TestArkormModel({ id: 1, name: 'A' }),
                new TestArkormModel({ id: 2, name: 'B' }),
            ])
            const ctx = {
                req: { originalUrl: '/api/users' },
                res: { send: () => { } },
            }

            const collection = new ResourceCollection(models, ctx as any)

            expect(collection.getBody()).toEqual({
                data: [
                    { id: 1, name: 'A' },
                    { id: 2, name: 'B' },
                ],
            })
        })

        it('prefers auto-detected URL over paginator path for LengthAwarePaginator', () => {
            const models = new ArkormCollection([
                new TestArkormModel({ id: 1, name: 'A' }),
                new TestArkormModel({ id: 2, name: 'B' }),
            ])
            const paginator = new LengthAwarePaginator(models, 10, 2, 2, { path: '/users' })
            const ctx = {
                req: { originalUrl: '/api/v2/users?search=foo' },
                res: { send: () => { } },
            }

            const collection = new ResourceCollection(paginator, ctx as any)
            const body = collection.getBody()

            // Auto-detected request URL takes priority over paginator path
            expect(body.links).toEqual({
                first: '/api/v2/users?search=foo&page=1',
                last: '/api/v2/users?search=foo&page=5',
                prev: '/api/v2/users?search=foo&page=1',
                next: '/api/v2/users?search=foo&page=3',
            })
            expect((body.meta as any)?.path).toBe('/api/v2/users?search=foo&page=2')
        })

        it('auto-detects URL for plain pagination data with Arkorm models', () => {
            const ctx = {
                req: { originalUrl: '/api/users' },
                res: { send: () => { } },
            }

            const resource = {
                data: [
                    new TestArkormModel({ id: 1, name: 'A' }),
                    new TestArkormModel({ id: 2, name: 'B' }),
                ],
                pagination: {
                    currentPage: 2,
                    lastPage: 5,
                    nextPage: 3,
                    prevPage: 1,
                    firstPage: 1,
                },
            }

            const collection = new ResourceCollection(resource, ctx as any)
            const body = collection.getBody()

            expect(body.data).toEqual([
                { id: 1, name: 'A' },
                { id: 2, name: 'B' },
            ])
            expect(body.links).toEqual({
                first: '/api/users?page=1',
                last: '/api/users?page=5',
                prev: '/api/users?page=1',
                next: '/api/users?page=3',
            })
            expect(body.meta?.path).toBe('/api/users?page=2')
        })

        it('auto-detects URL with query string for plain pagination with Arkorm models', () => {
            const ctx = {
                req: { originalUrl: '/api/users?role=admin&sort=name' },
                res: { send: () => { } },
            }

            const resource = {
                data: [
                    new TestArkormModel({ id: 1, name: 'A' }),
                ],
                pagination: {
                    currentPage: 1,
                    lastPage: 3,
                    nextPage: 2,
                    firstPage: 1,
                },
            }

            const collection = new ResourceCollection(resource, ctx as any)
            const body = collection.getBody()

            expect(body.links).toEqual({
                first: '/api/users?role=admin&sort=name&page=1',
                last: '/api/users?role=admin&sort=name&page=3',
                next: '/api/users?role=admin&sort=name&page=2',
            })
            expect(body.meta?.path).toBe('/api/users?role=admin&sort=name&page=1')
        })

        it('serializes Arkorm Paginator in GenericResource with H3-like { req, res } context', () => {
            const models = new ArkormCollection([
                new TestArkormModel({ id: 1, name: 'A' }),
                new TestArkormModel({ id: 2, name: 'B' }),
            ])
            const paginator = new Paginator(models, 2, 1, true, { path: '/users' })
            const ctx = {
                req: { url: 'http://localhost:3000/users' },
                res: {},
            }

            const resource = new GenericResource(paginator, ctx as any)
            const body = JSON.parse(JSON.stringify(resource.getBody()))

            expect(body.data).toEqual([
                { id: 1, name: 'A' },
                { id: 2, name: 'B' },
            ])
            expect(body.links).toEqual({
                prev: null,
                next: '/users?page=2',
            })
        })

        it('uses setCtx to set URL for Arkorm collection with plain pagination', () => {
            Resource.setCtx({ req: { originalUrl: '/products' } })

            const resource = {
                data: new ArkormCollection([
                    new TestArkormModel({ id: 1, name: 'Widget' }),
                ]),
                pagination: {
                    currentPage: 1,
                    lastPage: 2,
                    nextPage: 2,
                    firstPage: 1,
                },
            }

            const collection = new ResourceCollection(resource as never)
            const body = collection.getBody()

            expect(body.data).toEqual([{ id: 1, name: 'Widget' }])
            expect(body.links).toEqual({
                first: '/products?page=1',
                last: '/products?page=2',
                next: '/products?page=2',
            })
        })
    })
})
