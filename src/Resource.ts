import type { H3Event } from 'h3'
import {
  CaseStyle,
  Collectible,
  NonCollectible,
  ResourceBody,
  ResourceData,
  ResponseStructureConfig,
} from 'src/types'
import { ServerResponse } from './ServerResponse'
import type { Response } from 'express'
import { ResourceCollection } from './ResourceCollection'
import {
  buildResponseEnvelope,
  getCaseTransformer,
  getGlobalCase,
  getGlobalResponseStructure,
  transformKeys,
} from './utility'

/**
 * Resource class to handle API resource transformation and response building
 */
export class Resource<R extends ResourceData | NonCollectible = ResourceData> {
  [key: string]: any;
  public body: ResourceBody<R> = { data: {} as any }
  public resource: R

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
    status?: boolean
    then?: boolean
    toResponse?: boolean
  } = {}

  constructor(rsc: R, private res?: Response) {
    this.resource = rsc

    /**
     * Copy properties from rsc to this instance for easy 
     * access, but only if data is not an array
     */
    if (!Array.isArray(this.resource.data ?? this.resource)) {
      for (const key of Object.keys(this.resource.data ?? this.resource)) {
        if (!(key in this)) {
          Object.defineProperty(this, key, {
            enumerable: true,
            configurable: true,
            get: () => {
              return this.resource.data?.[key] ?? (<any>this.resource)[key]
            },
            set: (value) => {
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
    C extends ResourceData[] | Collectible = ResourceData[],
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

  private resolveResponseStructure () {
    const local = (this.constructor as typeof Resource).responseStructure
    const global = getGlobalResponseStructure()

    return {
      rootKey: local?.rootKey ?? global?.rootKey ?? 'data',
      factory: local?.factory ?? global?.factory,
    }
  }

  private getPayloadKey () {
    const { rootKey, factory } = this.resolveResponseStructure()
    return factory ? undefined : rootKey
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

      let data: any = Array.isArray(resource) ? [...resource] : { ...resource }

      if (typeof data.data !== 'undefined') {
        data = data.data
      }

      // Apply case transformation if configured
      const caseStyle = (this.constructor as typeof Resource).preferredCase ?? getGlobalCase()
      if (caseStyle) {
        const transformer = getCaseTransformer(caseStyle)
        data = transformKeys(data, transformer)
      }

      const { rootKey, factory } = this.resolveResponseStructure()
      this.body = buildResponseEnvelope({
        payload: data,
        rootKey,
        factory,
        context: {
          type: 'resource',
          resource: this.resource,
        },
      }) as ResourceBody<R>
    }

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

    let data = Array.isArray(this.resource) ? [...this.resource] : { ...this.resource }

    if (!Array.isArray(data) && typeof data.data !== 'undefined') {
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

    return new ServerResponse(res ?? this.res as never, this.body)
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
