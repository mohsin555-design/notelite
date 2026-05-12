import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import ts from "typescript";

function loadLibraryCardPreview() {
  const sourcePath = new URL("../lib/library-card-preview.ts", import.meta.url);
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

test("library grid cards keep description text when page content exists", () => {
  const { getLibraryCardPreview } = loadLibraryCardPreview();
  const preview = getLibraryCardPreview({
    text: "",
    content: [
      { text: "First line" },
      { text: "Second line" },
    ],
  });

  assert.equal(preview.body, "First line Second line");
  assert.equal(preview.hasDescription, true);
  assert.equal(preview.contentAlignment, "end");
});

test("library grid cards stay balanced without a fake description", () => {
  const { getLibraryCardPreview } = loadLibraryCardPreview();
  const preview = getLibraryCardPreview(undefined);

  assert.equal(preview.body, "");
  assert.equal(preview.hasDescription, false);
  assert.equal(preview.contentAlignment, "between");
});

test("library grid description does not combine line clamp with block display", () => {
  const sourcePath = new URL("../components/LibraryPage.tsx", import.meta.url);
  const source = fs.readFileSync(sourcePath, "utf8");

  assert.equal(source.includes('className="line-clamp-3 block'), false);
});
