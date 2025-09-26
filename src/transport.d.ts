import type { FilterJSON, FieldDef } from "./domain";
/** HTTP method literals */
export type HttpMethod = "GET" | "POST";
/** Precise request shapes (keep literal method types) */
export type GetRequest = {
    url: string;
    init: {
        method: "GET";
        headers?: Record<string, string>;
    };
};
export type PostRequest = {
    url: string;
    init: {
        method: "POST";
        headers: Record<string, string>;
        body: string;
    };
};
export interface TransportOptions {
    /** GET: query param name (default: "filter") */
    queryKey?: string;
    /** POST: wrap body as { [bodyKey]: filter } instead of raw filter */
    bodyKey?: string;
    /** Extra headers to merge */
    headers?: Record<string, string>;
    /**
     * If provided, we will serialize via toJSON(fields, { useSymbolOps }).
     * If omitted, we assume the filter is already in target JSON shape.
     */
    fields?: FieldDef[];
    /** Use symbol operators ("=", "!=", ">", "<") in output. Default: false. */
    useSymbolOps?: boolean;
}
/** Build a GET request: endpoint?filter=<url-encoded JSON> */
export declare function buildGetRequest(endpoint: string, filter: FilterJSON, opts?: TransportOptions): GetRequest;
/** Build a POST request: JSON body (optionally wrapped under bodyKey) */
export declare function buildPostRequest(endpoint: string, filter: FilterJSON, opts?: TransportOptions): PostRequest;
/** Overloads to return precise types for each mode */
export declare function createRequest(endpoint: string, mode: "GET", filter: FilterJSON, opts?: TransportOptions): GetRequest;
export declare function createRequest(endpoint: string, mode: "POST", filter: FilterJSON, opts?: TransportOptions): PostRequest;
/** Utility: just the `key=value` query-string fragment (no leading '?') */
export declare function toQueryString(filter: FilterJSON, opts?: {
    key?: string;
    fields?: FieldDef[];
    useSymbolOps?: boolean;
}): string;
//# sourceMappingURL=transport.d.ts.map