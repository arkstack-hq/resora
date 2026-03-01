import { CaseStyle } from '../types'

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

export const toCamelCase = (str: string): string => {
    const words = splitWords(str)

    return words
        .map((w, i) => (i === 0 ? w : w.charAt(0).toUpperCase() + w.slice(1)))
        .join('')
}

export const toSnakeCase = (str: string): string => {
    return splitWords(str).join('_')
}

export const toPascalCase = (str: string): string => {
    return splitWords(str)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join('')
}

export const toKebabCase = (str: string): string => {
    return splitWords(str).join('-')
}

export const getCaseTransformer = (style: CaseStyle): ((key: string) => string) => {
    if (typeof style === 'function') return style
    switch (style) {
        case 'camel': return toCamelCase
        case 'snake': return toSnakeCase
        case 'pascal': return toPascalCase
        case 'kebab': return toKebabCase
    }
}

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
