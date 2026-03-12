import { isPlainObject } from './objects'

type ArkormLikeModel = {
    toObject: () => Record<string, any>
    getRawAttributes?: () => Record<string, any>
    getAttribute?: (key: string) => unknown
    setAttribute?: (key: string, value: unknown) => unknown
}

type ArkormLikeCollection = {
    all: () => unknown
}

/**
 * Type guard to check if a value is an Arkorm-like model, which is defined as an object 
 * that has a toObject method and optionally getRawAttributes, getAttribute, and 
 * setAttribute methods.
 * 
 * @param value  The value to check
 * @returns True if the value is an Arkorm-like model, false otherwise
 */
export const isArkormLikeModel = (value: unknown): value is ArkormLikeModel => {
    if (!value || typeof value !== 'object') {
        return false
    }

    const candidate = value as Partial<ArkormLikeModel>

    return typeof candidate.toObject === 'function'
        && typeof candidate.getRawAttributes === 'function'
}

/**
 * Type guard to check if a value is an Arkorm-like collection, which is defined as an object
 * 
 * @param value 
 * @returns 
 */
export const isArkormLikeCollection = (value: unknown): value is ArkormLikeCollection => {
    if (!value || typeof value !== 'object') {
        return false
    }

    const candidate = value as Partial<ArkormLikeCollection>

    return typeof candidate.all === 'function'
}

/**
 * Normalize a value for serialization by recursively converting Arkorm-like models and 
 * collections to plain objects, while preserving the structure of arrays and plain objects.
 * 
 * @param value The value to normalize
 * @returns The normalized value, ready for serialization
 */
export const normalizeSerializableData = (value: unknown): unknown => {
    if (Array.isArray(value)) {
        return value.map(item => normalizeSerializableData(item))
    }

    if (isArkormLikeModel(value)) {
        return normalizeSerializableData(value.toObject())
    }

    if (isArkormLikeCollection(value)) {
        const collectionData = value.all()

        if (Array.isArray(collectionData)) {
            return collectionData.map(item => normalizeSerializableData(item))
        }

        return normalizeSerializableData(collectionData)
    }

    if (isPlainObject(value)) {
        return Object.entries(value).reduce<Record<string, any>>((accumulator, [key, nestedValue]) => {
            accumulator[key] = normalizeSerializableData(nestedValue)

            return accumulator
        }, {})
    }

    return value
}
