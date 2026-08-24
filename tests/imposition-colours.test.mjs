import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const app = await readFile(new URL("../app.js", import.meta.url), "utf8");

test("restores a distinct client-side colour for each backend imposition row", () => {
  assert.match(app, /const placementColor = getPlacementColor\(placement\)/);
  assert.match(app, /fill="\$\{placementColor\}"/);
  assert.match(app, /function getPlacementColor\(placement\)[\s\S]*?placement\?\.color[\s\S]*?COLORS\[elementIndex % COLORS\.length\]/);
});
