import { Resource, registerPlugin, resetPluginsForTests } from 'resora'
import { beforeEach, describe, expect, it } from 'vitest'

import { Router as ClearRouter } from 'clear-router/hono'
import { Controller } from 'clear-router'
import { Hono } from 'hono'
import { clearRouterHonoPlugin } from '../src'
import request from 'parasito'

describe('@resora/plugin-clear-router hono', () => {
    let app: Hono

    beforeEach(() => {
        resetPluginsForTests()
        registerPlugin(clearRouterHonoPlugin)

        ClearRouter.routes = []
        ClearRouter.prefix = ''
        ClearRouter.groupMiddlewares = []
        ClearRouter.globalMiddlewares = []
        ClearRouter.routesByPathMethod = {}
        ClearRouter.routesByMethod = {}

        app = new Hono()
    })

    const setup = () => {
        ClearRouter.apply(app as any)
    }

    it('dispatches bare resora resources returned from inline handlers', async () => {
        ClearRouter.get('/users/1', () => {
            return new Resource({ id: 1, name: 'Ada' })
        })

        setup()

        await request(app).get('/users/1')
            .expect(200)
            // .expect('x-plugin', '1')
            .expect({
                data: {
                    id: 1,
                    name: 'Ada',
                },
            })
    })

    it('supports controller actions and preserves withResponse mutations', async () => {
        class CustomResource extends Resource {
            withResponse (response: any) {
                response
                    .header('X-Plugin', '1')
                    .setStatusCode(202)
            }
        }

        class UserController extends Controller {
            show () {
                return new CustomResource({ id: 2, name: 'Grace' })
            }
        }

        ClearRouter.get('/users/2', [UserController, 'show'])

        setup()

        await request(app).get('/users/2')
            .expect(202)
            // .expect('x-plugin', '1')
            .expect({
                data: {
                    id: 2,
                    name: 'Grace',
                },
            })
    })
})
