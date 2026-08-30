import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const app = await readFile(new URL("../app.js", import.meta.url), "utf8");

test("loads SAV families without making them a hard dependency", () => {
  assert.match(app, /loadPaginatedStrapiCollection\("\/api\/sav-product-families"/);
  assert.match(app, /"SAV family catalogue"\)\.catch\(\(\) => \[\]\)/);
  assert.match(app, /return \{ options, families \};/);
});

test("normalizes linked family options and preserves unlinked flat options", () => {
  assert.match(app, /function normalizeSavCatalog\(catalog\)/);
  assert.match(app, /const linkedOptionIds = new Set\(\)/);
  assert.match(app, /familyEntries\.push\(\{[\s\S]*?\.\.\.option,[\s\S]*?\.\.\.family,[\s\S]*?rollOptions: option\.rollOptions \|\| \[\]/);
  assert.match(app, /const legacyEntries = options[\s\S]*?!linkedOptionIds\.has\(optionId\)/);
  assert.match(app, /entries: \[\.\.\.familyEntries, \.\.\.legacyEntries\]/);
});

test("uses family variant labels while retaining laminate compatibility", () => {
  assert.match(app, /function resolveSavFamilyVariantSelections\(definitions, option\)/);
  assert.match(app, /candidate\.matchValue[\s\S]*?=== matchValue/);
  assert.match(app, /selections\[definition\.name\] = String\(configuredValue\?\.label \|\| matchValue\)/);
  assert.match(app, /variantSelections\[LAMINATE_COLUMN\] \|\| entry\.laminateName/);
  assert.match(app, /postProductSelectorColumns: normalized\.postProductSelectorColumns/);
});

test("keeps option print modes, roll QCodes and document identity authoritative", () => {
  assert.match(app, /documentId: option\.documentId \|\| option\.id \|\| ""/);
  assert.match(app, /availablePrintModes: option\.availablePrintModes \|\| \{\}/);
  assert.match(app, /rollOptions: option\.rollOptions \|\| \[\]/);
  assert.match(app, /savDocumentId: entry\.documentId \|\| ""/);
});
