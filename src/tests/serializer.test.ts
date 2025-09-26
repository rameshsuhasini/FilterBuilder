import { describe, it, expect } from "vitest";
import { fromJSON, toJSON } from "../serializer";
import type { FieldDef, FilterJSON, FilterNode } from "../domain";

const fields: FieldDef[] = [
  { name: "age", label: "Age", type: "number" },
  { name: "joined", label: "Joined", type: "date" },
  { name: "flag", label: "Flag", type: "boolean" },
];

// Narrowing helper for tests
function childrenOf(root: FilterJSON): ReadonlyArray<FilterNode> {
  return "and" in root ? root.and : root.or;
}

describe("serializer", () => {
  it("normalizes '=' to 'eq' and parses date strings to Date", () => {
    const raw: FilterJSON = {
      and: [
        { field: "age", operator: "=", value: 10 },
        { field: "joined", operator: "after", value: "2024-01-02T00:00:00.000Z" },
      ],
    };
    const norm = fromJSON(raw, fields);
    // (optional) assert the shape if you want
    expect("and" in norm).toBe(true);

    const kids = childrenOf(norm);
    const a = kids[0] as any;
    const b = kids[1] as any;
    expect(a.operator).toBe("eq");
    expect(b.value instanceof Date).toBe(true);
  });

  it("emits exact JSON shape and omits value for null-arity", () => {
    const input: FilterJSON = {
      and: [{ field: "flag", operator: "is_null" }],
    };
    const out = toJSON(input, fields);
    const first = childrenOf(out)[0] as any;
    expect("value" in first).toBe(false);
    expect("and" in out || "or" in out).toBe(true);
  });

  it("round-trips Date to ISO on export", () => {
    const input: FilterJSON = {
      and: [{ field: "joined", operator: "after", value: new Date("2023-08-01") }],
    };
    const out = toJSON(input, fields);
    const first = childrenOf(out)[0] as any;
    expect(typeof first.value).toBe("string");
    expect(first.value).toMatch(/^2023-08-01/);
  });
});
