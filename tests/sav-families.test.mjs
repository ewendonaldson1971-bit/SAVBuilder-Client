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
  assert.match(app, /familyEntries\.push\(\{[\s\S]*?\.\.\.family,[\s\S]*?\.\.\.option,[\s\S]*?rollOptions: option\.rollOptions \|\| \[\]/);
  assert.match(app, /const legacyEntries = options[\s\S]*?!linkedOptionIds\.has\(optionId\)/);
  assert.match(app, /entries: \[\.\.\.familyEntries, \.\.\.legacyEntries\]/);
});

test("keeps linked option filtering fields authoritative", () => {
  assert.match(app, /\.\.\.family,[\s\S]*?\.\.\.option,/);
  assert.match(app, /Class: String\(entry\.materialClass \|\| ""\)\.trim\(\)/);
  assert.match(app, /Longevity: String\(entry\.longevity \|\| ""\)\.trim\(\)/);
  assert.match(app, /White: toSelectorBoolean\(entry\.white\)/);
  assert.match(app, /savFamilyDocumentId: entry\.familyDocumentId \|\| ""/);
  assert.match(app, /function getPreferredStrapiMediaRelation\(optionValue, familyValue\)/);
  assert.match(app, /generalDescription: option\.generalDescription \|\| family\.generalDescription \|\| ""/);
});

test("groups family search results while retaining all matching options", () => {
  assert.match(app, /const familyId = String\(row\.savFamilyDocumentId \|\| ""\)\.trim\(\)/);
  assert.match(app, /if \(familyId\) return `family:\$\{familyId\}`/);
  assert.match(app, /function getProductSearchOptionCount\(rows\)/);
  assert.match(app, /familyOptionCount === 1 \? "option" : "options"/);
});

test("uses family variant labels while retaining laminate compatibility", () => {
  assert.match(app, /function resolveSavFamilyVariantSelections\(definitions, option\)/);
  assert.match(app, /candidate\.matchValue[\s\S]*?=== matchValue/);
  assert.match(app, /selections\[definition\.column\] = String\(configuredValue\?\.label \|\| matchValue\)/);
  assert.match(app, /variantSelections\[LAMINATE_COLUMN\] \|\| entry\.laminateName/);
  assert.match(app, /postProductSelectorColumns: normalized\.postProductSelectorColumns/);
});

test("namespaces family variants so they cannot collide with filters or option metadata", () => {
  assert.match(app, /const SAV_FAMILY_VARIANT_COLUMN_PREFIX = "SAV Family Variant: "/);
  assert.match(app, /column: getSavFamilyVariantColumnName\(definition\.name\)/);
  assert.match(app, /function isSavFamilyVariantColumnName\(column\)/);
  assert.match(app, /getDisplaySelectorColumn\(column\)[\s\S]*?SAV_FAMILY_VARIANT_COLUMN_PREFIX\.length/);
  assert.match(app, /state\.postProductSelectorColumns\.filter\(isSavFamilyVariantColumnName\)/);
});

test("keeps option print modes, roll QCodes and document identity authoritative", () => {
  assert.match(app, /documentId: option\.documentId \|\| option\.id \|\| ""/);
  assert.match(app, /availablePrintModes: option\.availablePrintModes \|\| \{\}/);
  assert.match(app, /rollOptions: option\.rollOptions \|\| \[\]/);
  assert.match(app, /savDocumentId: entry\.documentId \|\| ""/);
});
