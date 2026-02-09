"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { revalidateProfile } from "@/app/actions";

interface FollowButtonProps {
  targetUserId: string;
  targetUsername: string;
  isFollowing: boolean;
  currentUserId: string | null;
  onFollowChange?: (isFollowing: boolean) => void;
}

export default function FollowButton({
  targetUserId,
  targetUsername: _targetUsername,
  isFollowing: initialIsFollowing,
  currentUserId,
  onFollowChange,
}: FollowButtonProps) {
  void _targetUsername; // Reserved for future use (e.g., "Follow @username")
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleToggle() {
    if (!currentUserId) {
      router.push("/login");
      return;
    }

    const wasFollowing = isFollowing;
    setIsFollowing(!wasFollowing);
    setLoading(true);

    try {
      if (wasFollowing) {
        const { error } = await supabase
          .from("follows")
          .delete()
          .eq("follower_id", currentUserId)
          .eq("following_id", targetUserId);
        if (error) throw error;
        onFollowChange?.(false);
      } else {
        const { error } = await supabase.from("follows").insert({
          follower_id: currentUserId,
          following_id: targetUserId,
        });
        if (error) throw error;

        // Log activity (don't block on this)
        supabase.from("activity").insert({
          user_id: currentUserId,
          action_type: "followed",
          target_user_id: targetUserId,
        });

        onFollowChange?.(true);
      }
      // Invalidate cached profile stats for both users
      await Promise.all([
        revalidateProfile(targetUserId),
        revalidateProfile(currentUserId),
      ]);
      router.refresh();
    } catch {
      // Revert on error
      setIsFollowing(wasFollowing);
    } finally {
      setLoading(false);
    }
  }

  // Don't show follow button for own profile
  if (currentUserId === targetUserId) {
    return null;
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
        isFollowing
          ? "bg-neutral-100 text-neutral-600 hover:bg-red-50 hover:text-red-600"
          : "bg-neutral-900 text-white hover:bg-neutral-800"
      }`}
    >
      {loading ? "..." : isFollowing ? "Following" : "Follow"}
    </button>
  );
}
