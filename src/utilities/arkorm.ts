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

export const isArkormLikeModel = (value: unknown): value is ArkormLikeModel => {
    if (!value || typeof value !== 'object') {
        return false
    }

    const candidate = value as Partial<ArkormLikeModel>

    return typeof candidate.toObject === 'function'
        && typeof candidate.getRawAttributes === 'function'
}

export const isArkormLikeCollection = (value: unknown): value is ArkormLikeCollection => {
    if (!value || typeof value !== 'object') {
        return false
    }

    const candidate = value as Partial<ArkormLikeCollection>

    return typeof candidate.all === 'function'
}

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
