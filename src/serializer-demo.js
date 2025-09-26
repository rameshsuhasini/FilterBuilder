import { toJSON, fromJSON } from "./serializer";
import {} from "./domain";
const fields = [
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
};
const normalized = fromJSON(input, fields); // "=" → "eq", dates parsed
const exported = toJSON(normalized, fields, { useSymbolOps: true }); // back to "=" etc.
console.log(JSON.stringify(exported, null, 2));
//# sourceMappingURL=serializer-demo.js.map