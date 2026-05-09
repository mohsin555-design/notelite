import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import ts from "typescript";

function loadFolderUtils() {
  const sourcePath = new URL("../lib/folder-utils.ts", import.meta.url);
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

test("folder creation uses Untitled and neutral defaults", () => {
  const { DEFAULT_FOLDER_COLOR, DEFAULT_FOLDER_NAME } = loadFolderUtils();

  assert.equal(DEFAULT_FOLDER_NAME, "Untitled");
  assert.equal(DEFAULT_FOLDER_COLOR, "neutral");
});

test("folder icon variant follows whether a folder has children", () => {
  const { getFolderIconVariant } = loadFolderUtils();

  assert.equal(getFolderIconVariant(0), "empty");
  assert.equal(getFolderIconVariant(2), "filled");
});

test("folder colors resolve to fill hex values", () => {
  const { getFolderFillColor } = loadFolderUtils();

  assert.equal(getFolderFillColor("neutral"), "#B2B2B2");
  assert.equal(getFolderFillColor("green"), "#14AE5C");
  assert.equal(getFolderFillColor("red"), "#EC221F");
  assert.equal(getFolderFillColor("amber"), "#E8B931");
  assert.equal(getFolderFillColor("purple"), "#9F31E8");
  assert.equal(getFolderFillColor("pink"), "#FF31AD");
  assert.equal(getFolderFillColor("blue"), "#319CE8");
  assert.equal(getFolderFillColor("orange"), "#FC8B3A");
  assert.equal(getFolderFillColor(undefined), "#B2B2B2");
});

test("folder color options include all Figma small-folder colors", () => {
  const { folderColorOptions } = loadFolderUtils();

  assert.deepEqual(
    folderColorOptions.map((option) => option.value),
    ["neutral", "amber", "green", "red", "purple", "pink", "blue", "orange"],
  );
});
