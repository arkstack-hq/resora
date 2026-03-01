import type { H3Event } from 'h3'
import { CaseStyle, Collectible, GenericBody, NonCollectible, ResourceData } from 'src/types'
import { ServerResponse } from './ServerResponse'
import type { Response } from 'express'
import { Resource } from './Resource'
import { getCaseTransformer, getGlobalCase, transformKeys } from './utility'

/**
 * GenericResource class to handle API resource transformation and response building
 */
export class GenericResource<
  R extends NonCollectible | Collectible | ResourceData = ResourceData,
  T extends ResourceData = any
> {
  [key: string]: any;
  public body: GenericBody<R> = { data: {} as any }
  public resource: R
  public collects?: typeof Resource<T>

  /**
   * Preferred case style for this resource's output keys.
   * Set on a subclass to override the global default.
   */
  static preferredCase?: CaseStyle

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
   * Get the original resource data
   */
  data (): R {
    return this.resource
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

      if (Array.isArray(data) && this.collects) {
        data = data.map(item => new this.collects!(item).data())
        this.resource = data
      }

      if (typeof data.data !== 'undefined') {
        data = data.data
      }

      if ((<any>this.resource).pagination && data.data && Array.isArray(data.data)) {
        delete data.pagination
      }

      this.body = { data }

      if (Array.isArray(this.body.data) && (<any>this.resource).pagination) {
        this.body.meta = {
          pagination: (<any>this.resource).pagination,
        }
      }

      // Apply case transformation if configured
      const caseStyle = (this.constructor as typeof GenericResource).preferredCase ?? getGlobalCase()
      if (caseStyle) {
        const transformer = getCaseTransformer(caseStyle)
        this.body.data = transformKeys(this.body.data, transformer)
      }
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

    let data: any = Array.isArray(this.resource) ? [...this.resource] : { ...this.resource }

    if (typeof data.data !== 'undefined') {
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

    delete extra.data
    delete extra.pagination

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

    return new ServerResponse(res ?? this.res as never, this.body)
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

    const resolved = Promise.resolve(this.body).then(onfulfilled, onrejected)

    if (this.res) {
      this.res.send(this.body)
    }

    return resolved
  }
}
