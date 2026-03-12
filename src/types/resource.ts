import { Cursor, Pagination } from './pagination'

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

export interface CollectionLike<T = any> {
    all: () => T[];
}

export interface PaginatorLike<T = any> {
    data: CollectionLike<T> | T[] | unknown;
    meta: Record<string, any>;
    links?: Record<string, any>;
}

export interface ResponseData<R extends ResourceData = any> extends ResourceDef {
    data: R;
    meta?: MetaData | undefined;
};

/**
 * @description A type that represents the metadata for a paginated collection of resources.
 */
export type PaginatedMetaData<R extends Collectible = Collectible> = MetaData & Omit<R, 'data'>;

/**
 * @description A type that represents the body of a response for a collection of resources.
 */
export interface ResponseDataCollection<R extends Collectible | undefined = undefined> extends ResourceData {
    data: R extends Collectible ? R['data'] : R;
    meta?: R extends Collectible ? PaginatedMetaData<R> | undefined : undefined;
};

export type CollectionBody<R extends ResourceData[] | Collectible | CollectionLike | PaginatorLike = ResourceData[]> = ResponseDataCollection<
    R extends Collectible
    ? R
    : R extends PaginatorLike<infer TPaginatorData>
    ? { data: TPaginatorData[] }
    : R extends CollectionLike<infer T>
    ? { data: T[] }
    : { data: R }
>

export type ResourceBody<R extends ResourceData | NonCollectible = ResourceData> = ResponseData<
    R extends NonCollectible ? R : { data: R }
>

export type GenericBody<R extends NonCollectible | Collectible | CollectionLike | PaginatorLike | ResourceData = ResourceData> = ResponseData<
    R extends PaginatorLike<infer TPaginatorData>
    ? { data: TPaginatorData[] }
    :
    R extends CollectionLike<infer T>
    ? { data: T[] }
    : R
>
