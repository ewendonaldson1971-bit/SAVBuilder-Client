import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const app = await readFile(new URL("../app.js", import.meta.url), "utf8");

test("submits SAV cart lines through the Pricing Engine", () => {
  assert.match(app, /\/api\/v1\/cart\/sav-builder\/lines/);
  assert.match(app, /Authorization.*Bearer.*pricingApiToken/);
  assert.match(app, /JSON\.stringify\(requestBody\)/);
  assert.match(app, /requestBody\.lineIndexes = requestedIndexes/);
});

test("does not build legacy parameterized shopping-cart URLs", () => {
  assert.doesNotMatch(app, /shopping-cart\?/);
  assert.doesNotMatch(app, /function buildCartUrl/);
});

test("waits for an authoritative quote before enabling cart buttons", () => {
  assert.match(app, /state\.authoritativeQuoteReady/);
  assert.match(app, /function canSubmitCart/);
  assert.match(app, /data-cart-line-index/);
});
