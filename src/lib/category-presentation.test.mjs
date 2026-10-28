import test from "node:test";
import assert from "node:assert/strict";
import { CATEGORIES } from "./sample-data.ts";
import { getStorefrontCategoryCountLabel, getStorefrontCategoryImage, mergeStorefrontCategories } from "./category-presentation.ts";

test("database category images take precedence over sample imagery", () => {
  const databaseImage = "https://images.unsplash.com/database-category.jpg";
  assert.equal(getStorefrontCategoryImage(databaseImage, "sarees", CATEGORIES), databaseImage);
});

test("categories with missing images use their existing sample-data image", () => {
  for (const category of CATEGORIES) {
    assert.equal(getStorefrontCategoryImage(null, category.slug, CATEGORIES), category.image);
  }
});

test("unknown categories without an image keep the designed placeholder", () => {
  assert.equal(getStorefrontCategoryImage(null, "unlisted-category", CATEGORIES), null);
});

test("database categories are retained and missing existing categories are supplied", () => {
  const fallbackCategories = CATEGORIES.map((category, orderIndex) => ({ ...category, orderIndex }));
  const databaseSarees = { ...fallbackCategories[0], id: "database-sarees", description: "Database description", orderIndex: 4 };
  const categories = mergeStorefrontCategories([databaseSarees], fallbackCategories);

  assert.equal(categories.length, CATEGORIES.length);
  assert.equal(categories[0].id, "database-sarees");
  assert.equal(categories[0].description, "Database description");
  assert.deepEqual(categories.slice(1).map(({ slug }) => slug), CATEGORIES.slice(1).map(({ slug }) => slug));
});

test("all sample categories are available when the database is unavailable", () => {
  const fallbackCategories = CATEGORIES.map((category, orderIndex) => ({ ...category, orderIndex }));
  assert.deepEqual(mergeStorefrontCategories([], fallbackCategories), fallbackCategories);
});

test("missing category counts stay unavailable while actual zero counts remain accurate", () => {
  assert.equal(getStorefrontCategoryCountLabel(null, "kurtas"), "Catalog count unavailable");
  assert.equal(getStorefrontCategoryCountLabel({ sarees: 0 }, "sarees"), "0 Handcrafted Items");
  assert.equal(getStorefrontCategoryCountLabel({ sarees: 3 }, "kurtas"), "Catalog count unavailable");
});
