import { Resource } from './Resource'

/**
 * ApiResource function to return the Resource instance
 * 
 * @param instance Resource instance
 * @returns Resource instance
 */
export function ApiResource<R extends Resource> (instance: Resource<R>): Resource<R> {
    return instance
}
