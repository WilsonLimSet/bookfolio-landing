"use client";

import Image from "next/image";
import { useState } from "react";

interface BookCoverProps {
  src: string | null;
  alt: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  priority?: boolean;
  showSpine?: boolean;
}

const sizeConfig = {
  xs: { width: 48, height: 72, text: "text-[8px]" },
  sm: { width: 64, height: 96, text: "text-xs" },
  md: { width: 80, height: 120, text: "text-xs" },
  lg: { width: 128, height: 192, text: "text-sm" },
  xl: { width: 192, height: 288, text: "text-sm" },
};

export default function BookCover({
  src,
  alt,
  size = "md",
  className = "",
  priority = false,
  showSpine = true,
}: BookCoverProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const { width, height, text } = sizeConfig[size];

  return (
    <div
      className={`
        relative overflow-hidden rounded-lg bg-neutral-100 group
        transition-all duration-300 ease-out
        hover:scale-[1.03] hover:shadow-xl
        ${className}
      `}
      style={{ width, height }}
    >
      {/* Base shadow */}
      <div className="absolute inset-0 rounded-lg shadow-md group-hover:shadow-lg transition-shadow duration-300" />

      {/* Top light reflection - premium feel */}
      <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-white/15 to-transparent pointer-events-none z-10 rounded-t-lg" />

      {/* Loading skeleton with shimmer */}
      {isLoading && src && !hasError && (
        <div className="absolute inset-0 bg-neutral-200 animate-pulse rounded-lg">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
        </div>
      )}

      {/* Cover image or fallback */}
      {src && !hasError ? (
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          className={`
            w-full h-full object-cover rounded-lg
            transition-opacity duration-500 ease-out
            ${isLoading ? "opacity-0" : "opacity-100"}
          `}
          onLoad={() => setIsLoading(false)}
          onError={() => setHasError(true)}
          priority={priority}
          unoptimized={src.includes("openlibrary.org")}
        />
      ) : (
        <div className={`w-full h-full flex items-center justify-center p-2 text-center rounded-lg ${text}`}>
          <span className="text-neutral-400 line-clamp-3">{alt}</span>
        </div>
      )}

      {/* Spine shadow (left edge) - book depth effect */}
      {showSpine && (
        <div className="absolute left-0 inset-y-0 w-[3px] bg-gradient-to-r from-black/25 to-transparent pointer-events-none rounded-l-lg" />
      )}

      {/* Page edges (right side) */}
      {showSpine && (
        <div className="absolute right-0 inset-y-[2px] w-[2px] bg-gradient-to-l from-neutral-300/60 to-transparent pointer-events-none" />
      )}

      {/* Bottom shadow for depth */}
      <div className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-black/10 to-transparent pointer-events-none rounded-b-lg" />
    </div>
  );
}
