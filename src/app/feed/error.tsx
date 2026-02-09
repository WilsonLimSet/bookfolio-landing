"use client";

export default function FeedError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <h1 className="text-2xl font-bold mb-2">Couldn&apos;t load feed</h1>
        <p className="text-neutral-500 mb-6">
          Something went wrong loading your feed. Please try again.
        </p>
        <button
          onClick={reset}
          className="px-6 py-3 bg-neutral-900 text-white rounded-xl font-medium hover:bg-neutral-800 transition-colors"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
