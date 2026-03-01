import { afterEach, describe, expect, it } from 'vitest'
import {
    GenericResource,
    getCaseTransformer,
    getGlobalCase,
    Resource,
    ResourceCollection,
    ResourceData,
    setGlobalCase,
    splitWords,
    toCamelCase,
    toKebabCase,
    toPascalCase,
    toSnakeCase,
    transformKeys,
} from 'src'

describe('splitWords', () => {
    it('should split camelCase', () => {
        expect(splitWords('firstName')).toEqual(['first', 'name'])
    })

    it('should split PascalCase', () => {
        expect(splitWords('FirstName')).toEqual(['first', 'name'])
    })

    it('should split snake_case', () => {
        expect(splitWords('first_name')).toEqual(['first', 'name'])
    })

    it('should split kebab-case', () => {
        expect(splitWords('first-name')).toEqual(['first', 'name'])
    })

    it('should handle consecutive uppercase (acronyms)', () => {
        expect(splitWords('XMLParser')).toEqual(['xml', 'parser'])
    })

    it('should handle single word', () => {
        expect(splitWords('name')).toEqual(['name'])
    })

    it('should handle mixed separators', () => {
        expect(splitWords('user_firstName')).toEqual(['user', 'first', 'name'])
    })
})

describe('toCamelCase', () => {
    it('should convert snake_case to camelCase', () => {
        expect(toCamelCase('first_name')).toBe('firstName')
    })

    it('should convert PascalCase to camelCase', () => {
        expect(toCamelCase('FirstName')).toBe('firstName')
    })

    it('should convert kebab-case to camelCase', () => {
        expect(toCamelCase('first-name')).toBe('firstName')
    })

    it('should leave camelCase unchanged', () => {
        expect(toCamelCase('firstName')).toBe('firstName')
    })
})

describe('toSnakeCase', () => {
    it('should convert camelCase to snake_case', () => {
        expect(toSnakeCase('firstName')).toBe('first_name')
    })

    it('should convert PascalCase to snake_case', () => {
        expect(toSnakeCase('FirstName')).toBe('first_name')
    })

    it('should convert kebab-case to snake_case', () => {
        expect(toSnakeCase('first-name')).toBe('first_name')
    })

    it('should leave snake_case unchanged', () => {
        expect(toSnakeCase('first_name')).toBe('first_name')
    })
})

describe('toPascalCase', () => {
    it('should convert camelCase to PascalCase', () => {
        expect(toPascalCase('firstName')).toBe('FirstName')
    })

    it('should convert snake_case to PascalCase', () => {
        expect(toPascalCase('first_name')).toBe('FirstName')
    })

    it('should convert kebab-case to PascalCase', () => {
        expect(toPascalCase('first-name')).toBe('FirstName')
    })

    it('should leave PascalCase unchanged', () => {
        expect(toPascalCase('FirstName')).toBe('FirstName')
    })
})

describe('toKebabCase', () => {
    it('should convert camelCase to kebab-case', () => {
        expect(toKebabCase('firstName')).toBe('first-name')
    })

    it('should convert PascalCase to kebab-case', () => {
        expect(toKebabCase('FirstName')).toBe('first-name')
    })

    it('should convert snake_case to kebab-case', () => {
        expect(toKebabCase('first_name')).toBe('first-name')
    })

    it('should leave kebab-case unchanged', () => {
        expect(toKebabCase('first-name')).toBe('first-name')
    })
})

describe('getCaseTransformer', () => {
    it('should return the correct transformer for preset styles', () => {
        expect(getCaseTransformer('camel')).toBe(toCamelCase)
        expect(getCaseTransformer('snake')).toBe(toSnakeCase)
        expect(getCaseTransformer('pascal')).toBe(toPascalCase)
        expect(getCaseTransformer('kebab')).toBe(toKebabCase)
    })

    it('should return a custom transformer function as-is', () => {
        const custom = (key: string) => key.toUpperCase()
        expect(getCaseTransformer(custom)).toBe(custom)
    })
})

describe('transformKeys', () => {
    it('should transform top-level keys', () => {
        const result = transformKeys({ first_name: 'John', last_name: 'Doe' }, toCamelCase)
        expect(result).toEqual({ firstName: 'John', lastName: 'Doe' })
    })

    it('should transform nested object keys', () => {
        const result = transformKeys(
            { user_info: { first_name: 'John', home_address: { zip_code: '12345' } } },
            toCamelCase
        )
        expect(result).toEqual({
            userInfo: { firstName: 'John', homeAddress: { zipCode: '12345' } },
        })
    })

    it('should transform keys in arrays of objects', () => {
        const result = transformKeys(
            [{ first_name: 'John' }, { first_name: 'Jane' }],
            toCamelCase
        )
        expect(result).toEqual([{ firstName: 'John' }, { firstName: 'Jane' }])
    })

    it('should return primitives as-is', () => {
        expect(transformKeys('hello', toCamelCase)).toBe('hello')
        expect(transformKeys(42, toCamelCase)).toBe(42)
        expect(transformKeys(null, toCamelCase)).toBe(null)
        expect(transformKeys(undefined, toCamelCase)).toBe(undefined)
    })

    it('should return Date and RegExp instances as-is', () => {
        const date = new Date()
        const regex = /test/

        expect(transformKeys(date, toCamelCase)).toBe(date)
        expect(transformKeys(regex, toCamelCase)).toBe(regex)
    })
})

describe('Global Case Configuration', () => {
    afterEach(() => {
        setGlobalCase(undefined)
    })

    it('should default to undefined', () => {
        expect(getGlobalCase()).toBeUndefined()
    })

    it('should allow setting and getting a global case style', () => {
        setGlobalCase('snake')
        expect(getGlobalCase()).toBe('snake')
    })

    it('should apply global case to Resource when no per-resource override is set', () => {
        setGlobalCase('snake')

        const resource = new Resource({ firstName: 'John', lastName: 'Doe' })
        const body = resource.json().body

        expect(body).toEqual({ data: { first_name: 'John', last_name: 'Doe' } })
    })

    it('should apply global case to ResourceCollection', () => {
        setGlobalCase('snake')

        const collection = new ResourceCollection([
            { firstName: 'John', lastName: 'Doe' },
            { firstName: 'Jane', lastName: 'Smith' },
        ])
        const body = collection.json().body

        expect(body).toEqual({
            data: [
                { first_name: 'John', last_name: 'Doe' },
                { first_name: 'Jane', last_name: 'Smith' },
            ],
        })
    })

    it('should apply global case to GenericResource', () => {
        setGlobalCase('snake')

        const resource = new GenericResource({ firstName: 'John', lastName: 'Doe' })
        const body = resource.json().body

        expect(body).toEqual({ data: { first_name: 'John', last_name: 'Doe' } })
    })

    it('should clear global case when set to undefined', () => {
        setGlobalCase('snake')
        setGlobalCase(undefined)

        const resource = new Resource({ firstName: 'John' })
        const body = resource.json().body

        expect(body).toEqual({ data: { firstName: 'John' } })
    })
})

describe('Per-Resource Case Override', () => {
    afterEach(() => {
        setGlobalCase(undefined)
    })

    it('should apply per-resource snake_case on Resource subclass', () => {
        class SnakeResource extends Resource {
            static preferredCase = 'snake' as const

            data () {
                return {
                    firstName: this.firstName,
                    lastName: this.lastName,
                }
            }
        }

        const resource = new SnakeResource({ firstName: 'John', lastName: 'Doe' })
        const body = resource.json().body

        expect(body).toEqual({ data: { first_name: 'John', last_name: 'Doe' } })
    })

    it('should apply per-resource PascalCase on Resource subclass', () => {
        class PascalResource extends Resource {
            static preferredCase = 'pascal' as const

            data () {
                return {
                    first_name: this.first_name,
                    last_name: this.last_name,
                }
            }
        }

        const resource = new PascalResource({ first_name: 'John', last_name: 'Doe' })
        const body = resource.json().body

        expect(body).toEqual({ data: { FirstName: 'John', LastName: 'Doe' } })
    })

    it('should apply per-resource kebab-case on Resource subclass', () => {
        class KebabResource extends Resource {
            static preferredCase = 'kebab' as const

            data () {
                return {
                    firstName: this.firstName,
                    lastName: this.lastName,
                }
            }
        }

        const resource = new KebabResource({ firstName: 'John', lastName: 'Doe' })
        const body = resource.json().body

        expect(body).toEqual({ data: { 'first-name': 'John', 'last-name': 'Doe' } })
    })

    it('should apply per-resource camelCase on Resource subclass', () => {
        class CamelResource extends Resource {
            static preferredCase = 'camel' as const

            data () {
                return {
                    first_name: this.first_name,
                    last_name: this.last_name,
                }
            }
        }

        const resource = new CamelResource({ first_name: 'John', last_name: 'Doe' })
        const body = resource.json().body

        expect(body).toEqual({ data: { firstName: 'John', lastName: 'Doe' } })
    })

    it('should support custom transformer function on Resource subclass', () => {
        class UpperResource extends Resource {
            static preferredCase = ((key: string) => key.toUpperCase()) as any

            data () {
                return {
                    firstName: this.firstName,
                }
            }
        }

        const resource = new UpperResource({ firstName: 'John' })
        const body = resource.json().body

        expect(body).toEqual({ data: { FIRSTNAME: 'John' } })
    })

    it('should prefer per-resource case over global case', () => {
        setGlobalCase('kebab')

        class SnakeResource extends Resource {
            static preferredCase = 'snake' as const

            data () {
                return {
                    firstName: this.firstName,
                }
            }
        }

        const resource = new SnakeResource({ firstName: 'John' })
        const body = resource.json().body

        expect(body).toEqual({ data: { first_name: 'John' } })
    })

    it('should apply per-collection case on ResourceCollection subclass', () => {
        class SnakeCollection<R extends ResourceData[]> extends ResourceCollection<R> {
            static preferredCase = 'snake' as const
        }

        const collection = new SnakeCollection([
            { firstName: 'John', lastName: 'Doe' },
        ])
        const body = collection.json().body

        expect(body).toEqual({
            data: [{ first_name: 'John', last_name: 'Doe' }],
        })
    })

    it('should apply per-resource case on GenericResource subclass', () => {
        class SnakeGeneric extends GenericResource {
            static preferredCase = 'snake' as const
        }

        const resource = new SnakeGeneric({ firstName: 'John', lastName: 'Doe' })
        const body = resource.json().body

        expect(body).toEqual({ data: { first_name: 'John', last_name: 'Doe' } })
    })
})

describe('Case Transformation with Collections', () => {
    afterEach(() => {
        setGlobalCase(undefined)
    })

    it('should transform keys in collection items when using Resource.collection()', () => {
        class SnakeResource extends Resource {
            static preferredCase = 'snake' as const

            data () {
                return {
                    firstName: this.firstName,
                    lastName: this.lastName,
                }
            }
        }

        const collection = SnakeResource.collection([
            { firstName: 'John', lastName: 'Doe' },
            { firstName: 'Jane', lastName: 'Smith' },
        ])
        const body = collection.json().body

        expect(body).toEqual({
            data: [
                { first_name: 'John', last_name: 'Doe' },
                { first_name: 'Jane', last_name: 'Smith' },
            ],
        })
    })

    it('should transform keys in paginated collection items', () => {
        setGlobalCase('snake')

        const collection = new ResourceCollection({
            data: [
                { firstName: 'John', lastName: 'Doe' },
            ],
            pagination: { currentPage: 1, total: 10 },
        })
        const body = collection.json().body

        expect(body).toEqual({
            data: [{ first_name: 'John', last_name: 'Doe' }],
            meta: { current_page: 1, total: 10 },
        })
    })

    it('should transform deeply nested keys', () => {
        setGlobalCase('snake')

        const resource = new Resource({
            userName: 'john',
            userProfile: {
                firstName: 'John',
                homeAddress: {
                    zipCode: '12345',
                    streetName: 'Main St',
                },
            },
        })
        const body = resource.json().body

        expect(body).toEqual({
            data: {
                user_name: 'john',
                user_profile: {
                    first_name: 'John',
                    home_address: {
                        zip_code: '12345',
                        street_name: 'Main St',
                    },
                },
            },
        })
    })
})


describe('Case Transformation with async/await', () => {
    afterEach(() => {
        setGlobalCase(undefined)
    })

    it('should produce transformed keys when awaited', async () => {
        setGlobalCase('snake')

        const resource = new Resource({ firstName: 'John', lastName: 'Doe' })
        const result = await resource.then(res => res)

        expect(result).toEqual({ data: { first_name: 'John', last_name: 'Doe' } })
    })

    it('should produce transformed keys when collection is awaited', async () => {
        setGlobalCase('snake')

        const collection = new ResourceCollection([
            { firstName: 'John' },
        ])
        const result = await collection.then(res => res)

        expect(result).toEqual({ data: [{ first_name: 'John' }] })
    })
})
