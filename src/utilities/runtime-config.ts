import { Config, ResoraConfig } from '../types'
import {
    setGlobalBaseUrl,
    setGlobalCase,
    setGlobalCursorMeta,
    setGlobalPageName,
    setGlobalPaginatedExtras,
    setGlobalPaginatedLinks,
    setGlobalPaginatedMeta,
    setGlobalResponseStructure,
} from './state'

import { createRequire } from 'module'
import { defineConfig } from './config'
import { existsSync } from 'fs'
import path from 'path'
import { pathToFileURL } from 'url'

let runtimeConfigLoaded = false
let runtimeConfigLoadingPromise: Promise<void> | undefined

/**
 * Resets the runtime configuration state for testing purposes.
 * 
 * @returns
 */
export const resetRuntimeConfigForTests = () => {
    runtimeConfigLoaded = false
    runtimeConfigLoadingPromise = undefined
}

/**
 * Applies the provided configuration to the global state of the application. 
 * 
 * @param config The complete configuration object to apply.
 */
export const applyRuntimeConfig = (config: Config) => {
    if (config.preferredCase !== 'camel') {
        setGlobalCase(config.preferredCase)
    }

    setGlobalResponseStructure(config.responseStructure)
    setGlobalPaginatedExtras(config.paginatedExtras)
    setGlobalPaginatedLinks(config.paginatedLinks)
    setGlobalPaginatedMeta(config.paginatedMeta)
    setGlobalCursorMeta(config.cursorMeta)
    setGlobalBaseUrl(config.baseUrl)
    setGlobalPageName(config.pageName)
}

/**
 * Loads the runtime configuration by searching for configuration files in the current working directory. 
 * @param configPath The path to the configuration file to load.
 * @returns 
 */
const importConfigFile = async (configPath: string) => {
    const configUrl = `${pathToFileURL(configPath).href}?resora_runtime=${Date.now()}`

    return await import(configUrl)
}

/**
 * Resolves the imported configuration and applies it to the global state.
 * 
 * @param imported 
 */
const resolveAndApply = (imported: any) => {
    const userConfig = (imported?.default ?? imported) as ResoraConfig
    const resolvedConfig = defineConfig(userConfig || {})

    applyRuntimeConfig(resolvedConfig)
    runtimeConfigLoaded = true
}

/**
 * Loads the runtime configuration synchronously by searching for CommonJS configuration files in the current working directory. 
 * 
 * @returns 
 */
const loadRuntimeConfigSync = (): boolean => {
    const require = createRequire(import.meta.url)
    const syncConfigPaths = [
        path.join(process.cwd(), 'resora.config.cjs'),
    ]

    for (const configPath of syncConfigPaths) {
        if (!existsSync(configPath)) {
            continue
        }

        try {
            const imported = require(configPath)
            resolveAndApply(imported)

            return true
        } catch {
            continue
        }
    }

    return false
}

/**
 * Loads the runtime configuration by searching for configuration files in the current working directory. 
 * 
 * @returns 
 */
export const loadRuntimeConfig = async () => {
    if (runtimeConfigLoaded) {
        return
    }

    if (runtimeConfigLoadingPromise) {
        return await runtimeConfigLoadingPromise
    }

    if (loadRuntimeConfigSync()) {
        return
    }

    runtimeConfigLoadingPromise = (async () => {
        const possibleConfigPaths = [
            path.join(process.cwd(), 'resora.config.js'),
            path.join(process.cwd(), 'resora.config.ts'),
        ]

        for (const configPath of possibleConfigPaths) {
            if (!existsSync(configPath)) {
                continue
            }

            try {
                const imported = await importConfigFile(configPath)
                resolveAndApply(imported)

                return
            } catch {
                continue
            }
        }

        runtimeConfigLoaded = true
    })()

    await runtimeConfigLoadingPromise
}

void loadRuntimeConfig()
