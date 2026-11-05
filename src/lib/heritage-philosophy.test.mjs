import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_HERITAGE_PHILOSOPHY } from "./heritage-philosophy.ts";

test("DEFAULT_HERITAGE_PHILOSOPHY provides all required section fields", () => {
  assert.equal(typeof DEFAULT_HERITAGE_PHILOSOPHY.imageUrl, "string");
  assert.ok(DEFAULT_HERITAGE_PHILOSOPHY.imageUrl.length > 0);
  assert.equal(typeof DEFAULT_HERITAGE_PHILOSOPHY.imageAlt, "string");
  assert.ok(DEFAULT_HERITAGE_PHILOSOPHY.imageAlt.length > 0);
  assert.equal(typeof DEFAULT_HERITAGE_PHILOSOPHY.eyebrow, "string");
  assert.ok(DEFAULT_HERITAGE_PHILOSOPHY.eyebrow.length > 0);
  assert.equal(typeof DEFAULT_HERITAGE_PHILOSOPHY.heading, "string");
  assert.ok(DEFAULT_HERITAGE_PHILOSOPHY.heading.includes("\n"));
  assert.equal(typeof DEFAULT_HERITAGE_PHILOSOPHY.paragraph1, "string");
  assert.equal(typeof DEFAULT_HERITAGE_PHILOSOPHY.paragraph2, "string");
  assert.equal(typeof DEFAULT_HERITAGE_PHILOSOPHY.highlightQuote, "string");
  assert.equal(typeof DEFAULT_HERITAGE_PHILOSOPHY.paragraph3, "string");
  assert.equal(DEFAULT_HERITAGE_PHILOSOPHY.value1Title, "Indian Soul");
  assert.equal(DEFAULT_HERITAGE_PHILOSOPHY.value1Subtitle, "Living Roots");
  assert.equal(DEFAULT_HERITAGE_PHILOSOPHY.value2Title, "Global Luxury");
  assert.equal(DEFAULT_HERITAGE_PHILOSOPHY.value2Subtitle, "Zero Compromise");
  assert.equal(DEFAULT_HERITAGE_PHILOSOPHY.value3Title, "Timeless");
  assert.equal(DEFAULT_HERITAGE_PHILOSOPHY.value3Subtitle, "Family Heirlooms");
  assert.equal(DEFAULT_HERITAGE_PHILOSOPHY.cardTitle, "Sacred Craft Lineage");
  assert.equal(DEFAULT_HERITAGE_PHILOSOPHY.memoirLinkUrl, "/about");
});

