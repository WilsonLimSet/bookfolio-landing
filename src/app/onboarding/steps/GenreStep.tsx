"use client";

import { useState } from "react";
import { saveGenres } from "../actions";

const genres = [
  "Literary Fiction",
  "Sci-Fi",
  "Fantasy",
  "Mystery/Thriller",
  "Romance",
  "Historical Fiction",
  "Non-Fiction",
  "Biography",
  "Self-Help",
  "Business",
  "Science",
  "Philosophy",
  "Poetry",
  "Horror",
  "Young Adult",
  "Graphic Novels",
];

interface GenreStepProps {
  onContinue: () => void;
  onBack: () => void;
  onSkip: () => void;
  initialGenres?: string[];
}

export default function GenreStep({ onContinue, onBack, onSkip, initialGenres }: GenreStepProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set(initialGenres || []));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleGenre(genre: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(genre)) next.delete(genre);
      else next.add(genre);
      return next;
    });
  }

  async function handleContinue() {
    setSaving(true);
    setError(null);
    const result = await saveGenres(Array.from(selected));
    if ("error" in result) {
      setError(result.error);
      setSaving(false);
      return;
    }
    onContinue();
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <div className="p-4">
        <button onClick={onBack} className="p-2 -ml-2 text-neutral-400 hover:text-neutral-600 transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      <div className="flex-1 flex flex-col px-8 pt-8">
        <h1 className="text-3xl font-bold text-neutral-900 mb-2">What genres do you love?</h1>
        <p className="text-neutral-500 mb-8">Pick a few to help us personalize your experience</p>

        {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

        <div className="flex flex-wrap gap-3">
          {genres.map((genre) => {
            const isSelected = selected.has(genre);
            return (
              <button
                key={genre}
                onClick={() => toggleGenre(genre)}
                className={`px-4 py-2.5 rounded-full text-sm font-medium transition-colors border ${
                  isSelected
                    ? "text-white border-transparent"
                    : "text-neutral-600 border-black/10 hover:border-neutral-400"
                }`}
                style={isSelected ? { background: "var(--onboarding-teal)", borderColor: "var(--onboarding-teal)" } : undefined}
              >
                {genre}
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-8 pb-12 space-y-3">
        <button
          onClick={handleContinue}
          disabled={selected.size === 0 || saving}
          className="w-full py-4 rounded-full text-lg font-semibold text-white transition-colors disabled:opacity-40"
          style={{ background: "var(--onboarding-teal)" }}
        >
          {saving ? "Saving..." : "Continue"}
        </button>
        <button
          onClick={onSkip}
          className="w-full text-center text-neutral-400 text-sm hover:text-neutral-600 transition-colors"
        >
          Nope, I like everything
        </button>
      </div>
    </div>
  );
}
