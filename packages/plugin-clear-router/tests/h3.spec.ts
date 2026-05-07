import { Resource, registerPlugin, resetPluginsForTests } from 'resora'
import { beforeEach, describe, it } from 'vitest'

import { Router as ClearRouter } from 'clear-router/h3'
import { Controller } from 'clear-router'
import { H3 } from 'h3'
import { clearRouterH3Plugin } from '../src'
import request from 'parasito'

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

        ClearRouter.apply(app)
        await request(app).get('/users/1')
            .expect(200)
            .expect({
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

        ClearRouter.apply(app)

        await request(app).get('/users/2')
            .expect(201)
            .expect('X-Plugin', '1')
            .expect({
                data: {
                    id: 2,
                    name: 'Grace',
                },
            })
    })
})