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
  getCaseTransformer,
  getPaginationExtraKeys,
  isArkormLikeCollection,
  isArkormLikeModel,
  normalizeSerializableData,
  sanitizeConditionalAttributes,
  transformKeys,
} from './utilities'

/**
 * GenericResource class to handle API resource transformation and response building
 */
export class GenericResource<
  R extends NonCollectible | Collectible | CollectionLike | PaginatorLike | ResourceData = ResourceData,
  T extends ResourceData = any
> extends BaseSerializer<R> {
  [key: string]: any;
  private body: GenericBody<R> = { data: {} as any }
  public resource: R
  public collects?: typeof Resource<T>
  protected withResponseContext?: {
    response: ServerResponse<GenericBody<R>>
    raw: Response | H3Event['res']
  }

  constructor(rsc: R, private res?: Response) {
    super()
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
      this.constructor as typeof GenericResource,
      this.resolveCollectsConfig()
    )
  }

  protected resolveCurrentRootKey () {
    return this.resolveResponseStructure().rootKey
  }

  protected applyMetaToBody (meta: MetaData, rootKey: string) {
    this.body = appendRootProperties(this.body, meta, rootKey) as GenericBody<R>
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
    }

    // if (this.collects) console.log(this.body, this.constructor.name, this.collects.name)
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
  ): Promise<GenericBody<R> | TResult> {
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
