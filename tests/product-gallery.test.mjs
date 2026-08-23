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

test("only shows a compact gallery control when a product has images", () => {
  assert.match(app, /if \(!count\) return "";/);
  assert.match(app, /View photos \(\$\{count\}\)/);
  assert.match(app, /data-product-gallery-open="true"/);
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
  assert.match(app, /openProductGallery\(state\.selectedProduct, imagePreview\.dataset\.productImagePreview\)/);
  assert.match(app, /images\.findIndex\(\(image\) => normalizePreviewUrl\(image\.url\) === normalizedInitialUrl\)/);
  assert.doesNotMatch(app, /<a class="og-preview image-preview"[^>]+target="_blank"/);
});
