import type {
    ResoraPlugin,
    ResoraPluginApi,
    ResoraPluginUtility,
    ResponsePluginEvent,
    SendPluginEvent,
    SerializePluginEvent,
} from './types/plugin'
import { getCtx, runWithCtx, setCtx } from './utilities'

type HookEventMap = {
    beforeSerialize: SerializePluginEvent
    afterSerialize: SerializePluginEvent
    beforeResponse: ResponsePluginEvent
    afterResponse: ResponsePluginEvent
    beforeSend: SendPluginEvent
    afterSend: SendPluginEvent
}

type HookName = keyof HookEventMap

const registeredPlugins = new Map<string, ResoraPlugin>()
const registeredUtilities = new Map<string, ResoraPluginUtility>()

export const getRegisteredPlugins = () => {
    return Array.from(registeredPlugins.values())
}

export const registerUtility = (name: string, utility: ResoraPluginUtility) => {
    registeredUtilities.set(name, utility)

    return utility
}

export const getUtility = <T extends ResoraPluginUtility = ResoraPluginUtility> (name: string) => {
    return registeredUtilities.get(name) as T | undefined
}

const pluginApi: ResoraPluginApi = {
    runWithCtx,
    setCtx,
    getCtx,
    registerUtility,
    getUtility,
    getRegisteredPlugins,
}

export const definePlugin = <T extends ResoraPlugin> (plugin: T) => {
    return plugin
}

export const registerPlugin = (plugins: ResoraPlugin | ResoraPlugin[]) => {
    for (const plugin of Array.isArray(plugins) ? plugins : [plugins]) {
        if (registeredPlugins.has(plugin.name)) {
            continue
        }

        registeredPlugins.set(plugin.name, plugin)
        plugin.setup?.(pluginApi)
    }

    return getRegisteredPlugins()
}

export const runPluginHook = <THook extends HookName> (hook: THook, event: HookEventMap[THook]) => {
    for (const plugin of registeredPlugins.values()) {
        const handler = plugin[hook]

        if (typeof handler === 'function') {
            handler(event as never, pluginApi)
        }
    }

    return event
}

export const resetPluginsForTests = () => {
    registeredPlugins.clear()
    registeredUtilities.clear()
}