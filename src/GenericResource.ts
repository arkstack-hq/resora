import type { H3Event } from 'h3'
import {
  CollectionLike,
  Collectible,
  GenericBody,
  MetaData,
  NonCollectible,
  PaginatorLike,
  ResourceLevelConfig,
  ResourceData,
} from './types'
import { ServerResponse } from './ServerResponse'
import type { Response } from 'express'
import { Resource } from './Resource'
import { BaseSerializer } from './BaseSerializer'
import {
  appendRootProperties,
  buildPaginationExtras,
  buildResponseEnvelope,
  extractRequestUrl,
  extractResponseFromCtx,
  getCaseTransformer,
  getPaginationExtraKeys,
  isArkormLikeCollection,
  isArkormLikeModel,
  normalizeSerializableData,
  normalizeSerializableDataAsync,
  requiresAsyncNormalization,
  sanitizeConditionalAttributes,
  setRequestUrl,
  transformKeys,
} from './utilities'

/**
 * GenericResource class to handle API resource transformation and response building
 * 
 * @author Legacy (3m1n3nc3)
 * @since 0.1.0
 * @see BaseSerializer for shared serialization logic and configuration handling
 */
export class GenericResource<
  R extends NonCollectible | Collectible | CollectionLike | PaginatorLike | ResourceData = ResourceData,
  T extends ResourceData = any
> extends BaseSerializer<R> {
  [key: string]: any;
  private body: GenericBody<R> = { data: {} as any }
  private pendingData?: unknown
  private pendingDataCollected = false
  private pendingAdditional: Record<string, any>[] = []
  private res?: Response
  public resource: R
  public collects?: typeof Resource<T>
  protected withResponseContext?: {
    response: ServerResponse<GenericBody<R>>
    raw: Response | H3Event['res']
  }

  constructor(rsc: R, ctx?: Response | H3Event | Record<string, any>) {
    super()
    if (ctx) GenericResource.ctx = ctx
    this.resource = rsc

    if (ctx) {
      const url = extractRequestUrl(ctx)
      if (url) {
        setRequestUrl(url)
      }

      this.res = extractResponseFromCtx(ctx)
    }

    const hasDataPayload = !!this.resource
      && typeof this.resource === 'object'
      && 'data' in (this.resource as Record<string, unknown>)

    const dataPayload = hasDataPayload
      ? (this.resource as NonCollectible | Collectible).data
      : undefined

    const hasObjectDataPayload = !!dataPayload && !Array.isArray(dataPayload)

    const source = hasDataPayload
      ? dataPayload
      : this.resource

    /**
     * Copy properties from rsc to this instance for easy 
     * access, but only if data is not an array
     */
    if (source && typeof source === 'object' && !Array.isArray(source) && !isArkormLikeCollection(source)) {
      const sourceKeys = isArkormLikeModel(source)
        ? [...new Set([
          ...Object.keys(source.getRawAttributes?.() ?? {}),
          ...Object.keys(source.toObject()),
        ])]
        : Object.keys(source)

      for (const key of sourceKeys) {
        if (!(key in this)) {
          Object.defineProperty(this, key, {
            enumerable: true,
            configurable: true,
            get: () => {
              if (isArkormLikeModel(source) && typeof source.getAttribute === 'function') {
                return source.getAttribute(key)
              }

              if (hasObjectDataPayload) {
                return (dataPayload as ResourceData)[key]
              }

              return (<any>this.resource)[key]
            },
            set: (value) => {
              if (isArkormLikeModel(source) && typeof source.setAttribute === 'function') {
                source.setAttribute(key, value)

                return
              }

              if (hasObjectDataPayload) {
                (dataPayload as ResourceData)[key] = value

                return
              }

              (<any>this.resource)[key] = value
            },
          })
        }
      }
    }
  }

  /**
   * Get the original resource data
   */
  data(_ctx?: unknown): R {
    return this.resource
  }

  /**
   * Get the current serialized output body.
   */
  getBody(): GenericBody<R> {
    this.json()

    return this.body
  }

  /**
   * Asynchronously get the current serialized output body.
   *
   * @returns
   */
  async getBodyAsync(): Promise<GenericBody<R>> {
    await this.jsonAsync()

    return this.body
  }

  /**
   * Replace the current serialized output body.
   */
  protected setBody(body: GenericBody<R>) {
    this.body = body

    return this
  }

  private resolveCollectsConfig(): ResourceLevelConfig | undefined {
    const collectedResource = this.collects as typeof Resource | undefined

    if (!collectedResource) {
      return undefined
    }

    const collectedConfig = typeof collectedResource.config === 'function'
      ? collectedResource.config()
      : {}

    return {
      preferredCase: collectedConfig.preferredCase ?? collectedResource.preferredCase,
      responseStructure: {
        ...(collectedResource.responseStructure || {}),
        ...(collectedConfig.responseStructure || {}),
      },
    }
  }

  private resolveResponseStructure() {
    return this.resolveSerializerResponseStructure(
      this.constructor as typeof GenericResource,
      this.resolveCollectsConfig()
    )
  }

  /**
   * Resolve the current root key for the response structure, based on configuration and defaults.
   * 
   * @returns 
   */
  protected resolveCurrentRootKey() {
    return this.resolveResponseStructure().rootKey
  }

  /**
   * Apply metadata properties to the response body, ensuring they are merged with.
   * 
   * @param meta 
   * @param rootKey 
   */
  protected applyMetaToBody(meta: MetaData, rootKey: string) {
    this.body = appendRootProperties(this.body, meta, rootKey) as GenericBody<R>
  }

  /**
   * Get the resource data to be used for generating metadata.
   * 
   * @returns 
   */
  protected getResourceForMeta() {
    return this.resource
  }

  protected getSerializerType() {
    return 'generic' as const
  }

  private getPayloadKey() {
    const { wrap, rootKey, factory } = this.resolveResponseStructure()

    return factory || !wrap ? undefined : rootKey
  }

  /**
   * Convert resource to JSON response format
   * 
   * @returns 
   */
  json() {
    if (!this.called.json) {
      this.called.json = true

      const ctx = this.resolveSerializationContext()
      const resource = this.data(ctx)

      if (requiresAsyncNormalization(resource)) {
        this.pendingData = resource
        this.called.json = false

        return this
      }

      let data: any = normalizeSerializableData(resource)

      if (Array.isArray(data) && this.collects) {
        data = data.map(item => new this.collects!(item).data(ctx))
      }

      if (requiresAsyncNormalization(data)) {
        this.pendingData = data
        this.pendingDataCollected = true
        this.called.json = false

        return this
      }

      if (!Array.isArray(data) && data && typeof data.data !== 'undefined') {
        data = data.data
      }

      data = sanitizeConditionalAttributes(data)

      const paginationExtras = buildPaginationExtras(this.resource)
      const { metaKey } = getPaginationExtraKeys()
      const configuredMeta = metaKey ? paginationExtras[metaKey] : undefined
      if (metaKey) {
        delete paginationExtras[metaKey]
      }

      // Apply case transformation if configured
      const caseStyle = this.resolveSerializerCaseStyle(
        this.constructor as typeof GenericResource,
        this.resolveCollectsConfig()
      )
      if (caseStyle) {
        const transformer = getCaseTransformer(caseStyle)
        data = transformKeys(data, transformer)
      }

      const customMeta = this.resolveMergedMeta(GenericResource.prototype.with)

      const { wrap, rootKey, factory } = this.resolveResponseStructure()
      this.body = buildResponseEnvelope({
        payload: data,
        meta: configuredMeta,
        metaKey,
        wrap,
        rootKey,
        factory,
        context: {
          type: 'generic',
          resource: this.resource,
        },
      }) as GenericBody<R>

      this.body = appendRootProperties(
        this.body,
        {
          ...paginationExtras,
          ...(customMeta || {}),
        },
        rootKey
      ) as GenericBody<R>
      this.body = this.applySerializePlugins(this.body) as GenericBody<R>
      this.applyPendingAdditional()
    }

    // if (this.collects) console.log(this.body, this.constructor.name, this.collects.name)
    return this
  }

  private async jsonAsync(): Promise<void> {
    if (!this.called.json) {
      this.called.json = true

      const ctx = this.resolveSerializationContext()
      const hasPendingData = typeof this.pendingData !== 'undefined'
      const pendingDataCollected = this.pendingDataCollected
      const resource = hasPendingData ? this.pendingData : this.data(ctx)
      this.pendingData = undefined
      this.pendingDataCollected = false

      let data: any = await normalizeSerializableDataAsync(resource)

      if (Array.isArray(data) && this.collects && !pendingDataCollected) {
        data = await Promise.all(data.map(async item => new this.collects!(item).data(ctx)))
        data = await normalizeSerializableDataAsync(data)
      }

      if (!Array.isArray(data) && data && typeof data.data !== 'undefined') {
        data = data.data
      }

      data = sanitizeConditionalAttributes(data)

      const paginationExtras = buildPaginationExtras(this.resource)
      const { metaKey } = getPaginationExtraKeys()
      const configuredMeta = metaKey ? paginationExtras[metaKey] : undefined
      if (metaKey) {
        delete paginationExtras[metaKey]
      }

      const caseStyle = this.resolveSerializerCaseStyle(
        this.constructor as typeof GenericResource,
        this.resolveCollectsConfig()
      )
      if (caseStyle) {
        const transformer = getCaseTransformer(caseStyle)
        data = transformKeys(data, transformer)
      }

      const customMeta = this.resolveMergedMeta(GenericResource.prototype.with)

      const { wrap, rootKey, factory } = this.resolveResponseStructure()
      this.body = buildResponseEnvelope({
        payload: data,
        meta: configuredMeta,
        metaKey,
        wrap,
        rootKey,
        factory,
        context: {
          type: 'generic',
          resource: this.resource,
        },
      }) as GenericBody<R>

      this.body = appendRootProperties(
        this.body,
        {
          ...paginationExtras,
          ...(customMeta || {}),
        },
        rootKey
      ) as GenericBody<R>
      this.body = this.applySerializePlugins(this.body) as GenericBody<R>
      this.applyPendingAdditional()
    }

    return undefined
  }

  /**
   * Convert resource to object format (for collections).
   *
   * @returns
   */
  toObject() {
    this.called.toObject = true
    this.json()

    let data: any = normalizeSerializableData(this.resource)

    if (!Array.isArray(data) && data && typeof data.data !== 'undefined') {
      data = data.data
    }

    return data
  }

  /**
   * Convert resource to object format and return original data.
   * 
   * @deprecated Use toObject() instead.
   * @alias toArray
   * @since 0.2.9
   */
  toArray() {
    this.called.toArray = true

    return this.toObject()
  }

  /**
   * Add additional properties to the response body
   * 
   * @param extra  Additional properties to merge into the response body
   * @returns 
   */
  additional<X extends Record<string, any>>(extra: X) {
    this.called.additional = true
    this.json()
    this.pendingAdditional.push({ ...extra })

    if (this.called.json) {
      this.applyPendingAdditional()
    }

    return this
  }

  private applyPendingAdditional() {
    for (const extra of this.pendingAdditional.splice(0)) {
      const extraData = extra.data

      delete extra.data
      delete extra.pagination

      const payloadKey = this.getPayloadKey()
      if (extraData && payloadKey && typeof this.body[payloadKey] !== 'undefined') {
        this.body[payloadKey] = Array.isArray(this.body[payloadKey])
          ? [...this.body[payloadKey], ...extraData]
          : { ...this.body[payloadKey], ...extraData }
      }

      this.body = {
        ...this.body,
        ...extra,
      }
    }
  }

  /**
   * Build a response object, optionally accepting a raw response to write to directly.
   */
  response(): ServerResponse<GenericBody<R>>
  /**
   * Build a response object, writing to the provided raw response if possible.
   * 
   * @param res 
   */
  response(res: H3Event['res']): ServerResponse<GenericBody<R>>
  response(res: Response): ServerResponse<GenericBody<R>>

  /**
   * Build a response object, writing to the provided raw response if possible.
   * 
   * @param res 
   * @returns 
   */
  response(res?: Response | H3Event['res']): ServerResponse<GenericBody<R>> {
    const rawResponse = this.resolveRawResponse(res ?? this.res) as Response | H3Event['res']

    return this.runResponse({
      ensureJson: () => this.json(),
      ensureJsonAsync: () => this.jsonAsync(),
      rawResponse,
      body: () => this.body,
      createServerResponse: (raw, body) => {
        const response = new ServerResponse(raw as never, body)
        this.withResponseContext = {
          response,
          raw,
        }

        return response
      },
      callWithResponse: (response, raw) => {
        this.withResponse(response, raw)
      },
    })
  }

  /**
   * Customize the outgoing transport response right before dispatch.
   *
   * Override in custom classes to mutate headers/status/body.
   */
  withResponse(
    _response?: ServerResponse<GenericBody<R>>,
    _rawResponse?: Response | H3Event['res']
  ): any {
    return this
  }

  /**
   * Promise-like then method to allow chaining with async/await or .then() syntax
   * 
   * @param onfulfilled  Callback to handle the fulfilled state of the promise, receiving the response body
   * @param onrejected  Callback to handle the rejected state of the promise, receiving the error reason
   * @returns A promise that resolves to the result of the onfulfilled or onrejected callback 
   */
  then<TResult1 = GenericBody<R>, TResult2 = never>(
    onfulfilled?: ((value: GenericBody<R>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return this.runThen({
      ensureJson: async () => {
        await this.jsonAsync()
      },
      body: () => this.body,
      rawResponse: this.resolveRawResponse(this.res) as Response | H3Event['res'],
      createServerResponse: (raw, body) => {
        const response = new ServerResponse(raw as never, body)
        this.withResponseContext = {
          response,
          raw,
        }

        return response
      },
      callWithResponse: (response, raw) => {
        this.withResponse(response, raw)
      },
      sendRawResponse: (raw, body) => {
        this.sendRawResponseBody(raw, body)
      },
      onfulfilled,
      onrejected,
    })
  }

  /**
   * Promise-like catch method to handle rejected state of the promise
   *
   * @param onrejected
   * @returns
   */
  catch<TResult = never>(
    onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null,
  ): Promise<GenericBody<R> | TResult> {
    return this.runThen({
      ensureJson: async () => {
        await this.jsonAsync()
      },
      body: () => this.body,
      rawResponse: this.resolveRawResponse(this.res) as Response | H3Event['res'],
      createServerResponse: (raw, body) => {
        const response = new ServerResponse(raw as never, body)
        this.withResponseContext = {
          response,
          raw,
        }

        return response
      },
      callWithResponse: (response, raw) => {
        this.withResponse(response, raw)
      },
      sendRawResponse: (raw, body) => {
        this.sendRawResponseBody(raw, body)
      },
      onrejected,
    })
  }

  /**
   * Promise-like finally method to handle cleanup after promise is settled
   *
   * @param onfinally
   * @returns
   */
  finally(onfinally?: (() => void) | null) {
    return this.runThen({
      ensureJson: async () => {
        await this.jsonAsync()
      },
      body: () => this.body,
      rawResponse: this.resolveRawResponse(this.res) as Response | H3Event['res'],
      createServerResponse: (raw, body) => {
        const response = new ServerResponse(raw as never, body)
        this.withResponseContext = {
          response,
          raw,
        }

        return response
      },
      callWithResponse: (response, raw) => {
        this.withResponse(response, raw)
      },
      sendRawResponse: (raw, body) => {
        this.sendRawResponseBody(raw, body)
      },
      onfulfilled: onfinally as any,
      onrejected: onfinally as any,
    })
  }
}
