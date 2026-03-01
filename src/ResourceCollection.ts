import type { H3Event } from 'h3'
import { CaseStyle, ResourceData, Collectible, CollectionBody } from 'src/types'
import { ServerResponse } from './ServerResponse'
import type { Response } from 'express'
import { Resource } from './Resource'
import { getCaseTransformer, getGlobalCase, transformKeys } from './utility'

/**
 * ResourceCollection class to handle API resource transformation and response building for collections
 */
export class ResourceCollection<R extends ResourceData[] | Collectible = ResourceData[], T extends ResourceData = any> {
  [key: string]: any;
  public body: CollectionBody<R> = { data: [] as any }
  public resource: R
  public collects?: typeof Resource<T>

  /**
   * Preferred case style for this collection's output keys.
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

      this.body = { data } as CollectionBody<R>

      if (!Array.isArray(this.resource)) {
        if (this.resource.pagination && this.resource.cursor)
          this.body.meta = {
            pagination: this.resource.pagination,
            cursor: this.resource.cursor
          } as CollectionBody<R>['meta']
        else if (this.resource.pagination)
          this.body.meta = { pagination: this.resource.pagination } as CollectionBody<R>['meta']
        else if (this.resource.cursor)
          this.body.meta = { cursor: this.resource.cursor } as CollectionBody<R>['meta']
      }

      // Apply case transformation if configured
      const caseStyle = (this.constructor as typeof ResourceCollection).preferredCase
        ?? (this.collects as typeof Resource | undefined)?.preferredCase
        ?? getGlobalCase()
      if (caseStyle) {
        const transformer = getCaseTransformer(caseStyle)
        this.body.data = transformKeys(this.body.data, transformer) as CollectionBody<R>['data']
      }
    }

    return this
  }

  /**
   * Flatten resource to return original data
   *
   * @returns
   */
  toArray (): (R extends Collectible ? R['data'][number] : R extends ResourceData[] ? R[number] : never)[] {
    this.called.toArray = true
    this.json()

    return Array.isArray(this.resource) ? [...this.resource] : [...this.resource.data as never[]]
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

    if (extra.data && Array.isArray(this.body.data)) {
      this.body.data = [...this.body.data, ...extra.data] as never
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

    return new ServerResponse(res ?? this.res as never, this.body)
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
