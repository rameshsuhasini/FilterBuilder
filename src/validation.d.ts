import type { FieldDef, FilterJSON } from "./domain";
import { type OperatorSupport } from "./domain";
/** Public result shape */
export interface ValidationIssue {
    path: string;
    code: "field.unknown" | "operator.unknown" | "operator.disabled" | "operator.type_mismatch" | "value.forbidden" | "value.missing" | "value.arity.two" | "value.arity.array" | "value.type" | "value.type.tuple" | "value.type.array" | "group.malformed";
    message: string;
}
export interface ValidationResult {
    ok: boolean;
    issues: ValidationIssue[];
}
/** Public API: validate a full filter tree (root must be a group) */
export declare function validateFilter(root: FilterJSON, fields: FieldDef[], operatorSupport?: OperatorSupport): ValidationResult;
//# sourceMappingURL=validation.d.ts.map