import { Collectible, NonCollectible, ResourceData } from './types'

import type { H3Event } from 'h3'
import type { Response } from 'express'
import { runPluginHook } from './plugins'

export interface ServerResponseData<R = any> {
    body: R
    status: number
    statusText?: string
    headers: Record<string, string>
}

/**
 * ServerResponse class to handle HTTP response construction and sending, compatible 
 * with both Express and H3 response objects.
 * 
 * @author Legacy (3m1n3nc3)
 * @since 0.1.0
 */
export class ServerResponse<
    R extends
    | NonCollectible
    | Collectible
    | ResourceData[]
    | ResourceData = any,
> {
    private _status: number = 200
    private sent = false
    private prepared = false
    private bodyResolver?: () => R | PromiseLike<R>
    headers: Record<string, string> = {}

    constructor(response: H3Event['res'], body: R)
    constructor(response: Response, body: R)
    constructor(response: undefined, body: R)
    constructor(private response: Response | H3Event['res'] | undefined, private body: R) { }

    /**
     * Set the HTTP status code for the response
     * 
     * @param status 
     * @returns The current ServerResponse instance
     */
    setStatusCode(status: number) {
        this._status = status
        this.prepared = false

        return this
    }

    /**
     * Replace the response body that will be dispatched.
     *
     * @param body
     * @returns The current ServerResponse instance
     */
    setBody(body: R) {
        this.body = body
        this.prepared = false

        return this
    }

    /**
     * Defer resolving the response body until the response is dispatched.
     *
     * @param resolver
     * @returns
     */
    setBodyResolver(resolver: () => R | PromiseLike<R>) {
        this.bodyResolver = resolver

        return this
    }

    /**
     * Get the current HTTP status code for the response
     * 
     * @returns 
     */
    status() {
        return this._status
    }

    /**
     * Get the current HTTP status text for the response
     * 
     * @returns 
     */
    statusText() {
        if (this.response && 'statusMessage' in this.response) {
            return this.response.statusMessage
        } else if (this.response && 'statusText' in this.response) {
            return this.response.statusText
        }

        return undefined
    }

    /**
     * Set a cookie in the response header
     * 
     * @param name The name of the cookie
     * @param value The value of the cookie
     * @param options Optional cookie attributes (e.g., path, domain, maxAge)
     * @returns The current ServerResponse instance
     */
    setCookie(name: string, value: string, options?: Record<string, any>) {
        this.#addHeader(
            'Set-Cookie',
            `${name}=${value}; ${Object.entries(options || {}).map(([key, val]) => `${key}=${val}`).join('; ')}`
        )

        return this
    }

    /**
     * Convert the resource to a JSON response body
     * 
     * @param headers Optional headers to add to the response
     * @returns The current ServerResponse instance
     */
    setHeaders(headers: Record<string, string>) {
        for (const [key, value] of Object.entries(headers)) {
            this.#addHeader(key, value)
        }

        return this
    }

    /**
     * Add a single header to the response
     * 
     * @param key The name of the header
     * @param value The value of the header
     * @returns The current ServerResponse instance
     */
    header(key: string, value: string) {
        this.#addHeader(key, value)

        return this
    }

    /**
     * Add a single header to the response
     * 
     * @param key The name of the header
     * @param value The value of the header
     */
    #addHeader(key: string, value: string) {
        this.headers[key] = value
        this.prepared = false

        if (
            this.response &&
            'headers' in this.response &&
            this.response.headers &&
            typeof this.response.headers.set === 'function'
        ) {
            this.response.headers.set(key, value)
        } else if (this.response && 'setHeader' in this.response) {
            this.response.setHeader(key, value)
        } else if (this.response && 'header' in this.response && typeof this.response.header === 'function') {
            this.response.header(key, value)
        } else if (this.response && 'set' in this.response && typeof this.response.set === 'function') {
            this.response.set(key, value)
        }
    }

    /**
     * Return the finalized response state without dispatching it.
     *
     * This is the preferred integration boundary for frameworks that own their
     * response lifecycle. The returned object is deliberately not thenable.
     */
    toResponseData(): ServerResponseData<R> {
        this.#prepare()

        const statusText = this.statusText()

        return {
            body: this.body,
            status: this._status,
            ...(statusText ? { statusText } : {}),
            headers: {
                ...this.headers,
            },
        }
    }

    /**
     * Dispatch the current body and apply any deferred transport state.
     *
     * @param body Optional body override
     * @returns The dispatched response body
     */
    send(body?: R): R | Promise<R> {
        if (this.sent || this.#rawResponseSent()) {
            return this.body
        }

        if (typeof body === 'undefined' && this.bodyResolver) {
            const resolver = this.bodyResolver
            this.bodyResolver = undefined

            return Promise.resolve(resolver()).then(resolvedBody => this.send(resolvedBody))
        }

        if (typeof body !== 'undefined') {
            this.body = body
            this.prepared = false
        }

        this.#prepare()

        if (!this.response) {
            this.sent = true

            return this.body
        }

        if ('send' in this.response && typeof this.response.send === 'function') {
            if ('statusCode' in this.response) {
                this.response.statusCode = this._status
            }

            if ('status' in this.response && typeof this.response.status === 'function') {
                this.response.status(this._status)
            } else if ('code' in this.response && typeof this.response.code === 'function') {
                this.response.code(this._status)
            }

            (this.response as any).__resoraStatus = this._status
            this.response.send(this.body)
            this.sent = true

            this.#runAfterSend()

            return this.body
        }

        if ('status' in this.response && typeof this.response.status === 'function') {
            this.response.status(this._status);
            (this.response as any).__resoraStatus = this._status
        } else if ('status' in this.response && typeof this.response.status !== 'function') {
            this.response.status = this._status
        }

        if ('body' in this.response && typeof this.response.body !== 'function') {
            (this.response as any).body = this.body;
            (this.response as any).__resoraStatus = this._status
        }

        this.sent = true
        this.#runAfterSend()

        return this.body
    }

    #prepare() {
        if (this.prepared) {
            return
        }

        const beforeSend = runPluginHook('beforeSend', {
            response: this,
            rawResponse: this.response,
            body: this.body,
            status: this._status,
            headers: {
                ...this.headers,
            },
        })

        this.body = beforeSend.body
        this._status = beforeSend.status
        this.headers = {
            ...beforeSend.headers,
        }
        this.prepared = true
    }

    #runAfterSend() {
        runPluginHook('afterSend', {
            response: this,
            rawResponse: this.response,
            body: this.body,
            status: this._status,
            headers: {
                ...this.headers,
            },
        })
    }

    #rawResponseSent() {
        const raw = this.response as any

        return Boolean(raw?.headersSent || raw?.sent || raw?.raw?.headersSent)
    }

    /**
     * Promise-like then method to allow chaining with async/await or .then() syntax
     * 
     * @param onfulfilled  Callback to handle the fulfilled state of the promise, receiving the response body
     * @param onrejected  Callback to handle the rejected state of the promise, receiving the error reason
     * @returns A promise that resolves to the result of the onfulfilled or onrejected callback 
     */
    then<TResult1 = R, TResult2 = never>(
        onfulfilled?: ((value: R) => TResult1 | PromiseLike<TResult1>) | null,
        onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
    ): Promise<TResult1 | TResult2> {
        const resolved = Promise.resolve(this.send()).then(onfulfilled, onrejected)

        return resolved
    }

    /**
     * Promise-like catch method to handle rejected state of the promise
     * 
     * @param onrejected 
     * @returns 
     */
    catch<TResult = never>(
        onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null,
    ): Promise<R | TResult> {
        return this.then(undefined, onrejected)
    }

    /**
     * Promise-like finally method to handle cleanup after promise is settled
     * 
     * @param onfinally 
     * @returns 
     */
    finally(onfinally?: (() => void) | null) {
        return this.then(onfinally, onfinally)
    }

}
