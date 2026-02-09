"use client";

import Image from "next/image";

interface BookCardProps {
  title: string;
  author: string | null;
  coverUrl: string | null;
  position: number;
  onRemove?: () => void;
  showRemove?: boolean;
}

export default function BookCard({
  title,
  author,
  coverUrl,
  position,
  onRemove,
  showRemove = false,
}: BookCardProps) {
  return (
    <div className="relative flex gap-3 p-3 bg-white rounded-lg border border-neutral-200 shadow-sm">
      <div className="absolute -top-2 -left-2 w-6 h-6 bg-neutral-900 text-white rounded-full flex items-center justify-center text-xs font-medium">
        {position}
      </div>

      <div className="w-16 h-24 bg-neutral-100 rounded overflow-hidden flex-shrink-0 relative">
        {coverUrl ? (
          <Image
            src={coverUrl}
            alt={`Cover of ${title}`}
            fill
            sizes="64px"
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-400 text-xs text-center p-1">
            No cover
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-neutral-900 truncate">{title}</h3>
        {author && (
          <p className="text-sm text-neutral-600 truncate">{author}</p>
        )}
      </div>

      {showRemove && onRemove && (
        <button
          onClick={onRemove}
          className="absolute top-2 right-2 w-6 h-6 bg-neutral-100 hover:bg-red-100 text-neutral-500 hover:text-red-600 rounded-full flex items-center justify-center transition-colors"
          aria-label="Remove book"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
