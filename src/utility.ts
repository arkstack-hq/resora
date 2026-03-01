import { CaseStyle, Config, MetaData, ResponseFactory, ResponseFactoryContext, ResponseStructureConfig } from './types'

import { existsSync } from 'fs'
import path from 'path'

/**
 * Global preferred case style applied to all resources that don't specify their own.
 */
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
 * Set the global preferred case style for all resources.
 *
 * @param style  A preset case style or a custom transformer function.
 */
export const setGlobalCase = (style: CaseStyle | undefined): void => {
    globalPreferredCase = style
}

/**
 * Get the current global preferred case style.
 */
export const getGlobalCase = (): CaseStyle | undefined => {
    return globalPreferredCase
}

/**
 * Set global response structure options.
 *
 * @param config  Response structure options
 */
export const setGlobalResponseStructure = (config: ResponseStructureConfig | undefined): void => {
    globalResponseStructure = config
}

/**
 * Get global response structure options.
 */
export const getGlobalResponseStructure = (): ResponseStructureConfig | undefined => {
    return globalResponseStructure
}

/**
 * Set a global response root key.
 *
 * @param rootKey  Key used to wrap payloads
 */
export const setGlobalResponseRootKey = (rootKey: string | undefined): void => {
    globalResponseStructure = {
        ...(globalResponseStructure || {}),
        rootKey,
    }
}

/**
 * Enable or disable global data wrapping behavior.
 *
 * @param wrap  Whether payloads should be wrapped in a root key
 */
export const setGlobalResponseWrap = (wrap: boolean | undefined): void => {
    globalResponseStructure = {
        ...(globalResponseStructure || {}),
        wrap,
    }
}

/**
 * Get the global wrap behavior.
 */
export const getGlobalResponseWrap = (): boolean | undefined => {
    return globalResponseStructure?.wrap
}

/**
 * Get the global response root key.
 */
export const getGlobalResponseRootKey = (): string | undefined => {
    return globalResponseStructure?.rootKey
}

/**
 * Set a global response factory.
 *
 * @param factory  Function that builds the final response body
 */
export const setGlobalResponseFactory = (factory: ResponseFactory | undefined): void => {
    globalResponseStructure = {
        ...(globalResponseStructure || {}),
        factory,
    }
}

/**
 * Get the global response factory.
 */
export const getGlobalResponseFactory = (): ResponseFactory | undefined => {
    return globalResponseStructure?.factory
}

/**
 * Set global pagination extras keys.
 */
export const setGlobalPaginatedExtras = (extras: Config['paginatedExtras']): void => {
    globalPaginatedExtras = extras
}

/**
 * Get global pagination extras keys.
 */
export const getGlobalPaginatedExtras = (): Config['paginatedExtras'] => {
    return globalPaginatedExtras
}

/**
 * Set global pagination links mapping.
 */
export const setGlobalPaginatedLinks = (links: Config['paginatedLinks']): void => {
    globalPaginatedLinks = {
        ...globalPaginatedLinks,
        ...links,
    }
}

/**
 * Get global pagination links mapping.
 */
export const getGlobalPaginatedLinks = (): Config['paginatedLinks'] => {
    return globalPaginatedLinks
}

/**
 * Set global base URL used to compose absolute pagination links.
 */
export const setGlobalBaseUrl = (baseUrl: Config['baseUrl']): void => {
    globalBaseUrl = baseUrl
}

/**
 * Get global base URL used to compose absolute pagination links.
 */
export const getGlobalBaseUrl = (): Config['baseUrl'] => {
    return globalBaseUrl
}

/**
 * Set global query parameter name used for pagination links.
 */
export const setGlobalPageName = (pageName: Config['pageName']): void => {
    globalPageName = pageName
}

/**
 * Get global query parameter name used for pagination links.
 */
export const getGlobalPageName = (): Config['pageName'] => {
    return globalPageName
}

/**
 * Set global pagination meta mapping.
 */
export const setGlobalPaginatedMeta = (meta: Config['paginatedMeta']): void => {
    globalPaginatedMeta = {
        ...globalPaginatedMeta,
        ...meta,
    }
}

/**
 * Get global pagination meta mapping.
 */
export const getGlobalPaginatedMeta = (): Config['paginatedMeta'] => {
    return globalPaginatedMeta
}

/**
 * Set global cursor meta mapping.
 */
export const setGlobalCursorMeta = (meta: Config['cursorMeta']): void => {
    globalCursorMeta = {
        ...globalCursorMeta,
        ...meta,
    }
}

/**
 * Get global cursor meta mapping.
 */
export const getGlobalCursorMeta = (): Config['cursorMeta'] => {
    return globalCursorMeta
}

/**
 * Resolve the configured root keys for pagination extras.
 */
export const getPaginationExtraKeys = (): { metaKey?: string; linksKey?: string; cursorKey?: string } => {
    if (Array.isArray(globalPaginatedExtras)) {
        return {
            metaKey: globalPaginatedExtras.includes('meta') ? 'meta' : undefined,
            linksKey: globalPaginatedExtras.includes('links') ? 'links' : undefined,
            cursorKey: globalPaginatedExtras.includes('cursor') ? 'cursor' : undefined,
        }
    }

    return {
        metaKey: globalPaginatedExtras.meta,
        linksKey: globalPaginatedExtras.links,
        cursorKey: globalPaginatedExtras.cursor,
    }
}

const buildPageUrl = (
    page: number | undefined,
    pathName: string | undefined,
): string | undefined => {
    if (typeof page === 'undefined') {
        return undefined
    }

    const rawPath = pathName || ''
    const base = globalBaseUrl || ''

    const isAbsolutePath = /^https?:\/\//i.test(rawPath)
    const normalizedBase = base.replace(/\/$/, '')
    const normalizedPath = rawPath.replace(/^\//, '')
    const root = isAbsolutePath
        ? rawPath
        : normalizedBase
            ? normalizedPath
                ? `${normalizedBase}/${normalizedPath}`
                : normalizedBase
            : ''

    if (!root) {
        return undefined
    }

    const url = new URL(root)
    url.searchParams.set(globalPageName || 'page', String(page))

    return url.toString()
}

/**
 * Build configured pagination/cursor extras for the final response root.
 */
export const buildPaginationExtras = (resource: any): Record<string, any> => {
    const { metaKey, linksKey, cursorKey } = getPaginationExtraKeys()
    const extra: Record<string, any> = {}

    const pagination = resource?.pagination
    const cursor = resource?.cursor

    const metaBlock: Record<string, any> = {}
    const linksBlock: Record<string, any> = {}

    if (pagination) {
        const metaSource: Record<string, any> = {
            to: pagination.to,
            from: pagination.from,
            links: pagination.links,
            path: pagination.path,
            total: pagination.total,
            per_page: pagination.perPage,
            last_page: pagination.lastPage,
            current_page: pagination.currentPage,
        }

        for (const [sourceKey, outputKey] of Object.entries(globalPaginatedMeta)) {
            if (!outputKey) continue

            const value = metaSource[sourceKey]
            if (typeof value !== 'undefined') {
                metaBlock[outputKey] = value
            }
        }

        const linksSource: Record<string, any> = {
            first: buildPageUrl(pagination.firstPage, pagination.path),
            last: buildPageUrl(pagination.lastPage, pagination.path),
            prev: buildPageUrl(pagination.prevPage, pagination.path),
            next: buildPageUrl(pagination.nextPage, pagination.path),
        }

        for (const [sourceKey, outputKey] of Object.entries(globalPaginatedLinks)) {
            if (!outputKey) continue

            const value = linksSource[sourceKey]
            if (typeof value !== 'undefined') {
                linksBlock[outputKey] = value
            }
        }
    }

    if (cursor) {
        const cursorBlock: Record<string, any> = {}
        const cursorSource: Record<string, any> = {
            previous: cursor.previous,
            next: cursor.next,
        }

        for (const [sourceKey, outputKey] of Object.entries(globalCursorMeta)) {
            if (!outputKey) continue

            const value = cursorSource[sourceKey]
            if (typeof value !== 'undefined') {
                cursorBlock[outputKey] = value
            }
        }

        if (cursorKey && Object.keys(cursorBlock).length > 0) {
            extra[cursorKey] = cursorBlock
        } else if (Object.keys(cursorBlock).length > 0) {
            metaBlock.cursor = cursorBlock
        }
    }

    if (metaKey && Object.keys(metaBlock).length > 0) {
        extra[metaKey] = metaBlock
    }

    if (linksKey && Object.keys(linksBlock).length > 0) {
        extra[linksKey] = linksBlock
    }

    return extra
}

/**
 * Build a response envelope from payload/meta and optional custom factory.
 * 
 * @param param0 
 * @returns 
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

/**
 * Check if a value is a plain object (not an array, date, regexp, etc.)
 * 
 * @param value The value to check
 * @returns True if the value is a plain object, false otherwise
 */
export const isPlainObject = (value: any): value is Record<string, any> => {
    if (typeof value !== 'object' || value === null) return false
    if (Array.isArray(value) || value instanceof Date || value instanceof RegExp) return false

    const proto = Object.getPrototypeOf(value)

    return proto === Object.prototype || proto === null
}

/**
 * Append root-level properties to a response body while preserving array payload integrity.
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
 * Resolve metadata from an overridden no-arg class with() hook.
 *
 * This allows custom classes to define with() { return { ... } } while
 * preserving default framework metadata merging behavior.
 */
export const resolveWithHookMetadata = (
    instance: any,
    baseWithMethod: (...args: any[]) => any
): MetaData | undefined => {
    const candidate = instance?.with
    if (typeof candidate !== 'function' || candidate === baseWithMethod) {
        return undefined
    }

    // Only auto-invoke no-arg hooks to avoid interfering with chain-style with(meta)
    if (candidate.length > 0) {
        return undefined
    }

    const result = candidate.call(instance)

    return isPlainObject(result) ? result : undefined
}

/**
 * Deep-merge metadata objects.
 * Arrays are replaced by the incoming value.
 * 
 * @param base The base metadata object
 * @param incoming The incoming metadata object to merge into the base 
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

/**
 * Split a string into its constituent words by detecting
 * camelCase, PascalCase, snake_case, kebab-case, and whitespace boundaries.
 *
 * @param str  The string to split
 * @returns An array of lowercase words
 */
export const splitWords = (str: string): string[] => {
    return str
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
        .replace(/[-_\s]+/g, ' ')
        .trim()
        .toLowerCase()
        .split(' ')
        .filter(Boolean)
}

/**
 * Convert a string to camelCase.
 * 
 * @param str The string to convert
 * @returns The converted string in camelCase
 */
export const toCamelCase = (str: string): string => {
    const words = splitWords(str)

    return words
        .map((w, i) => (i === 0 ? w : w.charAt(0).toUpperCase() + w.slice(1)))
        .join('')
}

/**
 * Convert a string to snake_case.
 * 
 * @param str The string to convert
 * @returns The converted string in snake_case
 */
export const toSnakeCase = (str: string): string => {
    return splitWords(str).join('_')
}

/**
 * Convert a string to PascalCase.
 * 
 * @param str The string to convert
 * @return The converted string in PascalCase
 */
export const toPascalCase = (str: string): string => {
    return splitWords(str)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join('')
}

/**
 * Convert a string to kebab-case.
 * 
 * @param str The string to convert
 * @returns The converted string in kebab-case
 */
export const toKebabCase = (str: string): string => {
    return splitWords(str).join('-')
}

/**
 * Resolve a CaseStyle value to its corresponding transformer function.
 *
 * @param style  A preset name or custom function
 * @returns A function that transforms a single key string
 */
export const getCaseTransformer = (style: CaseStyle): ((key: string) => string) => {
    if (typeof style === 'function') return style
    switch (style) {
        case 'camel': return toCamelCase
        case 'snake': return toSnakeCase
        case 'pascal': return toPascalCase
        case 'kebab': return toKebabCase
    }
}

/**
 * Recursively transform all keys of an object (or array of objects) using
 * the given transformer function.
 *
 * Primitives, Dates, RegExps, and other non-plain values are returned as-is.
 *
 * @param obj          The value to transform
 * @param transformer  A function that converts a key string
 * @returns A new value with all object keys transformed
 */
export const transformKeys = (obj: any, transformer: (key: string) => string): any => {
    if (obj === null || obj === undefined) return obj
    if (Array.isArray(obj)) return obj.map((item) => transformKeys(item, transformer))
    if (obj instanceof Date || obj instanceof RegExp) return obj
    if (typeof obj === 'object') {
        return Object.fromEntries(
            Object.entries(obj).map(([key, value]) => [
                transformer(key),
                transformKeys(value, transformer),
            ])
        )
    }

    return obj
}

let stubsDir = path.resolve(process.cwd(), 'node_modules/resora/stubs')
if (!existsSync(stubsDir)) {
    stubsDir = path.resolve(process.cwd(), 'stubs')
}

/**
 * Get the default configuration for the package, including stub paths and default options.
 * 
 * @returns The default configuration object
 */
export const getDefaultConfig = (): Config => {
    return {
        stubsDir,
        preferredCase: 'camel',
        responseStructure: {
            wrap: true,
            rootKey: 'data',
        },
        paginatedExtras: ['meta', 'links'],
        baseUrl: 'https://localhost',
        pageName: 'page',
        paginatedLinks: {
            first: 'first',
            last: 'last',
            prev: 'prev',
            next: 'next',
        },
        paginatedMeta: {
            to: 'to',
            from: 'from',
            links: 'links',
            path: 'path',
            total: 'total',
            per_page: 'per_page',
            last_page: 'last_page',
            current_page: 'current_page',
        },
        cursorMeta: {
            previous: 'previous',
            next: 'next',
        },
        resourcesDir: 'src/resources',
        stubs: {
            config: 'resora.config.stub',
            resource: 'resource.stub',
            collection: 'resource.collection.stub',
        },
    }
}

/**
 * Define the configuration for the package
 * 
 * @param userConfig  The user configuration to override the default configuration
 * @returns The merged configuration object
 */
export const defineConfig = (
    userConfig: Partial<Omit<Config, 'stubs'>> & { stubs?: Partial<Config['stubs']> } = {}
): Config => {
    const defaultConfig = getDefaultConfig()

    return Object.assign(
        defaultConfig,
        userConfig,
        {
            stubs: Object.assign(defaultConfig.stubs, userConfig.stubs || {}),
        }
    )
}