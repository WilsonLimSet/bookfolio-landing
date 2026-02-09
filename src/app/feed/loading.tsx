export default function FeedLoading() {
  return (
    <>
      {/* Header skeleton */}
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
          {/* Tab bar skeleton */}
          <div className="flex gap-1 p-1 bg-neutral-100 rounded-xl mb-6">
            <div className="flex-1 py-2 px-4 bg-white rounded-lg shadow-sm">
              <div className="h-4 bg-neutral-200 rounded animate-pulse mx-auto w-16" />
            </div>
            <div className="flex-1 py-2 px-4">
              <div className="h-4 bg-neutral-200 rounded animate-pulse mx-auto w-8" />
            </div>
            <div className="flex-1 py-2 px-4">
              <div className="h-4 bg-neutral-200 rounded animate-pulse mx-auto w-16" />
            </div>
          </div>

          {/* Feed items skeleton */}
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-neutral-100 overflow-hidden">
                <div className="flex items-center gap-3 p-4 pb-3">
                  <div className="w-10 h-10 bg-neutral-200 rounded-full animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-24 bg-neutral-200 rounded animate-pulse" />
                    <div className="h-3 w-16 bg-neutral-100 rounded animate-pulse" />
                  </div>
                </div>
                <div className="flex gap-4 px-4 pb-4">
                  <div className="w-20 h-[120px] bg-neutral-100 rounded-lg animate-pulse" />
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-4 w-3/4 bg-neutral-200 rounded animate-pulse" />
                    <div className="h-3 w-1/2 bg-neutral-100 rounded animate-pulse" />
                    <div className="h-6 w-8 bg-neutral-100 rounded animate-pulse mt-2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
