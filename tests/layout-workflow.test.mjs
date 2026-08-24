import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
const css = await readFile(new URL("../styles.css", import.meta.url), "utf8");
const app = await readFile(new URL("../app.js", import.meta.url), "utf8");

test("organizes the SAV workflow into input and output columns", () => {
  const leftStart = html.indexOf('class="workflow-column input-workflow"');
  const dataEntry = html.indexOf('class="input-panel surface"');
  const artwork = html.indexOf('class="artwork-panel surface"');
  const rightStart = html.indexOf('class="workflow-column output-workflow"');
  const stockOptions = html.indexOf('id="widths-title"');
  const imposition = html.indexOf('id="imposition-title"');

  assert.ok(leftStart >= 0 && leftStart < dataEntry && dataEntry < artwork && artwork < rightStart);
  assert.ok(rightStart < stockOptions && stockOptions < imposition);
  assert.match(css, /grid-template-columns:\s*minmax\(360px, 0\.82fr\) minmax\(520px, 1\.18fr\)/);
  assert.match(css, /@media \(max-width: 980px\)[\s\S]*?\.app-shell\s*\{\s*grid-template-columns: 1fr;/);
});

test("keeps the output workflow visible while desktop users scroll the inputs", () => {
  assert.match(css, /\.output-workflow\s*\{[\s\S]*?position: sticky;[\s\S]*?top: 16px;[\s\S]*?max-height: calc\(100vh - 32px\);[\s\S]*?overflow-y: auto;/);
  assert.match(css, /@media \(max-width: 980px\)[\s\S]*?\.output-workflow\s*\{[\s\S]*?position: static;[\s\S]*?max-height: none;[\s\S]*?overflow: visible;/);
});

test("starts and resets with every class filter unselected", () => {
  assert.match(app, /classFilters: new Set\(\)/);
  assert.equal((app.match(/state\.classFilters = new Set\(\);/g) || []).length, 2);
});

test("treats the initial empty class selection as neutral guidance", () => {
  assert.match(app, /title = "Choose a class"/);
  assert.match(app, /Choose a class to see matching SAV products\./);
  assert.match(app, /survey-empty\$\{awaitingClassSelection \? " neutral" : ""\}/);
  assert.match(css, /\.survey-empty\.neutral\s*\{/);
  assert.match(css, /\.survey-empty:not\(\.neutral\)/);
});
