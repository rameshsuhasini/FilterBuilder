import type { FieldDef, FilterJSON } from "./domain";
/**
 * Normalize an incoming JSON (exact {and|or} shape) to:
 * - keep the same shape
 * - normalize operators like "=" → "eq" internally
 * - parse dates from ISO strings to Date objects (for UI editing)
 */
export declare function fromJSON(raw: FilterJSON, fields: FieldDef[]): FilterJSON;
/**
 * Produce the required JSON for transport/storage:
 * - exact {and|or} group keys
 * - omit value for 'is_null' / 'is_not_null'
 * - convert Date → ISO strings
 * - optionally emit symbol operators ("=") for eq/neq/gt/lt
 */
export declare function toJSON(root: FilterJSON, fields: FieldDef[], opts?: {
    useSymbolOps?: boolean;
}): FilterJSON;
/** Helpers for query-string usage */
export declare function encodeFilterParam(json: FilterJSON): string;
export declare function decodeFilterParam(param: string): FilterJSON;
//# sourceMappingURL=serializer.d.ts.map