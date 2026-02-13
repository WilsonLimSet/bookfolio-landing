"use client";

interface SkeletonProps {
  className?: string;
  animate?: boolean;
  style?: React.CSSProperties;
}

export function Skeleton({ className = "", animate = true, style }: SkeletonProps) {
  return (
    <div
      className={`bg-neutral-200 rounded ${animate ? "animate-pulse" : ""} ${className}`}
      style={style}
    />
  );
}

export function BookCardSkeleton() {
  return (
    <div className="flex gap-3 p-3 rounded-lg">
      <Skeleton className="w-12 h-18 rounded-md flex-shrink-0" />
      <div className="flex-1 space-y-2 py-1">
        <Skeleton className="h-4 w-3/4 rounded" />
        <Skeleton className="h-3 w-1/2 rounded" />
      </div>
    </div>
  );
}

export function SearchResultsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-1">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>
          <BookCardSkeleton />
        </div>
      ))}
    </div>
  );
}

export function BookCoverSkeleton({ size = "md" }: { size?: "xs" | "sm" | "md" | "lg" | "xl" }) {
  const sizeConfig = {
    xs: { width: 48, height: 72 },
    sm: { width: 64, height: 96 },
    md: { width: 80, height: 120 },
    lg: { width: 128, height: 192 },
    xl: { width: 192, height: 288 },
  };

  const { width, height } = sizeConfig[size];

  return (
    <Skeleton
      className="rounded-lg"
      style={{ width, height }}
    />
  );
}

export function ProfileBookListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="space-y-2"
        >
          <BookCoverSkeleton size="md" />
          <Skeleton className="h-3 w-full rounded" />
          <Skeleton className="h-3 w-2/3 rounded" />
        </div>
      ))}
    </div>
  );
}

export function FeedItemSkeleton() {
  return (
    <div className="p-4 border-b border-neutral-100">
      <div className="flex gap-3">
        <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-24 rounded" />
            <Skeleton className="h-3 w-16 rounded" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="w-16 h-24 rounded-md flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4 rounded" />
              <Skeleton className="h-3 w-1/2 rounded" />
              <Skeleton className="h-3 w-full rounded" />
              <Skeleton className="h-3 w-2/3 rounded" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function FeedSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>
          <FeedItemSkeleton />
        </div>
      ))}
    </div>
  );
}
