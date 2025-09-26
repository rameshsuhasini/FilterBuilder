// ──────────────────────────────────────────────────────────────────────────────
// Field & Operator types
// ──────────────────────────────────────────────────────────────────────────────

export type FieldType = 'string' | 'number' | 'boolean' | 'date';

/**
 * Canonical operator keys (used internally for validation, UI, etc.)
 * Includes 'between', 'in', and null checks per requirements.
 */
export type OperatorKey =
  | 'eq' | 'neq'
  | 'gt' | 'lt'
  | 'between'
  | 'before' | 'after'
  | 'contains' | 'starts_with' | 'ends_with'
  | 'in' | 'not_in'
  | 'is_null' | 'is_not_null';

/**
 * The target JSON may use symbol "=" for equality (as shown in the prompt).
 * We allow it at the type level; mapping to 'eq' happens in the serializer step.
 */
export type OperatorSymbol = '=';

// ──────────────────────────────────────────────────────────────────────────────
// Condition & Group nodes — EXACT target JSON format
// ──────────────────────────────────────────────────────────────────────────────

export type ScalarValue = string | number | boolean | Date | null;
export type TupleValue = [ScalarValue, ScalarValue];   // for 'between'
export type ArrayValue = ScalarValue[];                // for 'in'/'not_in'
export type ConditionValue = ScalarValue | TupleValue | ArrayValue;

export interface Condition {
  field: string;
  operator: OperatorKey | OperatorSymbol; // accept "=" in incoming/outgoing JSON
  /**
   * For 'none' arity operators (is_null / is_not_null), value is omitted.
   * For 'one'  → scalar; 'two' → [a,b]; 'array' → array of scalars.
   */
  value?: ConditionValue;
}

// Groups must follow the exact { and:[…] } / { or:[…] } shape
export type AndGroup = { and: ReadonlyArray<FilterNode> };
export type OrGroup  = { or:  ReadonlyArray<FilterNode> };
export type FilterNode = Condition | AndGroup | OrGroup;
export type FilterJSON = AndGroup | OrGroup; // root must be a group

// ──────────────────────────────────────────────────────────────────────────────
/** Schema: dataset-agnostic field definitions */
export interface FieldDef {
  name: string;   // e.g., "age"
  label: string;  // e.g., "Age"
  type: FieldType;
}

// ──────────────────────────────────────────────────────────────────────────────
// Operator capabilities & configurable support
// ──────────────────────────────────────────────────────────────────────────────

export type OperatorArity = 'none' | 'one' | 'two' | 'array';

export interface OperatorRule {
  types: FieldType[];    // which primitive field types the operator supports
  arity: OperatorArity;  // required value shape
}

/** Intrinsic rules (type compatibility + arity) */
export const OP_RULES: Record<OperatorKey, OperatorRule> = {
  // equality
  eq:  { types: ['string','number','boolean','date'], arity: 'one' },
  neq: { types: ['string','number','boolean','date'], arity: 'one' },

  // ordered
  gt:  { types: ['number','date'], arity: 'one' },
  lt:  { types: ['number','date'], arity: 'one' },

  // range
  between: { types: ['number','date'], arity: 'two' },

  // date aliases
  before: { types: ['date'], arity: 'one' },
  after:  { types: ['date'], arity: 'one' },

  // string ops
  contains:     { types: ['string'], arity: 'one' },
  starts_with:  { types: ['string'], arity: 'one' },
  ends_with:    { types: ['string'], arity: 'one' },

  // arrays
  in:     { types: ['string','number'], arity: 'array' },
  not_in: { types: ['string','number'], arity: 'array' },

  // null checks
  is_null:     { types: ['string','number','boolean','date'], arity: 'none' },
  is_not_null: { types: ['string','number','boolean','date'], arity: 'none' },
};

/**
 * Configurable map of supported operators per type (consumer-provided).
 * Default EXACTLY matches the challenge prompt.
 */
export type OperatorSupport = Readonly<Record<FieldType, ReadonlyArray<OperatorKey>>>;

export const DEFAULT_OPERATOR_SUPPORT: OperatorSupport = {
  string:  ['eq', 'neq', 'contains', 'starts_with', 'ends_with'],
  number:  ['eq', 'neq', 'gt', 'lt', 'between'],
  boolean: ['eq', 'neq'],
  date:    ['eq', 'neq', 'before', 'after', 'between'],
};

// ──────────────────────────────────────────────────────────────────────────────
// Small helpers for creating empty roots
// ──────────────────────────────────────────────────────────────────────────────

export const emptyAnd = (): AndGroup => ({ and: [] });
export const emptyOr  = (): OrGroup  => ({ or:  [] });
