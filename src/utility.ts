import { CaseStyle, Config } from './types'

import { existsSync } from 'fs'
import path from 'path'

/**
 * Global preferred case style applied to all resources that don't specify their own.
 */
let globalPreferredCase: CaseStyle | undefined

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
 */
export const toCamelCase = (str: string): string => {
    const words = splitWords(str)

    return words
        .map((w, i) => (i === 0 ? w : w.charAt(0).toUpperCase() + w.slice(1)))
        .join('')
}

/**
 * Convert a string to snake_case.
 */
export const toSnakeCase = (str: string): string => {
    return splitWords(str).join('_')
}

/**
 * Convert a string to PascalCase.
 */
export const toPascalCase = (str: string): string => {
    return splitWords(str)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join('')
}

/**
 * Convert a string to kebab-case.
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

export const getDefaultConfig = (): Config => {
    return {
        stubsDir,
        preferredCase: 'camel',
        paginatedExtras: ['meta', 'links'],
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