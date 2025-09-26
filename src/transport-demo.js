import { fromJSON } from "./serializer";
import { buildGetRequest, buildPostRequest, toQueryString } from "./transport";
const fields = [
    { name: "age", label: "Age", type: "number" },
    { name: "role", label: "Role", type: "string" },
    { name: "isActive", label: "Active", type: "boolean" },
    { name: "joined", label: "Joined", type: "date" },
];
// start with your exact target format (can include "=")
const input = {
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
// (optional) normalize via fromJSON if some values may be Dates in UI, etc.
const normalized = fromJSON(input, fields);
// GET (query param "filter")
const getReq = buildGetRequest("https://api.example.com/search", normalized, {
    fields, // ensures Date→ISO & operator formatting
    useSymbolOps: false, // keep operator keys ("eq") in output (default)
});
console.log("GET →", getReq.url, getReq.init);
// POST (JSON body, wrapped under { filter: ... })
const postReq = buildPostRequest("https://api.example.com/search", normalized, {
    fields,
    bodyKey: "filter",
});
console.log("POST →", postReq.url, postReq.init);
// Just the query string (no leading '?')
console.log("QS →", toQueryString(normalized, { fields }));
//# sourceMappingURL=transport-demo.js.map