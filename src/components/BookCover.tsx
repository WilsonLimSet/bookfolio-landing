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
  index?: number;
}

const sizeConfig = {
  xs: { width: 48, height: 72, text: "text-[8px]" },
  sm: { width: 64, height: 96, text: "text-xs" },
  md: { width: 80, height: 120, text: "text-xs" },
  lg: { width: 128, height: 192, text: "text-sm" },
  xl: { width: 192, height: 288, text: "text-sm" },
};

// Warm tinted placeholders — cycles through muted book-ish tones
const placeholderColors = [
  "#e8ddd3", // warm cream
  "#d4c5b5", // light tan
  "#c9d5d0", // sage
  "#d1c4d8", // muted lavender
  "#c8d4df", // dusty blue
  "#ddd5c8", // sand
  "#d8cdc4", // warm gray
  "#c4ccd8", // cool slate
];

function getPlaceholderColor(src: string | null, index?: number): string {
  if (index !== undefined) return placeholderColors[index % placeholderColors.length];
  if (!src) return placeholderColors[0];
  // Simple hash from URL for consistent color per book
  let hash = 0;
  for (let i = 0; i < src.length; i++) {
    hash = ((hash << 5) - hash + src.charCodeAt(i)) | 0;
  }
  return placeholderColors[Math.abs(hash) % placeholderColors.length];
}

export default function BookCover({
  src,
  alt,
  size = "md",
  className = "",
  priority = false,
  showSpine = true,
  index,
}: BookCoverProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const { width, height, text } = sizeConfig[size];
  const placeholderBg = getPlaceholderColor(src, index);

  // Stagger delay based on index for that streaming-in feel
  const staggerDelay = index !== undefined ? `${index * 50}ms` : "0ms";

  return (
    <div
      className={`
        relative overflow-hidden rounded-lg group
        transition-transform duration-200 ease-out
        hover:scale-[1.03]
        ${className}
      `}
      style={{
        width,
        height,
        backgroundColor: placeholderBg,
        animationDelay: staggerDelay,
      }}
    >
      {/* Shadow — single element instead of multiple overlays */}
      <div className="absolute inset-0 rounded-lg shadow-md group-hover:shadow-xl transition-shadow duration-200" />

      {/* Cover image or fallback */}
      {src && !hasError ? (
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          className={`
            w-full h-full object-cover rounded-lg
            transition-opacity duration-200 ease-out
            ${isLoading ? "opacity-0" : "opacity-100"}
          `}
          onLoad={() => setIsLoading(false)}
          onError={() => setHasError(true)}
          priority={priority}
          sizes={`${width}px`}
        />
      ) : (
        <div className={`w-full h-full flex items-center justify-center p-2 text-center rounded-lg ${text}`}>
          <span className="text-neutral-400 line-clamp-3">{alt}</span>
        </div>
      )}

      {/* Spine + page edge — single combined overlay */}
      {showSpine && (
        <>
          <div className="absolute left-0 inset-y-0 w-[3px] bg-gradient-to-r from-black/20 to-transparent pointer-events-none rounded-l-lg" />
          <div className="absolute right-0 inset-y-[2px] w-[2px] bg-gradient-to-l from-neutral-300/50 to-transparent pointer-events-none" />
        </>
      )}
    </div>
  );
}
