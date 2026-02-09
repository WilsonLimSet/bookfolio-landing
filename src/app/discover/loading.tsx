export default function DiscoverLoading() {
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
          <div className="h-8 w-24 bg-neutral-200 rounded mb-6 animate-pulse" />

          {/* Search skeleton */}
          <div className="mb-8">
            <div className="h-10 w-full bg-neutral-100 rounded-lg animate-pulse" />
          </div>

          {/* Suggested users */}
          <div className="mb-8">
            <div className="h-4 w-32 bg-neutral-200 rounded mb-4 animate-pulse" />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-white border border-neutral-100 rounded-xl">
                  <div className="w-10 h-10 bg-neutral-200 rounded-full animate-pulse" />
                  <div className="flex-1 space-y-1">
                    <div className="h-4 w-20 bg-neutral-200 rounded animate-pulse" />
                    <div className="h-3 w-14 bg-neutral-100 rounded animate-pulse" />
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
