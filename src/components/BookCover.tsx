"use client";

import Image from "next/image";
import { useState } from "react";

interface BookCoverProps {
  src: string | null;
  alt: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  priority?: boolean;
}

const sizeConfig = {
  sm: { width: 48, height: 72 },
  md: { width: 64, height: 96 },
  lg: { width: 128, height: 192 },
  xl: { width: 192, height: 288 },
};

export default function BookCover({
  src,
  alt,
  size = "md",
  className = "",
  priority = false,
}: BookCoverProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const { width, height } = sizeConfig[size];

  if (!src || hasError) {
    return (
      <div
        className={`bg-neutral-100 flex items-center justify-center text-neutral-400 ${className}`}
        style={{ width, height }}
      >
        <span className="text-xs text-center p-1 line-clamp-3">{alt}</span>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`} style={{ width, height }}>
      {isLoading && (
        <div className="absolute inset-0 bg-neutral-100 animate-pulse" />
      )}
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={`object-cover transition-opacity duration-300 ${
          isLoading ? "opacity-0" : "opacity-100"
        }`}
        onLoad={() => setIsLoading(false)}
        onError={() => setHasError(true)}
        priority={priority}
        unoptimized={src.includes("openlibrary.org")}
      />
    </div>
  );
}
