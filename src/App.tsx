import React, { useState, useCallback } from "react";
import FilterBuilder from "./ui/FilterBuilder";
import type { FieldDef, FilterJSON } from "./domain";
import { DEFAULT_OPERATOR_SUPPORT } from "./domain";
import { buildGetRequest, buildPostRequest } from "./transport";

// Demo dataset: Users
const userFields: FieldDef[] = [
  { name: "age", label: "Age", type: "number" },
  { name: "role", label: "Role", type: "string" },
  { name: "isActive", label: "Active", type: "boolean" },
  { name: "joined", label: "Joined", type: "date" },
];
// Demo dataset: Products
 const productFields: FieldDef[] = [
   { name: "title", label: "Title", type: "string" },
   { name: "price", label: "Price", type: "number" },
   { name: "inStock", label: "In Stock", type: "boolean" },
   { name: "released", label: "Released", type: "date" },
 ];


// Start with an empty AND group
const initialFilter: FilterJSON = { and: [] };

export default function App() {
  // ⬇⬇ These fix the “cannot find name 'jsonOut'” error
  const [jsonOut, setJsonOut] = useState<FilterJSON>(initialFilter);
  const [qsOut, setQsOut] = useState<string>("");
  const [dataset, setDataset] = useState<"users" | "products">("users");
  const fields = dataset === "users" ? userFields : productFields;

 const handleChange = useCallback((json: FilterJSON, qs: string) => {
   setJsonOut(json);
   setQsOut(qs);
}, []);

  // API panel
  const [mode, setMode] = useState<"GET" | "POST">("GET");
  const [endpoint, setEndpoint] = useState<string>("https://httpbin.org/anything");
  const [sendStatus, setSendStatus] = useState<string>("");

  async function handleSend() {
    try {
      const filter = jsonOut; // exact target JSON
      if (mode === "GET") {
        const req = buildGetRequest(endpoint, filter, { fields });
        const res = await fetch(req.url, req.init);
        const data = await res.json().catch(() => ({}));
        setSendStatus(`${res.status} ${res.statusText}\n` + JSON.stringify(data, null, 2));
      } else {
        const req = buildPostRequest(endpoint, filter, { fields, bodyKey: "filter" });
        const res = await fetch(req.url, req.init);
        const data = await res.json().catch(() => ({}));
        setSendStatus(`${res.status} ${res.statusText}\n` + JSON.stringify(data, null, 2));
      }
    } catch (e: any) {
      setSendStatus("Error: " + e.message);
    }
  }

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", padding: 16, lineHeight: 1.4 }}>
      <h1 style={{ marginBottom: 8 }}>Filter Builder — Demo</h1>
      <p style={{ marginTop: 0 }}>
        Build nested filters (AND/OR). Output matches the required JSON format.
      </p>
      
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
+   <label>
+     Dataset:&nbsp;
+     <select value={dataset} onChange={(e) => {
const next = e.target.value as "users" | "products";
+       setDataset(next);
+       // optional: reset filter when switching datasets
+       setJsonOut({ and: [] });
+       setQsOut("");
}}>
+       <option value="users">Users</option>
+       <option value="products">Products</option>
+     </select>
+   </label>
+ </div>


      <FilterBuilder
        fields={fields}
        operatorSupport={DEFAULT_OPERATOR_SUPPORT}
        initial={initialFilter}
        onChange={handleChange}
        useSymbolOpsInOutput={false}
        queryKey="filter"
        endpoint="/search"
      />

    </div>
  );
}
