export default function ListDetailLoading() {
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

          {/* Header */}
          <div className="mb-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="h-7 w-48 bg-neutral-200 rounded mb-2 animate-pulse" />
                <div className="h-4 w-full bg-neutral-100 rounded mb-4 animate-pulse" />
                {/* Creator info */}
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-neutral-200 rounded-full animate-pulse" />
                  <div className="h-4 w-20 bg-neutral-100 rounded animate-pulse" />
                </div>
              </div>
              <div className="h-10 w-16 bg-neutral-100 rounded-lg animate-pulse" />
            </div>
            <div className="h-4 w-16 bg-neutral-100 rounded mt-3 animate-pulse" />
          </div>

          {/* Books grid skeleton */}
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i}>
                <div className="aspect-[2/3] bg-neutral-100 rounded-lg animate-pulse" />
                <div className="h-3 w-full bg-neutral-200 rounded mt-2 animate-pulse" />
                <div className="h-3 w-2/3 bg-neutral-100 rounded mt-1 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
