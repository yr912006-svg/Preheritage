import { Files } from "files-sdk";
import { neon } from "files-sdk/neon";

const BUCKET = "assets";

let files: Files | undefined;

export function getNeonFiles() {
  const required = ["AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "AWS_ENDPOINT_URL_S3", "AWS_REGION"];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length) throw new Error(`Neon Object Storage is not configured: ${missing.join(", ")}`);
  files ??= new Files({ adapter: neon({ bucket: BUCKET }) });
  return files;
}

export function storageObjectUrl(key: string) {
  return `/api/storage/${key.split("/").map(encodeURIComponent).join("/")}`;
}

export function isValidStorageKey(key: string) {
  return key.startsWith("products/") && key.length <= 512 && !key.split("/").some((part) => !part || part === "." || part === "..");
}
