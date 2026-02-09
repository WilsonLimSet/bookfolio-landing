"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import LikeButton from "./LikeButton";

type Tab = "friends" | "you" | "incoming";

interface FeedTabsProps {
  currentUserId: string;
  followingIds: string[];
  currentUsername: string;
}

interface ReviewData {
  id: string;
  user_id: string;
  title: string;
  author: string | null;
  cover_url: string | null;
  open_library_key: string | null;
  score: number;
  tier: string;
  category: string;
  review_text: string | null;
  finished_at: string | null;
  created_at: string;
}

interface Notification {
  id: string;
  type: string;
  from_user_id: string | null;
  book_title: string | null;
  book_key: string | null;
  review_id: string | null;
  read: boolean;
  created_at: string;
}

interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
}

export default function FeedTabs({ currentUserId, followingIds, currentUsername }: FeedTabsProps) {
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<Tab>("friends");
  const [loading, setLoading] = useState(true);

  // Data for each tab
  const [friendsActivity, setFriendsActivity] = useState<ReviewData[]>([]);
  const [yourActivity, setYourActivity] = useState<ReviewData[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [profiles, setProfiles] = useState<Map<string, Profile>>(new Map());
  const [likeCounts, setLikeCounts] = useState<Map<string, number>>(new Map());
  const [userLikes, setUserLikes] = useState<Set<string>>(new Set());
  const [unreadCount, setUnreadCount] = useState(0);

  // Cache: track which tabs have been loaded to avoid re-fetching
  const loadedTabs = useRef<Set<Tab>>(new Set());

  const loadFriendsActivity = useCallback(async () => {
    // Get ranked books from people you follow (with reviews)
    let query = supabase
      .from("user_books")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (followingIds.length > 0) {
      query = query.in("user_id", followingIds);
    }

    const { data: reviews } = await query;

    if (reviews && reviews.length > 0) {
      // Get profiles
      const userIds = [...new Set(reviews.map(r => r.user_id))];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .in("id", userIds);

      setProfiles(prev => {
        const merged = new Map(prev);
        profilesData?.forEach(p => merged.set(p.id, p));
        return merged;
      });

      // Get like counts and user's likes
      const reviewIds = reviews.map(r => r.id);
      const [likesResult, userLikesResult] = await Promise.all([
        supabase
          .from("review_likes")
          .select("review_id")
          .in("review_id", reviewIds),
        supabase
          .from("review_likes")
          .select("review_id")
          .eq("user_id", currentUserId)
          .in("review_id", reviewIds),
      ]);

      // Count likes per review
      setLikeCounts(prev => {
        const merged = new Map(prev);
        likesResult.data?.forEach(like => {
          merged.set(like.review_id, (merged.get(like.review_id) || 0) + 1);
        });
        return merged;
      });

      // Track user's likes
      setUserLikes(prev => {
        const merged = new Set(prev);
        userLikesResult.data?.forEach(l => merged.add(l.review_id));
        return merged;
      });

      setFriendsActivity(reviews);
    } else {
      setFriendsActivity([]);
    }
    loadedTabs.current.add("friends");
  }, [supabase, followingIds, currentUserId]);

  const loadYourActivity = useCallback(async () => {
    const { data: reviews } = await supabase
      .from("user_books")
      .select("*")
      .eq("user_id", currentUserId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (reviews) {
      // Get like counts for your reviews
      const reviewIds = reviews.map(r => r.id);
      const { data: likesData } = await supabase
        .from("review_likes")
        .select("review_id")
        .in("review_id", reviewIds);

      setLikeCounts(prev => {
        const merged = new Map(prev);
        likesData?.forEach(like => {
          merged.set(like.review_id, (merged.get(like.review_id) || 0) + 1);
        });
        return merged;
      });

      setYourActivity(reviews);
    }
    loadedTabs.current.add("you");
  }, [supabase, currentUserId]);

  const loadNotifications = useCallback(async () => {
    const { data: notifs } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", currentUserId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (notifs) {
      // Get profiles for from_user_id
      const userIds = [...new Set(notifs.filter(n => n.from_user_id).map(n => n.from_user_id))];
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, username, avatar_url")
          .in("id", userIds);

        setProfiles(prev => {
          const merged = new Map(prev);
          profilesData?.forEach(p => merged.set(p.id, p));
          return merged;
        });
      }

      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.read).length);

      // Mark notifications as read
      if (notifs.some(n => !n.read)) {
        await supabase
          .from("notifications")
          .update({ read: true })
          .eq("user_id", currentUserId)
          .eq("read", false);
      }
    }
    loadedTabs.current.add("incoming");
  }, [supabase, currentUserId]);

  // Load data based on active tab - skip if already cached
  useEffect(() => {
    if (loadedTabs.current.has(activeTab)) {
      setLoading(false);
      return;
    }

    async function loadTabData() {
      setLoading(true);

      if (activeTab === "friends") {
        await loadFriendsActivity();
      } else if (activeTab === "you") {
        await loadYourActivity();
      } else {
        await loadNotifications();
      }

      setLoading(false);
    }
    loadTabData();
  }, [activeTab, loadFriendsActivity, loadYourActivity, loadNotifications]);

  function handleLikeToggle(reviewId: string, isLiked: boolean) {
    // Update local state
    const newLikes = new Set(userLikes);
    const newCounts = new Map(likeCounts);

    if (isLiked) {
      newLikes.add(reviewId);
      newCounts.set(reviewId, (newCounts.get(reviewId) || 0) + 1);
    } else {
      newLikes.delete(reviewId);
      newCounts.set(reviewId, Math.max(0, (newCounts.get(reviewId) || 1) - 1));
    }

    setUserLikes(newLikes);
    setLikeCounts(newCounts);
  }

  const currentData = activeTab === "friends" ? friendsActivity : activeTab === "you" ? yourActivity : [];

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-neutral-100 rounded-xl mb-6">
        <button
          onClick={() => setActiveTab("friends")}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "friends"
              ? "bg-white text-neutral-900 shadow-sm"
              : "text-neutral-600 hover:text-neutral-900"
          }`}
        >
          Friends
        </button>
        <button
          onClick={() => setActiveTab("you")}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "you"
              ? "bg-white text-neutral-900 shadow-sm"
              : "text-neutral-600 hover:text-neutral-900"
          }`}
        >
          You
        </button>
        <button
          onClick={() => setActiveTab("incoming")}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors relative ${
            activeTab === "incoming"
              ? "bg-white text-neutral-900 shadow-sm"
              : "text-neutral-600 hover:text-neutral-900"
          }`}
        >
          Incoming
          {unreadCount > 0 && activeTab !== "incoming" && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-neutral-100 overflow-hidden">
              <div className="flex items-center gap-3 p-4 pb-3">
                <div className="w-10 h-10 bg-neutral-200 rounded-full animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-24 bg-neutral-200 rounded animate-pulse" />
                  <div className="h-3 w-16 bg-neutral-100 rounded animate-pulse" />
                </div>
              </div>
              <div className="flex gap-4 px-4 pb-4">
                <div className="w-20 h-[120px] bg-neutral-100 rounded-lg animate-pulse" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-4 w-3/4 bg-neutral-200 rounded animate-pulse" />
                  <div className="h-3 w-1/2 bg-neutral-100 rounded animate-pulse" />
                  <div className="h-6 w-8 bg-neutral-100 rounded animate-pulse mt-2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : activeTab === "incoming" ? (
        // Notifications
        notifications.length > 0 ? (
          <div className="space-y-3">
            {notifications.map((notif) => (
              <NotificationItem
                key={notif.id}
                notification={notif}
                profile={notif.from_user_id ? profiles.get(notif.from_user_id) : null}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-neutral-500">
            No notifications yet
          </div>
        )
      ) : currentData.length > 0 ? (
        <div className="space-y-4">
          {currentData.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              profile={activeTab === "you" ? { id: currentUserId, username: currentUsername, avatar_url: null } : profiles.get(review.user_id)}
              likeCount={likeCounts.get(review.id) || 0}
              isLiked={userLikes.has(review.id)}
              currentUserId={currentUserId}
              onLikeToggle={handleLikeToggle}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-neutral-500">
          {activeTab === "friends" && followingIds.length === 0
            ? "Follow some readers to see their activity here!"
            : "No activity yet"}
        </div>
      )}
    </div>
  );
}

function ReviewCard({
  review,
  profile,
  likeCount,
  isLiked,
  currentUserId,
  onLikeToggle,
}: {
  review: ReviewData;
  profile: Profile | null | undefined;
  likeCount: number;
  isLiked: boolean;
  currentUserId: string;
  onLikeToggle: (reviewId: string, isLiked: boolean) => void;
}) {
  const timeAgo = getTimeAgo(new Date(review.created_at));

  return (
    <div className="bg-white rounded-xl border border-neutral-100 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 pb-3">
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
          <Link href={`/profile/${profile?.username}`} className="font-medium text-sm hover:underline">
            {profile?.username || "Someone"}
          </Link>
          <p className="text-xs text-neutral-500">{timeAgo}</p>
        </div>
      </div>

      {/* Book Info */}
      <div className="flex gap-4 px-4">
        <Link
          href={`/book/${review.open_library_key?.replace("/works/", "").replace("/books/", "") || ""}`}
          className="w-20 h-[120px] bg-neutral-100 rounded-lg overflow-hidden flex-shrink-0 shadow-md relative"
        >
          {review.cover_url && (
            <Image src={review.cover_url} alt="" fill sizes="80px" className="object-cover" />
          )}
        </Link>
        <div className="flex-1 min-w-0 py-1">
          <Link
            href={`/book/${review.open_library_key?.replace("/works/", "").replace("/books/", "") || ""}`}
            className="font-semibold hover:underline block"
          >
            {review.title}
          </Link>
          {review.author && (
            <p className="text-sm text-neutral-500">{review.author}</p>
          )}
          <div className="flex items-center gap-2 mt-2">
            <span className={`text-lg font-bold ${
              review.tier === 'liked' ? 'text-green-600' :
              review.tier === 'fine' ? 'text-yellow-600' :
              'text-red-500'
            }`}>
              {review.score}
            </span>
            {review.tier === 'liked' && <span className="text-orange-500">❤️</span>}
          </div>
          {review.finished_at && (
            <p className="text-xs text-neutral-400 mt-1">
              Finished {new Date(review.finished_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </p>
          )}
        </div>
      </div>

      {/* Review Text */}
      {review.review_text && (
        <div className="px-4 py-3">
          <p className="text-sm text-neutral-700 leading-relaxed">
            {review.review_text}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4 px-4 py-3 border-t border-neutral-100">
        <LikeButton
          reviewId={review.id}
          initialLiked={isLiked}
          initialCount={likeCount}
          currentUserId={currentUserId}
          reviewUserId={review.user_id}
          onToggle={onLikeToggle}
        />
        <Link
          href={`/review/${review.id}`}
          className="text-sm text-neutral-500 hover:text-neutral-700 flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          Reply
        </Link>
        <Link
          href={`/book/${review.open_library_key?.replace("/works/", "").replace("/books/", "") || ""}`}
          className="text-sm text-neutral-500 hover:text-neutral-700 flex items-center gap-1 ml-auto"
        >
          Book
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );
}

function NotificationItem({
  notification,
  profile,
}: {
  notification: Notification;
  profile: Profile | null | undefined;
}) {
  const timeAgo = getTimeAgo(new Date(notification.created_at));

  let message = "";
  let link = "/";

  switch (notification.type) {
    case "follow":
      message = "started following you";
      link = `/profile/${profile?.username}`;
      break;
    case "like":
      message = `liked your review of ${notification.book_title}`;
      link = notification.review_id ? `/review/${notification.review_id}` : "/";
      break;
    case "comment":
      message = `commented on your review of ${notification.book_title}`;
      link = notification.review_id ? `/review/${notification.review_id}` : "/";
      break;
    case "friend_ranked":
      message = `ranked ${notification.book_title}`;
      link = notification.book_key ? `/book/${notification.book_key.replace("/works/", "")}` : "/";
      break;
  }

  return (
    <Link
      href={link}
      className={`flex items-center gap-3 p-4 rounded-xl border transition-colors ${
        notification.read
          ? "bg-white border-neutral-100 hover:bg-neutral-50"
          : "bg-blue-50 border-blue-100 hover:bg-blue-100"
      }`}
    >
      <div className="w-10 h-10 bg-neutral-200 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center text-sm font-bold text-neutral-500 relative">
        {profile?.avatar_url ? (
          <Image src={profile.avatar_url} alt="" fill sizes="40px" className="object-cover" />
        ) : (
          (profile?.username || "?")[0].toUpperCase()
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm">
          <span className="font-medium">{profile?.username || "Someone"}</span>{" "}
          {message}
        </p>
        <p className="text-xs text-neutral-500">{timeAgo}</p>
      </div>
    </Link>
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
