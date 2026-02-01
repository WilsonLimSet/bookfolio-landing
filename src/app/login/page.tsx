"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { login, signup } from "./actions";
import Link from "next/link";

function LoginForm() {
  const searchParams = useSearchParams();
  const referralCode = searchParams.get("ref");

  const [isSignUp, setIsSignUp] = useState(false);
  const [referrerName, setReferrerName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // If there's a referral code, default to sign up mode
  useEffect(() => {
    if (referralCode) {
      setIsSignUp(true);
      setReferrerName(referralCode); // Referral code is the username
    }
  }, [referralCode]);

  async function handleSubmit(formData: FormData) {
    setError(null);
    setSuccess(null);
    setLoading(true);

    const result = isSignUp ? await signup(formData) : await login(formData);

    setLoading(false);

    if (result && "error" in result) {
      setError(result.error);
    } else if (result && "success" in result && result.message) {
      setSuccess(result.message);
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
          <h1 className="mt-6 text-3xl font-bold">
            {isSignUp ? "Create an account" : "Welcome back"}
          </h1>
          <p className="mt-2 text-neutral-600">
            {isSignUp
              ? "Sign up to share your favorite books"
              : "Sign in to your account"}
          </p>
        </div>

        <form action={handleSubmit} className="space-y-4">
          {referralCode && (
            <input type="hidden" name="referral_code" value={referralCode} />
          )}

          {isSignUp && referrerName && (
            <div className="p-3 bg-blue-50 text-blue-700 rounded-lg text-sm">
              Invited by <span className="font-semibold">@{referrerName}</span>
            </div>
          )}

          {isSignUp && (
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
          )}

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-neutral-700 mb-1"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full px-4 py-3 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-neutral-700 mb-1"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              className="w-full px-4 py-3 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-50 text-green-700 rounded-lg text-sm">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-3 bg-neutral-900 text-white rounded-lg font-medium hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading
              ? "Loading..."
              : isSignUp
                ? "Create Account"
                : "Sign In"}
          </button>
        </form>

        <div className="text-center">
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
              setSuccess(null);
            }}
            className="text-neutral-600 hover:text-neutral-900 text-sm"
          >
            {isSignUp
              ? "Already have an account? Sign in"
              : "Don't have an account? Sign up"}
          </button>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin" />
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
