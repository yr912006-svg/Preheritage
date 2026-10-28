import test from "node:test";
import assert from "node:assert/strict";
import { productImageExtension, validateProductImage } from "./product-image.ts";

test("image upload validation accepts JPEG, PNG and WebP signatures", () => {
  assert.equal(validateProductImage("image/jpeg", 3, new Uint8Array([0xff, 0xd8, 0xff])), null);
  assert.equal(validateProductImage("image/png", 8, new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])), null);
  assert.equal(validateProductImage("image/webp", 12, new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50])), null);
});

test("image upload validation rejects wrong MIME types, empty/oversized files and spoofed bytes", () => {
  assert.match(validateProductImage("image/gif", 10, new Uint8Array(10)), /JPEG, PNG, or WebP/);
  assert.match(validateProductImage("image/jpeg", 0, new Uint8Array()), /larger than 0/);
  assert.match(validateProductImage("image/jpeg", 10 * 1024 * 1024 + 1, new Uint8Array([0xff, 0xd8, 0xff])), /10 MB/);
  assert.match(validateProductImage("image/png", 8, new Uint8Array(8)), /valid JPEG, PNG, or WebP/);
  assert.equal(productImageExtension("image/webp"), "webp");
  assert.equal(productImageExtension("image/svg+xml"), null);
});
