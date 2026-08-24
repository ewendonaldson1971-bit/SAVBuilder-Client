import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
const app = await readFile(new URL("../app.js", import.meta.url), "utf8");

test("keeps the data-entry table visible and offers CSV as a secondary action", () => {
  assert.match(html, /id="import-element-csv"[^>]*>Import CSV<\/button>/);
  assert.match(html, /id="element-table-panel" class="element-table-panel"/);
  assert.doesNotMatch(html, /name="element-entry-mode"/);
  assert.doesNotMatch(html, /class="entry-mode"/);
});

test("recalculates after leaving a row and blocks incomplete rows from pricing", () => {
  assert.match(app, /ui\.elementRowsBody\.addEventListener\("input",[\s\S]*?syncJobInputFromElementTable\(\);[\s\S]*?invalidateAuthoritativeQuoteForEdit\(\);\s*\}\);/);
  assert.match(app, /ui\.elementRowsBody\.addEventListener\("focusout",[\s\S]*?nextField\.closest\("tr"\) === field\.closest\("tr"\)[\s\S]*?recalculate\(\);/);
  assert.match(app, /function invalidateAuthoritativeQuoteForEdit\(\) \{[\s\S]*?state\.pricingQuoteRequestId \+= 1;[\s\S]*?state\.authoritativeQuoteReady = false;[\s\S]*?syncCartButtons\(\);[\s\S]*?setImpositionActionButtonsDisabled\(true\);/);
  assert.match(app, /const rowNumber = index \+ 1;/);
  assert.doesNotMatch(app, /if \(!\[quantity, width, height\]\.every\(\(value\) => String\(value \|\| ""\)\.trim\(\)\)\) return;/);
  assert.match(app, /if \(parsed\.errors\.length\) \{[\s\S]*?renderEmptyResults\(\);[\s\S]*?return;/);
  assert.doesNotMatch(app, /const rowNumber = index \+ firstDataRow \+ 1;/);
});

test("pressing Enter in the last Shortname adds a row and focuses its Quantity", () => {
  assert.match(app, /ui\.elementRowsBody\.addEventListener\("keydown",[\s\S]*?event\.key !== "Enter"[\s\S]*?data-element-field='shortname'[\s\S]*?row !== ui\.elementRowsBody\.lastElementChild[\s\S]*?appendElementTableRow\(\);[\s\S]*?data-element-field='quantity'[\s\S]*?\.focus\(\);/);
});

test("imports CSV from a file or pasted text through a focused dialog", () => {
  assert.match(html, /id="element-csv-dialog"/);
  assert.match(html, /id="element-csv-file"[^>]*accept="\.csv,text\/csv,text\/plain"/);
  assert.match(html, /id="job-input"/);
  assert.match(app, /function openElementCsvDialog\(\)/);
  assert.match(app, /ui\.jobInput\.value = await file\.text\(\)/);
  assert.match(app, /function importElementCsvRows\(\)/);
  assert.match(app, /renderElementTableFromText\(\)/);
});

test("offers a clear action that resets the data-entry table", () => {
  assert.match(html, /id="clear-elements"[^>]*>Clear<\/button>/);
  assert.match(app, /ui\.clearElements\.addEventListener\("click", \(\) => \{[\s\S]*?ui\.jobInput\.value = "";[\s\S]*?renderElementTableFromText\(\);[\s\S]*?recalculate\(\);/);
});
