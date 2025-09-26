import type { FilterJSON, FilterNode, Condition } from "./domain";
type GroupKey = "and" | "or";
export type PathStep = {
    key: GroupKey;
    index: number;
};
export type GroupPath = ReadonlyArray<PathStep>;
export type NodePath = ReadonlyArray<PathStep>;
export declare function addConditionAt(root: FilterJSON, groupPath: GroupPath | undefined, condition: Condition): FilterJSON;
export declare function addGroupAt(root: FilterJSON, groupPath: GroupPath | undefined, newKey: GroupKey): FilterJSON;
export declare function removeAt(root: FilterJSON, nodePath: NodePath): FilterJSON;
export declare function toggleGroupKeyAt(root: FilterJSON, groupPath?: GroupPath): FilterJSON;
export declare function updateConditionAt(root: FilterJSON, nodePath: NodePath, patch: Partial<Condition>): FilterJSON;
export declare function replaceNodeAt(root: FilterJSON, nodePath: NodePath, node: FilterNode): FilterJSON;
export {};
//# sourceMappingURL=action.d.ts.map