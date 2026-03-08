import { GenericResource, ResourceData } from 'src'
import { ArkormCollection, Model } from 'arkormx'
import { describe, expect, it } from 'vitest'

class TestArkormModel extends Model<Record<string, unknown>> {
}

describe('Generic Core', () => {
    it('should create a Resource instance with correct data', () => {
        const resourceData: ResourceData = { id: 1, name: 'Test Resource' }
        const jsonResource = new GenericResource(resourceData)

        expect(jsonResource).toBeInstanceOf(GenericResource)
        expect(jsonResource.data()).toEqual(resourceData)
    })

    it('should allow access to resource properties directly on the instance', () => {
        const resourceData: ResourceData = { id: 2, name: 'Another Resource' }
        const jsonResource = new GenericResource(resourceData)

        expect(jsonResource.id).toBe(2)
        expect(jsonResource.name).toBe('Another Resource')
    })

    it('should allow setting properties directly on the instance', () => {
        const resourceData: ResourceData = { id: 3, name: 'Third Resource' }
        const jsonResource = new GenericResource(resourceData)

        jsonResource.name = 'Updated Resource'
        expect(jsonResource.name).toBe('Updated Resource')
        expect(jsonResource.data().name).toBe('Updated Resource')
    })

    it('should serialize Arkorm-like models without manual mapping', () => {
        const model = new TestArkormModel({ id: 1, name: 'Jane' })
        const resource = new GenericResource(model)

        expect(resource.getBody()).toEqual({
            data: {
                id: 1,
                name: 'Jane',
            },
        })
    })

    it('should serialize Arkorm-like eager-loaded relationships', () => {
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

        const resource = new GenericResource(user)

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

    it('should serialize arrays of Arkorm-like models', () => {
        const models = new ArkormCollection([
            new TestArkormModel({ id: 1, name: 'A' }),
            new TestArkormModel({ id: 2, name: 'B' }),
        ])

        const resource = new GenericResource(models)

        expect(resource.getBody()).toEqual({
            data: [
                { id: 1, name: 'A' },
                { id: 2, name: 'B' },
            ],
        })
    })
}) 