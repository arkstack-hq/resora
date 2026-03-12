import type { Command } from '@h3ravel/musket'
import { CaseStyle, ResponseStructureConfig } from './common'

export interface Config {
    /**
     * @description The directory where resource definitions are located.
     * @default 'resources'
     */
    resourcesDir: string
    /**
     * @description The directory where stub files are located.
     * @default 'node_modules/resora/stubs'
     */
    stubsDir: string

    /**
     * @description The file names of the various stub templates used for generating resources and configuration.
     * Each property corresponds to a specific type of stub:
     * - config: The stub file for generating the default configuration file.
     * - resource: The stub file for generating a single resource.
     * - collection: The stub file for generating a collection of resources.
     * All properties are required and should be provided as strings representing the file names of the respective stubs.
     */
    stubs: {
        config: string
        resource: string
        collection: string
    }

    /**
     * @description The preferred case style for resource keys in the response.
     * Can be set to a preset string ('camel', 'snake', 'pascal', 'kebab') or a custom transformer function.
     * @default 'camel'
     */
    preferredCase: CaseStyle

    /**
     * @description An array or object specifying which additional data to include in paginated responses.
     * Can include 'meta', 'links', and/or 'cursor'. If an object is provided, the keys can be customized to specify the property names for each type of extra data in the response.
     * @default ['meta', 'links']
     */
    paginatedExtras: ('meta' | 'links' | 'cursor')[] | {
        meta?: string | undefined;
        links?: string | undefined;
        cursor?: string | undefined;
    },

    /**
     * @description The base URL to use for generating pagination links in responses.
     * @default 'https://localhost'
     */
    baseUrl: string

    /**
     * @description The query parameter name to use for the page number in paginated requests.
     * @default 'page'
     */
    pageName: string

    /**
     * @description An object specifying the keys to use for pagination links in the response. Each property corresponds to a specific pagination link:
     * - first: The key for the link to the first page of results.
     * - last: The key for the link to the last page of results.
     * - prev: The key for the link to the previous page of results.
     * - next: The key for the link to the next page of results.
     * All properties are optional and can be customized to specify the desired keys for pagination links in the response.
     */
    paginatedLinks: {
        first?: string | undefined;
        last?: string | undefined;
        prev?: string | undefined;
        next?: string | undefined;
    },

    /**
     * @description An object specifying the keys to use for pagination metadata in the response. Each property corresponds to a specific piece of pagination information:
     * - to: The key for the index of the last item in the current page of results.
     * - from: The key for the index of the first item in the current page of results.
     * - links: The key for any additional pagination links included in the response.
     */
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

    /**
     * @description An object specifying the keys to use for cursor pagination metadata in the response. Each property corresponds to a specific piece of cursor pagination information:
     * - previous: The key for the cursor value that points to the previous page of results.
     * - next: The key for the cursor value that points to the next page of results.
     * Both properties are optional and can be customized to specify the desired keys for cursor pagination metadata in the response.   
     */
    cursorMeta: {
        previous?: string | undefined
        next?: string | undefined
    }

    /**
     * @description An object specifying the structure of the response body for resources. It includes a rootKey property that defines the key under which the resource data will be nested in the response. The rootKey is a string that represents the name of this key in the response body.
     */
    responseStructure: ResponseStructureConfig

    /**
     * @description An optional array of additional command classes to be registered with the framework. Each command class should extend the base Command class provided by the '@h3ravel/musket' package. This allows users to easily add custom commands to their application by including them in this array when defining the configuration.
     */
    extraCommands?: typeof Command<any>[]
}

/**
 * @description A type that represents the configuration options that can be set at the resource level, allowing for customization of case style, response structure, and additional data included in paginated responses on a per-resource basis.
 */
export interface ResourceLevelConfig {
    /**
     * @description The preferred case style for resource keys in the response.
     * Can be set to a preset string ('camel', 'snake', 'pascal', 'kebab') or a custom transformer function.
     * @default 'camel'
     */
    preferredCase?: CaseStyle | undefined
    /**
     * @description An object specifying the structure of the response body for resources. It includes a rootKey property that defines the key under which the resource data will be nested in the response. The rootKey is a string that represents the name of this key in the response body.
     */
    responseStructure?: ResponseStructureConfig | undefined
    /**
     * @description An array or object specifying which additional data to include in paginated responses.
     * Can include 'meta', 'links', and/or 'cursor'. If an object is provided, the keys can be customized to specify the property names for each type of extra data in the response.
     * @default ['meta', 'links']
     */
    paginatedExtras?: Config['paginatedExtras'] | undefined
}

export interface ResoraConfig extends Partial<Omit<Config, |
    'stubs' | 'cursorMeta' | 'paginatedMeta' | 'paginatedLinks' | 'responseStructure'
>> {
    /**
     * @description The file names of the various stub templates used for generating resources and configuration.
     * Each property corresponds to a specific type of stub:
     * - config: The stub file for generating the default configuration file.
     * - resource: The stub file for generating a single resource.
     * - collection: The stub file for generating a collection of resources.
     * All properties are required and should be provided as strings representing the file names of the respective stubs.
     */
    stubs?: Partial<Config['stubs']>

    /**
     * @description An object specifying the keys to use for cursor pagination metadata in the response. Each property corresponds to a specific piece of cursor pagination information:
     * - previous: The key for the cursor value that points to the previous page of results.
     * - next: The key for the cursor value that points to the next page of results.
     * Both properties are optional and can be customized to specify the desired keys for cursor pagination metadata in the response.   
     */
    cursorMeta?: Partial<Config['cursorMeta']>

    /**
     * @description An object specifying the keys to use for pagination metadata in the response. Each property corresponds to a specific piece of pagination information:
     * - to: The key for the index of the last item in the current page of results.
     * - from: The key for the index of the first item in the current page of results.
     * - links: The key for any additional pagination links included in the response.
     */
    paginatedMeta?: Partial<Config['paginatedMeta']>

    /**
     * @description An object specifying the keys to use for pagination links in the response. Each property corresponds to a specific pagination link:
     * - first: The key for the link to the first page of results.
     * - last: The key for the link to the last page of results.
     * - prev: The key for the link to the previous page of results.
     * - next: The key for the link to the next page of results.
     * All properties are optional and can be customized to specify the desired keys for pagination links in the response.
     */
    paginatedLinks?: Partial<Config['paginatedLinks']>

    /**
     * @description An object specifying the structure of the response body for resources. It includes a rootKey property that defines the key under which the resource data will be nested in the response. The rootKey is a string that represents the name of this key in the response body.
     */
    responseStructure?: Partial<Config['responseStructure']>
}