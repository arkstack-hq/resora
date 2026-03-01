import { isPlainObject } from './objects'

export const CONDITIONAL_ATTRIBUTE_MISSING = Symbol('resora.conditional.missing')

export const resolveWhen = <T> (condition: any, value: T | (() => T)): T | typeof CONDITIONAL_ATTRIBUTE_MISSING => {
    if (!condition) {
        return CONDITIONAL_ATTRIBUTE_MISSING
    }

    return typeof value === 'function'
        ? (value as () => T)()
        : value
}

export const resolveWhenNotNull = <T> (value: T | null | undefined): T | typeof CONDITIONAL_ATTRIBUTE_MISSING => {
    return value === null || typeof value === 'undefined'
        ? CONDITIONAL_ATTRIBUTE_MISSING
        : value
}

export const resolveMergeWhen = <T extends Record<string, any>> (
    condition: any,
    value: T | (() => T)
): Partial<T> => {
    if (!condition) {
        return {}
    }

    const resolved = typeof value === 'function'
        ? (value as () => T)()
        : value

    return isPlainObject(resolved) ? resolved : {}
}

export const sanitizeConditionalAttributes = (value: any): any => {
    if (value === CONDITIONAL_ATTRIBUTE_MISSING) {
        return CONDITIONAL_ATTRIBUTE_MISSING
    }

    if (Array.isArray(value)) {
        return value
            .map((item) => sanitizeConditionalAttributes(item))
            .filter((item) => item !== CONDITIONAL_ATTRIBUTE_MISSING)
    }

    if (isPlainObject(value)) {
        const result: Record<string, any> = {}

        for (const [key, nestedValue] of Object.entries(value)) {
            const sanitizedValue = sanitizeConditionalAttributes(nestedValue)

            if (sanitizedValue === CONDITIONAL_ATTRIBUTE_MISSING) {
                continue
            }

            result[key] = sanitizedValue
        }

        return result
    }

    return value
}
