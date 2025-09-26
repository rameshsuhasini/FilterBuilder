// src/actions.ts
// Immutable helpers that operate DIRECTLY on the exact JSON format:
// - Group nodes: { and: FilterNode[] } | { or: FilterNode[] }
// - Condition:   { field, operator, value? }

import type {
  FilterJSON,
  FilterNode,
  AndGroup,
  OrGroup,
  Condition,
} from "./domain";

type GroupKey = "and" | "or";
export type PathStep = { key: GroupKey; index: number };
export type GroupPath = ReadonlyArray<PathStep>; // points to a group (root = [])
export type NodePath  = ReadonlyArray<PathStep>; // points to a child index in its parent group

function isGroup(n: FilterNode): n is AndGroup | OrGroup {
  return !!n && typeof n === "object" && ("and" in n || "or" in n);
}
function keyOf(g: AndGroup | OrGroup): GroupKey {
  return "and" in g ? "and" : "or";
}
function childrenOf(g: AndGroup | OrGroup): ReadonlyArray<FilterNode> {
  return ("and" in g ? g.and : g.or) as ReadonlyArray<FilterNode>;
}
function makeGroup(k: GroupKey, children: ReadonlyArray<FilterNode>): AndGroup | OrGroup {
  return k === "and" ? ({ and: children } as AndGroup) : ({ or: children } as OrGroup);
}

/**
 * Safely update the group located at `path` (root when path is empty).
 * Validates each step: key match, index bounds, and that the target is a group.
 * Provides clear error messages instead of undefined destructuring.
 */
function updateGroupAt(
  root: AndGroup | OrGroup,
  path: GroupPath,
  updater: (g: AndGroup | OrGroup) => AndGroup | OrGroup
): AndGroup | OrGroup {
  if (!Array.isArray(path) || path.length === 0) {
    return updater(root);
  }

  // Work immutably
  let current: AndGroup | OrGroup = root;
  const parents: { group: AndGroup | OrGroup; key: GroupKey; index: number }[] = [];

  for (let depth = 0; depth < path.length; depth++) {
    const step = path[depth];
    if (!step) {
      throw new Error(`Path step at depth ${depth} is undefined`);
    }

    const k = keyOf(current);
    if (k !== step.key) {
      throw new Error(`Path key mismatch at depth ${depth}: expected ${k}, got ${step.key}`);
    }

    const list = childrenOf(current);
    if (step.index < 0 || step.index >= list.length) {
      throw new Error(
        `Index out of range at depth ${depth}: ${k}[${step.index}], length=${list.length}`
      );
    }

    const child = list[step.index];
    if (!child || !isGroup(child)) {
      throw new Error(`Path at depth ${depth} targets a non-group at ${k}[${step.index}]`);
    }

    parents.push({ group: current, key: k, index: step.index });
    current = child;
  }

  // Apply updater to the deepest group
  let updated = updater(current);

  // Rebuild back up immutably
  for (let i = parents.length - 1; i >= 0; i--) {
    const parent = parents[i];
    if (!parent) {
      throw new Error(`Parent at index ${i} is undefined`);
    }
    const { group, key, index } = parent;
    const list = childrenOf(group).slice() as FilterNode[];
    list[index] = updated;
    updated = makeGroup(key, list);
  }

  return updated;
}


// ───────────────────────────── actions ─────────────────────────────

// Add a condition under the group at `groupPath`
export function addConditionAt(
  root: FilterJSON,
  groupPath: GroupPath = [],
  condition: Condition
): FilterJSON {
  return updateGroupAt(root, groupPath, (g) => {
    const k = keyOf(g);
    const list = [...childrenOf(g), condition];
    return makeGroup(k, list);
  });
}

// Add a new (empty) nested group under the group at `groupPath`
export function addGroupAt(
  root: FilterJSON,
  groupPath: GroupPath = [],
  newKey: GroupKey
): FilterJSON {
  const empty = makeGroup(newKey, []);
  return updateGroupAt(root, groupPath, (g) => {
    const k = keyOf(g);
    const list = [...childrenOf(g), empty];
    return makeGroup(k, list);
  });
}

// Remove the node (condition or group) addressed by `nodePath`
export function removeAt(root: FilterJSON, nodePath: NodePath): FilterJSON {
  if (!Array.isArray(nodePath) || nodePath.length === 0) {
    throw new Error("removeAt: nodePath must not be empty");
  }
  const parentPath = nodePath.slice(0, -1) as GroupPath;
  const last = nodePath[nodePath.length - 1];

  return updateGroupAt(root, parentPath, (g) => {
    const k = keyOf(g);
    const list = childrenOf(g);
    if (last.index < 0 || last.index >= list.length) {
      throw new Error(`removeAt: index out of range at ${k}[${last.index}]`);
    }
    const next = list.filter((_, i) => i !== last.index);
    return makeGroup(k, next);
  });
}

// Toggle a group's key 'and' <-> 'or' at `groupPath` (children preserved)
export function toggleGroupKeyAt(
  root: FilterJSON,
  groupPath: GroupPath = []
): FilterJSON {
  return updateGroupAt(root, groupPath, (g) => {
    const list = childrenOf(g);
    const nextKey: GroupKey = keyOf(g) === "and" ? "or" : "and";
    return makeGroup(nextKey, list);
  });
}

// Update an existing CONDITION at `nodePath` with a partial patch
export function updateConditionAt(
  root: FilterJSON,
  nodePath: NodePath,
  patch: Partial<Condition>
): FilterJSON {
  if (!Array.isArray(nodePath) || nodePath.length === 0) {
    throw new Error("updateConditionAt: nodePath must not be empty");
  }
  const parentPath = nodePath.slice(0, -1) as GroupPath;
  const last = nodePath[nodePath.length - 1];

  return updateGroupAt(root, parentPath, (g) => {
    const k = keyOf(g);
    const list = [...childrenOf(g)];
    if (last.index < 0 || last.index >= list.length) {
      throw new Error(`updateConditionAt: index out of range at ${k}[${last.index}]`);
    }
    const target = list[last.index];
    if (!target || isGroup(target)) {
      throw new Error(`updateConditionAt: target at ${k}[${last.index}] is not a condition`);
    }
    list[last.index] = { ...target, ...patch };
    return makeGroup(k, list);
  });
}

// Replace a node (group or condition) at `nodePath`
export function replaceNodeAt(
  root: FilterJSON,
  nodePath: NodePath,
  node: FilterNode
): FilterJSON {
  if (!Array.isArray(nodePath) || nodePath.length === 0) {
    throw new Error("replaceNodeAt: nodePath must not be empty");
  }
  const parentPath = nodePath.slice(0, -1) as GroupPath;
  const last = nodePath[nodePath.length - 1];

  return updateGroupAt(root, parentPath, (g) => {
    const k = keyOf(g);
    const list = [...childrenOf(g)];
    if (last.index < 0 || last.index >= list.length) {
      throw new Error(`replaceNodeAt: index out of range at ${k}[${last.index}]`);
    }
    const next = list.slice() as FilterNode[];
    next[last.index] = node;
    return makeGroup(k, next);
  });
}
