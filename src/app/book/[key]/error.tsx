"use client";

import Link from "next/link";

export default function BookError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <h1 className="text-2xl font-bold mb-2">Couldn&apos;t load book</h1>
        <p className="text-neutral-500 mb-6">
          This book may not exist or something went wrong.
        </p>
        <div className="flex justify-center gap-3">
          <button
            onClick={reset}
            className="px-6 py-3 bg-neutral-900 text-white rounded-xl font-medium hover:bg-neutral-800 transition-colors"
          >
            Try again
          </button>
          <Link
            href="/discover"
            className="px-6 py-3 border border-neutral-200 rounded-xl font-medium hover:bg-neutral-50 transition-colors"
          >
            Discover books
          </Link>
        </div>
      </div>
    </main>
  );
}
