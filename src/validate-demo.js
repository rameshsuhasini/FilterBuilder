import { validateFilter } from "./validation";
import { DEFAULT_OPERATOR_SUPPORT } from "./domain";
const fields = [
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
};
const res = validateFilter(filter, fields, DEFAULT_OPERATOR_SUPPORT);
console.log(res.ok, res.issues);
//# sourceMappingURL=validate-demo.js.map