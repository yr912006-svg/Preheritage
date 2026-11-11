import { randomUUID } from "node:crypto";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { MAX_PRODUCT_IMAGE_BYTES, productImageExtension } from "@/lib/product-image";
import { storageObjectUrl } from "@/lib/neon-storage";

const BUCKET = "assets";
const PRESIGN_EXPIRATION_SECONDS = 900; // 15 minutes

let s3Client: S3Client | undefined;

export function getS3Client(): S3Client {
  const required = ["AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "AWS_ENDPOINT_URL_S3", "AWS_REGION"];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error(`Neon Object Storage is not configured: ${missing.join(", ")}`);
  }

  s3Client ??= new S3Client({
    region: process.env.AWS_REGION!,
    endpoint: process.env.AWS_ENDPOINT_URL_S3!,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
    forcePathStyle: true,
  });

  return s3Client;
}

export type PresignedUploadRequest = {
  filename?: string;
  contentType?: string;
  size?: number;
};

export type PresignedUploadResult = {
  key: string;
  uploadUrl: string;
  url: string;
};

export async function createProductImagePresignedUpload(
  request: PresignedUploadRequest,
  clientOverride?: S3Client
): Promise<{ ok: true; data: PresignedUploadResult } | { ok: false; status: number; error: string }> {
  const { contentType, size } = request;

  if (!contentType || typeof contentType !== "string") {
    return { ok: false, status: 400, error: "Choose an image file to upload." };
  }

  const extension = productImageExtension(contentType);
  if (!extension) {
    return { ok: false, status: 415, error: "Use JPEG, PNG, or WebP images." };
  }

  if (typeof size !== "number" || !Number.isInteger(size) || size <= 0 || size > MAX_PRODUCT_IMAGE_BYTES) {
    return { ok: false, status: 413, error: "Images must be smaller than 10 MB." };
  }

  const key = `products/${randomUUID()}.${extension}`;

  const client = clientOverride || getS3Client();
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(client, command, { expiresIn: PRESIGN_EXPIRATION_SECONDS });

  return {
    ok: true,
    data: {
      key,
      uploadUrl,
      url: storageObjectUrl(key),
    },
  };
}
