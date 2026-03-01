/**
 * @description A type that represents the pagination information for a collection of resources. It includes properties such as currentPage, from, to, perPage, total, firstPage, lastPage, prevPage, and nextPage. All properties are optional and can be undefined if not applicable.
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
    path?: string | undefined;
    links?: any;
}

/**
 * @description A type that represents the cursor information for pagination. It includes properties such as before and after, which are optional and can be undefined if not applicable. The before property represents the cursor for the previous page, while the after property represents the cursor for the next page.
 */
export interface Cursor {
    previous?: string | undefined;
    next?: string | undefined;
}
