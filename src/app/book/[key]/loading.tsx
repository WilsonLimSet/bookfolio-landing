export default function BookLoading() {
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
          <div className="flex flex-col md:flex-row gap-6 sm:gap-8">
            {/* Cover */}
            <div className="flex-shrink-0">
              <div className="w-48 md:w-64 aspect-[2/3] bg-neutral-100 rounded-xl mx-auto md:mx-0 animate-pulse" />
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="h-9 w-3/4 bg-neutral-200 rounded mb-3 animate-pulse" />
              <div className="h-6 w-1/2 bg-neutral-100 rounded mb-4 animate-pulse" />
              <div className="flex gap-3 mb-6">
                <div className="h-4 w-12 bg-neutral-100 rounded animate-pulse" />
                <div className="h-4 w-20 bg-neutral-100 rounded animate-pulse" />
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 mb-6">
                <div className="h-10 w-28 bg-neutral-200 rounded-lg animate-pulse" />
                <div className="h-10 w-28 bg-neutral-100 rounded-lg animate-pulse" />
                <div className="h-10 w-28 bg-neutral-100 rounded-lg animate-pulse" />
              </div>

              {/* Description */}
              <div className="space-y-2 mt-4">
                <div className="h-4 w-20 bg-neutral-200 rounded animate-pulse" />
                <div className="h-3 w-full bg-neutral-100 rounded animate-pulse" />
                <div className="h-3 w-full bg-neutral-100 rounded animate-pulse" />
                <div className="h-3 w-3/4 bg-neutral-100 rounded animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
