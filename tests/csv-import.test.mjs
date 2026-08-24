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
