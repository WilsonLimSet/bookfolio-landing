"use client";

import { useState, useEffect, useRef } from "react";
import { checkUsernameAvailability, saveUsername } from "../actions";
import { PulsingDots } from "@/components/Skeleton";

interface UsernameStepProps {
  onContinue: () => void;
  onBack: () => void;
  initialUsername?: string;
}

export default function UsernameStep({ onContinue, onBack, initialUsername }: UsernameStepProps) {
  const [username, setUsername] = useState(initialUsername || "");
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const checkTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (checkTimeout.current) clearTimeout(checkTimeout.current);

    const trimmed = username.trim().toLowerCase();
    if (trimmed.length < 3) {
      setAvailable(null);
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
      setAvailable(null);
      setError("Only letters, numbers, and underscores");
      return;
    }

    setError(null);
    setChecking(true);
    checkTimeout.current = setTimeout(async () => {
      const result = await checkUsernameAvailability(trimmed);
      setAvailable(result.available);
      setChecking(false);
    }, 400);

    return () => {
      if (checkTimeout.current) clearTimeout(checkTimeout.current);
    };
  }, [username]);

  async function handleContinue() {
    const trimmed = username.trim().toLowerCase();
    if (trimmed.length < 3 || !available) return;

    setSaving(true);
    setError(null);

    const result = await saveUsername(trimmed);
    if ("error" in result) {
      setError(result.error);
      setSaving(false);
      return;
    }

    onContinue();
  }

  const canContinue = username.trim().length >= 3 && available === true && !checking && !saving;

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
        <h1 className="text-3xl font-bold text-neutral-900 mb-2">Your username</h1>
        <p className="text-neutral-500 mb-8">How do you want to be known on Bookfolio?</p>

        <div className="max-w-sm w-full mx-auto space-y-4">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 font-medium">@</span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ""))}
              placeholder="username"
              maxLength={30}
              autoFocus
              className="w-full pl-9 pr-12 py-4 rounded-xl border border-black/10 focus:border-neutral-400 focus:outline-none text-lg"
            />
            {checking && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <PulsingDots />
              </div>
            )}
            {!checking && available === true && username.length >= 3 && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
            {!checking && available === false && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-red-500">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            )}
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
          {!checking && available === false && !error && (
            <p className="text-sm text-red-500">This username is taken</p>
          )}

          <p className="text-sm text-neutral-400">You can always change this later</p>
        </div>
      </div>

      <div className="px-8 pb-12">
        <button
          onClick={handleContinue}
          disabled={!canContinue}
          className="w-full py-4 rounded-full text-lg font-semibold text-white transition-colors disabled:opacity-40"
          style={{ background: canContinue ? "var(--onboarding-teal)" : "var(--onboarding-teal)" }}
        >
          {saving ? "Saving..." : "Continue"}
        </button>
      </div>
    </div>
  );
}
