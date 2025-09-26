// ──────────────────────────────────────────────────────────────────────────────
// Field & Operator types
// ──────────────────────────────────────────────────────────────────────────────
/** Intrinsic rules (type compatibility + arity) */
export const OP_RULES = {
    // equality
    eq: { types: ['string', 'number', 'boolean', 'date'], arity: 'one' },
    neq: { types: ['string', 'number', 'boolean', 'date'], arity: 'one' },
    // ordered
    gt: { types: ['number', 'date'], arity: 'one' },
    lt: { types: ['number', 'date'], arity: 'one' },
    // range
    between: { types: ['number', 'date'], arity: 'two' },
    // date aliases
    before: { types: ['date'], arity: 'one' },
    after: { types: ['date'], arity: 'one' },
    // string ops
    contains: { types: ['string'], arity: 'one' },
    starts_with: { types: ['string'], arity: 'one' },
    ends_with: { types: ['string'], arity: 'one' },
    // arrays
    in: { types: ['string', 'number'], arity: 'array' },
    not_in: { types: ['string', 'number'], arity: 'array' },
    // null checks
    is_null: { types: ['string', 'number', 'boolean', 'date'], arity: 'none' },
    is_not_null: { types: ['string', 'number', 'boolean', 'date'], arity: 'none' },
};
export const DEFAULT_OPERATOR_SUPPORT = {
    string: ['eq', 'neq', 'contains', 'starts_with', 'ends_with'],
    number: ['eq', 'neq', 'gt', 'lt', 'between'],
    boolean: ['eq', 'neq'],
    date: ['eq', 'neq', 'before', 'after', 'between'],
};
// ──────────────────────────────────────────────────────────────────────────────
// Small helpers for creating empty roots
// ──────────────────────────────────────────────────────────────────────────────
export const emptyAnd = () => ({ and: [] });
export const emptyOr = () => ({ or: [] });
//# sourceMappingURL=domain.js.map