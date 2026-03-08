import { ArkormCollection, LengthAwarePaginator, Model, Paginator } from 'arkormx'
import { GenericResource, Resource, ResourceCollection } from 'src'
import { beforeAll, describe, expect, it } from 'vitest'

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
        return this.toArray()
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
        const models = await UserModel.query().paginate(2)

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
                links: {
                    prev: null,
                    next: '/users?page=2',
                },
            },
        })
    })
})
