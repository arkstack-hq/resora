import {
    getGlobalBaseUrl,
    getGlobalCursorMeta,
    getGlobalPageName,
    getGlobalPaginatedExtras,
    getGlobalPaginatedLinks,
    getGlobalPaginatedMeta,
} from './state'

import { Config } from '../types'

/**
 * Retrieves the configured keys for pagination extras (meta, links, cursor) based on the application's configuration.
 * 
 * @returns An object containing the keys for meta, links, and cursor extras, or `undefined` if not configured.
 */
export const getPaginationExtraKeys = (): { metaKey?: string; linksKey?: string; cursorKey?: string } => {
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

    const rawPath = pathName || ''
    const base = getGlobalBaseUrl() || ''

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
    url.searchParams.set(getGlobalPageName() || 'page', String(page))

    return url.toString()
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

        for (const [sourceKey, outputKey] of Object.entries(getGlobalPaginatedMeta() as Config['paginatedMeta'])) {
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
