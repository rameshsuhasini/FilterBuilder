import { describe, it, expect } from "vitest";
import { validateFilter } from "../validation";
import type { FieldDef, FilterJSON, OperatorSupport } from "../domain";
import { DEFAULT_OPERATOR_SUPPORT } from "../domain";

const fields: FieldDef[] = [
  { name: "age", label: "Age", type: "number" },
  { name: "role", label: "Role", type: "string" },
  { name: "isActive", label: "Active", type: "boolean" },
  { name: "joined", label: "Joined", type: "date" },
];

describe("validation", () => {
  it("accepts a valid nested AND/OR filter (with '=' alias)", () => {
    const filter: FilterJSON = {
      and: [
        { field: "age", operator: "gt", value: 30 },
        {
          or: [
            { field: "role", operator: "eq", value: "admin" },
            { field: "isActive", operator: "=", value: true },
          ],
        },
      ],
    };
    const res = validateFilter(filter, fields, DEFAULT_OPERATOR_SUPPORT);
    expect(res.ok).toBe(true);
    expect(res.issues.length).toBe(0);
  });

  it("flags between when not two values", () => {
    const filter: FilterJSON = {
      and: [{ field: "age", operator: "between", value: [1] as any }],
    };
    const res = validateFilter(filter, fields, DEFAULT_OPERATOR_SUPPORT);
    expect(res.ok).toBe(false);
    expect(res.issues.some(i => i.code === "value.arity.two")).toBe(true);
  });

  it("flags is_null when value present", () => {
    const filter: FilterJSON = {
      and: [{ field: "role", operator: "is_null", value: "oops" as any }],
    };
    const res = validateFilter(filter, fields, DEFAULT_OPERATOR_SUPPORT);
    expect(res.ok).toBe(false);
    expect(res.issues.some(i => i.code === "value.forbidden")).toBe(true);
  });

  it("validates 'in' as array when enabled", () => {
    const SUPPORT_IN: OperatorSupport = {
      string: [...DEFAULT_OPERATOR_SUPPORT.string, "in"],
      number: [...DEFAULT_OPERATOR_SUPPORT.number, "in"],
      boolean: DEFAULT_OPERATOR_SUPPORT.boolean,
      date: DEFAULT_OPERATOR_SUPPORT.date,
    };
    const filter: FilterJSON = {
      and: [{ field: "role", operator: "in", value: ["admin", "editor"] }],
    };
    const res = validateFilter(filter, fields, SUPPORT_IN);
    expect(res.ok).toBe(true);
  });

  it("flags unknown field", () => {
    const filter: FilterJSON = {
      and: [{ field: "nope", operator: "eq", value: 1 }],
    };
    const res = validateFilter(filter, fields, DEFAULT_OPERATOR_SUPPORT);
    expect(res.ok).toBe(false);
    expect(res.issues.some(i => i.code === "field.unknown")).toBe(true);
  });
});
