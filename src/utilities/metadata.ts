import { MetaData } from '../types'
import { isPlainObject } from './objects'

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
