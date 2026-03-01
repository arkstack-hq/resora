import type { Command } from '@h3ravel/musket'

/**
 * @description A type representing a case transformation strategy.
 * Can be a preset string ('camel', 'snake', 'pascal', 'kebab') or a custom transformer function.
 */
export type CaseStyle = 'camel' | 'snake' | 'pascal' | 'kebab' | ((key: string) => string)

/**
 * @description A type representing the resource serializer variant.
 */
export type ResponseKind = 'resource' | 'collection' | 'generic'

/**
 * @description Context passed into a response factory function.
 */
export interface ResponseFactoryContext {
    type: ResponseKind
    rootKey: string
    resource: any
    meta?: MetaData | undefined
}

/**
 * @description A factory used to produce a fully custom response envelope.
 */
export type ResponseFactory = (payload: any, context: ResponseFactoryContext) => ResourceData

/**
 * @description Structure options for customizing the response envelope.
 */
export interface ResponseStructureConfig {
    /**
     * @description The key used to wrap resource payloads. Defaults to "data".
     */
    rootKey?: string | undefined

    /**
     * @description A factory for complete control over the final response structure.
     */
    factory?: ResponseFactory | undefined
}

export interface MetaData {
    [key: string]: any;
}

export interface ResourceData {
    [key: string]: any;
}

export interface ResourceDef extends ResourceData {
    cursor?: Cursor | undefined;
    pagination?: Pagination | undefined;
}

export interface NonCollectible {
    data: ResourceData;
}

export interface Collectible {
    data: ResourceData[];
    cursor?: Cursor | undefined;
    pagination?: Pagination | undefined;
}

export interface ResponseData<R extends ResourceData = any> extends ResourceDef {
    data: R;
    meta?: MetaData | undefined;
};

/**
 * @description A type that represents the metadata for a paginated collection of resources. It extends the MetaData type and includes all properties of a Collectible object except for the data property. This type is used to provide additional information about the paginated collection, such as pagination details, without including the actual resource data.
 * @example 
 * const paginatedMeta: PaginatedMetaData = {
 *   pagination: {
 *     currentPage: 1,
 *     total: 100
 *   },
 *   timestamp: '2024-06-01T12:00:00Z'
 * };
 */
export type PaginatedMetaData<R extends Collectible = Collectible> = MetaData & Omit<R, 'data'>;

/**
 * @description A type that represents the body of a response for a collection of resources. It includes a data property, which can be either an array of ResourceData objects or a Collectible object, and an optional meta property that can contain any additional metadata related to the response. The type is generic and can be used to define the structure of the response body for API endpoints that return collections of resources.
 * @example 
 * const collectionResponse: CollectionBody = {
 *   data: [
 *     { id: 1, name: 'Resource 1' },
 *     { id: 2, name: 'Resource 2' }
 *   ],
 *   meta: {
 *     pagination: {
 *       currentPage: 1,
 *       total: 2
 *     }
 *   }
 * };
 */
export interface ResponseDataCollection<R extends Collectible | undefined = undefined> extends ResourceData {
    data: R extends Collectible ? R['data'] : R;
    meta?: R extends Collectible ? PaginatedMetaData<R> | undefined : undefined;
};

/**
 * @description A type that represents the body of a response for a collection of resources. 
 * It can be either an array of ResourceData objects or a Collectible object, which contains an 
 * array of ResourceData objects. The type also includes the meta property, which is optional 
 * and can contain any additional metadata related to the response.
 * @example 
 * const collectionResponse: CollectionBody = {
 *   data: [
 *     { id: 1, name: 'Resource 1' },
 *     { id: 2, name: 'Resource 2' }
 *   ],
 *   meta: {
 *     pagination: {
 *       currentPage: 1,
 *       total: 2
 *     }
 *   }
 * };
 */
export type CollectionBody<R extends ResourceData[] | Collectible = ResourceData[]> = ResponseDataCollection<
    R extends Collectible ? R : { data: R }
>

/**
 * @description A type that represents the body of a response for a single resource. 
 * It can be either a ResourceData object or a NonCollectible object, which contains a 
 * ResourceData object. The type also includes the meta property, which is optional and can 
 * contain any additional metadata related to the response.
 * @example 
 * const resourceResponse: ResourceBody = {
 *   data: {
 *     id: 1,
 *     name: 'Resource Name',
 *     description: 'Resource Description'
 *   },
 *   meta: {
 *     timestamp: '2024-06-01T12:00:00Z'
 *   }
 * }; 
 */
export type ResourceBody<R extends ResourceData | NonCollectible = ResourceData> = ResponseData<
    R extends NonCollectible ? R : { data: R }
>

/**
 * @description A type that represents the body of a response for either a single resource or a collection of resources. 
 * It can be either a ResourceData object, an array of ResourceData objects, a NonCollectible object, or a Collectible object. 
 * The type also includes the meta property, which is optional and can contain any additional metadata related to the response.
 * @example 
 * const genericResponse: GenericBody = {
 *   data: {
 *     id: 1,
 *     name: 'Resource Name',
 *     description: 'Resource Description'
 *   },
 *   meta: {
 *     timestamp: '2024-06-01T12:00:00Z'
 *   }
 * };
 */
export type GenericBody<R extends NonCollectible | Collectible | ResourceData = ResourceData> = ResponseData<
    R
>

/**
 * @description A type that represents the pagination information for a collection of resources. It includes properties such as currentPage, from, to, perPage, total, firstPage, lastPage, prevPage, and nextPage. All properties are optional and can be undefined if not applicable.
 * @example 
 * const paginationInfo: Pagination = {
 *   currentPage: 1,
 *   from: 1,
 *   to: 10,
 *   perPage: 10,
 *   total: 100,
 *   firstPage: 1,
 *   lastPage: 10,
 *   prevPage: null,
 *   nextPage: 2
 * };
 */
export interface Pagination {
    currentPage?: number | undefined;
    from?: number | undefined;
    to?: number | undefined;
    perPage?: number | undefined;
    total?: number | undefined;
    firstPage?: number | undefined;
    lastPage?: number | undefined;
    prevPage?: number | undefined;
    nextPage?: number | undefined;
}

/**
 * @description A type that represents the cursor information for pagination. It includes properties such as before and after, which are optional and can be undefined if not applicable. The before property represents the cursor for the previous page, while the after property represents the cursor for the next page.
 * @example
 * const cursorInfo: Cursor = {
 *   previous: 'cursor-for-previous-page',
 *   next: 'cursor-for-next-page'
 * };
 */
export interface Cursor {
    previous?: string | undefined;
    next?: string | undefined;
}

export interface Config {
    /**
     * @description The directory where resource files are stored. This is the location where the generated resource files will be saved. It should be a valid path on the file system relative to the project root.
     */
    resourcesDir: string

    /**
     * @description The directory where stub files are stored. Stub files are templates used for generating resource files. This should also be a valid path on the file system relative to the project root where the stub templates are located.
     */
    stubsDir: string

    /**
     * @description An object that defines the stub file names for different types of resources.
     */
    stubs: {
        /**
         * @description The stub file name for the configuration file. This stub will be used when generating the default configuration file.
         */
        config: string

        /**
         * @description The stub file name for a resource. This stub will be used when generating a resource file.
         */
        resource: string

        /**
         * @description The stub file name for a collection resource. This stub will be used when generating a collection resource file.
         */
        collection: string
    }

    /**
     * @description This option allows you to specify the case style that should be used for the keys in API responses returned by the resources.
     * Accepts 'camel', 'snake', 'pascal', 'kebab', or a custom transformer function `(key: string) => string`.
     */
    preferredCase: CaseStyle

    /**
     * @description This option allows you to specify the extra properties that should be included in the response body when a resource is paginated. You can choose to include either 'meta', 'links', or both, or you can provide custom property names for these extras.
     */
    paginatedExtras: ['meta', 'links'] | {
        meta?: string | undefined;
        links?: string | undefined;
    },

    /**
     * @description This option allows you to specify the property names that should be used for pagination links in the response body when a resource is paginated. You can provide custom property names for the pagination links, and if not specified, the default property names will be used.
     */
    paginatedLinks: {
        first?: string | undefined;
        last?: string | undefined;
        prev?: string | undefined;
        next?: string | undefined;
    },

    /**
     * @description This option allows you to specify the property names that should be used for pagination metadata in the response body when a resource is paginated. You can provide custom property names for properties, and if not specified, the default property names will be used.
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
     * @description This option allows you to customize the default JSON response envelope.
     * You can rename the root key or provide a custom factory to build the full response body.
     */
    responseStructure: ResponseStructureConfig

    /**
     * @description This option allows you to specify additional commands that should be registered with the CLI application. You can provide an array of command classes that extend the Command class from the @h3ravel/musket package. These commands will be available for use in the CLI application alongside the base commands provided by the package.
     */
    extraCommands?: typeof Command<any>[]
}