import type { H3Event } from 'h3'
import {
  CollectionLike,
  ResourceData,
  Collectible,
  CollectionBody,
  MetaData,
  PaginatorLike,
  ResourceLevelConfig,
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
  normalizeSerializableData,
  sanitizeConditionalAttributes,
  setRequestUrl,
  transformKeys,
} from './utilities'

/**
 * ResourceCollection class to handle API resource transformation and response building 
 * for collections
 * 
 * @author Legacy (3m1n3nc3)
 * @since 0.1.0
 * @see BaseSerializer for shared serialization logic and configuration handling
 */
export class ResourceCollection<
  R extends ResourceData[] | Collectible | CollectionLike | PaginatorLike = ResourceData[] | Collectible | CollectionLike | PaginatorLike,
  T extends ResourceData = any
> extends BaseSerializer<R> {
  [key: string]: any;
  private body: CollectionBody<R> = { data: [] as any }
  private res?: Response
  public resource: R
  public collects?: typeof Resource<T>
  protected withResponseContext?: {
    response: ServerResponse<CollectionBody<R>>
    raw: Response | H3Event['res']
  }

  /**
   * Type guard to determine if the provided value is a Collectible with pagination information.
   * 
   * @param value The value to check.
   * @returns     True if the value is a Collectible with pagination information, false otherwise.
   */
  isPaginatedCollectible (value: unknown): value is Collectible {
    if (!value || typeof value !== 'object') {
      return false
    }

    const resource = value as Partial<Collectible & PaginatorLike>

    if (resource.pagination && Array.isArray(resource.data)) {
      return true
    }

    const hasPaginatorMeta = !!resource.meta
      && typeof resource.meta === 'object'
      && 'currentPage' in resource.meta

    if (!hasPaginatorMeta) {
      return false
    }

    return Array.isArray(resource.data) || isArkormLikeCollection(resource.data)
  }

  constructor(rsc: R)
  constructor(rsc: R, ctx: Response | H3Event | Record<string, any>)
  constructor(rsc: R, ctx?: Response | H3Event | Record<string, any>) {
    super()
    this.resource = rsc

    if (ctx) {
      const url = extractRequestUrl(ctx)
      if (url) {
        setRequestUrl(url)
      }

      this.res = extractResponseFromCtx(ctx)
    }
  }

  /**
   * Get the original resource data
   */
  data () {
    return this.toObject()
  }

  /**
   * Get the current serialized output body.
   */
  getBody (): CollectionBody<R> {
    this.json()

    return this.body
  }

  /**
   * Replace the current serialized output body.
   */
  protected setBody (body: CollectionBody<R>) {
    this.body = body

    return this
  }

  private resolveCollectsConfig (): ResourceLevelConfig | undefined {
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

  private resolveResponseStructure () {
    return this.resolveSerializerResponseStructure(
      this.constructor as typeof ResourceCollection,
      this.resolveCollectsConfig()
    )
  }

  /**
   * Resolve the current root key for the response structure, based on configuration and defaults.
   * 
   * @returns 
   */
  protected resolveCurrentRootKey () {
    return this.resolveResponseStructure().rootKey
  }

  /**
   * Apply metadata properties to the response body, ensuring they are merged with 
   * any existing properties and respecting the configured root key.
   * 
   * @param meta 
   * @param rootKey 
   */
  protected applyMetaToBody (meta: MetaData, rootKey: string) {
    this.body = appendRootProperties(this.body, meta, rootKey) as CollectionBody<R>
  }

  /**
   * Get the resource data to be used for generating metadata, allowing for 
   * customization in subclasses.
   * 
   * @returns 
   */
  protected getResourceForMeta () {
    return this.resource
  }

  /**
   * Get the appropriate key for the response payload based on the current response 
   * structure configuration.
   * 
   * @returns The key to use for the response payload, or undefined if no key is needed.
   */
  private getPayloadKey () {
    const { wrap, rootKey, factory } = this.resolveResponseStructure()

    return factory || !wrap ? undefined : rootKey
  }

  /**
   * Convert resource to JSON response format
   * 
   * @returns 
   */
  json () {
    if (!this.called.json) {
      this.called.json = true

      let data: ResourceData[] = this.data() as never

      if (this.collects) {
        data = data.map((item: any) => new this.collects!(item).data())
      }

      data = normalizeSerializableData(data) as ResourceData[]

      data = sanitizeConditionalAttributes(data) as ResourceData[]

      const paginationExtras = !Array.isArray(this.resource)
        ? buildPaginationExtras(this.resource)
        : {}

      const { metaKey } = getPaginationExtraKeys()
      const configuredMeta = metaKey ? paginationExtras[metaKey] : undefined
      if (metaKey) {
        delete paginationExtras[metaKey]
      }

      // Apply case transformation if configured
      const caseStyle = this.resolveSerializerCaseStyle(
        this.constructor as typeof ResourceCollection,
        this.resolveCollectsConfig()
      )
      if (caseStyle) {
        const transformer = getCaseTransformer(caseStyle)
        data = transformKeys(data, transformer) as CollectionBody<R>['data']
      }

      const customMeta = this.resolveMergedMeta(ResourceCollection.prototype.with)

      const { wrap, rootKey, factory } = this.resolveResponseStructure()
      this.body = buildResponseEnvelope({
        payload: data,
        meta: configuredMeta,
        metaKey,
        wrap,
        rootKey,
        factory,
        context: {
          type: 'collection',
          resource: this.resource,
        },
      }) as CollectionBody<R>

      this.body = appendRootProperties(
        this.body,
        {
          ...paginationExtras,
          ...(customMeta || {}),
        },
        rootKey
      ) as CollectionBody<R>
    }

    return this
  }

  /**
   * Convert resource to object format and return original data.
   *
   * @returns
   */
  toObject (): (
    R extends Collectible
    ? R['data'][number]
    : R extends PaginatorLike<infer TPaginatorData>
    ? TPaginatorData
    : R extends CollectionLike<infer TCollectionData>
    ? TCollectionData
    : R extends ResourceData[]
    ? R[number]
    : never
  )[] {
    this.called.toObject = true
    this.json()

    const source = Array.isArray(this.resource)
      ? this.resource
      : isArkormLikeCollection(this.resource)
        ? this.resource.all()
        : this.resource.data as never[]

    return normalizeSerializableData(source) as never
  }

  /**
   * Convert resource to object format and return original data.
   * 
   * @deprecated Use toObject() instead.
   * @alias toArray
   * @since 0.2.9
   */
  toArray (): (
    R extends Collectible
    ? R['data'][number]
    : R extends PaginatorLike<infer TPaginatorData>
    ? TPaginatorData
    : R extends CollectionLike<infer TCollectionData>
    ? TCollectionData
    : R extends ResourceData[]
    ? R[number]
    : never
  )[] {
    this.called.toArray = true

    return this.toObject()
  }

  /**
   * Add additional properties to the response body
   * 
   * @param extra  Additional properties to merge into the response body
   * @returns 
   */
  additional<X extends Record<string, any>> (extra: X) {
    this.called.additional = true
    this.json()

    delete extra.cursor
    delete extra.pagination

    const payloadKey = this.getPayloadKey()

    if (extra.data && payloadKey && Array.isArray(this.body[payloadKey])) {
      this.body[payloadKey] = [...this.body[payloadKey], ...extra.data] as never
    }

    this.body = {
      ...this.body,
      ...extra,
    }

    return this
  }

  response (): ServerResponse<CollectionBody<R>>
  response (res: H3Event['res']): ServerResponse<CollectionBody<R>>
  response (res?: H3Event['res']): ServerResponse<CollectionBody<R>> {
    const rawResponse = res ?? this.res as never

    return this.runResponse({
      ensureJson: () => this.json(),
      rawResponse,
      body: () => this.body,
      createServerResponse: (raw, body) => {
        const response = new ServerResponse(raw, body)
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
  withResponse (
    _response?: ServerResponse<CollectionBody<R>>,
    _rawResponse?: Response | H3Event['res']
  ): any {
    return this
  }

  setCollects (collects: typeof Resource<T>) {
    this.collects = collects

    return this
  }

  /**
   * Promise-like then method to allow chaining with async/await or .then() syntax
   * 
   * @param onfulfilled  Callback to handle the fulfilled state of the promise, receiving the response body
   * @param onrejected  Callback to handle the rejected state of the promise, receiving the error reason
   * @returns A promise that resolves to the result of the onfulfilled or onrejected callback 
   */
  then<TResult1 = CollectionBody<R>, TResult2 = never> (
    onfulfilled?: ((value: CollectionBody<R>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return this.runThen({
      ensureJson: () => this.json(),
      body: () => this.body,
      rawResponse: this.res,
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
        raw.send(body)
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
  catch<TResult = never> (
    onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null,
  ): Promise<CollectionBody<R> | TResult> {
    return this.runThen({
      ensureJson: () => this.json(),
      body: () => this.body,
      rawResponse: this.res,
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
        raw.send(body)
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
  finally (onfinally?: (() => void) | null) {
    return this.runThen({
      ensureJson: () => this.json(),
      body: () => this.body,
      rawResponse: this.res,
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
        raw.send(body)
      },
      onfulfilled: onfinally as any,
      onrejected: onfinally as any,
    })
  }
}
