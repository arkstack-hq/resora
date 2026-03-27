import {
    CaseStyle,
    MetaData,
    ResourceLevelConfig,
    ResponseStructureConfig,
} from './types'
import {
    getGlobalCase,
    getGlobalResponseStructure,
    loadRuntimeConfig,
    mergeMetadata,
    resolveMergeWhen,
    resolveWhen,
    resolveWhenNotNull,
    resolveWithHookMetadata,
    setCtx as setCtxState,
} from './utilities'

import { H3Event } from 'h3'
import { Response } from 'express'

interface SerializerConstructor {
    preferredCase?: CaseStyle
    responseStructure?: ResponseStructureConfig
    config?: () => ResourceLevelConfig
}

/**
 * @description BaseSerializer is an abstract class that provides common functionality for
 * serializing resources. It handles configuration, metadata management, and response 
 * structure resolution. Concrete serializers should extend this class and implement 
 * the abstract methods to define how resources are transformed and how metadata is 
 * applied to the response body.
 * 
 * @author Legacy (3m1n3nc3)
 * @since 0.2.8
 */
export abstract class BaseSerializer<TResource = any> {
    static preferredCase?: CaseStyle
    static responseStructure?: ResponseStructureConfig
    static config?: () => ResourceLevelConfig

    protected static ctx?: Response | H3Event | Record<string, any>
    protected instanceConfig?: ResourceLevelConfig
    protected additionalMeta?: MetaData
    protected called: {
        json?: boolean
        data?: boolean
        toObject?: boolean
        toArray?: boolean
        additional?: boolean
        with?: boolean
        withResponse?: boolean
        status?: boolean
        then?: boolean
        toResponse?: boolean
    } = {}

    constructor() {
        void loadRuntimeConfig()
    }

    /**
     * Sets the current request context for pagination URL detection.
     * Call from middleware to make the request path available to all
     * resources created during the request lifecycle.
     * 
     * Accepts an Express Request, H3Event, `{ req }` object, or a plain URL string.
     * 
     * @param ctx The request context.
     */
    static setCtx (ctx: unknown): void {
        setCtxState(ctx)
        this.ctx = ctx as any
    }

    /**
     * Helper method to conditionally resolve a value based on a condition. 
     * 
     * @param condition 
     * @param value 
     * @returns 
     */
    when<T> (condition: any, value: T | (() => T)): T | undefined {
        return resolveWhen(condition, value) as T | undefined
    }

    /**
     * Helper method to conditionally resolve a value only if it's not null or undefined.
     * 
     * @param value 
     * @returns 
     */
    whenNotNull<T> (value: T | null | undefined): T | undefined {
        return resolveWhenNotNull(value) as T | undefined
    }

    /**
     * Helper method to conditionally merge values into the response based on a condition.
     * 
     * @param condition 
     * @param value 
     * @returns 
     */
    mergeWhen<T extends Record<string, any>> (condition: any, value: T | (() => T)): Partial<T> {
        return resolveMergeWhen(condition, value)
    }

    /**
     * Resolve the current root key for the response structure. 
     */
    protected abstract resolveCurrentRootKey (): string
    protected abstract applyMetaToBody (meta: MetaData, rootKey: string): void
    protected abstract getResourceForMeta (): TResource

    /**
     * Add additional metadata to the response. If called without arguments.
     * 
     * @param meta 
     * @returns 
     */
    with (meta?: any): any {
        this.called.with = true

        if (typeof meta === 'undefined') {
            return this.additionalMeta || {}
        }

        const resolvedMeta = typeof meta === 'function'
            ? (meta(this.getResourceForMeta()) as MetaData)
            : meta

        this.additionalMeta = mergeMetadata(this.additionalMeta, resolvedMeta)

        if (this.called.json) {
            this.applyMetaToBody(resolvedMeta, this.resolveCurrentRootKey())
        }

        return this
    }

    /**
     * Add additional metadata to the response, ensuring it is merged with any existing metadata.
     * 
     * @param meta 
     * @returns 
     */
    withMeta<M extends MetaData> (meta: M | ((resource: TResource) => M)) {
        this.with(meta)

        return this
    }

    /**
     * Resolve the merged metadata for the current response, combining any metadata 
     * defined in hooks with additional metadata added via with() or withMeta().
     * 
     * @param withMethod 
     * @returns 
     */
    protected resolveMergedMeta (withMethod: (meta?: any) => any) {
        const hookMeta = resolveWithHookMetadata(this, withMethod)

        return mergeMetadata(hookMeta, this.additionalMeta)
    }

    /**
     * Run the response generation process, ensuring that the response is properly structured.
     * 
     * @param input 
     * @returns 
     */
    protected runResponse<TBody, TRawResponse, TServerResponse> (input: {
        ensureJson: () => void
        rawResponse: TRawResponse
        body: () => TBody
        createServerResponse: (raw: TRawResponse, body: TBody) => TServerResponse
        callWithResponse: (response: TServerResponse, raw: TRawResponse) => void
    }) {
        this.called.toResponse = true
        input.ensureJson()

        const resolvedBody = input.body()
        const response = input.createServerResponse(input.rawResponse, resolvedBody)

        this.called.withResponse = true
        input.callWithResponse(response, input.rawResponse)

        if (typeof (response as any)?.setBody === 'function') {
            (response as any).setBody(input.body())
        }

        return response
    }

    /**
     * Run the thenable process for the resource, allowing for async handling and 
     * response generation.
     * 
     * @param input 
     * @returns 
     */
    protected runThen<TBody, TRawResponse, TServerResponse, TResult1, TResult2> (input: {
        ensureJson: () => void
        body: () => TBody
        rawResponse?: TRawResponse
        createServerResponse: (raw: TRawResponse, body: TBody) => TServerResponse
        callWithResponse: (response?: TServerResponse, raw?: TRawResponse) => void
        sendRawResponse?: (raw: TRawResponse, body: TBody) => void
        onfulfilled?: ((value: TBody) => TResult1 | PromiseLike<TResult1>) | null
        onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
    }) {
        this.called.then = true
        input.ensureJson()

        const initialBody = input.body()
        let response: TServerResponse | undefined

        if (typeof input.rawResponse !== 'undefined') {
            response = input.createServerResponse(input.rawResponse, initialBody)

            this.called.withResponse = true
            input.callWithResponse(response, input.rawResponse)
        } else {
            this.called.withResponse = true
            input.callWithResponse()
        }

        const resolvedBody = input.body()

        if (typeof (response as any)?.setBody === 'function') {
            (response as any).setBody(resolvedBody)
        }

        const resolved = Promise.resolve(resolvedBody).then(input.onfulfilled, input.onrejected)

        if (typeof (response as any)?.send === 'function') {
            (response as any).send(resolvedBody)
        } else if (typeof input.rawResponse !== 'undefined' && input.sendRawResponse) {
            input.sendRawResponse(input.rawResponse, resolvedBody)
        }

        return resolved
    }

    /**
     * Get or set the resource-level configuration for this serializer instance. 
     */
    config (): ResourceLevelConfig
    /**
     * Set the resource-level configuration for this serializer instance.
     * 
     * @param config The configuration object to set for this serializer instance.
     */
    config (config: ResourceLevelConfig): this
    /**
     * Get or set the resource-level configuration for this serializer instance.
     * 
     * @param config The configuration object to set for this serializer instance, or undefined to get the current configuration.
     * @returns 
     */
    config (config?: ResourceLevelConfig): ResourceLevelConfig | this {
        if (typeof config === 'undefined') {
            return this.instanceConfig || {}
        }

        this.instanceConfig = {
            ...(this.instanceConfig || {}),
            ...config,
            responseStructure: {
                ...(this.instanceConfig?.responseStructure || {}),
                ...(config.responseStructure || {}),
            },
        }

        return this
    }

    /**
     * Resolve the effective serializer configuration for this instance, combining 
     * class-level and instance-level configurations.
     * 
     * @param localConstructor 
     * @param _fallbackConfig 
     * @returns 
     */
    protected resolveSerializerConfig (
        localConstructor: SerializerConstructor,
        _fallbackConfig?: ResourceLevelConfig
    ) {
        const classConfig = typeof localConstructor.config === 'function'
            ? localConstructor.config()
            : {}

        return {
            preferredCase: this.instanceConfig?.preferredCase
                ?? classConfig?.preferredCase,
            responseStructure: {
                ...(classConfig?.responseStructure || {}),
                ...(this.instanceConfig?.responseStructure || {}),
            },
        }
    }

    /**
     * Resolve the preferred case style for this serializer instance, considering 
     * instance-level configuration, class-level configuration, and global defaults.
     * 
     * @param localConstructor The constructor of the serializer class.
     * @param fallbackConfig    The fallback configuration to use if no other configuration is found.
     * @returns The resolved    case style for this serializer instance.
     */
    protected resolveSerializerCaseStyle (
        localConstructor: SerializerConstructor,
        fallbackConfig?: ResourceLevelConfig
    ) {
        const localConfig = this.resolveSerializerConfig(localConstructor, fallbackConfig)

        return localConfig.preferredCase
            ?? localConstructor.preferredCase
            ?? fallbackConfig?.preferredCase
            ?? getGlobalCase()
    }

    /**
     * Resolve the response structure configuration for this serializer instance, considering
     * 
     * @param localConstructor 
     * @param fallbackConfig 
     * @returns 
     */
    protected resolveSerializerResponseStructure (
        localConstructor: SerializerConstructor,
        fallbackConfig?: ResourceLevelConfig
    ) {
        const localConfig = this.resolveSerializerConfig(localConstructor, fallbackConfig)
        const global = getGlobalResponseStructure()

        return {
            wrap: localConfig.responseStructure?.wrap
                ?? localConstructor.responseStructure?.wrap
                ?? fallbackConfig?.responseStructure?.wrap
                ?? global?.wrap
                ?? true,
            rootKey: localConfig.responseStructure?.rootKey
                ?? localConstructor.responseStructure?.rootKey
                ?? fallbackConfig?.responseStructure?.rootKey
                ?? global?.rootKey
                ?? 'data',
            factory: localConfig.responseStructure?.factory
                ?? localConstructor.responseStructure?.factory
                ?? fallbackConfig?.responseStructure?.factory
                ?? global?.factory,
        }
    }
}
