export default function ReadLoading() {
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
          <div className="flex items-center gap-4 mb-6">
            <div className="w-9 h-9 bg-neutral-100 rounded-lg animate-pulse" />
            <div>
              <div className="h-6 w-16 bg-neutral-200 rounded mb-1 animate-pulse" />
              <div className="h-4 w-32 bg-neutral-100 rounded animate-pulse" />
            </div>
          </div>

          <div className="space-y-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-xl">
                <div className="w-8 h-6 bg-neutral-100 rounded animate-pulse" />
                <div className="w-12 h-[72px] bg-neutral-100 rounded-lg animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 bg-neutral-200 rounded animate-pulse" />
                  <div className="h-3 w-1/2 bg-neutral-100 rounded animate-pulse" />
                </div>
                <div className="h-6 w-8 bg-neutral-100 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
