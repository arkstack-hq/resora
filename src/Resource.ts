import type { H3Event } from 'h3'
import {
  CollectionLike,
  Collectible,
  MetaData,
  NonCollectible,
  PaginatorLike,
  ResourceBody,
  ResourceData,
} from './types'
import { ServerResponse } from './ServerResponse'
import type { Response } from 'express'
import { ResourceCollection } from './ResourceCollection'
import { BaseSerializer } from './BaseSerializer'
import {
  appendRootProperties,
  buildResponseEnvelope,
  extractRequestUrl,
  extractResponseFromCtx,
  getCaseTransformer,
  isArkormLikeModel,
  normalizeSerializableData,
  sanitizeConditionalAttributes,
  setRequestUrl,
  transformKeys,
} from './utilities'

/**
 * Resource class to handle API resource transformation and response building
 * 
 * 
 * @author Legacy (3m1n3nc3)
 * @since 0.1.0
 * @see BaseSerializer for shared serialization logic and configuration handling
 */
export class Resource<R extends ResourceData | NonCollectible = ResourceData> extends BaseSerializer<R> {
  [key: string]: any;
  private body: ResourceBody<R> = { data: {} as any }
  private res?: Response
  public resource: R
  protected withResponseContext?: {
    response: ServerResponse<ResourceBody<R>>
    raw: Response | H3Event['res']
  }

  constructor(rsc: R, ctx?: Response | H3Event | Record<string, any>) {
    super()
    if (ctx) Resource.ctx = ctx
    this.resource = rsc

    if (ctx) {
      const url = extractRequestUrl(ctx)
      if (url) {
        setRequestUrl(url)
      }

      this.res = extractResponseFromCtx(ctx)
    }

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
    return this.toObject()
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

  private resolveResponseStructure () {
    return this.resolveSerializerResponseStructure(this.constructor as typeof Resource)
  }

  /**
   * Resolve the current root key for the response body based on configuration and defaults.
   * 
   * @returns 
   */
  protected resolveCurrentRootKey () {
    return this.resolveResponseStructure().rootKey
  }

  protected applyMetaToBody (meta: MetaData, rootKey: string) {
    this.body = appendRootProperties(this.body, meta, rootKey) as ResourceBody<R>
  }

  protected getResourceForMeta () {
    return this.resource
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
      const caseStyle = this.resolveSerializerCaseStyle(this.constructor as typeof Resource)
      if (caseStyle) {
        const transformer = getCaseTransformer(caseStyle)
        data = transformKeys(data, transformer)
      }

      const customMeta = this.resolveMergedMeta(Resource.prototype.with)

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
   * Convert resource to object format (for collections) or return original data for single resources.
   *
   * @returns
   */
  toObject (): R extends NonCollectible ? R['data'] : R {
    this.called.toObject = true
    this.json()

    let data = normalizeSerializableData(this.resource) as any

    if (!Array.isArray(data) && data && typeof data.data !== 'undefined') {
      data = data.data
    }

    return data as never
  }

  /**
   * Convert resource to object format and return original data.
   * 
   * @deprecated Use toObject() instead.
   * @alias toArray
   * @since 0.2.9
   */
  toArray (): R extends NonCollectible ? R['data'] : R {
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

  /**
   * Build a response object, optionally accepting a raw response to mutate in withResponse.
   */
  response (): ServerResponse<ResourceBody<R>>
  /**
   * Build a response object, optionally accepting a raw response to mutate in withResponse.
   * @param res Optional raw response object (e.g. Express Response or H3Event res)
   */
  response (res: H3Event['res']): ServerResponse<ResourceBody<R>>
  response (res: Response): ServerResponse<ResourceBody<R>>
  /**
   * Build a response object, optionally accepting a raw response to mutate in withResponse.
   * 
   * @param res Optional raw response object (e.g. Express Response or H3Event res)
   * @returns 
   */
  response (res?: H3Event['res'] | Response): ServerResponse<ResourceBody<R>> {
    const rawResponse = res ?? this.res ?? (Resource.ctx as any)?.res as never

    return this.runResponse({
      ensureJson: () => this.json(),
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
    return this.runThen({
      ensureJson: () => this.json(),
      body: () => this.body,
      rawResponse: this.res ?? (Resource.ctx as any)?.res as never,
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
  ): Promise<ResourceBody<R> | TResult> {
    return this.runThen({
      ensureJson: () => this.json(),
      body: () => this.body,
      rawResponse: this.res ?? (Resource.ctx as any)?.res as never,
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
      rawResponse: this.res ?? (Resource.ctx as any)?.res as never,
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
