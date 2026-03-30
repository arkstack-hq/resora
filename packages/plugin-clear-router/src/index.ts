import { Router as ClearRouterExpress } from 'clear-router/express'
import { Router as ClearRouterH3 } from 'clear-router/h3'
import type { CoreRouter } from 'clear-router/core'
import type { RouteHandler as ExpressRouteHandler } from 'clear-router/types/express'
import type { RouteHandler as H3RouteHandler } from 'clear-router/types/h3'
import { definePlugin } from 'resora'

type AnyRouteHandler = ExpressRouteHandler | H3RouteHandler

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
    runWithCtx: <R>(ctx: unknown, callback: () => R) => R
) => {
    const target = router as T & {
        [patchedKey]?: boolean
        resolveHandler: (route: any) => {
            handlerFunction: AnyRouteHandler | null
            instance: unknown
        }
    }

    if (target[patchedKey]) {
        return
    }

    const resolveHandler = target.resolveHandler.bind(target)

    target.resolveHandler = ((route: any) => {
        const resolved = resolveHandler(route)

        if (!resolved.handlerFunction) {
            return resolved
        }

        const handlerFunction = resolved.handlerFunction

        resolved.handlerFunction = ((ctx: unknown, req: unknown) => {
            return runWithCtx(ctx, async () => {
                return await Promise.resolve(handlerFunction(ctx as never, req as never))
            })
        }) as AnyRouteHandler

        return resolved
    }) as typeof target.resolveHandler

    target[patchedKey] = true
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

export const clearRouterPlugin = [clearRouterExpressPlugin, clearRouterH3Plugin]