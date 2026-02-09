export default function WantToReadLoading() {
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
              <div className="h-6 w-28 bg-neutral-200 rounded mb-1 animate-pulse" />
              <div className="h-4 w-32 bg-neutral-100 rounded animate-pulse" />
            </div>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
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
