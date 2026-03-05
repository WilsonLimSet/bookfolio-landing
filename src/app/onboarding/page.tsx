"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { completeOnboarding, getOnboardingProfile } from "./actions";
import WelcomeCarousel from "./steps/WelcomeCarousel";
import SignInStep from "./steps/SignInStep";
import UsernameStep from "./steps/UsernameStep";
import ProfilePhotoStep from "./steps/ProfilePhotoStep";
import ReadingGoalStep from "./steps/ReadingGoalStep";
import GenreStep from "./steps/GenreStep";
import FindFriendsStep from "./steps/FindFriendsStep";
import InviteStep from "./steps/InviteStep";
import { PulsingDots } from "@/components/Skeleton";
import ImportStep from "./steps/ImportStep";

type Step =
  | "carousel"
  | "signin"
  | "username"
  | "photo"
  | "reading-goal"
  | "genres"
  | "find-friends"
  | "invite"
  | "import";

const STEP_ORDER: Step[] = [
  "carousel",
  "signin",
  "username",
  "photo",
  "reading-goal",
  "genres",
  "find-friends",
  "invite",
  "import",
];

const STORAGE_KEY = "bookfolio_onboarding_step";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("carousel");
  const [direction, setDirection] = useState(1);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<{
    username: string | null;
    avatar_url: string | null;
    reading_goal_2025: number | null;
    favorite_genres: string[] | null;
    onboarding_completed: boolean | null;
    referral_code: string | null;
  } | null>(null);

  // Check auth state and determine starting step
  useEffect(() => {
    async function init() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setUserId(user.id);
        const profileData = await getOnboardingProfile();

        if (profileData) {
          setProfile(profileData);

          // Already completed onboarding
          if (profileData.onboarding_completed) {
            router.replace("/feed");
            return;
          }

          // Determine starting step based on what's been completed
          const savedStep = localStorage.getItem(STORAGE_KEY) as Step | null;

          if (savedStep && STEP_ORDER.includes(savedStep)) {
            // Skip carousel/signin if already authenticated
            const stepIndex = STEP_ORDER.indexOf(savedStep);
            const usernameIndex = STEP_ORDER.indexOf("username");
            if (stepIndex >= usernameIndex) {
              // Don't go back before username if already signed in
              if (!profileData.username && savedStep !== "username") {
                setStep("username");
              } else if (profileData.username && savedStep === "username") {
                setStep("photo");
              } else {
                setStep(savedStep);
              }
            } else {
              // Already signed in, skip to username or photo
              setStep(profileData.username ? "photo" : "username");
            }
          } else {
            // No saved step, skip to username or photo
            setStep(profileData.username ? "photo" : "username");
          }
        }
      } else {
        // Not signed in — check for saved step in pre-auth flow
        const savedStep = localStorage.getItem(STORAGE_KEY) as Step | null;
        if (savedStep === "signin") {
          setStep("signin");
        }
        // Otherwise start at carousel
      }

      setLoading(false);
    }

    init();
  }, [router]);

  const goToStep = useCallback(
    (nextStep: Step) => {
      const currentIndex = STEP_ORDER.indexOf(step);
      const nextIndex = STEP_ORDER.indexOf(nextStep);
      setDirection(nextIndex > currentIndex ? 1 : -1);
      setStep(nextStep);
      localStorage.setItem(STORAGE_KEY, nextStep);
    },
    [step]
  );

  const goBack = useCallback(() => {
    const currentIndex = STEP_ORDER.indexOf(step);
    if (currentIndex > 0) {
      const prevStep = STEP_ORDER[currentIndex - 1];
      // Skip signin/carousel if already authenticated
      if (userId && (prevStep === "signin" || prevStep === "carousel")) {
        return; // Don't go back to auth steps
      }
      goToStep(prevStep);
    }
  }, [step, userId, goToStep]);

  const [finishError, setFinishError] = useState<string | null>(null);

  async function handleFinish() {
    setFinishError(null);
    const result = await completeOnboarding();
    if ("error" in result) {
      setFinishError(result.error);
      return;
    }
    localStorage.removeItem(STORAGE_KEY);
    router.replace("/feed");
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <PulsingDots />
      </main>
    );
  }

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? "100%" : "-100%",
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? "-100%" : "100%",
      opacity: 0,
    }),
  };

  // Carousel and SignIn are full-screen without slide animation wrapper
  if (step === "carousel") {
    return (
      <WelcomeCarousel
        onGetStarted={() => goToStep("signin")}
        onLogin={() => goToStep("signin")}
      />
    );
  }

  if (step === "signin") {
    return <SignInStep onBack={() => goToStep("carousel")} />;
  }

  return (
    <AnimatePresence mode="wait" custom={direction}>
      <motion.div
        key={step}
        custom={direction}
        variants={slideVariants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{ duration: 0.25, ease: "easeInOut" }}
      >
        {step === "username" && (
          <UsernameStep
            onContinue={() => goToStep("photo")}
            onBack={goBack}
            initialUsername={profile?.username || undefined}
          />
        )}

        {step === "photo" && (
          <ProfilePhotoStep
            onContinue={() => goToStep("reading-goal")}
            onBack={goBack}
            onSkip={() => goToStep("reading-goal")}
          />
        )}

        {step === "reading-goal" && (
          <ReadingGoalStep
            onContinue={() => goToStep("genres")}
            onBack={goBack}
            onSkip={() => goToStep("genres")}
            initialGoal={profile?.reading_goal_2025}
          />
        )}

        {step === "genres" && (
          <GenreStep
            onContinue={() => goToStep("find-friends")}
            onBack={goBack}
            onSkip={() => goToStep("find-friends")}
            initialGenres={profile?.favorite_genres || undefined}
          />
        )}

        {step === "find-friends" && (
          userId ? (
            <FindFriendsStep
              onContinue={() => goToStep("invite")}
              onBack={goBack}
              onSkip={() => goToStep("invite")}
              userId={userId}
            />
          ) : (
            <div className="min-h-screen flex items-center justify-center">
              <PulsingDots />
            </div>
          )
        )}

        {step === "invite" && (
          <InviteStep
            onContinue={() => goToStep("import")}
            onBack={goBack}
            onSkip={() => goToStep("import")}
            referralCode={profile?.referral_code || profile?.username || ""}
          />
        )}

        {step === "import" && (
          <ImportStep
            onFinish={handleFinish}
            onBack={goBack}
            error={finishError}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
}
