import { ArkormCollection, Model } from 'arkormx'
import { describe, expect, it } from 'vitest'

import { Resource } from 'src'

class TestArkormModel extends Model<Record<string, unknown>> {
}

describe('Arkorm integration', () => {
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
})
