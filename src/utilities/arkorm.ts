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

type ResoraCollectionLike = {
    toObject: () => unknown
    toObjectAsync?: () => Promise<unknown>
    getBody: () => unknown
    getBodyAsync?: () => Promise<unknown>
    json: () => unknown
    setCollects: (...args: unknown[]) => unknown
    isSerializationPending?: () => boolean
}

type ResoraSerializerLike = {
    getBody: () => unknown
    getBodyAsync?: () => Promise<unknown>
    json: () => unknown
    toObject: () => unknown
    isSerializationPending?: () => boolean
}

export const isPromiseLike = (value: unknown): value is PromiseLike<unknown> => {
    return !!value
        && (typeof value === 'object' || typeof value === 'function')
        && typeof (value as PromiseLike<unknown>).then === 'function'
}

export const requiresAsyncNormalization = (value: unknown): boolean => {
    if (isResoraCollectionLike(value) || isResoraSerializerLike(value)) {
        value.getBody()

        return value.isSerializationPending?.() ?? false
    }

    if (isPromiseLike(value)) {
        return true
    }

    if (Array.isArray(value)) {
        return value.some(item => requiresAsyncNormalization(item))
    }

    if (isPlainObject(value)) {
        return Object.values(value).some(item => requiresAsyncNormalization(item))
    }

    return false
}

const unwrapNestedSerializerBody = (body: unknown) => {
    if (isPlainObject(body) && 'data' in body) {
        return body.data
    }

    return body
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

export const isResoraSerializerLike = (value: unknown): value is ResoraSerializerLike => {
    if (!value || typeof value !== 'object') {
        return false
    }

    const candidate = value as Partial<ResoraSerializerLike>

    return typeof candidate.toObject === 'function'
        && typeof candidate.getBody === 'function'
        && typeof candidate.json === 'function'
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

    if (isResoraSerializerLike(value)) {
        return normalizeSerializableData(unwrapNestedSerializerBody(value.getBody()))
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

export const normalizeSerializableDataAsync = async (value: unknown): Promise<unknown> => {
    if (isResoraCollectionLike(value)) {
        const object = typeof value.toObjectAsync === 'function'
            ? await value.toObjectAsync()
            : value.toObject()

        return normalizeSerializableDataAsync(object)
    }

    if (isResoraSerializerLike(value)) {
        const body = typeof value.getBodyAsync === 'function'
            ? await value.getBodyAsync()
            : value.getBody()

        return normalizeSerializableDataAsync(unwrapNestedSerializerBody(body))
    }

    const awaitedValue = isPromiseLike(value)
        ? await value
        : value

    if (Array.isArray(awaitedValue)) {
        return Promise.all(awaitedValue.map(item => normalizeSerializableDataAsync(item)))
    }

    if (isArkormLikeModel(awaitedValue)) {
        return normalizeSerializableDataAsync(awaitedValue.toObject())
    }

    if (isArkormLikeCollection(awaitedValue)) {
        return normalizeSerializableDataAsync(awaitedValue.all())
    }

    if (isPlainObject(awaitedValue)) {
        const entries = await Promise.all(
            Object.entries(awaitedValue).map(async ([key, nestedValue]) => [
                key,
                await normalizeSerializableDataAsync(nestedValue),
            ])
        )

        return Object.fromEntries(entries)
    }

    return awaitedValue
}
