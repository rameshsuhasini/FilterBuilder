import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState, useCallback } from "react";
import FilterBuilder from "./ui/FilterBuilder";
import { DEFAULT_OPERATOR_SUPPORT } from "./domain";
import { buildGetRequest, buildPostRequest } from "./transport";
// Demo dataset: Users
const userFields = [
    { name: "age", label: "Age", type: "number" },
    { name: "role", label: "Role", type: "string" },
    { name: "isActive", label: "Active", type: "boolean" },
    { name: "joined", label: "Joined", type: "date" },
];
// Demo dataset: Products
const productFields = [
    { name: "title", label: "Title", type: "string" },
    { name: "price", label: "Price", type: "number" },
    { name: "inStock", label: "In Stock", type: "boolean" },
    { name: "released", label: "Released", type: "date" },
];
// Start with an empty AND group
const initialFilter = { and: [] };
export default function App() {
    // ⬇⬇ These fix the “cannot find name 'jsonOut'” error
    const [jsonOut, setJsonOut] = useState(initialFilter);
    const [qsOut, setQsOut] = useState("");
    const [dataset, setDataset] = useState("users");
    const fields = dataset === "users" ? userFields : productFields;
    const handleChange = useCallback((json, qs) => {
        setJsonOut(json);
        setQsOut(qs);
    }, []);
    // API panel
    const [mode, setMode] = useState("GET");
    const [endpoint, setEndpoint] = useState("https://httpbin.org/anything");
    const [sendStatus, setSendStatus] = useState("");
    async function handleSend() {
        try {
            const filter = jsonOut; // exact target JSON
            if (mode === "GET") {
                const req = buildGetRequest(endpoint, filter, { fields });
                const res = await fetch(req.url, req.init);
                const data = await res.json().catch(() => ({}));
                setSendStatus(`${res.status} ${res.statusText}\n` + JSON.stringify(data, null, 2));
            }
            else {
                const req = buildPostRequest(endpoint, filter, { fields, bodyKey: "filter" });
                const res = await fetch(req.url, req.init);
                const data = await res.json().catch(() => ({}));
                setSendStatus(`${res.status} ${res.statusText}\n` + JSON.stringify(data, null, 2));
            }
        }
        catch (e) {
            setSendStatus("Error: " + e.message);
        }
    }
    return (_jsxs("div", { style: { fontFamily: "system-ui, sans-serif", padding: 16, lineHeight: 1.4 }, children: [_jsx("h1", { style: { marginBottom: 8 }, children: "Filter Builder \u2014 Demo" }), _jsx("p", { style: { marginTop: 0 }, children: "Build nested filters (AND/OR). Output matches the required JSON format." }), _jsxs("div", { style: { display: "flex", gap: 8, marginBottom: 12 }, children: ["+   ", _jsxs("label", { children: ["+     Dataset:\u00A0 +     ", _jsxs("select", { value: dataset, onChange: (e) => {
                                    const next = e.target.value;
                                    +setDataset(next);
                                    + +setJsonOut({ and: [] });
                                    +setQsOut("");
                                }, children: ["+       ", _jsx("option", { value: "users", children: "Users" }), "+       ", _jsx("option", { value: "products", children: "Products" }), "+     "] }), "+   "] }), "+ "] }), _jsx(FilterBuilder, { fields: fields, operatorSupport: DEFAULT_OPERATOR_SUPPORT, initial: initialFilter, onChange: handleChange, useSymbolOpsInOutput: false, queryKey: "filter", endpoint: "/search" })] }));
}
//# sourceMappingURL=App.js.map