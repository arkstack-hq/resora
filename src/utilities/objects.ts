export const isPlainObject = (value: any): value is Record<string, any> => {
    if (typeof value !== 'object' || value === null) return false
    if (Array.isArray(value) || value instanceof Date || value instanceof RegExp) return false

    const proto = Object.getPrototypeOf(value)

    return proto === Object.prototype || proto === null
}

export const appendRootProperties = (
    body: any,
    extra?: Record<string, any> | undefined,
    rootKey: string = 'data'
): any => {
    if (!extra || Object.keys(extra).length === 0) {
        return body
    }

    if (Array.isArray(body)) {
        return {
            [rootKey]: body,
            ...extra,
        }
    }

    if (isPlainObject(body)) {
        return {
            ...body,
            ...extra,
        }
    }

    return {
        [rootKey]: body,
        ...extra,
    }
}

export const mergeMetadata = (
    base?: Record<string, any> | undefined,
    incoming?: Record<string, any> | undefined
): Record<string, any> | undefined => {
    if (!incoming) return base
    if (!base) return incoming

    const merged: Record<string, any> = { ...base }

    for (const [key, value] of Object.entries(incoming)) {
        const existing = merged[key]
        if (isPlainObject(existing) && isPlainObject(value)) {
            merged[key] = mergeMetadata(existing, value)
        } else {
            merged[key] = value
        }
    }

    return merged
}
