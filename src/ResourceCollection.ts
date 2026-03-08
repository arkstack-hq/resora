import type { H3Event } from 'h3'
import {
  CaseStyle,
  CollectionLike,
  ResourceData,
  Collectible,
  CollectionBody,
  MetaData,
  PaginatorLike,
  ResponseStructureConfig,
} from './types'
import { ServerResponse } from './ServerResponse'
import type { Response } from 'express'
import { Resource } from './Resource'
import {
  appendRootProperties,
  buildPaginationExtras,
  buildResponseEnvelope,
  getCaseTransformer,
  getGlobalCase,
  getGlobalResponseStructure,
  getPaginationExtraKeys,
  isArkormLikeCollection,
  mergeMetadata,
  normalizeSerializableData,
  resolveMergeWhen,
  resolveWhen,
  resolveWhenNotNull,
  resolveWithHookMetadata,
  sanitizeConditionalAttributes,
  transformKeys,
} from './utilities'

/**
 * ResourceCollection class to handle API resource transformation and response building for collections
 */
export class ResourceCollection<
  R extends ResourceData[] | Collectible | CollectionLike | PaginatorLike = ResourceData[] | Collectible | CollectionLike | PaginatorLike,
  T extends ResourceData = any
> {
  [key: string]: any;
  private body: CollectionBody<R> = { data: [] as any }
  public resource: R
  public collects?: typeof Resource<T>
  private additionalMeta?: MetaData
  protected withResponseContext?: {
    response: ServerResponse<CollectionBody<R>>
    raw: Response | H3Event['res']
  }

  private isPaginatedCollectible (value: unknown): value is Collectible {
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

  /**
   * Preferred case style for this collection's output keys.
   * Set on a subclass to override the global default.
   */
  static preferredCase?: CaseStyle

  /**
   * Response structure override for this collection class.
   */
  static responseStructure?: ResponseStructureConfig

  private called: {
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

  constructor(rsc: R)
  constructor(rsc: R, res: Response)
  constructor(rsc: R, private res?: Response) {
    this.resource = rsc
  }

  /**
   * Get the original resource data
   */
  data () {
    return this.toArray()
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

  /**
   * Conditionally include a value in serialized output.
   */
  when<T> (condition: any, value: T | (() => T)): T | undefined {
    return resolveWhen(condition, value) as T | undefined
  }

  /**
   * Include a value only when it is not null/undefined.
   */
  whenNotNull<T> (value: T | null | undefined): T | undefined {
    return resolveWhenNotNull(value) as T | undefined
  }

  /**
   * Conditionally merge object attributes into serialized output.
   */
  mergeWhen<T extends Record<string, any>> (condition: any, value: T | (() => T)): Partial<T> {
    return resolveMergeWhen(condition, value)
  }

  private resolveResponseStructure () {
    const local = (this.constructor as typeof ResourceCollection).responseStructure
    const collectsLocal = (this.collects as typeof Resource | undefined)?.responseStructure
    const global = getGlobalResponseStructure()

    return {
      wrap: local?.wrap ?? collectsLocal?.wrap ?? global?.wrap ?? true,
      rootKey: local?.rootKey ?? collectsLocal?.rootKey ?? global?.rootKey ?? 'data',
      factory: local?.factory ?? collectsLocal?.factory ?? global?.factory,
    }
  }

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
      const caseStyle = (this.constructor as typeof ResourceCollection).preferredCase
        ?? (this.collects as typeof Resource | undefined)?.preferredCase
        ?? getGlobalCase()
      if (caseStyle) {
        const transformer = getCaseTransformer(caseStyle)
        data = transformKeys(data, transformer) as CollectionBody<R>['data']
      }

      const hookMeta = resolveWithHookMetadata(this, ResourceCollection.prototype.with)
      const customMeta = mergeMetadata(hookMeta, this.additionalMeta)

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
   * Append structured metadata to the response body.
   *
   * @param meta  Metadata object or metadata factory
   * @returns
   */
  with (meta?: any): any {
    this.called.with = true

    if (typeof meta === 'undefined') {
      return this.additionalMeta || {}
    }

    const resolvedMeta = typeof meta === 'function'
      ? (meta(this.resource) as MetaData)
      : meta

    this.additionalMeta = mergeMetadata(this.additionalMeta, resolvedMeta)

    if (this.called.json) {
      const { rootKey } = this.resolveResponseStructure()
      this.body = appendRootProperties(this.body, resolvedMeta, rootKey) as CollectionBody<R>
    }

    return this
  }

  /**
   * Typed fluent metadata helper.
   *
   * @param meta  Metadata object or metadata factory
   * @returns
   */
  withMeta<M extends MetaData> (meta: M | ((resource: R) => M)) {
    this.with(meta)

    return this
  }

  /**
   * Flatten resource to return original data
   *
   * @returns
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
    this.json()

    const source = Array.isArray(this.resource)
      ? this.resource
      : isArkormLikeCollection(this.resource)
        ? this.resource.all()
        : this.resource.data as never[]

    return normalizeSerializableData(source) as never
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
    this.called.toResponse = true

    this.json()

    const rawResponse = res ?? this.res as never
    const response = new ServerResponse(rawResponse, this.body)
    this.withResponseContext = {
      response,
      raw: rawResponse,
    }

    this.called.withResponse = true
    this.withResponse(response, rawResponse)

    return response
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
    this.called.then = true
    this.json()

    if (this.res) {
      const response = new ServerResponse(this.res as never, this.body)
      this.withResponseContext = {
        response,
        raw: this.res,
      }
      this.called.withResponse = true
      this.withResponse(response, this.res)
    } else {
      this.called.withResponse = true
      this.withResponse()
    }

    const resolved = Promise.resolve(this.body).then(onfulfilled, onrejected)

    if (this.res) {
      this.res.send(this.body)
    }

    return resolved
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
    return this.then(undefined, onrejected)
  }

  /**
   * Promise-like finally method to handle cleanup after promise is settled
   * 
   * @param onfinally 
   * @returns 
   */
  finally (onfinally?: (() => void) | null) {
    return this.then(onfinally, onfinally)
  }
}
