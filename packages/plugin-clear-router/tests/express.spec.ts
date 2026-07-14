import { Bind, Container } from 'clear-router/decorators'
import { Resource, registerPlugin, resetPluginsForTests } from '../../../src'
import { beforeEach, describe, expect, it } from 'vitest'
import express, { Router as ExpressRouter } from 'express'

import { Router as ClearRouter } from 'clear-router/express'
import { Controller } from 'clear-router'
import { clearRouterExpressPlugin } from '../src'
import request from 'parasito'

describe('@resora/plugin-clear-router express', () => {
    let app: express.Application
    let router: ExpressRouter

    beforeEach(() => {
        resetPluginsForTests()
        registerPlugin(clearRouterExpressPlugin)

        ClearRouter.reset()
        ClearRouter.configure({
            container: {
                enabled: false,
                autoDiscover: false,
                strict: false,
            },
        })
        Container.clear()

        app = express()
        router = ExpressRouter()
        app.use(express.json())
    })

    const setup = async () => {
        await ClearRouter.apply(router)
        app.use(router)
    }

    it('dispatches bare resora resources returned from inline handlers', async () => {
        ClearRouter.get('/users/1', () => {
            return new Resource({ id: 1, name: 'Ada' })
        })

        await setup()

        const response = await request(app).get('/users/1')

        expect(response.status).toBe(200)
        expect(response.body).toEqual({
            data: {
                id: 1,
                name: 'Ada',
            },
        })
    })

    it('dispatches resources returned from controller actions', async () => {
        class UserController extends Controller {
            index() {
                return new Resource({ id: 3, name: 'Linus' })
            }
        }

        ClearRouter.get('/users', [UserController, 'index'])

        await setup()

        const response = await request(app).get('/users')

        expect(response.status).toBe(200)
        expect(response.body).toEqual({
            data: {
                id: 3,
                name: 'Linus',
            },
        })
    })

    it('preserves resora withResponse header and status mutations', async () => {
        class CustomResource extends Resource {
            withResponse(response: any) {
                response
                    .header('X-Plugin', '1')
                    .setStatusCode(202)
            }
        }

        class UserController extends Controller {
            show() {
                return new CustomResource({ id: 2, name: 'Grace' })
            }
        }

        ClearRouter.get('/users/2', [UserController, 'show'])

        await setup()

        const response = await request(app).get('/users/2')

        expect(response.status).toBe(202)
        expect(response.header['x-plugin']).toBe('1')
        expect(response.body).toEqual({
            data: {
                id: 2,
                name: 'Grace',
            },
        })
    })

    it('does not double-send async controller responses bound with .response()', async () => {
        class UserController extends Controller {
            async index() {
                return new Resource({ id: 4, name: 'Katherine' })
                    .additional({ message: 'OK' })
                    .response()
                    .setStatusCode(202)
            }
        }

        ClearRouter.get('/async-users', [UserController, 'index'])

        await setup()

        const response = await request(app).get('/async-users')

        expect(response.status).toBe(202)
        expect(response.body).toEqual({
            data: {
                id: 4,
                name: 'Katherine',
            },
            message: 'OK',
        })
    })

    it('preserves request-scoped DI across concurrent resource responses', async () => {
        class ScopedResource extends Resource {
            withResponse(response: any) {
                response.header('X-Scoped-Resource', '1')
            }
        }

        class RequestService {
            constructor(
                readonly id: string,
                readonly instanceId: number,
            ) { }
        }

        let instances = 0
        Container.bind(RequestService, {
            scope: 'request',
            useFactory: (ctx) => {
                return new RequestService(ctx.clearRequest.param('id'), ++instances)
            },
        })

        class UserController extends Controller {
            @Bind(RequestService, RequestService)
            show(first: RequestService, second: RequestService) {
                return new ScopedResource({
                    id: first.id,
                    instanceId: first.instanceId,
                    sameInstance: first === second,
                })
            }
        }

        ClearRouter.configure({
            container: {
                enabled: true,
                strict: true,
            },
        })
        ClearRouter.get('/scoped-users/:id', [UserController, 'show'])

        await setup()

        const [first, second] = await Promise.all([
            request(app).get('/scoped-users/first'),
            request(app).get('/scoped-users/second'),
        ])

        expect(first.body.data).toMatchObject({ id: 'first', sameInstance: true })
        expect(second.body.data).toMatchObject({ id: 'second', sameInstance: true })
        expect(first.body.data.instanceId).not.toBe(second.body.data.instanceId)
        expect(first.headers.get('x-scoped-resource')).toBe('1')
        expect(second.headers.get('x-scoped-resource')).toBe('1')
    })

    it('discovers parameter types with bare @Bind()', async () => {
        class UserService {
            find(id: string) {
                return { id, name: 'Ada' }
            }
        }

        Container.bind(UserService, UserService)

        class UserController extends Controller {
            @Bind()
            show(service: UserService) {
                return new Resource(service.find(this.ctx.clearRequest.param('id')))
            }
        }

        ClearRouter.configure({
            container: {
                enabled: true,
                strict: true,
            },
        })
        ClearRouter.get('/bound-users/:id', [UserController, 'show'])

        await setup()

        const response = await request(app).get('/bound-users/42')

        expect(response.status).toBe(200)
        expect(response.body).toEqual({
            data: {
                id: '42',
                name: 'Ada',
            },
        })
    })
})
