import { createClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";

// Plain Supabase client for cached queries (no cookies needed)
function getAnonClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export const getProfileStats = (profileId: string) =>
  unstable_cache(
    async () => {
      const supabase = getAnonClient();

      const now = new Date();
      const currentYear = now.getFullYear();
      const yearStart = `${currentYear}-01-01`;
      const yearEnd = `${currentYear}-12-31`;
      const twelveWeeksAgo = new Date(now.getTime() - 12 * 7 * 24 * 60 * 60 * 1000).toISOString();

      const [
        referralResult,
        followersResult,
        followingResult,
        fictionResult,
        nonfictionResult,
        wantToReadCountResult,
        favoritesResult,
        currentlyReadingResult,
        weeklyActivityResult,
        userRankResult,
        booksThisYearResult,
        listsCountResult,
      ] = await Promise.all([
        supabase
          .from("referrals")
          .select("id", { count: "exact", head: true })
          .eq("referrer_id", profileId),
        supabase
          .from("follows")
          .select("*", { count: "exact", head: true })
          .eq("following_id", profileId),
        supabase
          .from("follows")
          .select("*", { count: "exact", head: true })
          .eq("follower_id", profileId),
        supabase
          .from("user_books")
          .select("id", { count: "exact", head: true })
          .eq("user_id", profileId)
          .eq("category", "fiction"),
        supabase
          .from("user_books")
          .select("id", { count: "exact", head: true })
          .eq("user_id", profileId)
          .eq("category", "nonfiction"),
        supabase
          .from("want_to_read")
          .select("id", { count: "exact", head: true })
          .eq("user_id", profileId),
        supabase
          .from("favorite_books")
          .select("*")
          .eq("user_id", profileId)
          .order("position"),
        supabase
          .from("currently_reading")
          .select("*")
          .eq("user_id", profileId)
          .order("started_at", { ascending: false }),
        supabase
          .from("activity")
          .select("created_at")
          .eq("user_id", profileId)
          .gte("created_at", twelveWeeksAgo)
          .order("created_at", { ascending: false }),
        supabase.rpc("get_user_book_rank", { target_user_id: profileId }),
        supabase
          .from("user_books")
          .select("id", { count: "exact", head: true })
          .eq("user_id", profileId)
          .gte("finished_at", yearStart)
          .lte("finished_at", yearEnd),
        supabase
          .from("book_lists")
          .select("id", { count: "exact", head: true })
          .eq("user_id", profileId)
          .eq("is_public", true),
      ]);

      return {
        referralCount: referralResult.count || 0,
        followersCount: followersResult.count || 0,
        followingCount: followingResult.count || 0,
        fictionCount: fictionResult.count || 0,
        nonfictionCount: nonfictionResult.count || 0,
        wantToReadCount: wantToReadCountResult.count || 0,
        favoriteBooks: favoritesResult.data || [],
        currentlyReading: currentlyReadingResult.data || [],
        weeklyActivity: weeklyActivityResult.data || [],
        userRank: userRankResult.data || 0,
        booksThisYear: booksThisYearResult.count || 0,
        listsCount: listsCountResult.count || 0,
      };
    },
    [`profile-stats-${profileId}`],
    { revalidate: 60, tags: [`profile-${profileId}`] }
  )();

export const getLeaderboardData = () =>
  unstable_cache(
    async () => {
      const supabase = getAnonClient();

      const [likedBooksResult, activeUsersResult] = await Promise.all([
        supabase
          .from("user_books")
          .select("open_library_key, title, author, cover_url, score, category")
          .eq("tier", "liked")
          .order("score", { ascending: false })
          .limit(200),
        supabase
          .from("user_books")
          .select("user_id")
          .limit(1000),
      ]);

      return {
        likedBooks: likedBooksResult.data || [],
        activeUsers: activeUsersResult.data || [],
      };
    },
    ["leaderboard-data"],
    { revalidate: 60, tags: ["leaderboard"] }
  )();
