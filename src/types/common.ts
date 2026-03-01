/**
 * @description A type representing a case transformation strategy.
 * Can be a preset string ('camel', 'snake', 'pascal', 'kebab') or a custom transformer function.
 */
export type CaseStyle = 'camel' | 'snake' | 'pascal' | 'kebab' | ((key: string) => string)

/**
 * @description A type representing the resource serializer variant.
 */
export type ResponseKind = 'resource' | 'collection' | 'generic'

/**
 * @description Context passed into a response factory function.
 */
export interface ResponseFactoryContext {
    type: ResponseKind
    rootKey: string
    resource: any
    meta?: Record<string, any> | undefined
}

/**
 * @description A factory used to produce a fully custom response envelope.
 */
export type ResponseFactory = (payload: any, context: ResponseFactoryContext) => Record<string, any>

/**
 * @description Structure options for customizing the response envelope.
 */
export interface ResponseStructureConfig {
    /**
     * @description Whether payloads should be wrapped in a root key.
     * Set to false to return unwrapped payloads when possible.
     * @default true
     */
    wrap?: boolean | undefined

    /**
     * @description The key used to wrap resource payloads.
     * @default 'data'
     */
    rootKey?: string | undefined

    /**
     * @description A factory for complete control over the final response structure.
     */
    factory?: ResponseFactory | undefined
}
