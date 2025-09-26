// src/validation.ts
import type {
  FieldDef,
  FieldType,
  OperatorKey,
  OperatorSymbol,
  ConditionValue,
  ScalarValue,
  FilterJSON,
  FilterNode,
  Condition,
} from "./domain";
import {
  OP_RULES,
  DEFAULT_OPERATOR_SUPPORT,
  type OperatorSupport,
} from "./domain";

/** Public result shape */
export interface ValidationIssue {
  path: string;            // e.g. "root.and[1].or[0]"
  code:
    | "field.unknown"
    | "operator.unknown"
    | "operator.disabled"
    | "operator.type_mismatch"
    | "value.forbidden"
    | "value.missing"
    | "value.arity.two"
    | "value.arity.array"
    | "value.type"
    | "value.type.tuple"
    | "value.type.array"
    | "group.malformed";
  message: string;
}

export interface ValidationResult {
  ok: boolean;
  issues: ValidationIssue[];
}

/** Map symbol operators (from the required JSON) to canonical keys */
function normalizeOperator(
  op: OperatorKey | OperatorSymbol
): OperatorKey | null {
  if (op === "=") return "eq";
  // If it's already a canonical key we know about, keep it.
  return (op in OP_RULES ? (op as OperatorKey) : null);
}

/** Locate a field by name */
function fieldByName(fields: FieldDef[], name: string): FieldDef | undefined {
  return fields.find((f) => f.name === name);
}

/** Primitive scalar type guard */
function isValidScalarForType(value: ScalarValue, type: FieldType): boolean {
  if (value === null) return true; // allow null; arity rules decide if it's okay
  switch (type) {
    case "string":
      return typeof value === "string";
    case "number":
      return typeof value === "number" && Number.isFinite(value);
    case "boolean":
      return typeof value === "boolean";
    case "date":
      return value instanceof Date && !isNaN(value.getTime());
  }
}

/** tuple helper */
function isTupleTwo(v: unknown): v is [unknown, unknown] {
  return Array.isArray(v) && v.length === 2;
}

/** array helper */
function isArrayVal(v: unknown): v is unknown[] {
  return Array.isArray(v);
}

/** Validate a single condition node */
function validateCondition(
  cond: Condition,
  fields: FieldDef[],
  support: OperatorSupport,
  path: string
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // field must exist
  const field = fieldByName(fields, cond.field);
  if (!field) {
    issues.push({
      path,
      code: "field.unknown",
      message: `Unknown field "${cond.field}"`,
    });
    return issues; // without a field, we can't validate further
  }

  // operator must be known
  const norm = normalizeOperator(cond.operator);
  if (!norm) {
    issues.push({
      path,
      code: "operator.unknown",
      message: `Unsupported operator "${String(cond.operator)}"`,
    });
    return issues;
  }

  // operator must be enabled for this field type (schema-driven)
  const enabled = support[field.type] ?? [];
  if (!enabled.includes(norm)) {
    issues.push({
      path,
      code: "operator.disabled",
      message: `Operator ${norm} is not enabled for type ${field.type}`,
    });
  }

  // intrinsic rule must also allow this primitive type
  const rule = OP_RULES[norm];
  if (!rule.types.includes(field.type)) {
    issues.push({
      path,
      code: "operator.type_mismatch",
      message: `Operator ${norm} is not valid for primitive type ${field.type}`,
    });
  }

  // arity/value checks
  const v = cond.value as ConditionValue | undefined;

  switch (rule.arity) {
    case "none": {
      // required JSON says: "no value" → value should be omitted
      if ("value" in cond && cond.value !== undefined) {
        issues.push({
          path,
          code: "value.forbidden",
          message: `Operator ${norm} must not have a value`,
        });
      }
      break;
    }

    case "one": {
      // must be present and a scalar of the right type
      if (!("value" in cond) || v === undefined) {
        issues.push({
          path,
          code: "value.missing",
          message: `Operator ${norm} requires a value`,
        });
      } else if (Array.isArray(v)) {
        issues.push({
          path,
          code: "value.type",
          message: `Operator ${norm} requires a single ${field.type} value`,
        });
      } else if (!isValidScalarForType(v as ScalarValue, field.type)) {
        issues.push({
          path,
          code: "value.type",
          message: `Value does not match field type ${field.type}`,
        });
      }
      break;
    }

    case "two": {
      if (!isTupleTwo(v)) {
        issues.push({
          path,
          code: "value.arity.two",
          message: `Operator ${norm} requires exactly two values`,
        });
      } else {
        const [a, b] = v as [ScalarValue, ScalarValue];
        if (
          !isValidScalarForType(a, field.type) ||
          !isValidScalarForType(b, field.type)
        ) {
          issues.push({
            path,
            code: "value.type.tuple",
            message: `Both values must be of type ${field.type}`,
          });
        }
      }
      break;
    }

    case "array": {
      if (!isArrayVal(v)) {
        issues.push({
          path,
          code: "value.arity.array",
          message: `Operator ${norm} requires an array of values`,
        });
      } else {
        const arr = v as ScalarValue[];
        // Optionally enforce non-empty arrays; uncomment if desired:
        // if (arr.length === 0) {
        //   issues.push({
        //     path,
        //     code: "value.arity.array",
        //     message: `Operator ${norm} requires a non-empty array`,
        //   });
        // }
        const bad = arr.some((x) => !isValidScalarForType(x, field.type));
        if (bad) {
          issues.push({
            path,
            code: "value.type.array",
            message: `All array items must be of type ${field.type}`,
          });
        }
      }
      break;
    }
  }

  return issues;
}

/** Validate any node: condition or group */
function validateNode(
  node: FilterNode,
  fields: FieldDef[],
  support: OperatorSupport,
  path: string,
  out: ValidationIssue[]
) {
  // Group: exactly one of {and} or {or}
  if ("and" in node || "or" in node) {
    if ("and" in node && "or" in node) {
      out.push({
        path,
        code: "group.malformed",
        message: "Group cannot have both 'and' and 'or'",
      });
      return;
    }
    const key = "and" in node ? "and" : "or";
    const children = (node as any)[key] as ReadonlyArray<FilterNode>;
    // recurse
    children.forEach((child, i) =>
      validateNode(child, fields, support, `${path}.${key}[${i}]`, out)
    );
    return;
  }

  // Otherwise, treat it as a condition
  out.push(
    ...validateCondition(node as Condition, fields, support, path)
  );
}

/** Public API: validate a full filter tree (root must be a group) */
export function validateFilter(
  root: FilterJSON,
  fields: FieldDef[],
  operatorSupport: OperatorSupport = DEFAULT_OPERATOR_SUPPORT
): ValidationResult {
  const issues: ValidationIssue[] = [];
  validateNode(root as FilterNode, fields, operatorSupport, "root", issues);
  return { ok: issues.length === 0, issues };
}
