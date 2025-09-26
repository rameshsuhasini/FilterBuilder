import { validateFilter } from "./validation";
import { DEFAULT_OPERATOR_SUPPORT, type FieldDef } from "./domain";

const fields: FieldDef[] = [
  { name: "age", label: "Age", type: "number" },
  { name: "role", label: "Role", type: "string" },
  { name: "isActive", label: "Active", type: "boolean" },
  { name: "joined", label: "Joined", type: "date" },
];

const filter = {
  and: [
    { field: "age", operator: "gt", value: 30 },
    {
      or: [
        { field: "role", operator: "eq", value: "admin" },
        { field: "isActive", operator: "=", value: true }, // "=" allowed
      ],
    },
  ],
} as const;

const res = validateFilter(filter, fields, DEFAULT_OPERATOR_SUPPORT);
console.log(res.ok, res.issues);
