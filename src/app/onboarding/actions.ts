"use server";

import { revalidateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";

type ActionResult = { error: string } | { success: true };

export async function checkUsernameAvailability(
  username: string
): Promise<{ available: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let query = supabase
    .from("profiles")
    .select("username")
    .eq("username", username);

  // Exclude current user so re-entering onboarding doesn't block own username
  if (user) {
    query = query.neq("id", user.id);
  }

  const { data } = await query.maybeSingle();

  return { available: !data };
}

export async function saveUsername(username: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  // Check availability (exclude current user)
  const { data: existing } = await supabase
    .from("profiles")
    .select("username")
    .eq("username", username)
    .neq("id", user.id)
    .maybeSingle();

  if (existing) return { error: "Username is already taken" };

  const { error } = await supabase
    .from("profiles")
    .update({ username })
    .eq("id", user.id);

  if (error) return { error: "Failed to set username" };

  return { success: true };
}

export async function saveAvatar(formData: FormData): Promise<ActionResult & { url?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const file = formData.get("avatar") as File;
  if (!file) return { error: "No file provided" };

  const fileExt = file.name.split(".").pop();
  const filePath = `${user.id}/avatar.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(filePath, file, { upsert: true });

  if (uploadError) return { error: "Failed to upload avatar" };

  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(filePath);

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
    .eq("id", user.id);

  if (error) return { error: "Failed to save avatar" };

  return { success: true, url: publicUrl };
}

export async function saveReadingGoal(goal: number): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("profiles")
    .update({ reading_goal_2025: goal, updated_at: new Date().toISOString() })
    .eq("id", user.id);

  if (error) return { error: "Failed to save reading goal" };

  return { success: true };
}

export async function saveGenres(genres: string[]): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("profiles")
    .update({ favorite_genres: genres, updated_at: new Date().toISOString() })
    .eq("id", user.id);

  if (error) return { error: "Failed to save genres" };

  return { success: true };
}

export async function completeOnboarding(): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase
    .from("profiles")
    .update({ onboarding_completed: true, updated_at: new Date().toISOString() })
    .eq("id", user.id);

  if (error) return { error: "Failed to complete onboarding" };

  revalidateTag(`profile-${user.id}`, "max");

  return { success: true };
}

export async function updateReferralBadge(): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { count } = await supabase
    .from("referrals")
    .select("id", { count: "exact", head: true })
    .eq("referrer_id", user.id);

  const referralCount = count || 0;
  let badge: string | null = null;

  if (referralCount >= 5) {
    badge = "ambassador";
  } else if (referralCount >= 1) {
    badge = "connector";
  }

  const { error } = await supabase
    .from("profiles")
    .update({ referral_badge: badge })
    .eq("id", user.id);

  if (error) return { error: "Failed to update badge" };

  revalidateTag(`profile-${user.id}`, "max");

  return { success: true };
}

export async function getOnboardingProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, avatar_url, reading_goal_2025, favorite_genres, onboarding_completed, referral_code")
    .eq("id", user.id)
    .single();

  return profile ? { ...profile, userId: user.id } : null;
}
