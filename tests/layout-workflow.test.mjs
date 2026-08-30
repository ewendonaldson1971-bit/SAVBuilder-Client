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
  assert.match(css, /\.limit-selector\s*\{[\s\S]*?grid-template-columns: repeat\(auto-fit, minmax\(112px, 1fr\)\);/);
});

test("uses the Optically Clear property label", () => {
  assert.match(app, /id: "optically-clear", label: "Optically Clear"/);
  assert.doesNotMatch(app, /label: "Opti-Clear"/);
});

test("starts and resets with every class filter unselected", () => {
  assert.match(app, /classFilters: new Set\(\)/);
  assert.equal((app.match(/state\.classFilters = new Set\(\);/g) || []).length, 2);
});

test("places the first-step class controls beside their instruction", () => {
  assert.match(html, /id="class-step"[\s\S]*?Start here[\s\S]*?Choose a product class[\s\S]*?id="class-selector"/);
  assert.ok(html.indexOf('id="class-step"') < html.indexOf('class="product-search"'));
  assert.match(app, /target === "class"/);
  assert.match(app, /label: "Class"[\s\S]*?target: "class"[\s\S]*?label: "Product"/);
  assert.match(css, /\.class-step\.is-active\s*\{[\s\S]*?border-color: #348ede;[\s\S]*?box-shadow:/);
});

test("shows SAV family cards independently before the Advanced Selector", () => {
  const familySelectionStart = app.indexOf("function applySavFamilySelection(resultIndex)");
  const familySelectionEnd = app.indexOf("function applyProductResultSelection(result)", familySelectionStart);
  const familySelectionBody = app.slice(familySelectionStart, familySelectionEnd);
  assert.match(html, /id="sav-family-panel"[\s\S]*?Choose a product family[\s\S]*?id="sav-family-cards"/);
  assert.ok(html.indexOf('id="sav-family-panel"') < html.indexOf('<h2 id="setup-title">Advanced Selector</h2>'));
  assert.match(html, /Browse SAV product families independently from the Advanced Selector\.[\s\S]*?Advanced Selector/);
  assert.doesNotMatch(html, /id="product-finder"|Legacy catalogue|Browse products not yet in a family/);
  assert.match(app, /function getSavFamilyCardResults\(\)/);
  assert.match(familySelectionBody, /state\.selectedFamilyId = familyId;[\s\S]*?state\.familyDetailOpen = true;[\s\S]*?initializeSavFamilySelections\(result\.rows\);[\s\S]*?recalculate\(\);/);
  assert.doesNotMatch(familySelectionBody, /applyProductResultSelection|selectorSelections|productSearchSelection/);
  assert.doesNotMatch(app, /ui\.productFinder|getLegacySelectorRows/);
  assert.match(css, /\.sav-family-cards\s*\{[\s\S]*?grid-template-columns: repeat\(2, minmax\(0, 1fr\)\);/);
});

test("opens a Sheet Builder-style family detail screen with radio variants", () => {
  assert.match(html, /id="sav-family-detail" class="sav-family-detail"[\s\S]*?id="setup-title">Advanced Selector/);
  assert.match(app, /function renderSavFamilyDetail\(selectorState\)/);
  assert.match(app, /data-family-back[\s\S]*?Configure your SAV[\s\S]*?01 · OPTIONS/);
  assert.match(app, /class="family-radio-list" role="radiogroup"/);
  assert.match(app, /type="radio"[\s\S]*?data-family-variant/);
  assert.match(app, /if \(state\.familyDetailOpen\) return getSavFamilySelectorState\(\);/);
  assert.match(app, /if \(ui\.setupPanel\) ui\.setupPanel\.hidden = state\.familyDetailOpen;/);
  assert.match(css, /\.family-detail-grid\s*\{[\s\S]*?grid-template-columns: minmax\(300px, 0\.92fr\) minmax\(420px, 1\.08fr\);/);
});

test("provides a discreet Strapi shortcut at the right of the header", () => {
  const imposition = html.indexOf('class="imposition-actions"');
  const strapi = html.indexOf('class="strapi-admin-link"');
  assert.ok(imposition >= 0 && strapi > imposition);
  assert.match(html, /class="strapi-admin-link"[\s\S]*?href="https:\/\/strapi\.vivad\.com\.au\/admin\/content-manager\/collection-types\/api::sav-builder-option\.sav-builder-option\?pageSize=10"[\s\S]*?target="_blank"[\s\S]*?aria-label="Open SAV Builder products in Strapi"/);
  assert.match(css, /\.strapi-admin-link\s*\{[\s\S]*?flex: 0 0 32px;[\s\S]*?opacity: 0\.66;/);
});

test("hides secondary configuration and result stages on initial load", () => {
  assert.match(html, /<details class="filters-panel"[^>]*hidden>/);
  assert.match(html, /id="advanced-options-config" hidden>/);
  assert.match(html, /id="artwork-config"[^>]*hidden>/);
  assert.match(html, /class="workflow-column output-workflow"[^>]*hidden>/);
  assert.match(app, /function updateProgressiveVisibility\(selectorState, elements = \[\], errors = \[\]\)/);
  assert.match(app, /const showJobResults = hasSelectedProduct && hasValidElements;/);
  assert.match(css, /\.app-shell\.is-input-only\s*\{[\s\S]*?grid-template-columns: minmax\(360px, 760px\);/);
});

test("does not duplicate initial class guidance away from its controls", () => {
  assert.match(app, /!state\.classFilters\.size && !state\.productSearchQuery\.trim\(\) && !state\.productSearchSelection[\s\S]*?ui\.configuratorGuidance\.hidden = true;/);
  assert.match(app, /function renderSelectorEmptyState\(selectorState\) \{\s*if \(!state\.classFilters\.size\) return "";/);
  assert.doesNotMatch(app, /Choose a class to see matching SAV products\./);
  assert.doesNotMatch(css, /\.survey-empty\.neutral/);
});

test("keeps optional filters in a collapsed disclosure between class and search", () => {
  assert.match(html, /<details class="filters-panel"[\s\S]*?Additional filters[\s\S]*?class="brand-filter"[\s\S]*?id="brand-selector"[\s\S]*?class="mounting-filter"[\s\S]*?id="mounting-surface-selector"[\s\S]*?<\/details>/);
  assert.ok(html.indexOf('id="class-step"') < html.indexOf('class="filters-panel"'));
  assert.ok(html.indexOf('class="filters-panel"') < html.indexOf('class="product-search"'));
  assert.doesNotMatch(html, /class="filters-panel"[\s\S]*?class="class-filter"/);
});

test("renders laminate choices as a vertical radio group", () => {
  assert.match(app, /class="laminate-radio-list" role="radiogroup" aria-label="Laminate"/);
  assert.match(app, /function renderLaminateRadioOption\([\s\S]*?type="radio" name="product-laminate"/);
  assert.doesNotMatch(app, /renderProductOptionButton\(LAMINATE_COLUMN, choice, selectedLaminate\)/);
  assert.match(css, /\.laminate-radio-list\s*\{[\s\S]*?display: grid;[\s\S]*?gap: 8px;/);
  assert.match(css, /\.laminate-radio-option input\s*\{[\s\S]*?accent-color: var\(--vivad-blue\);/);
});

test("renders print options as a vertical radio group", () => {
  assert.match(app, /class="print-mode-radio-list" role="radiogroup" aria-label="Print Options"/);
  assert.match(app, /function renderPrintModeRadioOption\([\s\S]*?type="radio" name="product-print-mode"/);
  assert.doesNotMatch(app, /renderProductOptionButton\(PRINT_MODE_COLUMN/);
  assert.match(css, /\.print-mode-radio-list,[\s\S]*?\.laminate-radio-list\s*\{[\s\S]*?display: grid;[\s\S]*?gap: 8px;/);
  assert.match(css, /\.print-mode-radio-option input,[\s\S]*?\.laminate-radio-option input\s*\{[\s\S]*?accent-color: var\(--vivad-blue\);/);
  assert.match(app, /ui\.selectorSurvey\.addEventListener\("change",[\s\S]*?input\[type="radio"\][\s\S]*?applySelectorChoice\(choice\)/);
});

test("lets users select an authoritative stock option by row", () => {
  assert.match(app, /selectedStockQcode: ""/);
  assert.match(app, /selectedQcode: state\.selectedStockQcode \|\| undefined/);
  assert.match(app, /data-stock-qcode="\$\{escapeHtml\(qcode\)\}" tabindex="0" aria-selected=/);
  assert.match(app, /ui\.optionsBody\.addEventListener\("click", handleStockOptionClick\)/);
  assert.match(app, /ui\.optionsBody\.addEventListener\("keydown", handleStockOptionKeydown\)/);
  assert.match(app, /const qcode = String\(quote\?\.source\?\.qcode \|\| ""\)\.trim\(\)/);
  assert.match(app, /state\.currentBest = best;[\s\S]*?renderResults\(best, ranked, elements\)/);
  assert.match(app, /renderOptions\(options, best\);[\s\S]*?renderPricing\(best, elements\);[\s\S]*?renderImposition\(best\);/);
  assert.match(css, /\.stock-option-row\s*\{[\s\S]*?cursor: pointer;/);
});

test("matches the Mounting Surface control shape to the Brand control", () => {
  assert.match(css, /\.brand-dropdown-trigger,[\s\S]*?min-height: 52px;[\s\S]*?padding: 7px 12px;[\s\S]*?border-radius: 7px;/);
  assert.match(css, /\.mounting-surface-select\s*\{[\s\S]*?min-height: 52px;[\s\S]*?padding: 7px 12px;[\s\S]*?border-radius: 7px;/);
});

test("shows the default brand once as All brands", () => {
  assert.match(app, /currentIsAllBrands \? "" : `<span class="brand-option-media">/);
  assert.match(app, /currentIsAllBrands \? "All brands" : current\.label/);
  assert.doesNotMatch(css, /\.brand-all-mark/);
});

test("keeps compact dimensions and Add row on the same desktop line", () => {
  assert.match(css, /\.element-table-panel\s*\{[\s\S]*?grid-template-columns: minmax\(0, 1fr\) auto;[\s\S]*?align-items: end;/);
  assert.match(css, /\.element-entry-table th:nth-child\(1\),[\s\S]*?width: 84px;/);
  assert.match(css, /\.element-entry-table th:nth-child\(2\),[\s\S]*?\.element-entry-table td:nth-child\(3\)\s*\{\s*width: 110px;/);
  assert.match(css, /\.element-table-panel \.table-actions\s*\{[\s\S]*?align-self: end;/);
});
