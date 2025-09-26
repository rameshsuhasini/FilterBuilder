import { describe, it, expect } from "vitest";
import { buildGetRequest, buildPostRequest } from "../transport";
import type { FieldDef, FilterJSON } from "../domain";

const fields: FieldDef[] = [
  { name: "age", label: "Age", type: "number" },
];

const filter: FilterJSON = { and: [{ field: "age", operator: "gt", value: 42 }] };

describe("transport", () => {
  it("builds GET with encoded filter param", () => {
    const req = buildGetRequest("https://api.example.com/search", filter, { fields });
    expect(req.init.method).toBe("GET");
    expect(req.url).toMatch(/filter=/);
    const u = new URL(req.url);
    const raw = u.searchParams.get("filter");
    expect(raw).toBeTruthy();
  });

  it("builds POST with JSON body (wrapped key)", () => {
    const req = buildPostRequest("https://api.example.com/search", filter, {
      fields,
      bodyKey: "filter",
    });
    expect(req.init.method).toBe("POST");
    expect(req.init.headers["Content-Type"]).toBe("application/json");
    const body = JSON.parse(req.init.body as string);
    expect(body.filter.and[0].field).toBe("age");
  });
});
