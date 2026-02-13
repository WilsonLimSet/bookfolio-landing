export default function EditListLoading() {
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

          {/* Title */}
          <div className="h-7 w-24 bg-neutral-200 rounded mb-6 animate-pulse" />

          {/* List settings card */}
          <div className="bg-white rounded-xl border border-neutral-100 p-4 mb-6">
            <div className="h-5 w-24 bg-neutral-200 rounded mb-4 animate-pulse" />

            <div className="space-y-4">
              {/* Name field */}
              <div>
                <div className="h-4 w-12 bg-neutral-200 rounded mb-1 animate-pulse" />
                <div className="h-12 w-full bg-neutral-100 rounded-xl animate-pulse" />
              </div>

              {/* Description field */}
              <div>
                <div className="h-4 w-20 bg-neutral-200 rounded mb-1 animate-pulse" />
                <div className="h-20 w-full bg-neutral-100 rounded-xl animate-pulse" />
              </div>

              {/* Visibility toggle */}
              <div className="flex items-center gap-3">
                <div className="h-6 w-11 bg-neutral-200 rounded-full animate-pulse" />
                <div className="h-4 w-12 bg-neutral-100 rounded animate-pulse" />
              </div>

              {/* Save button */}
              <div className="h-12 w-full bg-neutral-900 rounded-xl animate-pulse" />
            </div>
          </div>

          {/* Books card */}
          <div className="bg-white rounded-xl border border-neutral-100 p-4 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-5 w-20 bg-neutral-200 rounded animate-pulse" />
              <div className="h-3 w-32 bg-neutral-100 rounded animate-pulse" />
            </div>

            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-lg">
                  <div className="w-6 h-8 bg-neutral-100 rounded animate-pulse" />
                  <div className="w-6 h-4 bg-neutral-100 rounded animate-pulse" />
                  <div className="w-10 h-[60px] bg-neutral-100 rounded animate-pulse" />
                  <div className="flex-1 space-y-1">
                    <div className="h-4 w-3/4 bg-neutral-200 rounded animate-pulse" />
                    <div className="h-3 w-1/2 bg-neutral-100 rounded animate-pulse" />
                  </div>
                  <div className="w-8 h-8 bg-neutral-100 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>

          {/* Delete button */}
          <div className="border-t border-neutral-100 pt-6">
            <div className="h-12 w-full bg-red-50 rounded-xl animate-pulse" />
          </div>
        </div>
      </main>
    </>
  );
}
