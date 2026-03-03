import { ResponseFactory, ResponseFactoryContext } from '../types'

import { isPlainObject } from './objects'

/**
 * Builds a response envelope based on the provided payload, 
 * metadata, and configuration options.
 * 
 * @param config The configuration object containing payload, metadata, and other options for building the response.
 */
export const buildResponseEnvelope = ({
    payload,
    meta,
    metaKey = 'meta',
    wrap = true,
    rootKey = 'data',
    factory,
    context,
}: {
    payload: any
    meta?: Record<string, any> | undefined
    metaKey?: string
    wrap?: boolean
    rootKey?: string
    factory?: ResponseFactory | undefined
    context: Omit<ResponseFactoryContext, 'rootKey' | 'meta'>
}): Record<string, any> => {
    if (factory) {
        return factory(payload, {
            ...context,
            rootKey,
            meta,
        })
    }

    if (!wrap) {
        if (typeof meta === 'undefined') {
            return payload
        }

        if (isPlainObject(payload)) {
            return {
                ...payload,
                [metaKey]: meta,
            }
        }

        return {
            [rootKey]: payload,
            [metaKey]: meta,
        }
    }

    const body: Record<string, any> = { [rootKey]: payload }
    if (typeof meta !== 'undefined') {
        body[metaKey] = meta
    }

    return body
}
