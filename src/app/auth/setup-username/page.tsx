"use client";

import { useState } from "react";
import { setupUsername } from "./actions";
import Link from "next/link";

export default function SetupUsernamePage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError(null);
    setLoading(true);

    const result = await setupUsername(formData);

    setLoading(false);

    if (result && "error" in result) {
      setError(result.error);
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Link href="/" className="inline-flex flex-col items-center gap-2">
            <img
              src="/logo-512x512.png"
              alt="Bookfolio logo"
              className="w-12 h-12"
            />
            <span className="text-2xl font-semibold tracking-tight">
              Bookfolio
            </span>
          </Link>
          <h1 className="mt-6 text-3xl font-bold">Choose a username</h1>
          <p className="mt-2 text-neutral-600">
            Pick a username for your Bookfolio profile
          </p>
        </div>

        <form action={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-neutral-700 mb-1"
            >
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              minLength={3}
              pattern="[a-zA-Z0-9_]+"
              title="Username must be at least 3 characters and contain only letters, numbers, and underscores"
              className="w-full px-4 py-3 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
              placeholder="your_username"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-3 bg-neutral-900 text-white rounded-lg font-medium hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Setting up..." : "Continue"}
          </button>
        </form>
      </div>
    </main>
  );
}
