const CONTENT_TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
export const MAX_PRODUCT_IMAGE_BYTES = 10 * 1024 * 1024;

export function productImageExtension(type: string) {
  return CONTENT_TYPES[type] || null;
}

export function validateProductImage(type: string, size: number, bytes: Uint8Array) {
  if (!productImageExtension(type)) return "Use JPEG, PNG, or WebP images.";
  if (!Number.isInteger(size) || size <= 0 || size > MAX_PRODUCT_IMAGE_BYTES) return "Images must be larger than 0 bytes and smaller than 10 MB.";
  if (!hasValidImageSignature(type, bytes)) return "The selected file does not contain a valid JPEG, PNG, or WebP image.";
  return null;
}

function hasValidImageSignature(type: string, bytes: Uint8Array) {
  if (type === "image/jpeg") return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (type === "image/png") return bytes.length >= 8 && [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((value, index) => bytes[index] === value);
  if (type === "image/webp") return bytes.length >= 12 && bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;
  return false;
}
