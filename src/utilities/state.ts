import { CaseStyle, Config, ResponseFactory, ResponseStructureConfig } from '../types'

let globalPreferredCase: CaseStyle | undefined
let globalResponseStructure: ResponseStructureConfig | undefined
let globalPaginatedExtras: Config['paginatedExtras'] = ['meta', 'links']
let globalPaginatedLinks: Config['paginatedLinks'] = {
    first: 'first',
    last: 'last',
    prev: 'prev',
    next: 'next',
}
let globalBaseUrl: Config['baseUrl'] = 'https://localhost'
let globalPageName: Config['pageName'] = 'page'
let globalPaginatedMeta: Config['paginatedMeta'] = {
    to: 'to',
    from: 'from',
    links: 'links',
    path: 'path',
    total: 'total',
    per_page: 'per_page',
    last_page: 'last_page',
    current_page: 'current_page',
}
let globalCursorMeta: Config['cursorMeta'] = {
    previous: 'previous',
    next: 'next',
}

/**
 * Sets the global case style for response keys, which will be applied 
 * to all responses unless overridden by individual resource configurations.
 * 
 * @param style The case style to set as the global default for response keys. 
 */
export const setGlobalCase = (style: CaseStyle | undefined): void => {
    globalPreferredCase = style
}

/**
 * Retrieves the global case style for response keys, which is used 
 * to determine how keys in responses should be formatted.
 * 
 * @returns 
 */
export const getGlobalCase = (): CaseStyle | undefined => {
    return globalPreferredCase
}

/**
 * Sets the global response structure configuration, which defines how 
 * responses should be structured across the application.
 * 
 * @param config The response structure configuration object.
 */
export const setGlobalResponseStructure = (config: ResponseStructureConfig | undefined): void => {
    globalResponseStructure = config
}

/**
 * Retrieves the global response structure configuration, which 
 * defines how  responses should be structured across the application.
 * 
 * @returns 
 */
export const getGlobalResponseStructure = (): ResponseStructureConfig | undefined => {
    return globalResponseStructure
}

/**
 * Sets the global response root key, which is the key under which 
 * the main data will be nested in responses if wrapping is enabled.
 * 
 * @param rootKey The root key to set for response data.
 */
export const setGlobalResponseRootKey = (rootKey: string | undefined): void => {
    globalResponseStructure = {
        ...(globalResponseStructure || {}),
        rootKey,
    }
}

/**
 * Sets the global response wrap option, which determines whether responses 
 * should be wrapped in a root key or returned unwrapped when possible.
 * 
 * @param wrap The wrap option to set for responses.
 */
export const setGlobalResponseWrap = (wrap: boolean | undefined): void => {
    globalResponseStructure = {
        ...(globalResponseStructure || {}),
        wrap,
    }
}

/**
 * Retrieves the global response wrap option, which indicates whether responses 
 * should be wrapped in a root key or returned unwrapped when possible.
 * 
 * @returns 
 */
export const getGlobalResponseWrap = (): boolean | undefined => {
    return globalResponseStructure?.wrap
}

/**
 * Retrieves the global response root key, which is the key under which the main 
 * data will be nested in responses if wrapping is enabled.
 * 
 * @returns 
 */
export const getGlobalResponseRootKey = (): string | undefined => {
    return globalResponseStructure?.rootKey
}

/**
 * Sets the global response factory, which is a custom function that can be used 
 * to produce a completely custom response structure based on the provided 
 * payload and context.
 * 
 * @param factory The response factory function to set as the global default for response construction.
 */
export const setGlobalResponseFactory = (factory: ResponseFactory | undefined): void => {
    globalResponseStructure = {
        ...(globalResponseStructure || {}),
        factory,
    }
}

/**
 * Retrieves the global response factory, which is a custom function that 
 * can be used to produce a completely custom response structure based on 
 * the provided payload and context.
 * 
 * @returns 
 */
export const getGlobalResponseFactory = (): ResponseFactory | undefined => {
    return globalResponseStructure?.factory
}

/**
 * Sets the global paginated extras configuration, which defines the keys 
 * to use for pagination metadata, links, and cursor information in paginated responses.
 * 
 * @param extras The paginated extras configuration object.
 */
export const setGlobalPaginatedExtras = (extras: Config['paginatedExtras']): void => {
    globalPaginatedExtras = extras
}

/**
 * Retrieves the global paginated extras configuration, which defines the keys to use for pagination metadata, links, and cursor information in paginated responses.
 * 
 * @returns 
 */
export const getGlobalPaginatedExtras = (): Config['paginatedExtras'] => {
    return globalPaginatedExtras
}

/**
 * Sets the global paginated links configuration, which defines the keys to 
 * use for pagination links (first, last, prev, next) in paginated responses.
 * 
 * @param links The paginated links configuration object.
 */
export const setGlobalPaginatedLinks = (links: Config['paginatedLinks']): void => {
    globalPaginatedLinks = {
        ...globalPaginatedLinks,
        ...links,
    }
}

/**
 * Retrieves the global paginated links configuration, which defines the keys to use for pagination links (first, last, prev, next) in paginated responses.
 * 
 * @returns 
 */
export const getGlobalPaginatedLinks = (): Config['paginatedLinks'] => {
    return globalPaginatedLinks
}

/**
 * Sets the global base URL, which is used for generating pagination links in responses.
 * 
 * @param baseUrl The base URL to set for pagination link generation.
 */
export const setGlobalBaseUrl = (baseUrl: Config['baseUrl']): void => {
    globalBaseUrl = baseUrl
}

/**
 * Retrieves the global base URL, which is used for generating pagination links in responses.
 * 
 * @returns 
 */
export const getGlobalBaseUrl = (): Config['baseUrl'] => {
    return globalBaseUrl
}

/**
 * Sets the global page name, which is the query parameter name used for the page number in paginated requests and link generation.
 * 
 * @param pageName 
 */
export const setGlobalPageName = (pageName: Config['pageName']): void => {
    globalPageName = pageName
}

/**
 * Retrieves the global page name, which is the query parameter name 
 * used for the page number in paginated requests and link generation.
 * 
 * @returns 
 */
export const getGlobalPageName = (): Config['pageName'] => {
    return globalPageName
}

/**
 * Retrieves the keys to use for pagination extras (meta, links, cursor) based 
 * on the global configuration.
 * 
 * @param meta Whether to include pagination metadata in the response.
 */
export const setGlobalPaginatedMeta = (meta: Config['paginatedMeta']): void => {
    globalPaginatedMeta = meta
}

/**
 * Retrieves the keys to use for pagination extras (meta, links, cursor) based 
 * on the global configuration.
 * 
 * @returns The global pagination metadata configuration.
 */
export const getGlobalPaginatedMeta = (): Config['paginatedMeta'] => {
    return globalPaginatedMeta
}

/**
 * Sets the global cursor meta configuration, which defines the keys to use 
 * for cursor pagination metadata (previous, next) in responses.
 * 
 * @param meta The cursor meta configuration object.
 */
export const setGlobalCursorMeta = (meta: Config['cursorMeta']): void => {
    globalCursorMeta = {
        ...globalCursorMeta,
        ...meta,
    }
}

/**
 * Retrieves the keys to use for cursor pagination metadata (previous, next) in 
 * responses based on the global configuration.
 * 
 * @returns The global cursor pagination metadata configuration.
 */
export const getGlobalCursorMeta = (): Config['cursorMeta'] => {
    return globalCursorMeta
}
