import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const app = await readFile(new URL("../app.js", import.meta.url), "utf8");

test("loads SAV families without making them a hard dependency", () => {
  assert.match(app, /loadPaginatedStrapiCollection\("\/api\/sav-product-families"/);
  assert.match(app, /"SAV family catalogue"\)\.catch\(\(\) => \[\]\)/);
  assert.match(app, /return \{ options, families \};/);
});

test("normalizes product options and family options into independent datasets", () => {
  assert.match(app, /function normalizeSavCatalog\(catalog\)/);
  assert.match(app, /const optionEntries = \(Array\.isArray\(catalog\?\.options\)[\s\S]*?\.map\(unwrapStrapiEntity\)/);
  assert.match(app, /familyEntries\.push\(\{[\s\S]*?\.\.\.family,[\s\S]*?\.\.\.option,[\s\S]*?rollOptions: option\.rollOptions \|\| \[\]/);
  assert.match(app, /return \{ optionEntries, familyEntries \};/);
  assert.match(app, /rows: buildSelectorRowsFromStrapiEntries\(normalized\.optionEntries\)/);
  assert.match(app, /familyRows: buildSelectorRowsFromStrapiEntries\(normalized\.familyEntries\)/);
  assert.match(app, /postProductSelectorColumns: \[LAMINATE_COLUMN\]/);
  assert.doesNotMatch(app, /linkedOptionIds|legacyEntries/);
});

test("keeps linked option filtering fields authoritative", () => {
  assert.match(app, /\.\.\.family,[\s\S]*?\.\.\.option,/);
  assert.match(app, /Class: String\(entry\.materialClass \|\| ""\)\.trim\(\)/);
  assert.match(app, /Longevity: String\(entry\.longevity \|\| ""\)\.trim\(\)/);
  assert.match(app, /White: toSelectorBoolean\(entry\.white\)/);
  assert.match(app, /savFamilyDocumentId: entry\.familyDocumentId \|\| ""/);
  assert.match(app, /optionName: option\.productName \|\| ""/);
  assert.match(app, /savOptionName: String\(entry\.optionName \|\| ""\)\.trim\(\)/);
  assert.match(app, /function getPreferredStrapiMediaRelation\(optionValue, familyValue\)/);
  assert.match(app, /generalDescription: family\.generalDescription \|\| option\.generalDescription \|\| ""/);
  assert.match(app, /cardDescription: family\.cardDescription \|\| ""/);
});

test("groups family cards without changing the Product Selector catalogue", () => {
  assert.match(app, /function getSavFamilyCardResults\(\)[\s\S]*?state\.familyRows\.forEach/);
  assert.match(app, /const familyId = String\(row\.savFamilyDocumentId \|\| ""\)\.trim\(\)/);
  assert.match(app, /function getProductSearchResults\(query\)[\s\S]*?state\.selectorRows\.forEach/);
  assert.match(app, /function getCandidateSelectorRows\(selections\)[\s\S]*?state\.selectorRows\.filter\(matchesSelectedFilters\)/);
  assert.doesNotMatch(app, /getLegacySelectorRows/);
  assert.match(app, /function getProductSearchOptionCount\(rows\)/);
  assert.match(app, /optionCount === 1 \? "configuration" : "configurations"/);
});

test("keeps family card and configuration descriptions separate", () => {
  assert.match(app, /savFamilyCardDescription: String\(entry\.cardDescription \|\| ""\)\.trim\(\)/);
  assert.match(app, /const cardDescription = String\(row\.savFamilyCardDescription \|\| ""\)\.trim\(\)/);
  assert.match(app, /sav-family-card-description/);
  assert.match(app, /const description = String\(row\[GENERAL_DESCRIPTION_COLUMN\] \|\| ""\)\.trim\(\)/);
  assert.doesNotMatch(app, /sav-family-card-surfaces/);
});

test("shows the resolved SAV option name in the family About section", () => {
  assert.match(app, /const optionRows = getSavFamilyOptionRows\(selectedRows\)/);
  assert.match(app, /const optionName = optionRows\.length === 1[\s\S]*?optionRows\[0\]\.savOptionName/);
  assert.match(app, /family-detail-option-name[\s\S]*?<strong>Option:<\/strong>/);
});

test("uses only explicitly configured family variant types and values", () => {
  assert.match(app, /function resolveSavFamilyVariantSelections\(definitions, option\)/);
  assert.match(app, /candidate\.matchValue[\s\S]*?=== matchValue/);
  assert.match(app, /selections\[definition\.column\] = String\(configuredValue\?\.label \|\| matchValue\)/);
  assert.match(app, /familyVariantColumns: definitions\.map\(\(definition\) => definition\.column\)/);
  assert.match(app, /savFamilyVariantSelections: \{ \.\.\.variantSelections \}/);
  assert.match(app, /variantSelections\[LAMINATE_COLUMN\] \|\| entry\.laminateName/);
  assert.match(app, /postProductSelectorColumns: \[LAMINATE_COLUMN\]/);
  assert.match(app, /function getSavFamilyVariantColumns\(rows\)[\s\S]*?row\.savFamilyVariantColumns/);
  assert.match(app, /function getSavFamilyVariantValue\(row, column\)[\s\S]*?row\?\.savFamilyVariantSelections\?\.\[column\]/);
  assert.match(app, /function getSavFamilyVariantChoices\(rows, column\)/);
  const resolver = app.slice(
    app.indexOf("function resolveSavFamilyVariantSelections"),
    app.indexOf("function buildSelectorRowsFromStrapiEntries")
  );
  assert.doesNotMatch(resolver, /option\?\.laminateName/);
  const columnResolver = app.slice(
    app.indexOf("function getSavFamilyVariantColumns"),
    app.indexOf("function initializeSavFamilySelections")
  );
  assert.doesNotMatch(columnResolver, /CLASS_COLUMN|Object\.keys\(row\)|isLaminateColumnName/);
  assert.match(app, /function applySavFamilyVariant\(column, value\)[\s\S]*?columns\.slice\(changedIndex \+ 1\)[\s\S]*?state\.familyVariantSelections = selections/);
});

test("renders accessible help for configured family variant values", () => {
  assert.match(app, /helpText: String\(value\.helpText \|\| ""\)\.trim\(\)/);
  assert.match(app, /familyVariantHelp: definitions\.flatMap/);
  assert.match(app, /function getSavFamilyVariantHelp\(rows, column, value\)/);
  assert.match(app, /data-family-variant-help aria-label="Help for/);
  assert.match(app, /role="tooltip"/);
  assert.match(app, /aria-expanded="false"/);
  assert.match(app, /event\.key !== "Escape"/);
  assert.match(app, /function closeSavFamilyVariantHelp\(\)/);
});

test("keeps unavailable family variant radio choices visible but disabled", () => {
  assert.match(app, /const values = getSavFamilyVariantChoices\(rows, column\)/);
  assert.match(app, /const available = getSavFamilyRowsForSelections\(availableRows, \{ \[column\]: value \}\)\.length > 0/);
  assert.match(app, /available \? "" : " disabled"/);
  assert.match(app, /available \? "" : " disabled"}?>/);
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
