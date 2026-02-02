"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import FollowButton from "./FollowButton";

interface UserSearchProps {
  currentUserId: string;
  followingIds: string[];
}

interface UserResult {
  id: string;
  username: string;
}

export default function UserSearch({ currentUserId, followingIds }: UserSearchProps) {
  const supabase = createClient();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [followingState, setFollowingState] = useState<Set<string>>(new Set(followingIds));
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!query.trim()) {
      // Use timeout to avoid synchronous setState in effect
      searchTimeoutRef.current = setTimeout(() => {
        setResults([]);
        setIsSearching(false);
      }, 0);
      return;
    }

    // Use immediate timeout to set loading state (to avoid synchronous setState)
    const loadingTimeout = setTimeout(() => setIsSearching(true), 0);

    searchTimeoutRef.current = setTimeout(async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, username")
        .ilike("username", `%${query}%`)
        .neq("id", currentUserId)
        .limit(10);

      setResults(data || []);
      setIsSearching(false);
    }, 300);

    return () => {
      clearTimeout(loadingTimeout);
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query, currentUserId, supabase]);

  return (
    <div>
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for people..."
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-neutral-200 focus:border-neutral-400 focus:outline-none"
        />
        {isSearching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-5 h-5 border-2 border-neutral-300 border-t-neutral-600 rounded-full animate-spin" />
          </div>
        )}
      </div>

      {results.length > 0 && (
        <div className="mt-3 space-y-2">
          {results.map((user) => (
            <div
              key={user.id}
              className="flex items-center justify-between p-3 bg-white border border-neutral-100 rounded-xl"
            >
              <Link
                href={`/profile/${user.username}`}
                className="flex items-center gap-3 min-w-0 flex-1"
              >
                <div className="w-10 h-10 bg-neutral-200 rounded-full flex items-center justify-center text-sm font-bold text-neutral-500 flex-shrink-0">
                  {user.username[0].toUpperCase()}
                </div>
                <p className="font-medium text-sm truncate">{user.username}</p>
              </Link>
              <FollowButton
                targetUserId={user.id}
                targetUsername={user.username}
                isFollowing={followingState.has(user.id)}
                currentUserId={currentUserId}
                onFollowChange={(isNowFollowing) => {
                  setFollowingState(prev => {
                    const next = new Set(prev);
                    if (isNowFollowing) {
                      next.add(user.id);
                    } else {
                      next.delete(user.id);
                    }
                    return next;
                  });
                }}
              />
            </div>
          ))}
        </div>
      )}

      {query && !isSearching && results.length === 0 && (
        <p className="mt-4 text-center text-sm text-neutral-500">
          No users found matching &quot;{query}&quot;
        </p>
      )}
    </div>
  );
}
