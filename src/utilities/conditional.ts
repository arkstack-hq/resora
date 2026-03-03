import { isPlainObject } from './objects'

export const CONDITIONAL_ATTRIBUTE_MISSING = Symbol('resora.conditional.missing')

/**
 * Resolves a value based on a condition. If the condition is falsy, it returns a special symbol indicating that the attribute is missing. 
 * 
 * 
 * @param condition The condition to evaluate.
 * @param value The value or function to resolve if the condition is truthy.
 * @returns The resolved value or a symbol indicating the attribute is missing.
 */
export const resolveWhen = <T> (condition: any, value: T | (() => T)): T | typeof CONDITIONAL_ATTRIBUTE_MISSING => {
    if (!condition) {
        return CONDITIONAL_ATTRIBUTE_MISSING
    }

    return typeof value === 'function'
        ? (value as () => T)()
        : value
}

/**
 * Resolves a value only if it is not null or undefined. 
 * 
 * @param value The value to resolve.
 * @returns The resolved value or a symbol indicating the attribute is missing.
 */
export const resolveWhenNotNull = <T> (value: T | null | undefined): T | typeof CONDITIONAL_ATTRIBUTE_MISSING => {
    return value === null || typeof value === 'undefined'
        ? CONDITIONAL_ATTRIBUTE_MISSING
        : value
}

/**
 * Conditionally merges object attributes based on a condition. 
 * 
 * @param condition 
 * @param value 
 * @returns 
 */
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

/**
 *  Recursively sanitizes an object or array by removing any attributes that are marked as missing using the special symbol.
 * 
 * @param value The value to sanitize.
 * @returns The sanitized value.
 */
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
