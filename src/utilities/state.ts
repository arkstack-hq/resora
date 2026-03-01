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

export const setGlobalCase = (style: CaseStyle | undefined): void => {
    globalPreferredCase = style
}

export const getGlobalCase = (): CaseStyle | undefined => {
    return globalPreferredCase
}

export const setGlobalResponseStructure = (config: ResponseStructureConfig | undefined): void => {
    globalResponseStructure = config
}

export const getGlobalResponseStructure = (): ResponseStructureConfig | undefined => {
    return globalResponseStructure
}

export const setGlobalResponseRootKey = (rootKey: string | undefined): void => {
    globalResponseStructure = {
        ...(globalResponseStructure || {}),
        rootKey,
    }
}

export const setGlobalResponseWrap = (wrap: boolean | undefined): void => {
    globalResponseStructure = {
        ...(globalResponseStructure || {}),
        wrap,
    }
}

export const getGlobalResponseWrap = (): boolean | undefined => {
    return globalResponseStructure?.wrap
}

export const getGlobalResponseRootKey = (): string | undefined => {
    return globalResponseStructure?.rootKey
}

export const setGlobalResponseFactory = (factory: ResponseFactory | undefined): void => {
    globalResponseStructure = {
        ...(globalResponseStructure || {}),
        factory,
    }
}

export const getGlobalResponseFactory = (): ResponseFactory | undefined => {
    return globalResponseStructure?.factory
}

export const setGlobalPaginatedExtras = (extras: Config['paginatedExtras']): void => {
    globalPaginatedExtras = extras
}

export const getGlobalPaginatedExtras = (): Config['paginatedExtras'] => {
    return globalPaginatedExtras
}

export const setGlobalPaginatedLinks = (links: Config['paginatedLinks']): void => {
    globalPaginatedLinks = {
        ...globalPaginatedLinks,
        ...links,
    }
}

export const getGlobalPaginatedLinks = (): Config['paginatedLinks'] => {
    return globalPaginatedLinks
}

export const setGlobalBaseUrl = (baseUrl: Config['baseUrl']): void => {
    globalBaseUrl = baseUrl
}

export const getGlobalBaseUrl = (): Config['baseUrl'] => {
    return globalBaseUrl
}

export const setGlobalPageName = (pageName: Config['pageName']): void => {
    globalPageName = pageName
}

export const getGlobalPageName = (): Config['pageName'] => {
    return globalPageName
}

export const setGlobalPaginatedMeta = (meta: Config['paginatedMeta']): void => {
    globalPaginatedMeta = {
        ...globalPaginatedMeta,
        ...meta,
    }
}

export const getGlobalPaginatedMeta = (): Config['paginatedMeta'] => {
    return globalPaginatedMeta
}

export const setGlobalCursorMeta = (meta: Config['cursorMeta']): void => {
    globalCursorMeta = {
        ...globalCursorMeta,
        ...meta,
    }
}

export const getGlobalCursorMeta = (): Config['cursorMeta'] => {
    return globalCursorMeta
}
