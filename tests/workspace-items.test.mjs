import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import ts from "typescript";

function loadWorkspaceItems() {
  const sourcePath = new URL("../lib/workspace-items.ts", import.meta.url);
  const source = fs.readFileSync(sourcePath, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
      baseUrl: process.cwd(),
      paths: {
        "@/*": ["./*"],
      },
    },
  }).outputText;
  const module = { exports: {} };
  const localRequire = (specifier) => {
    if (specifier === "@/lib/workspace-tree") {
      const treeSource = fs.readFileSync(new URL("../lib/workspace-tree.ts", import.meta.url), "utf8");
      const treeOutput = ts.transpileModule(treeSource, {
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          target: ts.ScriptTarget.ES2020,
          esModuleInterop: true,
        },
      }).outputText;
      const treeModule = { exports: {} };
      const treeFn = new Function("exports", "module", treeOutput);
      treeFn(treeModule.exports, treeModule);
      return treeModule.exports;
    }

    throw new Error(`Unsupported import: ${specifier}`);
  };
  const fn = new Function("exports", "module", "require", output);
  fn(module.exports, module, localRequire);
  return module.exports;
}

test("recent sort prefers newer created dates", () => {
  const { sortWorkspaceItems } = loadWorkspaceItems();
  const items = [
    { id: "one", title: "Alpha", type: "page", parentId: null, createdAt: "2026-05-01T10:00:00.000Z", canvas: { elements: [] } },
    { id: "two", title: "Beta", type: "page", parentId: null, createdAt: "2026-05-03T10:00:00.000Z", canvas: { elements: [] } },
  ];

  assert.deepEqual(sortWorkspaceItems(items, "recent").map((item) => item.id), ["two", "one"]);
});

test("kind sort keeps folders first, then pages, then canvases", () => {
  const { sortWorkspaceItems } = loadWorkspaceItems();
  const items = [
    { id: "canvas", title: "Canvas", type: "page", parentId: null, createdAt: "2026-05-01T10:00:00.000Z", canvas: { elements: [{ id: "x" }] } },
    { id: "page", title: "Brief", type: "page", parentId: null, createdAt: "2026-05-01T10:00:00.000Z", canvas: { elements: [] } },
    { id: "folder", title: "Projects", type: "folder", parentId: null, createdAt: "2026-05-01T10:00:00.000Z", canvas: { elements: [] } },
  ];

  assert.deepEqual(sortWorkspaceItems(items, "kind").map((item) => item.id), ["folder", "page", "canvas"]);
});

test("folder targets exclude the active folder and its descendants", () => {
  const { getFolderTargets } = loadWorkspaceItems();
  const pages = [
    { id: "root-a", title: "Alpha", type: "folder", parentId: null, createdAt: "2026-05-01T10:00:00.000Z", canvas: { elements: [] } },
    { id: "child-a", title: "Child", type: "folder", parentId: "root-a", createdAt: "2026-05-01T10:00:00.000Z", canvas: { elements: [] } },
    { id: "root-b", title: "Beta", type: "folder", parentId: null, createdAt: "2026-05-01T10:00:00.000Z", canvas: { elements: [] } },
  ];

  assert.deepEqual(
    getFolderTargets(pages, { id: "root-a", type: "folder" }).map((target) => target.id),
    [null, "root-b"],
  );
});
