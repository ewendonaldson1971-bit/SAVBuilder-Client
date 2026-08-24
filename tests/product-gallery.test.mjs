import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const app = await readFile(new URL("../app.js", import.meta.url), "utf8");
const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
const styles = await readFile(new URL("../styles.css", import.meta.url), "utf8");

test("loads the Strapi multiple-media gallery on SAV catalogue rows", () => {
  assert.match(app, /galleryImages:\s*getStrapiMediaItems\(entry\.galleryImages\)/);
  assert.match(app, /Array\.isArray\(value\?\.data\)/);
  assert.match(app, /media\.formats\?\.thumbnail \|\| media\.formats\?\.small/);
});

test("maps and renders the Strapi general image beneath the general description", () => {
  assert.match(app, /generalImage:\s*getStrapiMediaItems\(entry\.generalImage\)\[0\] \|\| null/);
  assert.match(app, /const generalImage = productRows\.find\(\(row\) => row\.generalImage\?\.url\)\?\.generalImage \|\| null/);
  assert.match(app, /\$\{description \? `<div class="product-description">\$\{formatDescription\(description\)\}<\/div>` : ""\}\s*\$\{imageUrl \? renderImagePreviewShell\(imageUrl\) : ""\}/);
});

test("shows a thumbnail-led gallery control when a product has images", () => {
  assert.match(app, /if \(!count\) return "";/);
  assert.match(app, /class="product-gallery-trigger-media"/);
  assert.match(app, /<strong>View gallery<\/strong>/);
  assert.match(app, /class="product-gallery-trigger-count"/);
  assert.match(app, /data-product-gallery-open="true"/);
  assert.match(app, /\$\{renderProductGeneralInfo\(product\)\}\s*\$\{renderProductGalleryControl\(product\)\}/);
});

test("opens the gallery from the preview product before print mode or laminate is selected", () => {
  assert.match(app, /state\.galleryProduct = selectorState\.product \|\| selectorState\.previewProduct/);
  assert.match(app, /openProductGallery\(state\.galleryProduct\)/);
  assert.doesNotMatch(app, /openProductGallery\(state\.selectedProduct\)/);
});

test("provides an accessible modal gallery with complete navigation", () => {
  assert.match(html, /<dialog id="product-gallery"[^>]+aria-labelledby="product-gallery-title"/);
  assert.match(html, /id="product-gallery-previous"[^>]+aria-label="Previous image"/);
  assert.match(html, /id="product-gallery-next"[^>]+aria-label="Next image"/);
  assert.match(app, /event\.key === "ArrowLeft"/);
  assert.match(app, /event\.key === "ArrowRight"/);
  assert.match(app, /\$\{state\.productGalleryIndex \+ 1\} of \$\{images\.length\}/);
  assert.match(styles, /\.product-gallery-dialog::backdrop/);
});

test("opens guidance image previews in the controlled product gallery", () => {
  assert.match(app, /data-product-image-preview="\$\{escapeHtml\(url\)\}"/);
  assert.match(app, /openProductGallery\(state\.galleryProduct, imagePreview\.dataset\.productImagePreview\)/);
  assert.match(app, /images\.findIndex\(\(image\) => normalizePreviewUrl\(image\.url\) === normalizedInitialUrl\)/);
  assert.doesNotMatch(app, /<a class="og-preview image-preview"[^>]+target="_blank"/);
});

test("selecting every visible class includes blank or unrecognised product classes", () => {
  assert.match(app, /classOptions\.every\(\(option\) => state\.classFilters\.has\(option\.id\)\)\) return true;/);
  assert.match(app, /if \(!state\.classFilters\.size\) return false;/);
});

test("the class selector only renders the individual class controls", () => {
  const classOptions = app.match(/const CLASS_OPTIONS = \[([\s\S]*?)\n  \];/)?.[1] || "";
  assert.doesNotMatch(classOptions, /id: "all"/);
  assert.doesNotMatch(app, /data-class-filter="all"/);
});

test("product search treats no selected classes as all classes", () => {
  assert.match(app, /function matchesProductSearchFilters\(row\) \{[\s\S]*?\(!state\.classFilters\.size \|\| matchesSelectedClassOptions\(row\)\)/);
  assert.match(app, /function getProductSearchResults\(query\)[\s\S]*?if \(!matchesProductSearchFilters\(row\)\) return;/);
  assert.match(app, /getActiveProductSearchSelectionState\(\)[\s\S]*?row\.isCompleteProduct &&[\s\S]*?matchesProductSearchFilters\(row\)/);
});
