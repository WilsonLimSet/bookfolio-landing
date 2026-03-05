"use client";

import { useState } from "react";
import { saveReadingGoal } from "../actions";

const presets = [12, 24, 52];

interface ReadingGoalStepProps {
  onContinue: () => void;
  onBack: () => void;
  onSkip: () => void;
  initialGoal?: number | null;
}

export default function ReadingGoalStep({ onContinue, onBack, onSkip, initialGoal }: ReadingGoalStepProps) {
  const [goal, setGoal] = useState(initialGoal || 24);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleContinue() {
    setSaving(true);
    setError(null);
    const result = await saveReadingGoal(goal);
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

      <div className="flex-1 flex flex-col items-center px-8 pt-8">
        <h1 className="text-3xl font-bold text-neutral-900 mb-2 text-center">What&apos;s your reading goal?</h1>
        <p className="text-neutral-500 mb-12 text-center">Set a goal to stay motivated</p>

        <div className="flex items-center gap-6 mb-8">
          <button
            onClick={() => setGoal(Math.max(1, goal - 1))}
            className="w-12 h-12 rounded-full border-2 border-black/10 flex items-center justify-center text-2xl text-neutral-400 hover:border-neutral-400 hover:text-neutral-600 transition-colors"
          >
            -
          </button>
          <div className="text-center">
            <span className="text-6xl font-bold text-neutral-900">{goal}</span>
            <p className="text-neutral-500 mt-1">books this year</p>
          </div>
          <button
            onClick={() => setGoal(Math.min(365, goal + 1))}
            className="w-12 h-12 rounded-full border-2 border-black/10 flex items-center justify-center text-2xl text-neutral-400 hover:border-neutral-400 hover:text-neutral-600 transition-colors"
          >
            +
          </button>
        </div>

        {error && <p className="text-sm text-red-500 mt-4">{error}</p>}

        <div className="flex gap-3">
          {presets.map((p) => (
            <button
              key={p}
              onClick={() => setGoal(p)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
                goal === p
                  ? "text-white"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              }`}
              style={goal === p ? { background: "var(--onboarding-teal)" } : undefined}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="px-8 pb-12 space-y-3">
        <button
          onClick={handleContinue}
          disabled={saving}
          className="w-full py-4 rounded-full text-lg font-semibold text-white transition-colors disabled:opacity-40"
          style={{ background: "var(--onboarding-teal)" }}
        >
          {saving ? "Saving..." : "Continue"}
        </button>
        <button
          onClick={onSkip}
          className="w-full text-center text-neutral-400 text-sm hover:text-neutral-600 transition-colors"
        >
          Not now
        </button>
      </div>
    </div>
  );
}
