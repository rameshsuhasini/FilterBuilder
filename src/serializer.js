import { OP_RULES } from "./domain";
// ──────────────────────────────────────────────────────────────────────────────
// Operator mapping
// ──────────────────────────────────────────────────────────────────────────────
const SYMBOL_TO_KEY = {
    "=": "eq",
    "!=": "neq",
    ">": "gt",
    "<": "lt",
};
const KEY_TO_SYMBOL = {
    eq: "=",
    neq: "!=",
    gt: ">",
    lt: "<",
    // leave others as their key names (e.g., "between", "in", ...)
};
function toKey(op) {
    if (op in OP_RULES)
        return op;
    const mapped = SYMBOL_TO_KEY[String(op)];
    if (!mapped)
        throw new Error(`Unknown operator: ${String(op)}`);
    return mapped;
}
function toOutOperator(op, useSymbols) {
    if (!useSymbols)
        return op;
    return KEY_TO_SYMBOL[op] ?? op;
}
// ──────────────────────────────────────────────────────────────────────────────
// Value (de)serialization helpers
// ──────────────────────────────────────────────────────────────────────────────
function toIsoIfDate(t, v) {
    return t === "date" && v instanceof Date ? v.toISOString() : v;
}
function fromIsoIfDate(t, raw) {
    if (t !== "date")
        return raw;
    if (raw == null)
        return null;
    const d = raw instanceof Date ? raw : new Date(raw);
    return isNaN(d.getTime()) ? null : d;
}
function serializeValue(type, operator, value) {
    const key = toKey(operator);
    const rule = OP_RULES[key];
    if (rule.arity === "none")
        return undefined; // omit value entirely
    if (value == null)
        return null;
    if (rule.arity === "two") {
        const arr = Array.isArray(value) ? value : [null, null];
        return [toIsoIfDate(type, arr[0] ?? null), toIsoIfDate(type, arr[1] ?? null)];
    }
    if (rule.arity === "array") {
        const arr = Array.isArray(value) ? value : [];
        return arr.map((x) => toIsoIfDate(type, x));
    }
    // one
    return toIsoIfDate(type, value);
}
function parseValue(type, operator, raw) {
    const key = toKey(operator);
    const rule = OP_RULES[key];
    if (rule.arity === "none")
        return undefined; // keep omitted
    if (raw == null)
        return null;
    if (rule.arity === "two") {
        if (!Array.isArray(raw) || raw.length !== 2)
            return [null, null];
        return [fromIsoIfDate(type, raw[0]), fromIsoIfDate(type, raw[1])];
    }
    if (rule.arity === "array") {
        if (!Array.isArray(raw))
            return [];
        return raw.map((x) => fromIsoIfDate(type, x));
    }
    // one
    return fromIsoIfDate(type, raw);
}
// ──────────────────────────────────────────────────────────────────────────────
// Field lookup
// ──────────────────────────────────────────────────────────────────────────────
function fieldByName(fields, name) {
    const f = fields.find((x) => x.name === name);
    if (!f)
        throw new Error(`Unknown field: ${name}`);
    return f;
}
// ──────────────────────────────────────────────────────────────────────────────
// Public API
// ──────────────────────────────────────────────────────────────────────────────
/**
 * Normalize an incoming JSON (exact {and|or} shape) to:
 * - keep the same shape
 * - normalize operators like "=" → "eq" internally
 * - parse dates from ISO strings to Date objects (for UI editing)
 */
export function fromJSON(raw, fields) {
    function walk(node) {
        if ("and" in node)
            return { and: node.and.map(walk) };
        if ("or" in node)
            return { or: node.or.map(walk) };
        const f = fieldByName(fields, node.field);
        const opKey = toKey(node.operator);
        const value = "value" in node ? parseValue(f.type, opKey, node.value) : undefined;
        const normalized = {
            field: node.field,
            operator: opKey, // canonicalized
            ...(value !== undefined ? { value } : {}),
        };
        return normalized;
    }
    return walk(raw);
}
/**
 * Produce the required JSON for transport/storage:
 * - exact {and|or} group keys
 * - omit value for 'is_null' / 'is_not_null'
 * - convert Date → ISO strings
 * - optionally emit symbol operators ("=") for eq/neq/gt/lt
 */
export function toJSON(root, fields, opts = {}) {
    const useSymbols = !!opts.useSymbolOps;
    function walk(node) {
        if ("and" in node)
            return { and: node.and.map(walk) };
        if ("or" in node)
            return { or: node.or.map(walk) };
        const f = fieldByName(fields, node.field);
        const key = toKey(node.operator);
        const outOp = toOutOperator(key, useSymbols);
        const ser = serializeValue(f.type, key, node.value);
        const out = { field: node.field, operator: outOp };
        if (ser !== undefined)
            out.value = ser; // omit for 'none'
        return out;
    }
    return walk(root);
}
/** Helpers for query-string usage */
export function encodeFilterParam(json) {
    return encodeURIComponent(JSON.stringify(json));
}
export function decodeFilterParam(param) {
    return JSON.parse(decodeURIComponent(param));
}
//# sourceMappingURL=serializer.js.map