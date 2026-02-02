"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface LikeButtonProps {
  reviewId: string;
  initialLiked: boolean;
  initialCount: number;
  currentUserId: string;
  reviewUserId: string;
  onToggle?: (reviewId: string, isLiked: boolean) => void;
}

export default function LikeButton({
  reviewId,
  initialLiked,
  initialCount,
  currentUserId,
  reviewUserId,
  onToggle,
}: LikeButtonProps) {
  const supabase = createClient();
  const [isLiked, setIsLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [isLoading, setIsLoading] = useState(false);

  async function handleToggle() {
    if (isLoading) return;

    setIsLoading(true);
    const newLiked = !isLiked;

    // Optimistic update
    setIsLiked(newLiked);
    setCount(prev => newLiked ? prev + 1 : prev - 1);
    onToggle?.(reviewId, newLiked);

    try {
      if (newLiked) {
        // Like the review
        await supabase.from("review_likes").insert({
          user_id: currentUserId,
          review_id: reviewId,
        });

        // Create notification if liking someone else's review
        if (reviewUserId !== currentUserId) {
          // Get the book info from the review
          const { data: review } = await supabase
            .from("user_books")
            .select("title, open_library_key")
            .eq("id", reviewId)
            .single();

          if (review) {
            await supabase.from("notifications").insert({
              user_id: reviewUserId,
              type: "like",
              from_user_id: currentUserId,
              book_title: review.title,
              book_key: review.open_library_key,
              review_id: reviewId,
            });
          }
        }
      } else {
        // Unlike the review
        await supabase
          .from("review_likes")
          .delete()
          .eq("user_id", currentUserId)
          .eq("review_id", reviewId);
      }
    } catch (error) {
      // Revert on error
      setIsLiked(!newLiked);
      setCount(prev => newLiked ? prev - 1 : prev + 1);
      onToggle?.(reviewId, !newLiked);
      console.error("Error toggling like:", error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isLoading}
      className={`flex items-center gap-1.5 text-sm transition-colors ${
        isLiked
          ? "text-red-500"
          : "text-neutral-500 hover:text-red-500"
      }`}
    >
      <svg
        className="w-5 h-5"
        fill={isLiked ? "currentColor" : "none"}
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
      {count > 0 ? count : "Like"}
    </button>
  );
}
