import { Config, ResoraConfig } from '../types'

import { existsSync } from 'fs'
import path from 'path'

let stubsDir = path.resolve(process.cwd(), 'node_modules/resora/stubs')
if (!existsSync(stubsDir)) {
    stubsDir = path.resolve(process.cwd(), 'stubs')
}

/**
 * Get the default configuration for the application
 * 
 * @returns 
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
 * Defines the configuration for the application by merging the provided configuration with the default configuration. This function takes a partial configuration object as input and returns a complete configuration object that includes all required properties, using default values for any properties that are not specified in the input.
 * 
 * @param config 
 * @returns 
 */
export const defineConfig = (config: ResoraConfig): Config => {
    const defConf = getDefaultConfig()

    return Object.assign(
        defConf,
        config,
        {
            stubs: Object.assign(defConf.stubs, config.stubs || {}),
        },
        {
            cursorMeta: Object.assign(defConf.cursorMeta, config.cursorMeta || {}),
        },
        {
            paginatedMeta: Object.assign(defConf.paginatedMeta, config.paginatedMeta || {}),
        },
        {
            paginatedLinks: Object.assign(defConf.paginatedLinks, config.paginatedLinks || {}),
        },
        {
            responseStructure: Object.assign(defConf.responseStructure, config.responseStructure || {})
        },
    )
}
