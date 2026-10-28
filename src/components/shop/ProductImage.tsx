"use client";

import { useState } from "react";
import Image from "next/image";

interface ProductImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  sizes?: string;
}

/** Shows a branded placeholder when a product has no image or its image cannot load. */
export function ProductImage({ src, alt, className = "object-cover", sizes }: ProductImageProps) {
  const [failedSource, setFailedSource] = useState<string | null>(null);

  if (!src || failedSource === src) {
    return (
      <div
        role="img"
        aria-label={`${alt} image unavailable`}
        className="absolute inset-0 grid place-items-center bg-ivory-200 font-serif text-xl font-bold text-gold-700"
      >
        PH
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      unoptimized={src.startsWith("/api/storage/")}
      onError={() => setFailedSource(src)}
      className={className}
    />
  );
}
