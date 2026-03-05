"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { completeOnboarding } from "../actions";

interface ImportStepProps {
  onFinish: () => void;
  onBack: () => void;
  error?: string | null;
}

export default function ImportStep({ onFinish, onBack, error: externalError }: ImportStepProps) {
  const router = useRouter();
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleImport() {
    setImporting(true);
    setError(null);

    // Complete onboarding first, then navigate to import
    const result = await completeOnboarding();
    if ("error" in result) {
      setError(result.error);
      setImporting(false);
      return;
    }

    localStorage.removeItem("bookfolio_onboarding_step");
    router.replace("/import");
  }

  const displayError = error || externalError;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <div className="p-4">
        <button onClick={onBack} className="p-2 -ml-2 text-neutral-400 hover:text-neutral-600 transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center px-8 pt-8">
        <h1 className="text-3xl font-bold text-neutral-900 mb-2 text-center">Get a head start</h1>
        <p className="text-neutral-500 mb-12 text-center">Import your books from Goodreads to quickly build your ranked list</p>

        <div className="w-32 h-32 rounded-full bg-neutral-100 flex items-center justify-center mb-8">
          <svg className="w-16 h-16 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>

        <div className="w-full max-w-sm">
          <p className="text-sm text-neutral-500 text-center mb-6">
            Export your Goodreads library as CSV and import it here. We&apos;ll match your books and let you rank them.
          </p>
        </div>

        {displayError && (
          <p className="text-sm text-red-500 text-center">{displayError}</p>
        )}
      </div>

      <div className="px-8 pb-12 space-y-3">
        <button
          onClick={handleImport}
          disabled={importing}
          className="w-full py-4 rounded-full text-lg font-semibold text-white text-center transition-colors disabled:opacity-40"
          style={{ background: "var(--onboarding-teal)" }}
        >
          {importing ? "Setting up..." : "Import from Goodreads"}
        </button>
        <button
          onClick={onFinish}
          className="w-full text-center text-neutral-400 text-sm hover:text-neutral-600 transition-colors"
        >
          Skip — I&apos;ll do this later
        </button>
      </div>
    </div>
  );
}
