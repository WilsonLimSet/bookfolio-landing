export default function ReviewLoading() {
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
        <div className="max-w-2xl mx-auto">
          {/* Back button skeleton */}
          <div className="h-4 w-24 bg-neutral-100 rounded mb-6 animate-pulse" />

          {/* Review card skeleton */}
          <div className="bg-white rounded-xl border border-neutral-100 overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b border-neutral-100">
              <div className="w-12 h-12 bg-neutral-200 rounded-full animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-24 bg-neutral-200 rounded animate-pulse" />
                <div className="h-3 w-40 bg-neutral-100 rounded animate-pulse" />
              </div>
            </div>

            {/* Book info */}
            <div className="flex gap-4 p-4">
              <div className="w-24 h-36 bg-neutral-100 rounded-lg animate-pulse flex-shrink-0" />
              <div className="flex-1 space-y-2 py-1">
                <div className="h-6 w-3/4 bg-neutral-200 rounded animate-pulse" />
                <div className="h-4 w-1/2 bg-neutral-100 rounded animate-pulse" />
                <div className="h-8 w-12 bg-neutral-100 rounded animate-pulse mt-3" />
                <div className="h-3 w-32 bg-neutral-100 rounded animate-pulse mt-2" />
              </div>
            </div>

            {/* Review text skeleton */}
            <div className="px-4 pb-4 space-y-2">
              <div className="h-4 w-full bg-neutral-100 rounded animate-pulse" />
              <div className="h-4 w-full bg-neutral-100 rounded animate-pulse" />
              <div className="h-4 w-2/3 bg-neutral-100 rounded animate-pulse" />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4 px-4 py-3 border-t border-neutral-100">
              <div className="h-5 w-12 bg-neutral-100 rounded animate-pulse" />
              <div className="h-5 w-20 bg-neutral-100 rounded animate-pulse ml-auto" />
            </div>
          </div>

          {/* Comments section skeleton */}
          <div className="mt-6">
            <div className="h-6 w-24 bg-neutral-200 rounded mb-4 animate-pulse" />
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-8 h-8 bg-neutral-200 rounded-full animate-pulse flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-20 bg-neutral-200 rounded animate-pulse" />
                    <div className="h-3 w-full bg-neutral-100 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
