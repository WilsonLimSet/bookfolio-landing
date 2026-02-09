export default function ListsLoading() {
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
          <div className="flex items-center justify-between mb-6">
            <div className="h-8 w-16 bg-neutral-200 rounded animate-pulse" />
            <div className="h-10 w-24 bg-neutral-900 rounded-lg animate-pulse" />
          </div>

          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 bg-white rounded-xl border border-neutral-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-neutral-200 rounded-full animate-pulse" />
                  <div className="h-4 w-24 bg-neutral-200 rounded animate-pulse" />
                </div>
                <div className="h-5 w-48 bg-neutral-200 rounded mb-2 animate-pulse" />
                <div className="h-3 w-full bg-neutral-100 rounded mb-3 animate-pulse" />
                <div className="flex gap-2">
                  {[1, 2, 3, 4].map((j) => (
                    <div key={j} className="w-12 h-[72px] bg-neutral-100 rounded animate-pulse" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
