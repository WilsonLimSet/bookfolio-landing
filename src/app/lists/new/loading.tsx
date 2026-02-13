export default function NewListLoading() {
  return (
    <>
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-neutral-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <div className="w-7 h-7 bg-neutral-200 rounded animate-pulse" />
            <div className="flex gap-2">
              <div className="w-8 h-8 bg-neutral-100 rounded-lg animate-pulse" />
              <div className="w-8 h-8 bg-neutral-100 rounded-lg animate-pulse" />
            </div>
          </div>
        </div>
      </header>

      <main className="min-h-screen px-4 sm:px-6 py-6">
        <div className="max-w-md mx-auto">
          {/* Back button skeleton */}
          <div className="h-4 w-24 bg-neutral-100 rounded mb-6 animate-pulse" />

          {/* Title */}
          <div className="h-7 w-40 bg-neutral-200 rounded mb-6 animate-pulse" />

          {/* Form skeleton */}
          <div className="space-y-4">
            {/* Name field */}
            <div>
              <div className="h-4 w-12 bg-neutral-200 rounded mb-1 animate-pulse" />
              <div className="h-12 w-full bg-neutral-100 rounded-xl animate-pulse" />
            </div>

            {/* Description field */}
            <div>
              <div className="h-4 w-20 bg-neutral-200 rounded mb-1 animate-pulse" />
              <div className="h-20 w-full bg-neutral-100 rounded-xl animate-pulse" />
            </div>

            {/* Visibility toggle */}
            <div className="flex items-center gap-3">
              <div className="h-6 w-11 bg-neutral-200 rounded-full animate-pulse" />
              <div className="h-4 w-12 bg-neutral-100 rounded animate-pulse" />
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-2">
              <div className="h-12 flex-1 bg-neutral-900 rounded-xl animate-pulse" />
              <div className="h-12 w-24 bg-neutral-100 rounded-xl animate-pulse" />
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
