import { Resource, registerPlugin, resetPluginsForTests } from 'resora'
import { beforeEach, describe, expect, it } from 'vitest'

import { Router as ClearRouter } from 'clear-router/h3'
import { Controller } from 'clear-router'
import { H3 } from 'h3'
import { clearRouterH3Plugin } from '../src'

describe('@resora/plugin-clear-router h3', () => {
    let app: H3

    beforeEach(() => {
        resetPluginsForTests()
        registerPlugin(clearRouterH3Plugin)

        ClearRouter.routes = []
        ClearRouter.prefix = ''
        ClearRouter.groupMiddlewares = []
        ClearRouter.globalMiddlewares = []
        ClearRouter.routesByPathMethod = {}
        ClearRouter.routesByMethod = {}

        app = new H3()
    })

    it('returns serialized resora resources through inline clear-router h3 handlers', async () => {
        ClearRouter.get('/users/1', () => {
            return new Resource({ id: 1, name: 'Ada' })
        })

        const router = ClearRouter.apply(app)
        const response = await router.fetch(new Request('http://localhost/users/1'))

        expect(response.status).toBe(200)
        expect(await response.json()).toEqual({
            data: {
                id: 1,
                name: 'Ada',
            },
        })
    })

    it('supports controller actions and preserves withResponse mutations', async () => {
        class UserController extends Controller {
            show () {
                return new Resource({ id: 2, name: 'Grace' })
                    .response(this.ctx.res)
                    .header('X-Plugin', '1')
                    .setStatusCode(201)
            }
        }

        ClearRouter.get('/users/2', [UserController, 'show'])

        const router = ClearRouter.apply(app)
        const response = await router.fetch(new Request('http://localhost/users/2'))

        expect(response.status).toBe(201)
        expect(response.headers.get('X-Plugin')).toBe('1')
        expect(await response.json()).toEqual({
            data: {
                id: 2,
                name: 'Grace',
            },
        })
    })
})