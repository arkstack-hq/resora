import { Router as ClearRouterExpress } from 'clear-router/express'
import { Router as ClearRouterFastify } from 'clear-router/fastify'
import { Router as ClearRouterH3 } from 'clear-router/h3'
import { Router as ClearRouterHono } from 'clear-router/hono'
import { Router as ClearRouterKoa } from 'clear-router/koa'
import type { CoreRouter } from 'clear-router/core'
import { definePlugin } from 'resora'

type AnyRouteHandler = (...args: any[]) => any
type ResolveContext = (ctx: unknown) => unknown
type ResolveResult = (ctx: unknown, result: unknown, resolved: unknown) => unknown
type PatchState = {
    runWithCtx: <R>(ctx: unknown, callback: () => R) => R
    resolveContext: ResolveContext
    resolveResult?: ResolveResult
}

const patchedKey = Symbol.for('resora:clear-router-plugin:patched')

/**
 * Patch the given Clear Router router class to wrap route handlers with the provided 
 * runWithCtx function, enabling context-aware execution of route handlers.
 *
 * @param router        The Clear Router router class to patch
 * @param runWithCtx    A function that wraps the route handler execution with a given context
 * @returns void
 */
const patchRouter = <T extends typeof CoreRouter> (
    router: T,
    runWithCtx: <R>(ctx: unknown, callback: () => R) => R,
    resolveContext: ResolveContext = ctx => ctx,
    resolveResult?: ResolveResult
) => {
    const target = router as T & {
        [patchedKey]?: PatchState
        resolveHandler: (route: any) => {
            handlerFunction: AnyRouteHandler | null
            instance: unknown
        }
        getCurrentPluginRequestContext?: () => { ctx?: unknown } | undefined
    }

    const current = target[patchedKey]
    if (current) {
        current.runWithCtx = runWithCtx
        current.resolveContext = resolveContext
        current.resolveResult = resolveResult

        return
    }

    const resolveHandler = target.resolveHandler.bind(target)
    const state: PatchState = { runWithCtx, resolveContext, resolveResult }

    target.resolveHandler = ((route: any) => {
        const resolved = resolveHandler(route)

        if (!resolved.handlerFunction) {
            return resolved
        }

        const handlerFunction = resolved.handlerFunction

        resolved.handlerFunction = ((...args: any[]) => {
            const ctx = target.getCurrentPluginRequestContext?.()?.ctx ?? args[0]

            return state.runWithCtx(state.resolveContext(ctx), async () => {
                const result = handlerFunction(...args)
                const resolvedResult = await Promise.resolve(result)

                return state.resolveResult
                    ? state.resolveResult(ctx, result, resolvedResult)
                    : resolvedResult
            })
        }) as AnyRouteHandler

        return resolved
    }) as typeof target.resolveHandler

    target[patchedKey] = state
}

/**
 * Clear Router plugin for Express framework. Patches Clear Router's Express router to wrap 
 * route handlers with the provided runWithCtx function, enabling context-aware execution of 
 * route handlers in Express applications.
 */
export const clearRouterExpressPlugin = definePlugin({
    name: 'clear-router-express',
    setup: ({ runWithCtx }) => {
        patchRouter(ClearRouterExpress as never, runWithCtx)
    },
})

/**
 * Clear Router plugin for Fastify framework. Patches Clear Router's Fastify router to wrap
 * route handlers with a Fastify reply-aware context for resora response mutations.
 */
export const clearRouterFastifyPlugin = definePlugin({
    name: 'clear-router-fastify',
    setup: ({ runWithCtx }) => {
        patchRouter(ClearRouterFastify as never, runWithCtx, (ctx: any) => ({
            ...ctx,
            res: ctx.reply,
        }))
    },
})

/**
 * Clear Router plugin for H3 framework. Patches Clear Router's H3 router to wrap route 
 * handlers with the provided runWithCtx function, enabling context-aware execution of 
 * route handlers in H3 applications.
 */
export const clearRouterH3Plugin = definePlugin({
    name: 'clear-router-h3',
    setup: ({ runWithCtx }) => {
        patchRouter(ClearRouterH3 as never, runWithCtx)
    },
})

/**
 * Clear Router plugin for Hono framework. Patches Clear Router's Hono router to wrap
 * route handlers with the active Hono context for resora response mutations.
 */
export const clearRouterHonoPlugin = definePlugin({
    name: 'clear-router-hono',
    setup: ({ runWithCtx }) => {
        patchRouter(ClearRouterHono as never, runWithCtx, ctx => ctx, (ctx: any, result: any, resolved) => {
            if (
                result &&
                typeof result === 'object' &&
                typeof result.then === 'function' &&
                typeof result.json === 'function' &&
                typeof ctx.json === 'function'
            ) {
                return ctx.json(resolved, ctx.__resoraStatus || ctx.res?.status || 200)
            }

            return resolved
        })
    },
})

/**
 * Clear Router plugin for Koa framework. Patches Clear Router's Koa router to wrap
 * route handlers with the active Koa context for resora response mutations.
 */
export const clearRouterKoaPlugin = definePlugin({
    name: 'clear-router-koa',
    setup: ({ runWithCtx }) => {
        patchRouter(ClearRouterKoa as never, runWithCtx)
    },
})

export const clearRouterPlugin = [
    clearRouterExpressPlugin,
    clearRouterFastifyPlugin,
    clearRouterH3Plugin,
    clearRouterHonoPlugin,
    clearRouterKoaPlugin,
]
