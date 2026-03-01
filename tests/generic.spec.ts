import { describe, expect, it } from 'vitest'

import { GenericResource, ResourceData } from 'src'

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
}) 