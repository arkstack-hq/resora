import { MetaData } from '../types'
import { isPlainObject } from './objects'

/**
 * Resolves metadata from a resource instance by checking for a custom `with` method. 
 * If the method exists and is different from the base method, it calls it to retrieve metadata. 
 * This allows resources to provide additional metadata for response construction.
 * 
 * @param instance The resource instance to check for a custom `with` method.
 * @param baseWithMethod The base `with` method to compare against.
 * @returns The resolved metadata or `undefined` if no custom metadata is provided.
 */
export const resolveWithHookMetadata = (
    instance: any,
    baseWithMethod: (...args: any[]) => any
): MetaData | undefined => {
    const candidate = instance?.with
    if (typeof candidate !== 'function' || candidate === baseWithMethod) {
        return undefined
    }

    if (candidate.length > 0) {
        return undefined
    }

    const result = candidate.call(instance)

    return isPlainObject(result) ? result : undefined
}
