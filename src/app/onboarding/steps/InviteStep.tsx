"use client";

import { useState } from "react";

interface InviteStepProps {
  onContinue: () => void;
  onBack: () => void;
  onSkip: () => void;
  referralCode: string;
  referralCount?: number;
}

const TIERS = [
  { count: 1, label: "Connector", icon: "link" },
  { count: 3, label: "Social Links", icon: "share" },
  { count: 5, label: "Ambassador", icon: "star" },
  { count: 10, label: "Accent Color", icon: "palette" },
];

export default function InviteStep({ onContinue, onBack, onSkip, referralCode, referralCount = 0 }: InviteStepProps) {
  const [copied, setCopied] = useState(false);

  const referralUrl = typeof window !== "undefined"
    ? `${window.location.origin}/login?ref=${referralCode}`
    : "";

  const shareText = "I ranked my top books on Bookfolio. See if we agree!";

  async function handleCopy() {
    await navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join me on Bookfolio",
          text: shareText,
          url: referralUrl,
        });
      } catch {
        // User cancelled share
      }
    } else {
      handleCopy();
    }
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

      <div className="flex-1 flex flex-col items-center px-8 pt-4">
        <h1 className="text-3xl font-bold text-neutral-900 mb-2 text-center">Invite your friends</h1>
        <p className="text-neutral-500 mb-8 text-center">Share your link and unlock rewards as friends join.</p>

        {/* Reward Tiers */}
        <div className="w-full max-w-sm mb-8">
          <div className="flex items-center justify-between relative">
            {/* Progress line */}
            <div className="absolute top-5 left-[10%] right-[10%] h-0.5 bg-neutral-200" />
            <div
              className="absolute top-5 left-[10%] h-0.5 bg-green-500 transition-all duration-500"
              style={{
                width: referralCount >= 10 ? "80%" :
                       referralCount >= 5 ? "53%" :
                       referralCount >= 3 ? "27%" :
                       referralCount >= 1 ? "0%" : "0%",
              }}
            />

            {TIERS.map((tier) => {
              const isUnlocked = referralCount >= tier.count;
              return (
                <div key={tier.count} className="flex flex-col items-center z-10 relative">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                      isUnlocked
                        ? "bg-green-500 text-white"
                        : "bg-neutral-100 text-neutral-400 border-2 border-black/10"
                    }`}
                  >
                    {isUnlocked ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      tier.count
                    )}
                  </div>
                  <span className={`text-[10px] mt-1.5 font-medium text-center leading-tight ${
                    isUnlocked ? "text-green-600" : "text-neutral-400"
                  }`}>
                    {tier.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {referralCount > 0 && (
          <p className="text-sm text-green-600 font-medium mb-4">
            {referralCount} {referralCount === 1 ? "friend has" : "friends have"} joined!
          </p>
        )}

        <div className="w-full max-w-sm space-y-4">
          {referralCode ? (
            <>
              <button
                onClick={handleShare}
                className="w-full py-4 rounded-full text-lg font-semibold text-white transition-colors"
                style={{ background: "var(--onboarding-teal)" }}
              >
                Share invite link
              </button>

              <button
                onClick={handleCopy}
                className="w-full py-3 rounded-full text-sm font-medium border border-black/10 text-neutral-600 hover:bg-neutral-50 transition-colors"
              >
                {copied ? "Copied!" : "Copy link"}
              </button>
            </>
          ) : (
            <p className="text-sm text-neutral-400 text-center">Your referral link will be available after you set up your profile.</p>
          )}
        </div>
      </div>

      <div className="px-8 pb-12 space-y-3">
        <button
          onClick={onContinue}
          className="w-full py-4 rounded-full text-lg font-semibold text-white transition-colors"
          style={{ background: "var(--onboarding-teal)" }}
        >
          Continue
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
