import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import ts from "typescript";

function loadPopoverPosition() {
  const sourcePath = new URL("../lib/popover-position.ts", import.meta.url);
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

test("popover opens below when there is enough room", () => {
  const { getAnchoredPopoverPosition } = loadPopoverPosition();
  const position = getAnchoredPopoverPosition(
    { left: 200, right: 260, top: 100, bottom: 132 },
    { width: 140, height: 120, viewportWidth: 1200, viewportHeight: 900 },
  );

  assert.equal(position.top, 140);
  assert.equal(position.left, 120);
});

test("popover flips above when there is not enough room below", () => {
  const { getAnchoredPopoverPosition } = loadPopoverPosition();
  const position = getAnchoredPopoverPosition(
    { left: 900, right: 960, top: 760, bottom: 792 },
    { width: 180, height: 180, viewportWidth: 1200, viewportHeight: 900 },
  );

  assert.equal(position.top, 572);
  assert.equal(position.left, 780);
});
