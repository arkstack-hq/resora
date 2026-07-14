import { Resource, registerPlugin, resetPluginsForTests } from '../../../src'
import { beforeEach, describe, it } from 'vitest'
import fastify, { FastifyInstance } from 'fastify'

import { Router as ClearRouter } from 'clear-router/fastify'
import { Controller } from 'clear-router'
import { clearRouterFastifyPlugin } from '../src'
import request from 'parasito'

describe('@resora/plugin-clear-router fastify', () => {
    let app: FastifyInstance

    beforeEach(() => {
        resetPluginsForTests()
        registerPlugin(clearRouterFastifyPlugin)

        ClearRouter.reset()

        app = fastify()
    })

    const setup = async () => {
        ClearRouter.apply(app)
        await app.ready()
    }

    it('dispatches bare resora resources returned from inline handlers', async () => {
        ClearRouter.get('/users/1', () => {
            return new Resource({ id: 1, name: 'Ada' })
        })

        await setup()

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

        await request(app).get('/users/2')
            .expect(202)
            .expect('x-plugin', '1')
            .expect({
                data: {
                    id: 2,
                    name: 'Grace',
                },
            })
    })
})
