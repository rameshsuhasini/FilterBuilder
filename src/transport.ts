// src/transport.ts
import type { FilterJSON, FieldDef } from "./domain";
import { toJSON, encodeFilterParam } from "./serializer";

/** HTTP method literals */
export type HttpMethod = "GET" | "POST";

/** Precise request shapes (keep literal method types) */
export type GetRequest = {
  url: string;
  init: { method: "GET"; headers?: Record<string, string> };
};

export type PostRequest = {
  url: string;
  init: { method: "POST"; headers: Record<string, string>; body: string };
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

/** helper: add/replace a query param */
function withQuery(urlStr: string, key: string, value: string): string {
  try {
    const url = new URL(urlStr);
    url.searchParams.set(key, value);
    return url.toString();
  } catch {
    // relative path
    const sep = urlStr.includes("?") ? "&" : "?";
    return `${urlStr}${sep}${encodeURIComponent(key)}=${value}`;
  }
}

/** ensure payload is serialized if fields provided; otherwise passthrough */
function materializePayload(
  filter: FilterJSON,
  opts: TransportOptions
): FilterJSON {
  if (opts.fields && Array.isArray(opts.fields) && opts.fields.length > 0) {
    return toJSON(filter, opts.fields, { useSymbolOps: !!opts.useSymbolOps });
  }
  return filter; // assume already valid target JSON
}

/** Build a GET request: endpoint?filter=<url-encoded JSON> */
export function buildGetRequest(
  endpoint: string,
  filter: FilterJSON,
  opts: TransportOptions = {}
): GetRequest {
  const key = opts.queryKey ?? "filter";
  const payload = materializePayload(filter, opts);
  const encoded = encodeFilterParam(payload);

  let init: GetRequest["init"] = { method: "GET" };
  if (opts.headers) init = { method: "GET", headers: { ...opts.headers } };

  const url = withQuery(endpoint, key, encoded);
  return { url, init };
}

/** Build a POST request: JSON body (optionally wrapped under bodyKey) */
export function buildPostRequest(
  endpoint: string,
  filter: FilterJSON,
  opts: TransportOptions = {}
): PostRequest {
  const payload = materializePayload(filter, opts);
  const jsonBody = opts.bodyKey
    ? JSON.stringify({ [opts.bodyKey]: payload })
    : JSON.stringify(payload);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(opts.headers ?? {}),
  };

  return {
    url: endpoint,
    init: { method: "POST", headers, body: jsonBody },
  };
}

/** Overloads to return precise types for each mode */
export function createRequest(
  endpoint: string,
  mode: "GET",
  filter: FilterJSON,
  opts?: TransportOptions
): GetRequest;
export function createRequest(
  endpoint: string,
  mode: "POST",
  filter: FilterJSON,
  opts?: TransportOptions
): PostRequest;
export function createRequest(
  endpoint: string,
  mode: HttpMethod,
  filter: FilterJSON,
  opts: TransportOptions = {}
): GetRequest | PostRequest {
  return mode === "GET"
    ? buildGetRequest(endpoint, filter, opts)
    : buildPostRequest(endpoint, filter, opts);
}

/** Utility: just the `key=value` query-string fragment (no leading '?') */
export function toQueryString(
  filter: FilterJSON,
  opts: { key?: string; fields?: FieldDef[]; useSymbolOps?: boolean } = {}
): string {
  const key = opts.key ?? "filter";
  const payload = opts.fields
    ? toJSON(filter, opts.fields, { useSymbolOps: !!opts.useSymbolOps })
    : filter;
  const encoded = encodeFilterParam(payload);
  return `${encodeURIComponent(key)}=${encoded}`;
}
