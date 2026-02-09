export default function ProfileLoading() {
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
          {/* Profile info */}
          <div className="text-center mb-6">
            <div className="w-24 h-24 bg-neutral-200 rounded-full mx-auto mb-4 animate-pulse" />
            <div className="h-7 w-32 bg-neutral-200 rounded mx-auto mb-2 animate-pulse" />
            <div className="h-4 w-24 bg-neutral-100 rounded mx-auto animate-pulse" />
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-xl p-3 text-center border border-neutral-100">
                <div className="h-8 w-12 bg-neutral-200 rounded mx-auto mb-1 animate-pulse" />
                <div className="h-3 w-16 bg-neutral-100 rounded mx-auto animate-pulse" />
              </div>
            ))}
          </div>

          {/* Action buttons */}
          <div className="flex justify-center gap-3 mb-8">
            <div className="h-10 w-24 bg-neutral-100 rounded-lg animate-pulse" />
            <div className="h-10 w-20 bg-neutral-100 rounded-lg animate-pulse" />
          </div>

          {/* Favorites section */}
          <div className="mb-8">
            <div className="h-4 w-28 bg-neutral-200 rounded mb-4 animate-pulse" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="aspect-[2/3] bg-neutral-100 rounded-lg animate-pulse" />
              ))}
            </div>
          </div>

          {/* Reading lists */}
          <div className="space-y-2 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-white rounded-xl border border-neutral-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-neutral-100 animate-pulse" />
                  <div className="space-y-1">
                    <div className="h-4 w-28 bg-neutral-200 rounded animate-pulse" />
                    <div className="h-3 w-16 bg-neutral-100 rounded animate-pulse" />
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
