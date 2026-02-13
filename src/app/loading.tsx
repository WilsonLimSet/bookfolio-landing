export default function HomeLoading() {
  return (
    <main className="min-h-screen flex flex-col px-6 py-12">
      {/* Header skeleton */}
      <header className="w-full max-w-4xl mx-auto flex justify-end mb-8">
        <div className="w-20 h-10 bg-neutral-100 rounded-lg animate-pulse" />
      </header>

      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="max-w-md w-full text-center space-y-8">
          {/* Logo skeleton */}
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 bg-neutral-200 rounded-xl animate-pulse" />
            <div className="h-8 w-32 bg-neutral-200 rounded animate-pulse" />
          </div>

          {/* Tagline skeleton */}
          <div className="space-y-3">
            <div className="h-10 w-48 bg-neutral-200 rounded mx-auto animate-pulse" />
            <div className="h-5 w-72 bg-neutral-100 rounded mx-auto animate-pulse" />
          </div>

          {/* Search skeleton */}
          <div className="h-12 w-full bg-neutral-100 rounded-xl animate-pulse" />
        </div>
      </div>

      <footer className="w-full max-w-4xl mx-auto pt-8 flex justify-center gap-6">
        <div className="h-4 w-10 bg-neutral-100 rounded animate-pulse" />
        <div className="h-4 w-20 bg-neutral-100 rounded animate-pulse" />
        <div className="h-4 w-24 bg-neutral-100 rounded animate-pulse" />
      </footer>
    </main>
  );
}
