import { CaseStyle, Config, ResponseFactory, ResponseStructureConfig } from '../types'
import { AsyncLocalStorage } from 'node:async_hooks'

let globalPreferredCase: CaseStyle | undefined
let globalResponseStructure: ResponseStructureConfig | undefined
let globalPaginatedExtras: Config['paginatedExtras'] = ['meta', 'links']
let globalPaginatedLinks: Config['paginatedLinks'] = {
    first: 'first',
    last: 'last',
    prev: 'prev',
    next: 'next',
}
let globalBaseUrl: Config['baseUrl'] = ''
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

let globalRequestUrl: string | undefined
let globalCtx: unknown
const requestContextStore = new AsyncLocalStorage<{
    ctx: unknown
    url?: string
}>()

/**
 * Sets the current request URL, used as a fallback for pagination link generation
 * when no explicit path is provided in the pagination data.
 * 
 * @param url The request URL or pathname to set.
 */
export const setRequestUrl = (url: string | undefined): void => {
    globalRequestUrl = url
}

/**
 * Retrieves the current request URL, used as a fallback path for pagination links.
 * 
 * @returns The current request URL, or undefined if not set.
 */
export const getRequestUrl = (): string | undefined => {
    return requestContextStore.getStore()?.url ?? globalRequestUrl
}

export const runWithCtx = <T> (ctx: unknown, callback: () => T): T => {
    return requestContextStore.run({
        ctx,
        url: extractRequestUrl(ctx),
    }, callback)
}

export const getCtx = (): unknown => {
    return requestContextStore.getStore()?.ctx ?? globalCtx
}

/**
 * Extracts the request URL pathname (with query string) from an HTTP context.
 *
 * Both Express middleware and H3 HTTPEvent expose `{ req, res }`. The `req`
 * object carries URL information:
 * - H3 / Web standard `Request`: `req.url` is a full URL string
 * - Express `Request`: `req.originalUrl` is the pathname + query string
 *
 * The function also accepts a plain `req` object directly or a string URL.
 *
 * @param ctx An HTTP context `{ req, res }`, a bare `Request` object, or a string URL.
 * @returns The pathname with query string, or undefined.
 */
export const extractRequestUrl = (ctx: unknown): string | undefined => {
    if (!ctx || typeof ctx !== 'object') {
        return typeof ctx === 'string' ? ctx : undefined
    }

    const obj = ctx as Record<string, any>

    // Context with `req` property ({ req, res } from Express middleware or H3 HTTPEvent)
    if (obj.req && typeof obj.req === 'object') {
        return extractUrlFromRequest(obj.req)
    }

    // Bare request object passed directly
    return extractUrlFromRequest(obj)
}

/**
 * Extracts the URL pathname + query string from a request object.
 *
 * Handles both Web standard `Request` (H3) where `url` is a full URL string,
 * and Express `Request` where `originalUrl` or `url` provide the path.
 */
const extractUrlFromRequest = (req: Record<string, any>): string | undefined => {
    // Express Request: `originalUrl` is the most reliable path + query
    if (typeof req.originalUrl === 'string') {
        return req.originalUrl
    }

    // Web standard Request (H3): `url` is a full URL string — extract pathname + search
    if (typeof req.url === 'string') {
        try {
            const parsed = new URL(req.url)

            return parsed.pathname + parsed.search
        } catch {
            // Not a valid absolute URL, use as-is (likely already a path)
            return req.url
        }
    }

    return undefined
}

/**
 * Extracts the response object from an HTTP context.
 *
 * If the context has a `res` property (Express middleware `{ req, res }` or
 * H3 HTTPEvent), returns `ctx.res`. Otherwise assumes the value is already
 * a bare response object and returns it directly.
 *
 * @param ctx The HTTP context or bare response.
 * @returns The response object, or undefined.
 */
export const extractResponseFromCtx = (ctx: unknown): any | undefined => {
    if (!ctx || typeof ctx !== 'object') {
        return undefined
    }

    const obj = ctx as Record<string, any>

    // Context with `res` property ({ req, res } from Express or H3)
    if (obj.res && typeof obj.res === 'object') {
        return obj.res
    }

    // Bare response object passed directly
    return ctx
}

/**
 * Sets the current request context. Extracts the request URL from the provided
 * context and stores it for use in pagination link generation.
 * 
 * Can be called from middleware to make the request URL available to all
 * resources created during the request lifecycle.
 * 
 * @param ctx An HTTP context `{ req, res }`, Express Request, H3 HTTPEvent, or bare request.
 */
export const setCtx = (ctx: unknown): void => {
    globalCtx = ctx
    setRequestUrl(extractRequestUrl(ctx))
}
