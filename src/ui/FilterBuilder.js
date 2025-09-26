import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useMemo, useState, useEffect } from "react";
import { OP_RULES } from "../domain";
import { addConditionAt, addGroupAt, toggleGroupKeyAt, removeAt, updateConditionAt, } from "../action";
import { validateFilter } from "../validation";
import { toJSON, fromJSON } from "../serializer";
import { toQueryString } from "../transport";
export default function FilterBuilder({ fields, operatorSupport, initial, onChange, useSymbolOpsInOutput = false, queryKey = "filter", endpoint = "/search", }) {
    const [root, setRoot] = useState(initial);
    // Stable RW copy for computation
    const fieldsRW = useMemo(() => [...fields], [fields]);
    // Import/Export UI
    const [jsonInput, setJsonInput] = useState("");
    const [loadError, setLoadError] = useState(null);
    function handleCopyRequired() {
        try {
            const text = JSON.stringify(toJSON(root, fieldsRW, { useSymbolOps: useSymbolOpsInOutput }), null, 2);
            navigator.clipboard?.writeText(text);
        }
        catch { }
    }
    function handleLoadJson() {
        setLoadError(null);
        try {
            const parsed = JSON.parse(jsonInput);
            const normalized = fromJSON(parsed, fieldsRW);
            setRoot(normalized);
        }
        catch (e) {
            setLoadError(e?.message ?? "Invalid JSON");
        }
    }
    // Validation
    const validation = useMemo(() => validateFilter(root, fieldsRW, operatorSupport), [root, fieldsRW, operatorSupport]);
    // Build outputs
    const out = useMemo(() => toJSON(root, fieldsRW, { useSymbolOps: useSymbolOpsInOutput }), [root, fieldsRW, useSymbolOpsInOutput]);
    const qs = useMemo(() => toQueryString(out, {
        key: queryKey,
        fields: fieldsRW,
        useSymbolOps: useSymbolOpsInOutput,
    }), [out, queryKey, fieldsRW, useSymbolOpsInOutput]);
    // Emit as effect
    useEffect(() => {
        onChange?.(out, qs);
    }, [out, qs, onChange]);
    return (_jsxs("div", { className: "stack", children: [_jsx(GroupView, { node: root, path: [], fields: fields, operatorSupport: operatorSupport, setRoot: setRoot }), _jsxs("div", { className: "card", children: [_jsx("div", { className: "section-title", children: "Validation" }), _jsxs("div", { style: { marginTop: 6 }, children: [_jsx("strong", { children: "Valid:" }), " ", String(validation.ok), !validation.ok && (_jsx("ul", { style: { marginTop: 6 }, children: validation.issues.map((i, idx) => (_jsxs("li", { children: [i.message, " ", _jsx("code", { children: i.path })] }, idx))) }))] })] }), _jsxs("div", { className: "card", children: [_jsx("div", { className: "section-title", children: "Required JSON" }), _jsx("pre", { className: "kv", children: JSON.stringify(out, null, 2) })] })] }));
}
function GroupView(props) {
    const { node, path, fields, operatorSupport, setRoot } = props;
    const key = "and" in node ? "and" : "or";
    const children = node[key];
    function addCond() {
        const f = fields[0];
        const ops = operatorSupport[f.type];
        const op = ops[0];
        setRoot((prev) => addConditionAt(prev, path, {
            field: f.name,
            operator: op,
            value: defaultValueFor(f, op),
        }));
    }
    function addGroup(kind) {
        setRoot((prev) => addGroupAt(prev, path, kind));
    }
    function toggle() {
        setRoot((prev) => toggleGroupKeyAt(prev, path));
    }
    function remove(idx) {
        const nodePath = [...path, { key, index: idx }];
        setRoot((prev) => removeAt(prev, nodePath));
    }
    return (_jsxs("div", { className: "card", children: [_jsxs("div", { className: "header", children: [_jsxs("span", { className: `badge ${key === "or" ? "or" : ""}`, children: [key.toUpperCase(), " group"] }), _jsxs("div", { className: "spacer", children: [_jsx("button", { className: "btn", onClick: addCond, children: "+ Condition" }), _jsx("button", { className: "btn", onClick: () => addGroup("and"), children: "+ AND group" }), _jsx("button", { className: "btn", onClick: () => addGroup("or"), children: "+ OR group" }), _jsx("button", { className: "btn btn-primary", onClick: toggle, "aria-label": "Toggle AND/OR", children: "Toggle" })] })] }), _jsx("div", { className: "stack", children: children.map((child, idx) => "and" in child || "or" in child ? (_jsx(GroupView, { node: child, path: [...path, { key, index: idx }], fields: fields, operatorSupport: operatorSupport, setRoot: setRoot }, `${key}-${idx}`)) : (_jsx(ConditionRow, { cond: child, nodePath: [...path, { key, index: idx }], fields: fields, operatorSupport: operatorSupport, setRoot: setRoot, onRemove: () => remove(idx) }, `${key}-cond-${idx}`))) })] }));
}
function ConditionRow(props) {
    const { cond, nodePath, fields, operatorSupport, setRoot, onRemove } = props;
    const field = fields.find((f) => f.name === cond.field) ?? fields[0];
    const allowedOps = operatorSupport[field.type];
    function onFieldChange(name) {
        const f = fields.find((x) => x.name === name) ?? fields[0];
        const op = allowedOpsFor(f, operatorSupport)[0];
        setRoot((prev) => updateConditionAt(prev, nodePath, {
            field: name,
            operator: op,
            value: defaultValueFor(f, op),
        }));
    }
    function onOperatorChange(opStr) {
        const op = opStr;
        setRoot((prev) => updateConditionAt(prev, nodePath, {
            operator: op,
            value: defaultValueFor(field, op),
        }));
    }
    function onValueChange(value) {
        setRoot((prev) => updateConditionAt(prev, nodePath, { value }));
    }
    const rule = OP_RULES[cond.operator] ?? OP_RULES.eq;
    const showValue = rule.arity !== "none";
    return (_jsxs("div", { className: "condition-grid", children: [_jsx("label", { className: "sr-only", htmlFor: `field-${field.name}`, children: "Field" }), _jsx("select", { id: `field-${field.name}`, className: "select", "aria-label": "Field", value: field.name, onChange: (e) => onFieldChange(e.target.value), children: fields.map((f) => (_jsx("option", { value: f.name, children: f.label }, f.name))) }), _jsx("label", { className: "sr-only", htmlFor: `op-${field.name}`, children: "Operator" }), _jsx("select", { id: `op-${field.name}`, className: "select", "aria-label": "Operator", value: String(cond.operator), onChange: (e) => onOperatorChange(e.target.value), children: allowedOps.map((op) => (_jsx("option", { value: op, children: op }, op))) }), showValue ? (renderValueEditor(field.type, cond, onValueChange)) : (_jsx("span", { style: { color: "var(--muted)" }, children: "\u2014" })), _jsx("button", { className: "btn btn-danger", onClick: onRemove, "aria-label": "Remove condition", children: "Remove" })] }));
}
/* ---------------- helpers for UI ---------------- */
function allowedOpsFor(field, support) {
    return support[field.type];
}
function defaultValueFor(field, op) {
    const rule = OP_RULES[op];
    switch (rule.arity) {
        case "none":
            return undefined;
        case "one":
            switch (field.type) {
                case "number":
                    return 0;
                case "boolean":
                    return false;
                case "date":
                    return new Date();
                default:
                    return "";
            }
        case "two":
            return [null, null];
        case "array":
            return [];
    }
}
function renderValueEditor(fieldType, cond, onChange) {
    const rule = OP_RULES[cond.operator];
    // between → two inputs
    if (rule.arity === "two") {
        const [a, b] = (Array.isArray(cond.value) ? cond.value : [null, null]);
        if (fieldType === "number") {
            return (_jsxs("div", { style: { display: "flex", gap: 6 }, children: [_jsx("input", { className: "input", type: "number", value: typeof a === "number" ? String(a) : "", onChange: (e) => onChange([e.target.value === "" ? null : Number(e.target.value), b ?? null]) }), _jsx("input", { className: "input", type: "number", value: typeof b === "number" ? String(b) : "", onChange: (e) => onChange([a ?? null, e.target.value === "" ? null : Number(e.target.value)]) })] }));
        }
        // date
        const aStr = a instanceof Date ? a.toISOString().slice(0, 10) : "";
        const bStr = b instanceof Date ? b.toISOString().slice(0, 10) : "";
        return (_jsxs("div", { style: { display: "flex", gap: 6 }, children: [_jsx("input", { className: "input", type: "date", value: aStr, onChange: (e) => onChange([e.target.value ? new Date(e.target.value) : null, b ?? null]) }), _jsx("input", { className: "input", type: "date", value: bStr, onChange: (e) => onChange([a ?? null, e.target.value ? new Date(e.target.value) : null]) })] }));
    }
    // in / not_in → CSV (string/number)
    if (rule.arity === "array") {
        const list = Array.isArray(cond.value) ? cond.value : [];
        return (_jsx("input", { className: "input", type: "text", placeholder: fieldType === "number" ? "e.g. 10, 20, 30" : "e.g. red, blue, green", value: list.map((v) => (v instanceof Date ? v.toISOString() : String(v ?? ""))).join(", "), onChange: (e) => {
                const parts = e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter((s) => s.length > 0);
                const arr = fieldType === "number" ? parts.map((p) => Number(p)) : parts;
                onChange(arr);
            } }));
    }
    // one → single input
    switch (fieldType) {
        case "number":
            return (_jsx("input", { className: "input", type: "number", value: typeof cond.value === "number" ? String(cond.value) : "", onChange: (e) => onChange(e.target.value === "" ? null : Number(e.target.value)) }));
        case "boolean":
            return (_jsxs("select", { className: "select", value: cond.value === true ? "true" : "false", onChange: (e) => onChange(e.target.value === "true"), children: [_jsx("option", { value: "true", children: "true" }), _jsx("option", { value: "false", children: "false" })] }));
        case "date":
            return (_jsx("input", { className: "input", type: "date", value: cond.value instanceof Date ? cond.value.toISOString().slice(0, 10) : "", onChange: (e) => onChange(e.target.value ? new Date(e.target.value) : null) }));
        default:
            return (_jsx("input", { className: "input", type: "text", value: typeof cond.value === "string" ? cond.value : "", onChange: (e) => onChange(e.target.value) }));
    }
}
//# sourceMappingURL=FilterBuilder.js.map