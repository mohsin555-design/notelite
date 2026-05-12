import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import ts from "typescript";

function loadWorkspaceTree() {
  const sourcePath = new URL("../lib/workspace-tree.ts", import.meta.url);
  const source = fs.readFileSync(sourcePath, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
  }).outputText;
  const module = { exports: {} };
  const fn = new Function("exports", "module", output);
  fn(module.exports, module);
  return module.exports;
}

test("folder children stay in workspace order and exclude unrelated pages", () => {
  const { getFolderChildren } = loadWorkspaceTree();
  const pages = [
    { id: "canvas-a", title: "Canvas plan", type: "page", parentId: "folder-a", canvas: { elements: [] } },
    { id: "folder-a", title: "Projects", type: "folder", parentId: null },
    { id: "page-a", title: "Brief", type: "page", parentId: "folder-a", canvas: { elements: [] } },
    { id: "page-b", title: "Outside", type: "page", parentId: null, canvas: { elements: [] } },
    { id: "folder-b", title: "Nested", type: "folder", parentId: "folder-a" },
  ];

  assert.deepEqual(
    getFolderChildren(pages, "folder-a").map((page) => page.id),
    ["canvas-a", "page-a", "folder-b"],
  );
});

test("canvas pages are detected from canvas data or canvas titles", () => {
  const { getWorkspaceItemKind } = loadWorkspaceTree();

  assert.equal(
    getWorkspaceItemKind({ type: "folder", title: "Folder", canvas: { elements: [] } }),
    "folder",
  );
  assert.equal(
    getWorkspaceItemKind({ type: "page", title: "Sketch", canvas: { elements: [{ id: "one" }] } }),
    "canvas",
  );
  assert.equal(
    getWorkspaceItemKind({ type: "page", title: "Team canvas", canvas: { elements: [] } }),
    "canvas",
  );
  assert.equal(
    getWorkspaceItemKind({ type: "page", title: "Notes", canvas: { elements: [] } }),
    "page",
  );
});

test("page breadcrumbs return ancestors from root to direct parent", () => {
  const { getPageBreadcrumbs } = loadWorkspaceTree();
  const pages = [
    { id: "root", title: "Workspace", type: "folder", parentId: null, canvas: { elements: [] } },
    { id: "project", title: "Project", type: "folder", parentId: "root", canvas: { elements: [] } },
    { id: "brief", title: "Brief", type: "page", parentId: "project", canvas: { elements: [] } },
    { id: "outside", title: "Outside", type: "page", parentId: null, canvas: { elements: [] } },
  ];

  assert.deepEqual(
    getPageBreadcrumbs(pages, pages[2]).map((page) => page.id),
    ["root", "project"],
  );
});

test("page breadcrumbs stop when parent links are missing or circular", () => {
  const { getPageBreadcrumbs } = loadWorkspaceTree();
  const pages = [
    { id: "loop-a", title: "Loop A", type: "folder", parentId: "loop-b", canvas: { elements: [] } },
    { id: "loop-b", title: "Loop B", type: "folder", parentId: "loop-a", canvas: { elements: [] } },
    { id: "lost", title: "Lost", type: "page", parentId: "missing", canvas: { elements: [] } },
  ];

  assert.deepEqual(
    getPageBreadcrumbs(pages, pages[0]).map((page) => page.id),
    ["loop-b"],
  );
  assert.deepEqual(getPageBreadcrumbs(pages, pages[2]), []);
});
