import { describe, expect, it } from 'vitest'

import { GenericResource, Resource, ResourceCollection } from 'src'

describe('Conditional Attributes', () => {
    it('supports when(), whenNotNull(), and mergeWhen() on Resource', () => {
        class UserResource extends Resource<{
            id: number
            isAdmin?: boolean
            email?: string | null
        }> {
            data () {
                return {
                    id: this.id,
                    role: this.when(this.isAdmin, 'admin'),
                    email: this.whenNotNull(this.email),
                    ...this.mergeWhen(this.isAdmin, {
                        permissions: ['manage-users'],
                    }),
                }
            }
        }

        const adminBody = new UserResource({ id: 1, isAdmin: true, email: 'admin@example.com' }).json().body
        const memberBody = new UserResource({ id: 2, isAdmin: false, email: null }).json().body

        expect(adminBody).toEqual({
            data: {
                id: 1,
                role: 'admin',
                email: 'admin@example.com',
                permissions: ['manage-users'],
            },
        })

        expect(memberBody).toEqual({
            data: {
                id: 2,
            },
        })
    })

    it('evaluates when() and mergeWhen() callbacks lazily', () => {
        class LazyResource extends Resource<{ enabled: boolean }> {
            data () {
                return {
                    enabled: this.enabled,
                    value: this.when(this.enabled, () => {
                        this.hitCount += 1

                        return 'loaded'
                    }),
                    ...this.mergeWhen(this.enabled, () => {
                        this.mergeHitCount += 1

                        return { extra: true }
                    }),
                }
            }
        }

        const disabled = new LazyResource({ enabled: false })
        disabled.hitCount = 0
        disabled.mergeHitCount = 0

        expect(disabled.json().body).toEqual({
            data: {
                enabled: false,
            },
        })
        expect(disabled.hitCount).toBe(0)
        expect(disabled.mergeHitCount).toBe(0)

        const enabled = new LazyResource({ enabled: true })
        enabled.hitCount = 0
        enabled.mergeHitCount = 0

        expect(enabled.json().body).toEqual({
            data: {
                enabled: true,
                value: 'loaded',
                extra: true,
            },
        })
        expect(enabled.hitCount).toBe(1)
        expect(enabled.mergeHitCount).toBe(1)
    })

    it('supports conditional attributes in collected resources', () => {
        class UserResource extends Resource<{ id: number; isAdmin?: boolean }> {
            data () {
                return {
                    id: this.id,
                    ...this.mergeWhen(this.isAdmin, {
                        role: 'admin',
                    }),
                }
            }
        }

        class UserCollection extends ResourceCollection<{ id: number; isAdmin: boolean }[]> {
            collects = UserResource
        }

        const body = new UserCollection([
            { id: 1, isAdmin: true },
            { id: 2, isAdmin: false },
        ]).json().body

        expect(body).toEqual({
            data: [
                { id: 1, role: 'admin' },
                { id: 2 },
            ],
        })
    })

    it('supports conditional attributes in GenericResource', () => {
        class UserGeneric extends GenericResource<{ id: number; nickname?: string | null; active?: boolean }> {
            data () {
                return {
                    id: this.id,
                    nickname: this.whenNotNull(this.nickname),
                    state: this.when(this.active, 'active'),
                }
            }
        }

        expect(new UserGeneric({ id: 1, nickname: null, active: false }).json().body).toEqual({
            data: {
                id: 1,
            },
        })

        expect(new UserGeneric({ id: 2, nickname: 'neo', active: true }).json().body).toEqual({
            data: {
                id: 2,
                nickname: 'neo',
                state: 'active',
            },
        })
    })
})
