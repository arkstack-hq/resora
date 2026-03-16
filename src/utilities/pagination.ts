import {
    getGlobalBaseUrl,
    getGlobalCursorMeta,
    getGlobalPageName,
    getGlobalPaginatedExtras,
    getGlobalPaginatedLinks,
    getGlobalPaginatedMeta,
    getRequestUrl,
} from './state'

import { Config } from '../types'
import { isArkormLikeCollection } from './arkorm'

/**
 * Retrieves the configured keys for pagination extras (meta, links, cursor) based on the application's configuration.
 * 
 * @returns An object containing the keys for meta, links, and cursor extras, or `undefined` if not configured.
 */
export const getPaginationExtraKeys = (): {
    metaKey?: string;
    linksKey?: string;
    cursorKey?: string
} => {
    const extras = getGlobalPaginatedExtras()

    if (Array.isArray(extras)) {
        return {
            metaKey: extras.includes('meta') ? 'meta' : undefined,
            linksKey: extras.includes('links') ? 'links' : undefined,
            cursorKey: extras.includes('cursor') ? 'cursor' : undefined,
        }
    }

    return {
        metaKey: extras.meta,
        linksKey: extras.links,
        cursorKey: extras.cursor,
    }
}

/**
 * Builds a pagination URL for a given page number and path, using the global base URL and page name configuration.
 *
 * URL resolution follows a three-tier priority:
 * 1. Full URL – when `pathName` is absolute or `baseUrl` is set alongside a path
 * 2. Path-relative – when only a path is available (e.g. `/users?page=2`)
 * 3. Bare fallback – `/?page=X` when neither base URL nor path is available
 *
 * @param page The page number for which to build the URL. If `undefined`, the function will return `undefined`.
 * @param pathName The path to use for the URL. If not provided, it will default to an empty string.
 * @returns
 */
const buildPageUrl = (
    page: number | undefined,
    pathName: string | undefined,
): string | undefined => {
    if (typeof page === 'undefined') {
        return undefined
    }

    const rawPath = pathName || getRequestUrl() || ''
    const base = getGlobalBaseUrl() || ''
    const pageName = getGlobalPageName() || 'page'

    // Split rawPath into pathname and existing query string
    const qIndex = rawPath.indexOf('?')
    const pathOnly = qIndex >= 0 ? rawPath.slice(0, qIndex) : rawPath
    const existingSearch = qIndex >= 0 ? rawPath.slice(qIndex + 1) : ''

    // Tier 1a: path is already a full URL – use it directly
    if (/^https?:\/\//i.test(pathOnly)) {
        const url = new URL(rawPath)
        url.searchParams.set(pageName, String(page))

        return url.toString()
    }

    const normalizedBase = base.replace(/\/$/, '')
    const normalizedPath = pathOnly.replace(/^\//, '')

    // Tier 1b: base is a full URL – combine with path
    if (/^https?:\/\//i.test(normalizedBase)) {
        const root = normalizedPath
            ? `${normalizedBase}/${normalizedPath}`
            : normalizedBase
        const url = new URL(root)
        if (existingSearch) {
            for (const [k, v] of new URLSearchParams(existingSearch)) {
                url.searchParams.set(k, v)
            }
        }
        url.searchParams.set(pageName, String(page))

        return url.toString()
    }

    // Tier 2 / 3: path-relative or bare fallback
    const segments = [normalizedBase, normalizedPath].filter(Boolean).join('/')
    const pathBase = segments ? `/${segments}` : '/'

    const params = new URLSearchParams(existingSearch)
    params.set(pageName, String(page))

    return `${pathBase}?${params.toString()}`
}

/**
 * Derives page numbers (firstPage, lastPage, nextPage, prevPage) from an
 * Arkorm-style pagination meta object so that buildPageUrl() can generate
 * links that respect the auto-detected request URL and query string.
 */
const derivePageNumbers = (
    meta: Record<string, any>,
): Record<string, number | undefined> => {
    const currentPage = meta.currentPage as number | undefined
    const lastPage = meta.lastPage as number | undefined
    const hasMorePages = meta.hasMorePages as boolean | undefined

    return {
        firstPage: typeof lastPage === 'number' ? 1 : undefined,
        lastPage,
        nextPage: typeof lastPage === 'number'
            ? (typeof currentPage === 'number' && currentPage < lastPage ? currentPage + 1 : undefined)
            : (hasMorePages && typeof currentPage === 'number' ? currentPage + 1 : undefined),
        prevPage: typeof currentPage === 'number' && currentPage > 1
            ? currentPage - 1
            : undefined,
    }
}

/**
 * Extracts a pagination link (e.g. 'first', 'last', 'prev', 'next') from a 
 * pagination object, if it exists.
 * 
 * @param pagination 
 * @param rel 
 * @returns 
 */
export const hasPaginationLink = (pagination: any, rel: string): string | undefined => {
    return pagination.links && Object.prototype.hasOwnProperty.call(pagination.links, rel)
}

/**
 * Builds pagination extras (meta, links, cursor) for a given resource based on 
 * its pagination and cursor properties, using the configured keys for each type of extra.
 * 
 * @param resource The resource for which to build pagination extras. 
 * @returns An object containing the pagination extras (meta, links, cursor) for the resource.
 */
export const buildPaginationExtras = (resource: any): Record<string, any> => {
    const { metaKey, linksKey, cursorKey } = getPaginationExtraKeys()
    const extra: Record<string, any> = {}

    const isArkormPaginatorLike = !!resource
        && typeof resource === 'object'
        && !!resource.meta
        && typeof resource.meta === 'object'
        && (Array.isArray(resource.data) || isArkormLikeCollection(resource.data))

    // Derive page numbers from Arkorm paginator meta so buildPageUrl() can
    // generate links that respect the auto-detected request URL / query string.
    const arkormPageNumbers = isArkormPaginatorLike
        ? derivePageNumbers(resource.meta)
        : undefined

    // Arkorm paginator URLs are kept as a fallback when buildPageUrl() cannot
    // produce a link (i.e. no request URL, no baseUrl, and no explicit path).
    const arkormFallbackLinks = isArkormPaginatorLike
        ? {
            first: typeof resource.firstPageUrl === 'function' ? resource.firstPageUrl() : undefined,
            last: typeof resource.lastPageUrl === 'function' ? resource.lastPageUrl() : undefined,
            prev: typeof resource.previousPageUrl === 'function' ? resource.previousPageUrl() : undefined,
            next: typeof resource.nextPageUrl === 'function' ? resource.nextPageUrl() : undefined,
        }
        : undefined

    const pagination = resource?.pagination || (isArkormPaginatorLike
        ? {
            ...resource.meta,
            ...(arkormPageNumbers || {}),
            path: resource.urlDriver?.path,
        }
        : undefined)
    const cursor = resource?.cursor

    const metaBlock: Record<string, any> = {}
    const linksBlock: Record<string, any> = {}

    if (pagination) {
        // For Arkorm paginators, prefer the auto-detected request URL over the
        // paginator's own path. Plain pagination data keeps the existing
        // behaviour where an explicit path wins over the request URL.
        const effectivePath = isArkormPaginatorLike
            ? (getRequestUrl() || pagination.path)
            : pagination.path

        const linksSource: Record<string, any> = {
            first: hasPaginationLink(pagination, 'first')
                ? pagination.links.first
                : buildPageUrl(pagination.firstPage, effectivePath) ?? arkormFallbackLinks?.first,
            last: hasPaginationLink(pagination, 'last')
                ? pagination.links.last
                : buildPageUrl(pagination.lastPage, effectivePath) ?? arkormFallbackLinks?.last,
            prev: hasPaginationLink(pagination, 'prev')
                ? pagination.links.prev
                : buildPageUrl(pagination.prevPage, effectivePath) ?? arkormFallbackLinks?.prev,
            next: hasPaginationLink(pagination, 'next')
                ? pagination.links.next
                : buildPageUrl(pagination.nextPage, effectivePath) ?? arkormFallbackLinks?.next,
        }

        // Resolve links for the meta block: explicit pagination.links first,
        // then computed links from buildPageUrl() + Arkorm fallback.
        const resolvedLinks = Object.fromEntries(
            Object.entries(linksSource).filter(([, v]) => v !== undefined),
        )

        const metaSource: Record<string, any> = {
            to: pagination.to,
            from: pagination.from,
            links: pagination.links || (isArkormPaginatorLike && Object.keys(resolvedLinks).length ? resolvedLinks : undefined),
            path: pagination.path,
            total: pagination.total,
            per_page: pagination.perPage,
            last_page: pagination.lastPage,
            current_page: pagination.currentPage,
        }

        for (const [sourceKey, outputKey] of Object.entries(getGlobalPaginatedMeta() as Config['paginatedMeta'])) {
            if (!outputKey) continue

            const value = metaSource[sourceKey]
            if (typeof value !== 'undefined') {
                metaBlock[outputKey] = value
            }
        }

        for (const [sourceKey, outputKey] of Object.entries(getGlobalPaginatedLinks() as Config['paginatedLinks'])) {
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

        for (const [sourceKey, outputKey] of Object.entries(getGlobalCursorMeta() as Config['cursorMeta'])) {
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
