import { toJSON, fromJSON } from "./serializer";
import { type FieldDef } from "./domain";

const fields: FieldDef[] = [
  { name: "age", label: "Age", type: "number" },
  { name: "role", label: "Role", type: "string" },
  { name: "isActive", label: "Active", type: "boolean" },
  { name: "joined", label: "Joined", type: "date" },
];

const input = {
  and: [
    { field: "age", operator: "gt", value: 30 },
    {
      or: [
        { field: "role", operator: "eq", value: "admin" },
        { field: "isActive", operator: "=", value: true }
      ]
    }
  ]
} as const;

const normalized = fromJSON(input as any, fields);            // "=" → "eq", dates parsed
const exported   = toJSON(normalized, fields, { useSymbolOps: true }); // back to "=" etc.

console.log(JSON.stringify(exported, null, 2));
