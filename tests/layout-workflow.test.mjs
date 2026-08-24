import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
const css = await readFile(new URL("../styles.css", import.meta.url), "utf8");
const app = await readFile(new URL("../app.js", import.meta.url), "utf8");

test("organizes the SAV workflow into input and output columns", () => {
  const leftStart = html.indexOf('class="workflow-column input-workflow"');
  const dataEntry = html.indexOf('class="input-panel surface"');
  const artwork = html.indexOf('class="advanced-config artwork-config"');
  const rightStart = html.indexOf('class="workflow-column output-workflow"');
  const stockOptions = html.indexOf('id="widths-title"');
  const imposition = html.indexOf('id="imposition-title"');

  assert.ok(leftStart >= 0 && leftStart < dataEntry && dataEntry < artwork && artwork < rightStart);
  assert.ok(rightStart < stockOptions && stockOptions < imposition);
  assert.match(css, /grid-template-columns:\s*minmax\(360px, 0\.82fr\) minmax\(520px, 1\.18fr\)/);
  assert.match(css, /@media \(max-width: 980px\)[\s\S]*?\.app-shell\s*\{\s*grid-template-columns: 1fr;/);
});

test("keeps the output workflow visible while desktop users scroll the inputs", () => {
  assert.match(css, /\.output-workflow\s*\{[\s\S]*?position: sticky;[\s\S]*?top: calc\(var\(--sticky-header-height\) \+ 16px\);[\s\S]*?max-height: calc\(100vh - var\(--sticky-header-height\) - 32px\);[\s\S]*?overflow-y: auto;/);
  assert.match(css, /@media \(max-width: 980px\)[\s\S]*?\.output-workflow\s*\{[\s\S]*?position: static;[\s\S]*?max-height: none;[\s\S]*?overflow: visible;/);
});

test("keeps the Vivad header visible while the page scrolls", () => {
  assert.match(css, /\.app-header\s*\{\s*position: sticky;\s*top: 0;\s*z-index: 60;/);
  assert.match(css, /--sticky-header-height: 112px;/);
});

test("places artwork controls behind the same disclosure pattern as Advanced Options", () => {
  assert.match(html, /<details class="advanced-config artwork-config"/);
  assert.match(html, /<span id="artwork-title">Artwork Preview<\/span>/);
  assert.match(html, /id="artwork-config-status" class="advanced-config-status">No artwork/);
  assert.match(html, /class="advanced-config-body artwork-config-body"/);
  assert.match(app, /function renderArtworkConfigStatus\(\)/);
});

test("aligns the compact Reset action with Product search", () => {
  assert.match(html, /<div class="product-search">[\s\S]*?id="product-search"[\s\S]*?id="reset-survey"[\s\S]*?id="product-search-results"/);
  assert.doesNotMatch(html, /class="setup-reset-row"/);
  assert.match(css, /\.product-search\s*\{[\s\S]*?grid-template-columns: minmax\(0, 1fr\) auto;[\s\S]*?align-items: end;/);
  assert.match(css, /\.product-search-results\s*\{[\s\S]*?grid-column: 1 \/ -1;/);
});

test("uses the concise Perforated property label", () => {
  assert.match(app, /id: "perforated", label: "Perforated"/);
  assert.doesNotMatch(app, /label: "Perforated \(One Way Vision\)"/);
});

test("uses the concise Repositionable property label", () => {
  assert.match(app, /id: "repositionable", label: "Repositionable"/);
  assert.doesNotMatch(app, /label: "Repositionable on Install"/);
});

test("uses the Opti-Clear property label", () => {
  assert.match(app, /id: "optically-clear", label: "Opti-Clear"/);
  assert.doesNotMatch(app, /label: "Optically Clear"/);
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

test("places Mounting Surface immediately after the Class controls", () => {
  assert.match(html, /class="class-filter"[\s\S]*?id="class-selector"[\s\S]*?class="mounting-filter"[\s\S]*?id="mounting-surface-selector"/);
});
