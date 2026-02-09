"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

interface Comment {
  id: string;
  user_id: string;
  comment_text: string;
  created_at: string;
}

interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
}

interface CommentSectionProps {
  reviewId: string;
  reviewUserId: string;
  reviewBookTitle: string;
  currentUserId: string | null;
}

export default function CommentSection({
  reviewId,
  reviewUserId,
  reviewBookTitle,
  currentUserId,
}: CommentSectionProps) {
  const supabase = createClient();
  const [comments, setComments] = useState<Comment[]>([]);
  const [profiles, setProfiles] = useState<Map<string, Profile>>(new Map());
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadComments = useCallback(async () => {
    const { data: commentsData } = await supabase
      .from("review_comments")
      .select("*")
      .eq("review_id", reviewId)
      .order("created_at", { ascending: true });

    if (commentsData && commentsData.length > 0) {
      setComments(commentsData);

      // Load profiles
      const userIds = [...new Set(commentsData.map(c => c.user_id))];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .in("id", userIds);

      const profileMap = new Map(profilesData?.map(p => [p.id, p]) || []);
      setProfiles(profileMap);
    } else {
      setComments([]);
    }

    setIsLoading(false);
  }, [supabase, reviewId]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!currentUserId || !newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const { data: comment, error } = await supabase
        .from("review_comments")
        .insert({
          user_id: currentUserId,
          review_id: reviewId,
          comment_text: newComment.trim(),
        })
        .select()
        .single();

      if (error) throw error;

      // Create notification if commenting on someone else's review
      if (reviewUserId !== currentUserId) {
        await supabase.from("notifications").insert({
          user_id: reviewUserId,
          type: "comment",
          from_user_id: currentUserId,
          book_title: reviewBookTitle,
          review_id: reviewId,
        });
      }

      // Get current user's profile if not already loaded
      if (!profiles.has(currentUserId)) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, username, avatar_url")
          .eq("id", currentUserId)
          .single();

        if (profile) {
          setProfiles(new Map(profiles).set(currentUserId, profile));
        }
      }

      setComments([...comments, comment]);
      setNewComment("");
    } catch (error) {
      console.error("Error posting comment:", error);
      alert("Failed to post comment");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(commentId: string) {
    if (!confirm("Delete this comment?")) return;

    try {
      await supabase
        .from("review_comments")
        .delete()
        .eq("id", commentId);

      setComments(comments.filter(c => c.id !== commentId));
    } catch (error) {
      console.error("Error deleting comment:", error);
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="w-6 h-6 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Comment Form */}
      {currentUserId ? (
        <form onSubmit={handleSubmit} className="flex gap-3">
          <div className="w-10 h-10 bg-neutral-200 rounded-full flex-shrink-0" />
          <div className="flex-1">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-neutral-400 focus:outline-none resize-none text-sm"
              rows={2}
              maxLength={500}
            />
            <div className="flex justify-end mt-2">
              <button
                type="submit"
                disabled={!newComment.trim() || isSubmitting}
                className="px-4 py-2 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? "Posting..." : "Post"}
              </button>
            </div>
          </div>
        </form>
      ) : (
        <Link
          href="/login"
          className="block text-center py-4 bg-neutral-50 rounded-xl text-sm text-neutral-600 hover:bg-neutral-100 transition-colors"
        >
          Sign in to comment
        </Link>
      )}

      {/* Comments List */}
      {comments.length > 0 ? (
        <div className="space-y-4">
          {comments.map((comment) => {
            const profile = profiles.get(comment.user_id);
            const isOwn = comment.user_id === currentUserId;

            return (
              <div key={comment.id} className="flex gap-3">
                <Link
                  href={`/profile/${profile?.username}`}
                  className="w-10 h-10 bg-neutral-200 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center text-sm font-bold text-neutral-500 relative"
                >
                  {profile?.avatar_url ? (
                    <Image src={profile.avatar_url} alt="" fill sizes="40px" className="object-cover" />
                  ) : (
                    (profile?.username || "?")[0].toUpperCase()
                  )}
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="bg-neutral-50 rounded-xl px-4 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <Link
                        href={`/profile/${profile?.username}`}
                        className="font-medium text-sm hover:underline"
                      >
                        {profile?.username || "Someone"}
                      </Link>
                      {isOwn && (
                        <button
                          onClick={() => handleDelete(comment.id)}
                          className="text-xs text-neutral-400 hover:text-red-500"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-neutral-700 mt-1">{comment.comment_text}</p>
                  </div>
                  <p className="text-xs text-neutral-400 mt-1 ml-4">
                    {getTimeAgo(new Date(comment.created_at))}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-center text-neutral-400 text-sm py-4">
          No comments yet. Be the first to comment!
        </p>
      )}
    </div>
  );
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString();
}
