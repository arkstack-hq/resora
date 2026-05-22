import { isPlainObject } from './objects'

type ArkormLikeModel = {
    toObject: () => Record<string, any> | PromiseLike<Record<string, any>>
    getRawAttributes?: () => Record<string, any>
    getAttribute?: (key: string) => unknown
    setAttribute?: (key: string, value: unknown) => unknown
}

type ArkormLikeCollection = {
    all: () => unknown
}

type ResoraCollectionLike = {
    toObject: () => unknown
    getBody: () => unknown
    json: () => unknown
    setCollects: (...args: unknown[]) => unknown
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
 * Type guard to check if a value is a Resora collection-like serializer.
 *
 * @param value
 * @returns
 */
export const isResoraCollectionLike = (value: unknown): value is ResoraCollectionLike => {
    if (!value || typeof value !== 'object') {
        return false
    }

    const candidate = value as Partial<ResoraCollectionLike>

    return typeof candidate.toObject === 'function'
        && typeof candidate.getBody === 'function'
        && typeof candidate.json === 'function'
        && typeof candidate.setCollects === 'function'
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

    if (isResoraCollectionLike(value)) {
        return normalizeSerializableData(value.toObject())
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

const isPromiseLike = <T = any> (value: unknown): value is PromiseLike<T> => {
    return !!value
        && (typeof value === 'object' || typeof value === 'function')
        && typeof (value as PromiseLike<T>).then === 'function'
}

/**
 * Async variant of normalizeSerializableData. It resolves promise-like values at
 * every nesting level before converting Arkorm-like models and collections.
 *
 * @param value The value to normalize
 * @returns The normalized value, ready for serialization
 */
export const normalizeSerializableDataAsync = async (value: unknown): Promise<unknown> => {
    const resolvedValue = isPromiseLike(value)
        ? await value
        : value

    if (Array.isArray(resolvedValue)) {
        return Promise.all(resolvedValue.map(item => normalizeSerializableDataAsync(item)))
    }

    if (isResoraCollectionLike(resolvedValue)) {
        return normalizeSerializableDataAsync(resolvedValue.toObject())
    }

    if (isArkormLikeModel(resolvedValue)) {
        return normalizeSerializableDataAsync(resolvedValue.toObject())
    }

    if (isArkormLikeCollection(resolvedValue)) {
        return normalizeSerializableDataAsync(resolvedValue.all())
    }

    if (isPlainObject(resolvedValue)) {
        const entries = await Promise.all(
            Object.entries(resolvedValue).map(async ([key, nestedValue]) => {
                return [key, await normalizeSerializableDataAsync(nestedValue)] as const
            })
        )

        return entries.reduce<Record<string, any>>((accumulator, [key, nestedValue]) => {
            accumulator[key] = nestedValue

            return accumulator
        }, {})
    }

    return resolvedValue
}
