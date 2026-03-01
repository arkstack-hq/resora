import type { Command } from '@h3ravel/musket'
import { CaseStyle, ResponseStructureConfig } from './common'

export interface Config {
    resourcesDir: string
    stubsDir: string
    stubs: {
        config: string
        resource: string
        collection: string
    }

    preferredCase: CaseStyle

    paginatedExtras: ('meta' | 'links' | 'cursor')[] | {
        meta?: string | undefined;
        links?: string | undefined;
        cursor?: string | undefined;
    },

    baseUrl: string

    pageName: string

    paginatedLinks: {
        first?: string | undefined;
        last?: string | undefined;
        prev?: string | undefined;
        next?: string | undefined;
    },

    paginatedMeta: {
        to?: string | undefined
        from?: string | undefined
        links?: string | undefined
        path?: string | undefined
        total?: string | undefined
        per_page?: string | undefined
        last_page?: string | undefined
        current_page?: string | undefined
    }

    cursorMeta: {
        previous?: string | undefined
        next?: string | undefined
    }

    responseStructure: ResponseStructureConfig

    extraCommands?: typeof Command<any>[]
}
