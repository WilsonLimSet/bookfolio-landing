"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { PulsingDots } from "@/components/Skeleton";

interface UserResult {
  id: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
}

interface FindFriendsStepProps {
  onContinue: () => void;
  onBack: () => void;
  onSkip: () => void;
  userId: string;
}

export default function FindFriendsStep({ onContinue, onBack, onSkip, userId }: FindFriendsStepProps) {
  const supabase = useMemo(() => createClient(), []);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserResult[]>([]);
  const [suggested, setSuggested] = useState<UserResult[]>([]);
  const [following, setFollowing] = useState<Set<string>>(new Set());
  const [searching, setSearching] = useState(false);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  // Load suggested users
  useEffect(() => {
    async function loadSuggested() {
      const { data } = await supabase
        .from("profiles")
        .select("id, username, avatar_url, bio")
        .neq("id", userId)
        .not("username", "is", null)
        .limit(10);

      if (data) setSuggested(data);
    }
    loadSuggested();
  }, [supabase, userId]);

  // Search users
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    if (!query.trim()) {
      setResults([]);
      return;
    }

    setSearching(true);
    searchTimeout.current = setTimeout(async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, username, avatar_url, bio")
        .neq("id", userId)
        .ilike("username", `%${query}%`)
        .limit(10);

      setResults(data || []);
      setSearching(false);
    }, 300);

    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [query, supabase, userId]);

  async function toggleFollow(targetId: string) {
    if (following.has(targetId)) {
      await supabase.from("follows").delete().eq("follower_id", userId).eq("following_id", targetId);
      setFollowing((prev) => {
        const next = new Set(prev);
        next.delete(targetId);
        return next;
      });
    } else {
      await supabase.from("follows").insert({ follower_id: userId, following_id: targetId });
      setFollowing((prev) => new Set(prev).add(targetId));
    }
  }

  const displayUsers = query.trim() ? results : suggested;

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
        <h1 className="text-3xl font-bold text-neutral-900 mb-2">Find readers you know</h1>
        <p className="text-neutral-500 mb-6">Follow people to see their rankings and reviews</p>

        <div className="relative mb-6">
          <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by username"
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-black/10 focus:border-neutral-400 focus:outline-none"
          />
          {searching && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <PulsingDots />
            </div>
          )}
        </div>

        {!query.trim() && suggested.length > 0 && (
          <p className="text-xs text-neutral-400 uppercase tracking-wider mb-3 font-medium">Suggested</p>
        )}

        <div className="flex-1 overflow-y-auto space-y-1">
          {displayUsers.map((user) => (
            <div key={user.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-neutral-50">
              <div className="w-10 h-10 rounded-full bg-neutral-100 overflow-hidden flex-shrink-0 relative">
                {user.avatar_url ? (
                  <Image src={user.avatar_url} alt="" fill sizes="40px" className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-neutral-400 font-bold text-sm">
                    {user.username?.[0]?.toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-neutral-900">@{user.username}</p>
                {user.bio && <p className="text-xs text-neutral-400 truncate">{user.bio}</p>}
              </div>
              <button
                onClick={() => toggleFollow(user.id)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  following.has(user.id)
                    ? "bg-neutral-100 text-neutral-600"
                    : "text-white"
                }`}
                style={!following.has(user.id) ? { background: "var(--onboarding-teal)" } : undefined}
              >
                {following.has(user.id) ? "Following" : "Follow"}
              </button>
            </div>
          ))}

          {query.trim() && results.length === 0 && !searching && (
            <p className="text-center text-neutral-400 py-8">No users found</p>
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
