import {
    CaseStyle,
    MetaData,
    ResourceLevelConfig,
    ResponseStructureConfig,
} from './types'
import {
    getGlobalCase,
    getGlobalResponseStructure,
    mergeMetadata,
    resolveMergeWhen,
    resolveWhen,
    resolveWhenNotNull,
    resolveWithHookMetadata,
} from './utilities'

interface SerializerConstructor {
    preferredCase?: CaseStyle
    responseStructure?: ResponseStructureConfig
    config?: () => ResourceLevelConfig
}

export abstract class BaseSerializer<TResource = any> {
    static preferredCase?: CaseStyle
    static responseStructure?: ResponseStructureConfig
    static config?: () => ResourceLevelConfig

    protected instanceConfig?: ResourceLevelConfig
    protected additionalMeta?: MetaData
    protected called: {
        json?: boolean
        data?: boolean
        toArray?: boolean
        additional?: boolean
        with?: boolean
        withResponse?: boolean
        status?: boolean
        then?: boolean
        toResponse?: boolean
    } = {}

    when<T> (condition: any, value: T | (() => T)): T | undefined {
        return resolveWhen(condition, value) as T | undefined
    }

    whenNotNull<T> (value: T | null | undefined): T | undefined {
        return resolveWhenNotNull(value) as T | undefined
    }

    mergeWhen<T extends Record<string, any>> (condition: any, value: T | (() => T)): Partial<T> {
        return resolveMergeWhen(condition, value)
    }

    protected abstract resolveCurrentRootKey (): string
    protected abstract applyMetaToBody (meta: MetaData, rootKey: string): void
    protected abstract getResourceForMeta (): TResource

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

    withMeta<M extends MetaData> (meta: M | ((resource: TResource) => M)) {
        this.with(meta)

        return this
    }

    protected resolveMergedMeta (withMethod: (meta?: any) => any) {
        const hookMeta = resolveWithHookMetadata(this, withMethod)

        return mergeMetadata(hookMeta, this.additionalMeta)
    }

    config (): ResourceLevelConfig
    config (config: ResourceLevelConfig): this
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
