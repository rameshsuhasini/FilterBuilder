import { toJSON, encodeFilterParam } from "./serializer";
/** helper: add/replace a query param */
function withQuery(urlStr, key, value) {
    try {
        const url = new URL(urlStr);
        url.searchParams.set(key, value);
        return url.toString();
    }
    catch {
        // relative path
        const sep = urlStr.includes("?") ? "&" : "?";
        return `${urlStr}${sep}${encodeURIComponent(key)}=${value}`;
    }
}
/** ensure payload is serialized if fields provided; otherwise passthrough */
function materializePayload(filter, opts) {
    if (opts.fields && Array.isArray(opts.fields) && opts.fields.length > 0) {
        return toJSON(filter, opts.fields, { useSymbolOps: !!opts.useSymbolOps });
    }
    return filter; // assume already valid target JSON
}
/** Build a GET request: endpoint?filter=<url-encoded JSON> */
export function buildGetRequest(endpoint, filter, opts = {}) {
    const key = opts.queryKey ?? "filter";
    const payload = materializePayload(filter, opts);
    const encoded = encodeFilterParam(payload);
    let init = { method: "GET" };
    if (opts.headers)
        init = { method: "GET", headers: { ...opts.headers } };
    const url = withQuery(endpoint, key, encoded);
    return { url, init };
}
/** Build a POST request: JSON body (optionally wrapped under bodyKey) */
export function buildPostRequest(endpoint, filter, opts = {}) {
    const payload = materializePayload(filter, opts);
    const jsonBody = opts.bodyKey
        ? JSON.stringify({ [opts.bodyKey]: payload })
        : JSON.stringify(payload);
    const headers = {
        "Content-Type": "application/json",
        ...(opts.headers ?? {}),
    };
    return {
        url: endpoint,
        init: { method: "POST", headers, body: jsonBody },
    };
}
export function createRequest(endpoint, mode, filter, opts = {}) {
    return mode === "GET"
        ? buildGetRequest(endpoint, filter, opts)
        : buildPostRequest(endpoint, filter, opts);
}
/** Utility: just the `key=value` query-string fragment (no leading '?') */
export function toQueryString(filter, opts = {}) {
    const key = opts.key ?? "filter";
    const payload = opts.fields
        ? toJSON(filter, opts.fields, { useSymbolOps: !!opts.useSymbolOps })
        : filter;
    const encoded = encodeFilterParam(payload);
    return `${encodeURIComponent(key)}=${encoded}`;
}
//# sourceMappingURL=transport.js.map