import { existsSync } from 'fs'
import path from 'path'
import { Config } from '../types'

let stubsDir = path.resolve(process.cwd(), 'node_modules/resora/stubs')
if (!existsSync(stubsDir)) {
    stubsDir = path.resolve(process.cwd(), 'stubs')
}

export const getDefaultConfig = (): Config => {
    return {
        stubsDir,
        preferredCase: 'camel',
        responseStructure: {
            wrap: true,
            rootKey: 'data',
        },
        paginatedExtras: ['meta', 'links'],
        baseUrl: 'https://localhost',
        pageName: 'page',
        paginatedLinks: {
            first: 'first',
            last: 'last',
            prev: 'prev',
            next: 'next',
        },
        paginatedMeta: {
            to: 'to',
            from: 'from',
            links: 'links',
            path: 'path',
            total: 'total',
            per_page: 'per_page',
            last_page: 'last_page',
            current_page: 'current_page',
        },
        cursorMeta: {
            previous: 'previous',
            next: 'next',
        },
        resourcesDir: 'src/resources',
        stubs: {
            config: 'resora.config.stub',
            resource: 'resource.stub',
            collection: 'resource.collection.stub',
        },
    }
}

export const defineConfig = (
    userConfig: Partial<Omit<Config, 'stubs'>> & { stubs?: Partial<Config['stubs']> } = {}
): Config => {
    const defaultConfig = getDefaultConfig()

    return Object.assign(
        defaultConfig,
        userConfig,
        {
            stubs: Object.assign(defaultConfig.stubs, userConfig.stubs || {}),
        }
    )
}
