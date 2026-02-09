export default function LeaderboardLoading() {
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
        <div className="max-w-4xl mx-auto">
          <div className="h-8 w-32 bg-neutral-200 rounded mb-6 animate-pulse" />

          <div className="grid md:grid-cols-2 gap-6">
            {[1, 2].map((col) => (
              <div key={col}>
                <div className="h-4 w-24 bg-neutral-200 rounded mb-4 animate-pulse" />
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl">
                      <div className="w-6 h-5 bg-neutral-100 rounded animate-pulse" />
                      <div className="w-10 h-[60px] bg-neutral-100 rounded animate-pulse" />
                      <div className="flex-1 space-y-1">
                        <div className="h-4 w-3/4 bg-neutral-200 rounded animate-pulse" />
                        <div className="h-3 w-1/2 bg-neutral-100 rounded animate-pulse" />
                      </div>
                    </div>
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
