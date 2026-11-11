import test from "node:test";
import assert from "node:assert/strict";
import { S3Client } from "@aws-sdk/client-s3";
import { createProductImagePresignedUpload } from "./s3-presign.ts";

const mockS3Client = new S3Client({
  region: "us-east-2",
  endpoint: "https://mock-storage.neon.tech",
  credentials: {
    accessKeyId: "mock-access-key-id",
    secretAccessKey: "mock-secret-access-key",
  },
  forcePathStyle: true,
});

test("presigned upload rejects missing contentType", async () => {
  const result = await createProductImagePresignedUpload({ size: 1024 }, mockS3Client);
  assert.equal(result.ok, false);
  assert.equal(result.status, 400);
});

test("presigned upload rejects unsupported MIME types", async () => {
  const invalidTypes = ["application/pdf", "image/gif", "text/plain", "image/svg+xml"];
  for (const type of invalidTypes) {
    const result = await createProductImagePresignedUpload({ contentType: type, size: 1024 }, mockS3Client);
    assert.equal(result.ok, false);
    assert.equal(result.status, 415);
  }
});

test("presigned upload rejects invalid or oversized sizes", async () => {
  const invalidSizes = [0, -100, 10 * 1024 * 1024 + 1, 15 * 1024 * 1024, "1000", 1.5];
  for (const size of invalidSizes) {
    const result = await createProductImagePresignedUpload({ contentType: "image/webp", size }, mockS3Client);
    assert.equal(result.ok, false);
    assert.equal(result.status, 413);
  }
});

test("presigned upload creates valid presigned URL for JPEG, PNG, and WebP", async () => {
  const valid = [
    { type: "image/jpeg", ext: "jpg" },
    { type: "image/png", ext: "png" },
    { type: "image/webp", ext: "webp" },
  ];

  for (const { type, ext } of valid) {
    const result = await createProductImagePresignedUpload(
      { filename: `photo.${ext}`, contentType: type, size: 2 * 1024 * 1024 },
      mockS3Client
    );
    assert.equal(result.ok, true);
    assert.match(result.data.key, new RegExp(`^products/[a-f0-9-]+\\.${ext}$`));
    assert.match(result.data.url, new RegExp(`^/api/storage/products/[a-f0-9-]+\\.${ext}$`));
    assert.ok(result.data.uploadUrl.startsWith("https://mock-storage.neon.tech/assets/products/"));
    assert.ok(result.data.uploadUrl.includes("X-Amz-Signature="));
  }
});
