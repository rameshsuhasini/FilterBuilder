import React, { useMemo, useState, useEffect } from "react";
import type {
  FieldDef,
  OperatorKey,
  FilterJSON,
  FilterNode,
  Condition,
  ScalarValue,
  AndGroup,
  OrGroup,
} from "../domain";
import { OP_RULES, type OperatorSupport } from "../domain";
import {
  addConditionAt,
  addGroupAt,
  toggleGroupKeyAt,
  removeAt,
  updateConditionAt,
  type GroupPath,
} from "../action";
import { validateFilter } from "../validation";
import { toJSON, fromJSON } from "../serializer";
import { toQueryString } from "../transport";

type Props = {
  fields: ReadonlyArray<FieldDef>;
  operatorSupport: OperatorSupport;
  initial: FilterJSON;
  onChange?: (json: FilterJSON, qs: string) => void;
  useSymbolOpsInOutput?: boolean;
  queryKey?: string;
  endpoint?: string;
};

export default function FilterBuilder({
  fields,
  operatorSupport,
  initial,
  onChange,
  useSymbolOpsInOutput = false,
  queryKey = "filter",
  endpoint = "/search",
}: Props) {
  const [root, setRoot] = useState<FilterJSON>(initial);

  // Stable RW copy for computation
  const fieldsRW = useMemo(() => [...fields], [fields]);

  // Import/Export UI
  const [jsonInput, setJsonInput] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);

  function handleCopyRequired() {
    try {
      const text = JSON.stringify(
        toJSON(root, fieldsRW, { useSymbolOps: useSymbolOpsInOutput }),
        null,
        2
      );
      navigator.clipboard?.writeText(text);
    } catch {}
  }
  function handleLoadJson() {
    setLoadError(null);
    try {
      const parsed = JSON.parse(jsonInput);
      const normalized = fromJSON(parsed, fieldsRW);
      setRoot(normalized);
    } catch (e: any) {
      setLoadError(e?.message ?? "Invalid JSON");
    }
  }

  // Validation
  const validation = useMemo(
    () => validateFilter(root, fieldsRW, operatorSupport),
    [root, fieldsRW, operatorSupport]
  );

  // Build outputs
  const out = useMemo(
    () => toJSON(root, fieldsRW, { useSymbolOps: useSymbolOpsInOutput }),
    [root, fieldsRW, useSymbolOpsInOutput]
  );
  const qs = useMemo(
    () =>
      toQueryString(out, {
        key: queryKey,
        fields: fieldsRW,
        useSymbolOps: useSymbolOpsInOutput,
      }),
    [out, queryKey, fieldsRW, useSymbolOpsInOutput]
  );

  // Emit as effect
  useEffect(() => {
    onChange?.(out, qs);
  }, [out, qs, onChange]);

  return (
    <div className="stack">
      <GroupView
        node={root}
        path={[]}
        fields={fields}
        operatorSupport={operatorSupport}
        setRoot={setRoot}
      />

      <div className="card">
        <div className="section-title">Validation</div>
        <div style={{ marginTop: 6 }}>
          <strong>Valid:</strong> {String(validation.ok)}
          {!validation.ok && (
            <ul style={{ marginTop: 6 }}>
              {validation.issues.map((i, idx) => (
                <li key={idx}>
                  {i.message} <code>{i.path}</code>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="card">
        <div className="section-title">Required JSON</div>
        <pre className="kv">{JSON.stringify(out, null, 2)}</pre>
      </div>

    </div>
  );
}

function GroupView(props: {
  node: AndGroup | OrGroup;
  path: GroupPath;
  fields: ReadonlyArray<FieldDef>;
  operatorSupport: OperatorSupport;
  setRoot: React.Dispatch<React.SetStateAction<FilterJSON>>;
}) {
  const { node, path, fields, operatorSupport, setRoot } = props;
  const key: "and" | "or" = "and" in node ? "and" : "or";
  const children = (node as any)[key] as ReadonlyArray<FilterNode>;

  function addCond() {
    const f = fields[0]!;
    const ops = operatorSupport[f.type];
    const op = ops[0] as OperatorKey;
    setRoot((prev) =>
      addConditionAt(prev, path, {
        field: f.name,
        operator: op,
        value: defaultValueFor(f, op),
      })
    );
  }
  function addGroup(kind: "and" | "or") {
    setRoot((prev) => addGroupAt(prev, path, kind));
  }
  function toggle() {
    setRoot((prev) => toggleGroupKeyAt(prev, path));
  }
  function remove(idx: number) {
    const nodePath = [...path, { key, index: idx }];
    setRoot((prev) => removeAt(prev, nodePath));
  }

  return (
    <div className="card">
      <div className="header">
        <span className={`badge ${key === "or" ? "or" : ""}`}>{key.toUpperCase()} group</span>
        <div className="spacer">
          <button className="btn" onClick={addCond}>+ Condition</button>
          <button className="btn" onClick={() => addGroup("and")}>+ AND group</button>
          <button className="btn" onClick={() => addGroup("or")}>+ OR group</button>
          <button className="btn btn-primary" onClick={toggle} aria-label="Toggle AND/OR">
            Toggle
          </button>
        </div>
      </div>

      <div className="stack">
        {children.map((child, idx) =>
          "and" in (child as any) || "or" in (child as any) ? (
            <GroupView
              key={`${key}-${idx}`}
              node={child as any}
              path={[...path, { key, index: idx }]}
              fields={fields}
              operatorSupport={operatorSupport}
              setRoot={setRoot}
            />
          ) : (
            <ConditionRow
              key={`${key}-cond-${idx}`}
              cond={child as Condition}
              nodePath={[...path, { key, index: idx }]}
              fields={fields}
              operatorSupport={operatorSupport}
              setRoot={setRoot}
              onRemove={() => remove(idx)}
            />
          )
        )}
      </div>
    </div>
  );
}

function ConditionRow(props: {
  cond: Condition;
  nodePath: GroupPath;
  fields: ReadonlyArray<FieldDef>;
  operatorSupport: OperatorSupport;
  setRoot: React.Dispatch<React.SetStateAction<FilterJSON>>;
  onRemove: () => void;
}) {
  const { cond, nodePath, fields, operatorSupport, setRoot, onRemove } = props;

  const field = fields.find((f) => f.name === cond.field) ?? fields[0]!;
  const allowedOps = operatorSupport[field.type];

  function onFieldChange(name: string) {
    const f = fields.find((x) => x.name === name) ?? fields[0]!;
    const op = allowedOpsFor(f, operatorSupport)[0]!;
    setRoot((prev) =>
      updateConditionAt(prev, nodePath, {
        field: name,
        operator: op,
        value: defaultValueFor(f, op),
      })
    );
  }
  function onOperatorChange(opStr: string) {
    const op = opStr as OperatorKey;
    setRoot((prev) =>
      updateConditionAt(prev, nodePath, {
        operator: op,
        value: defaultValueFor(field, op),
      })
    );
  }
  function onValueChange(value: any) {
    setRoot((prev) => updateConditionAt(prev, nodePath, { value }));
  }

  const rule = OP_RULES[cond.operator as OperatorKey] ?? OP_RULES.eq;
  const showValue = rule.arity !== "none";

  return (
    <div className="condition-grid">
      <label className="sr-only" htmlFor={`field-${field.name}`}>Field</label>
      <select
        id={`field-${field.name}`}
        className="select"
        aria-label="Field"
        value={field.name}
        onChange={(e) => onFieldChange(e.target.value)}
      >
        {fields.map((f) => (
          <option key={f.name} value={f.name}>
            {f.label}
          </option>
        ))}
      </select>

      <label className="sr-only" htmlFor={`op-${field.name}`}>Operator</label>
      <select
        id={`op-${field.name}`}
        className="select"
        aria-label="Operator"
        value={String(cond.operator)}
        onChange={(e) => onOperatorChange(e.target.value)}
      >
        {allowedOps.map((op) => (
          <option key={op} value={op}>
            {op}
          </option>
        ))}
      </select>

      {showValue ? (
        renderValueEditor(field.type, cond, onValueChange)
      ) : (
        <span style={{ color: "var(--muted)" }}>—</span>
      )}

      <button className="btn btn-danger" onClick={onRemove} aria-label="Remove condition">
        Remove
      </button>
    </div>
  );
}

/* ---------------- helpers for UI ---------------- */

function allowedOpsFor(field: FieldDef, support: OperatorSupport) {
  return support[field.type];
}

function defaultValueFor(field: FieldDef, op: OperatorKey): any {
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

function renderValueEditor(
  fieldType: FieldDef["type"],
  cond: Condition,
  onChange: (v: any) => void
) {
  const rule = OP_RULES[cond.operator as OperatorKey];

  // between → two inputs
  if (rule.arity === "two") {
    const [a, b] = (Array.isArray(cond.value) ? cond.value : [null, null]) as any[];
    if (fieldType === "number") {
      return (
        <div style={{ display: "flex", gap: 6 }}>
          <input
            className="input"
            type="number"
            value={typeof a === "number" ? String(a) : ""}
            onChange={(e) =>
              onChange([e.target.value === "" ? null : Number(e.target.value), b ?? null])
            }
          />
          <input
            className="input"
            type="number"
            value={typeof b === "number" ? String(b) : ""}
            onChange={(e) =>
              onChange([a ?? null, e.target.value === "" ? null : Number(e.target.value)])
            }
          />
        </div>
      );
    }
    // date
    const aStr = a instanceof Date ? a.toISOString().slice(0, 10) : "";
    const bStr = b instanceof Date ? b.toISOString().slice(0, 10) : "";
    return (
      <div style={{ display: "flex", gap: 6 }}>
        <input
          className="input"
          type="date"
          value={aStr}
          onChange={(e) => onChange([e.target.value ? new Date(e.target.value) : null, b ?? null])}
        />
        <input
          className="input"
          type="date"
          value={bStr}
          onChange={(e) => onChange([a ?? null, e.target.value ? new Date(e.target.value) : null])}
        />
      </div>
    );
  }

  // in / not_in → CSV (string/number)
  if (rule.arity === "array") {
    const list = Array.isArray(cond.value) ? (cond.value as ScalarValue[]) : [];
    return (
      <input
        className="input"
        type="text"
        placeholder={fieldType === "number" ? "e.g. 10, 20, 30" : "e.g. red, blue, green"}
        value={list.map((v) => (v instanceof Date ? v.toISOString() : String(v ?? ""))).join(", ")}
        onChange={(e) => {
          const parts = e.target.value
            .split(",")
            .map((s) => s.trim())
            .filter((s) => s.length > 0);
          const arr = fieldType === "number" ? parts.map((p) => Number(p)) : parts;
          onChange(arr);
        }}
      />
    );
  }

  // one → single input
  switch (fieldType) {
    case "number":
      return (
        <input
          className="input"
          type="number"
          value={typeof cond.value === "number" ? String(cond.value) : ""}
          onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
        />
      );
    case "boolean":
      return (
        <select
          className="select"
          value={cond.value === true ? "true" : "false"}
          onChange={(e) => onChange(e.target.value === "true")}
        >
          <option value="true">true</option>
          <option value="false">false</option>
        </select>
      );
    case "date":
      return (
        <input
          className="input"
          type="date"
          value={cond.value instanceof Date ? cond.value.toISOString().slice(0, 10) : ""}
          onChange={(e) => onChange(e.target.value ? new Date(e.target.value) : null)}
        />
      );
    default:
      return (
        <input
          className="input"
          type="text"
          value={typeof cond.value === "string" ? cond.value : ""}
          onChange={(e) => onChange(e.target.value)}
        />
      );
  }
}
