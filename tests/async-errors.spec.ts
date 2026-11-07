import { GenericResource, Resource, ResourceCollection } from 'src'
import { describe, expect, it } from 'vitest'

import { H3 } from 'h3'
import express from 'express'
import request from 'parasito'

class FailingResource extends Resource {
    async data () {
        throw new Error('resource failed')
    }
}

class FailingCollection extends ResourceCollection {
    data (): any {
        return Promise.reject(new Error('collection failed'))
    }
}

class FailingGeneric extends GenericResource {
    async data () {
        throw new Error('generic failed')
    }
}

const expressApp = (handler: express.RequestHandler) => {
    const app = express()

    app.get('/test', handler)
    app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
        res.status(422).json({ error: err.message })
    })

    return app
}

describe('Async data errors', () => {
    it('rejects when awaiting a resource', async () => {
        await expect((async () => await new FailingResource({ id: 1 }))()).rejects.toThrow('resource failed')
    })

    it('rejects when awaiting a collection', async () => {
        await expect((async () => await new FailingCollection([{ id: 1 }]))()).rejects.toThrow('collection failed')
    })

    it('rejects when awaiting a generic resource', async () => {
        await expect((async () => await new FailingGeneric({ id: 1 }))()).rejects.toThrow('generic failed')
    })

    it('passes the error to catch()', async () => {
        const reason = await new FailingResource({ id: 1 }).catch((error: Error) => error.message)

        expect(reason).toBe('resource failed')
    })

    it('forwards the error to the Express error handler', async () => {
        const app = expressApp(async (_req, res) => {
            await new FailingResource({ id: 1 }, res)
        })

        await request(app).get('/test')
            .expect(422)
            .expect({ error: 'resource failed' })
    })

    it('forwards the error to the Express error handler from response()', async () => {
        const app = expressApp(async (_req, res) => {
            await new FailingCollection([{ id: 1 }], res).response()
        })

        await request(app).get('/test')
            .expect(422)
            .expect({ error: 'collection failed' })
    })

    it('forwards the error to the H3 error handler', async () => {
        const app = new H3({
            onError: (error) => new Response(JSON.stringify({ error: error.cause instanceof Error ? error.cause.message : error.message }), { status: 422 }),
        })

        app.use('/test', () => new FailingResource({ id: 1 }))

        const response = await app.fetch(new Request('http://localhost/test'))

        expect(response.status).toBe(422)
        expect(await response.json()).toEqual({ error: 'resource failed' })
    })
})
