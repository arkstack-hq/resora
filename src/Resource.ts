import type { H3Event } from 'h3'
import {
  CaseStyle,
  CollectionLike,
  Collectible,
  MetaData,
  NonCollectible,
  PaginatorLike,
  ResourceBody,
  ResourceData,
  ResponseStructureConfig,
} from './types'
import { ServerResponse } from './ServerResponse'
import type { Response } from 'express'
import { ResourceCollection } from './ResourceCollection'
import {
  appendRootProperties,
  buildResponseEnvelope,
  getCaseTransformer,
  getGlobalCase,
  getGlobalResponseStructure,
  isArkormLikeModel,
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
 * Resource class to handle API resource transformation and response building
 */
export class Resource<R extends ResourceData | NonCollectible = ResourceData> {
  [key: string]: any;
  private body: ResourceBody<R> = { data: {} as any }
  public resource: R
  private additionalMeta?: MetaData
  protected withResponseContext?: {
    response: ServerResponse<ResourceBody<R>>
    raw: Response | H3Event['res']
  }

  /**
   * Preferred case style for this resource's output keys.
   * Set on a subclass to override the global default.
   */
  static preferredCase?: CaseStyle

  /**
   * Response structure override for this resource class.
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

  constructor(rsc: R, private res?: Response) {
    this.resource = rsc

    const source = this.resource.data ?? this.resource

    /**
     * Copy properties from rsc to this instance for easy 
     * access, but only if data is not an array
     */
    if (!Array.isArray(source)) {
      const sourceKeys = isArkormLikeModel(source)
        ? Object.keys(source.toObject())
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

              return this.resource.data?.[key] ?? (<any>this.resource)[key]
            },
            set: (value) => {
              if (isArkormLikeModel(source) && typeof source.setAttribute === 'function') {
                source.setAttribute(key, value)

                return
              }

              if ((<any>this.resource).data && this.resource.data[key]) {
                this.resource.data[key] = value
              } else {
                (<any>this.resource)[key] = value
              }
            },
          })
        }
      }
    }
  }

  /**
   * Create a ResourceCollection from an array of resource data or a Collectible instance
   * 
   * @param data 
   * @returns 
   */
  static collection<
    C extends ResourceData[] | Collectible | CollectionLike | PaginatorLike = ResourceData[],
    T extends ResourceData = any
  > (data: C) {
    return new ResourceCollection<C, T>(data).setCollects(this)
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
  getBody (): ResourceBody<R> {
    this.json()

    return this.body
  }

  /**
   * Replace the current serialized output body.
   */
  protected setBody (body: ResourceBody<R>) {
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
    const local = (this.constructor as typeof Resource).responseStructure
    const global = getGlobalResponseStructure()

    return {
      wrap: local?.wrap ?? global?.wrap ?? true,
      rootKey: local?.rootKey ?? global?.rootKey ?? 'data',
      factory: local?.factory ?? global?.factory,
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

      const resource = this.data()

      let data: any = normalizeSerializableData(resource)

      if (!Array.isArray(data) && data && typeof data.data !== 'undefined') {
        data = data.data
      }

      data = sanitizeConditionalAttributes(data)

      // Apply case transformation if configured
      const caseStyle = (this.constructor as typeof Resource).preferredCase ?? getGlobalCase()
      if (caseStyle) {
        const transformer = getCaseTransformer(caseStyle)
        data = transformKeys(data, transformer)
      }

      const hookMeta = resolveWithHookMetadata(this, Resource.prototype.with)
      const customMeta = mergeMetadata(hookMeta, this.additionalMeta)

      const { wrap, rootKey, factory } = this.resolveResponseStructure()
      this.body = buildResponseEnvelope({
        payload: data,
        wrap,
        rootKey,
        factory,
        context: {
          type: 'resource',
          resource: this.resource,
        },
      }) as ResourceBody<R>

      this.body = appendRootProperties(this.body, customMeta, rootKey) as ResourceBody<R>
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
      this.body = appendRootProperties(this.body, resolvedMeta, rootKey)
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
   * Flatten resource to array format (for collections) or return original data for single resources
   *
   * @returns
   */
  toArray (): R extends NonCollectible ? R['data'] : R {
    this.called.toArray = true
    this.json()

    let data = normalizeSerializableData(this.resource) as any

    if (!Array.isArray(data) && data && typeof data.data !== 'undefined') {
      data = data.data
    }

    return data as never
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

    const payloadKey = this.getPayloadKey()

    if (extra.data && payloadKey && typeof this.body[payloadKey] !== 'undefined') {
      this.body[payloadKey] = Array.isArray(this.body[payloadKey])
        ? [...this.body[payloadKey], ...extra.data]
        : { ...this.body[payloadKey], ...extra.data }
    }

    this.body = {
      ...this.body,
      ...extra,
    }

    return this
  }

  response (): ServerResponse<ResourceBody<R>>
  response (res: H3Event['res']): ServerResponse<ResourceBody<R>>
  response (res?: H3Event['res']): ServerResponse<ResourceBody<R>> {
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
    _response?: ServerResponse<ResourceBody<R>>,
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
  then<TResult1 = ResourceBody<R>, TResult2 = never> (
    onfulfilled?: ((value: ResourceBody<R>) => TResult1 | PromiseLike<TResult1>) | null,
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
  ): Promise<ResourceBody<R> | TResult> {
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
