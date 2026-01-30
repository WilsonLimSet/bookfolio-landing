"use client";

import { useState } from "react";

export default function Home() {
  const [submitted, setSubmitted] = useState(false);
  const [email, setEmail] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const response = await fetch("https://formspree.io/f/xnqkwbpr", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    if (response.ok) {
      setSubmitted(true);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Logo */}
        <div className="text-3xl font-semibold tracking-tight">
          Bookfolio
        </div>

        {/* Tagline */}
        <div className="space-y-3">
          <h1 className="text-4xl font-bold tracking-tight">
            Which book is better?
          </h1>
          <p className="text-neutral-600 text-lg">
            Compare books head-to-head. Build rankings. Discover what readers really think.
          </p>
        </div>

        {/* How it works */}
        <div className="flex justify-center gap-8 text-sm text-neutral-500 py-4">
          <div className="flex flex-col items-center gap-1">
            <span className="text-2xl">📚</span>
            <span>Pick a winner</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-2xl">📊</span>
            <span>Elo rankings</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-2xl">🏆</span>
            <span>Discover gems</span>
          </div>
        </div>

        {/* Waitlist Form */}
        {!submitted ? (
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="w-full px-4 py-3 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent text-center"
            />
            <button
              type="submit"
              className="w-full px-4 py-3 bg-neutral-900 text-white rounded-lg font-medium hover:bg-neutral-800 transition-colors"
            >
              Join the Waitlist
            </button>
          </form>
        ) : (
          <div className="py-4 px-6 bg-green-50 text-green-800 rounded-lg">
            You&apos;re on the list! We&apos;ll be in touch soon.
          </div>
        )}

        {/* Footer */}
        <p className="text-sm text-neutral-400 pt-8">
          Coming February 2026
        </p>
      </div>
    </main>
  );
}
