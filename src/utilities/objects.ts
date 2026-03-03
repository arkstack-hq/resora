/**
 * Utility functions for working with objects, including type checking, merging, and property manipulation.
 * 
 * @param value The value to check.
 * @returns `true` if the value is a plain object, `false` otherwise.
 */
export const isPlainObject = (value: any): value is Record<string, any> => {
    if (typeof value !== 'object' || value === null) return false
    if (Array.isArray(value) || value instanceof Date || value instanceof RegExp) return false

    const proto = Object.getPrototypeOf(value)

    return proto === Object.prototype || proto === null
}

/**
 * Appends extra properties to a response body, ensuring that the main data is wrapped under a specified root key if necessary.
 * 
 * @param body The original response body, which can be an object, array, or primitive value.
 * @param extra Extra properties to append to the response body.
 * @param rootKey The root key under which to wrap the main data if necessary.
 * @returns The response body with the extra properties appended.
 */
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

/**
 * Deeply merges two metadata objects, combining nested objects recursively.
 * 
 * @param base The base metadata object to merge into.
 * @param incoming The incoming metadata object to merge from.
 * @returns 
 */
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
