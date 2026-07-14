import { Resource, registerPlugin, resetPluginsForTests } from '../../../src'
import { beforeEach, describe, expect, it } from 'vitest'

import { Router as ClearRouter } from 'clear-router/koa'
import { Controller } from 'clear-router'
import Koa from 'koa'
import KoaRouter from '@koa/router'
import { clearRouterKoaPlugin } from '../src'
import request from 'parasito'

describe('@resora/plugin-clear-router koa', () => {
    let app: Koa
    let router: KoaRouter

    beforeEach(() => {
        resetPluginsForTests()
        registerPlugin(clearRouterKoaPlugin)

        ClearRouter.reset()

        app = new Koa()
        router = new KoaRouter()
    })

    const setup = () => {
        ClearRouter.apply(router)
        app.use(router.routes())
        app.use(router.allowedMethods())
    }

    it('dispatches bare resora resources returned from inline handlers', async () => {
        ClearRouter.get('/users/1', () => {
            return new Resource({ id: 1, name: 'Ada' })
        })

        setup()

        const response = await request(app.callback()).get('/users/1')

        expect(response.status).toBe(200)
        expect(response.body).toEqual({
            data: {
                id: 1,
                name: 'Ada',
            },
        })
    })

    it('supports controller actions and preserves withResponse mutations', async () => {
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

        setup()

        const response = await request(app.callback()).get('/users/2')

        expect(response.status).toBe(202)
        expect(response.header['x-plugin']).toBe('1')
        expect(response.body).toEqual({
            data: {
                id: 2,
                name: 'Grace',
            },
        })
    })
})
