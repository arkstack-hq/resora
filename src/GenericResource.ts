import type { H3Event } from 'h3'
import {
  CaseStyle,
  CollectionLike,
  Collectible,
  GenericBody,
  MetaData,
  NonCollectible,
  ResourceData,
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
 * GenericResource class to handle API resource transformation and response building
 */
export class GenericResource<
  R extends NonCollectible | Collectible | CollectionLike | ResourceData = ResourceData,
  T extends ResourceData = any
> {
  [key: string]: any;
  private body: GenericBody<R> = { data: {} as any }
  public resource: R
  public collects?: typeof Resource<T>
  private additionalMeta?: MetaData
  protected withResponseContext?: {
    response: ServerResponse<GenericBody<R>>
    raw: Response | H3Event['res']
  }

  /**
   * Preferred case style for this resource's output keys.
   * Set on a subclass to override the global default.
   */
  static preferredCase?: CaseStyle

  /**
   * Response structure override for this generic resource class.
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
  data (): R {
    return this.resource
  }

  /**
   * Get the current serialized output body.
   */
  getBody (): GenericBody<R> {
    this.json()

    return this.body
  }

  /**
   * Replace the current serialized output body.
   */
  protected setBody (body: GenericBody<R>) {
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
    const local = (this.constructor as typeof GenericResource).responseStructure
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

      const resource = this.data()

      let data: any = normalizeSerializableData(resource)

      if (Array.isArray(data) && this.collects) {
        data = data.map(item => new this.collects!(item).data())
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
      const caseStyle = (this.constructor as typeof GenericResource).preferredCase ?? getGlobalCase()
      if (caseStyle) {
        const transformer = getCaseTransformer(caseStyle)
        data = transformKeys(data, transformer)
      }

      const hookMeta = resolveWithHookMetadata(this, GenericResource.prototype.with)
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
    }

    // if (this.collects) console.log(this.body, this.constructor.name, this.collects.name)
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
      this.body = appendRootProperties(this.body, resolvedMeta, rootKey) as GenericBody<R>
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
   * Convert resource to array format (for collections)
   *
   * @returns
   */
  toArray () {
    this.called.toArray = true
    this.json()

    let data: any = normalizeSerializableData(this.resource)

    if (!Array.isArray(data) && data && typeof data.data !== 'undefined') {
      data = data.data
    }

    return data
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

    return this
  }

  response (): ServerResponse<GenericBody<R>>
  response (res: H3Event['res']): ServerResponse<GenericBody<R>>
  response (res?: H3Event['res']): ServerResponse<GenericBody<R>> {
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
  then<TResult1 = GenericBody<R>, TResult2 = never> (
    onfulfilled?: ((value: GenericBody<R>) => TResult1 | PromiseLike<TResult1>) | null,
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
}
