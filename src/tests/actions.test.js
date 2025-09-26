import { describe, it, expect } from "vitest";
import { addConditionAt, addGroupAt, toggleGroupKeyAt, removeAt, } from "../action";
// --- helpers to narrow the union cleanly ---
function isGroup(n) {
    return !!n && typeof n === "object" && ("and" in n || "or" in n);
}
function groupKey(g) {
    return "and" in g ? "and" : "or";
}
function childrenOfRoot(root) {
    return "and" in root ? root.and : root.or;
}
function childrenOfGroup(g) {
    return "and" in g ? g.and : g.or;
}
describe("actions", () => {
    it("adds a condition at root and toggles group key", () => {
        let root = { and: [] };
        root = addConditionAt(root, [], { field: "age", operator: "gt", value: 30 });
        const kids1 = childrenOfRoot(root);
        expect(kids1.length).toBe(1);
        expect(isGroup(kids1[0])).toBe(false);
        // toggle root AND -> OR
        root = toggleGroupKeyAt(root, []);
        expect(groupKey(root)).toBe("or");
    });
    it("adds a nested OR group, inserts a condition in it, then removes it", () => {
        let root = { and: [] };
        // add OR group at root => root.and[0]
        root = addGroupAt(root, [], "or");
        let rootKids = childrenOfRoot(root);
        expect(rootKids.length).toBe(1);
        expect(isGroup(rootKids[0])).toBe(true);
        const firstGroup = rootKids[0];
        expect(groupKey(firstGroup)).toBe("or");
        // add a condition inside that OR group
        const pathToFirstGroup = [{ key: groupKey(root), index: 0 }];
        root = addConditionAt(root, pathToFirstGroup, {
            field: "age",
            operator: "gt",
            value: 1,
        });
        // verify it landed
        rootKids = childrenOfRoot(root);
        const innerKids = childrenOfGroup(rootKids[0]);
        expect(innerKids.length).toBe(1);
        expect(isGroup(innerKids[0])).toBe(false);
        // remove the OR group from root
        root = removeAt(root, [{ key: groupKey(root), index: 0 }]);
        expect(childrenOfRoot(root).length).toBe(0);
    });
});
//# sourceMappingURL=actions.test.js.map