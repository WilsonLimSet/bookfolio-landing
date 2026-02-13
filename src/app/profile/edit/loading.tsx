export default function EditProfileLoading() {
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
          {/* Title row */}
          <div className="flex items-center justify-between mb-6">
            <div className="h-7 w-24 bg-neutral-200 rounded animate-pulse" />
            <div className="h-4 w-20 bg-neutral-100 rounded animate-pulse" />
          </div>

          <div className="space-y-8">
            {/* Profile section */}
            <section className="space-y-4">
              <div className="h-5 w-16 bg-neutral-200 rounded animate-pulse" />

              {/* Avatar */}
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-neutral-200 animate-pulse" />
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-neutral-200 rounded animate-pulse" />
                  <div className="h-3 w-28 bg-neutral-100 rounded animate-pulse" />
                </div>
              </div>

              {/* Username field */}
              <div>
                <div className="h-4 w-16 bg-neutral-200 rounded mb-1 animate-pulse" />
                <div className="h-12 w-full bg-neutral-100 rounded-lg animate-pulse" />
              </div>

              {/* Bio field */}
              <div>
                <div className="h-4 w-8 bg-neutral-200 rounded mb-1 animate-pulse" />
                <div className="h-24 w-full bg-neutral-100 rounded-lg animate-pulse" />
              </div>

              {/* Reading goal */}
              <div>
                <div className="h-4 w-32 bg-neutral-200 rounded mb-1 animate-pulse" />
                <div className="h-12 w-24 bg-neutral-100 rounded-lg animate-pulse" />
              </div>

              {/* Save button */}
              <div className="h-10 w-28 bg-neutral-900 rounded-lg animate-pulse" />
            </section>

            {/* Social links section */}
            <section className="space-y-4">
              <div className="h-5 w-24 bg-neutral-200 rounded animate-pulse" />
              <div className="h-16 w-full bg-neutral-50 rounded-xl animate-pulse" />
            </section>

            {/* Favorites section */}
            <section className="space-y-4">
              <div className="h-5 w-28 bg-neutral-200 rounded animate-pulse" />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="aspect-[2/3] bg-neutral-100 rounded-lg animate-pulse" />
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>
    </>
  );
}
