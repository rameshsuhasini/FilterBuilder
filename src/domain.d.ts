export type FieldType = 'string' | 'number' | 'boolean' | 'date';
/**
 * Canonical operator keys (used internally for validation, UI, etc.)
 * Includes 'between', 'in', and null checks per requirements.
 */
export type OperatorKey = 'eq' | 'neq' | 'gt' | 'lt' | 'between' | 'before' | 'after' | 'contains' | 'starts_with' | 'ends_with' | 'in' | 'not_in' | 'is_null' | 'is_not_null';
/**
 * The target JSON may use symbol "=" for equality (as shown in the prompt).
 * We allow it at the type level; mapping to 'eq' happens in the serializer step.
 */
export type OperatorSymbol = '=';
export type ScalarValue = string | number | boolean | Date | null;
export type TupleValue = [ScalarValue, ScalarValue];
export type ArrayValue = ScalarValue[];
export type ConditionValue = ScalarValue | TupleValue | ArrayValue;
export interface Condition {
    field: string;
    operator: OperatorKey | OperatorSymbol;
    /**
     * For 'none' arity operators (is_null / is_not_null), value is omitted.
     * For 'one'  → scalar; 'two' → [a,b]; 'array' → array of scalars.
     */
    value?: ConditionValue;
}
export type AndGroup = {
    and: ReadonlyArray<FilterNode>;
};
export type OrGroup = {
    or: ReadonlyArray<FilterNode>;
};
export type FilterNode = Condition | AndGroup | OrGroup;
export type FilterJSON = AndGroup | OrGroup;
/** Schema: dataset-agnostic field definitions */
export interface FieldDef {
    name: string;
    label: string;
    type: FieldType;
}
export type OperatorArity = 'none' | 'one' | 'two' | 'array';
export interface OperatorRule {
    types: FieldType[];
    arity: OperatorArity;
}
/** Intrinsic rules (type compatibility + arity) */
export declare const OP_RULES: Record<OperatorKey, OperatorRule>;
/**
 * Configurable map of supported operators per type (consumer-provided).
 * Default EXACTLY matches the challenge prompt.
 */
export type OperatorSupport = Readonly<Record<FieldType, ReadonlyArray<OperatorKey>>>;
export declare const DEFAULT_OPERATOR_SUPPORT: OperatorSupport;
export declare const emptyAnd: () => AndGroup;
export declare const emptyOr: () => OrGroup;
//# sourceMappingURL=domain.d.ts.map