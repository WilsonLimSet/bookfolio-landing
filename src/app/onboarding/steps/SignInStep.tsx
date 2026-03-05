"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface SignInStepProps {
  onBack: () => void;
}

export default function SignInStep({ onBack }: SignInStepProps) {
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/onboarding`,
      },
    });
  }

  async function handleAppleSignIn() {
    setAppleLoading(true);
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "apple",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/onboarding`,
      },
    });
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
        <h1 className="text-3xl font-bold text-neutral-900 mb-2">Let&apos;s get started</h1>
        <p className="text-neutral-500 mb-12">Sign in to start ranking your books</p>

        <div className="space-y-4 max-w-sm w-full mx-auto">
          {/* Apple Sign In */}
          <button
            onClick={handleAppleSignIn}
            disabled={appleLoading || googleLoading}
            className="w-full px-6 py-4 bg-black text-white rounded-full font-medium flex items-center justify-center gap-3 hover:bg-neutral-800 transition-colors disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
            </svg>
            {appleLoading ? "Redirecting..." : "Continue with Apple"}
          </button>

          {/* Google Sign In */}
          <button
            onClick={handleGoogleSignIn}
            disabled={googleLoading || appleLoading}
            className="w-full px-6 py-4 bg-neutral-100 text-neutral-900 rounded-full font-medium flex items-center justify-center gap-3 hover:bg-neutral-200 transition-colors disabled:opacity-50"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853" />
              <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
            </svg>
            {googleLoading ? "Redirecting..." : "Continue with Google"}
          </button>
        </div>

        <div className="mt-auto pb-8 text-center">
          <p className="text-xs text-neutral-400">
            By continuing, you agree to our{" "}
            <a href="/terms" className="underline">Terms of Service</a>
            {" "}and{" "}
            <a href="/privacy" className="underline">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
}
