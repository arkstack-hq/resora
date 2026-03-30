import type { ResponseKind } from './common'

export type ResoraPluginUtility = (...args: any[]) => unknown

export interface ResoraPluginApi {
    runWithCtx: <T>(ctx: unknown, callback: () => T) => T
    setCtx: (ctx: unknown) => void
    getCtx: () => unknown
    registerUtility: (name: string, utility: ResoraPluginUtility) => ResoraPluginUtility
    getUtility: <T extends ResoraPluginUtility = ResoraPluginUtility>(name: string) => T | undefined
    getRegisteredPlugins: () => ResoraPlugin[]
}

export interface SerializePluginEvent<TBody = any, TResource = any> {
    serializer: unknown
    serializerType: ResponseKind
    resource: TResource
    body: TBody
}

export interface ResponsePluginEvent<TBody = any> {
    serializer: unknown
    serializerType: ResponseKind
    rawResponse?: unknown
    response?: unknown
    body: TBody
}

export interface SendPluginEvent<TBody = any> {
    response: unknown
    rawResponse: unknown
    body: TBody
    status: number
    headers: Record<string, string>
}

export interface ResoraPlugin {
    name: string
    setup?: (api: ResoraPluginApi) => void
    beforeSerialize?: (event: SerializePluginEvent, api: ResoraPluginApi) => void
    afterSerialize?: (event: SerializePluginEvent, api: ResoraPluginApi) => void
    beforeResponse?: (event: ResponsePluginEvent, api: ResoraPluginApi) => void
    afterResponse?: (event: ResponsePluginEvent, api: ResoraPluginApi) => void
    beforeSend?: (event: SendPluginEvent, api: ResoraPluginApi) => void
    afterSend?: (event: SendPluginEvent, api: ResoraPluginApi) => void
}