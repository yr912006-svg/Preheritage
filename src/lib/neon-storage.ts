import { Files } from "files-sdk";
import { neon } from "files-sdk/neon";

const BUCKET = "assets";

export const neonFiles = new Files({ adapter: neon({ bucket: BUCKET }) });

export function storageObjectUrl(key: string) {
  return `/api/storage/${key.split("/").map(encodeURIComponent).join("/")}`;
}

export function isValidStorageKey(key: string) {
  return key.length > 0 && key.length <= 512 && !key.split("/").some((part) => !part || part === "." || part === "..");
}
