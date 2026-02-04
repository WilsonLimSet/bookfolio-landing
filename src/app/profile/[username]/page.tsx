import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import FollowButton from "@/components/FollowButton";
import HeaderWrapper from "@/components/HeaderWrapper";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ username: string }>;
}

export default async function ProfilePage({ params }: PageProps) {
  const { username } = await params;
  const supabase = await createClient();

  const REFERRALS_REQUIRED = 3;

  // Get profile and current user in parallel
  const [profileResult, userResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, username, bio, avatar_url, instagram, twitter, reading_goal_2025")
      .eq("username", username)
      .single(),
    supabase.auth.getUser(),
  ]);

  const profile = profileResult.data;
  if (!profile) {
    notFound();
  }

  const user = userResult.data.user;
  const isOwner = user?.id === profile.id;

  // Run all remaining queries in parallel
  const now = new Date();
  const currentYear = now.getFullYear();
  const yearStart = `${currentYear}-01-01`;
  const yearEnd = `${currentYear}-12-31`;
  const twelveWeeksAgo = new Date(now.getTime() - 12 * 7 * 24 * 60 * 60 * 1000).toISOString();

  const [
    referralResult,
    followResult,
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
    // Get referral count to determine if social links should be shown
    supabase
      .from("referrals")
      .select("id", { count: "exact", head: true })
      .eq("referrer_id", profile.id),
    // Check if current user follows this profile
    user && !isOwner
      ? supabase
          .from("follows")
          .select("id")
          .eq("follower_id", user.id)
          .eq("following_id", profile.id)
          .single()
      : Promise.resolve({ data: null }),
    // Get follower count
    supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("following_id", profile.id),
    // Get following count
    supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("follower_id", profile.id),
    // Get fiction book count
    supabase
      .from("user_books")
      .select("id", { count: "exact", head: true })
      .eq("user_id", profile.id)
      .eq("category", "fiction"),
    // Get nonfiction book count
    supabase
      .from("user_books")
      .select("id", { count: "exact", head: true })
      .eq("user_id", profile.id)
      .eq("category", "nonfiction"),
    // Get want to read count
    supabase
      .from("want_to_read")
      .select("id", { count: "exact", head: true })
      .eq("user_id", profile.id),
    // Get favorite books
    supabase
      .from("favorite_books")
      .select("*")
      .eq("user_id", profile.id)
      .order("position"),
    // Get currently reading
    supabase
      .from("currently_reading")
      .select("*")
      .eq("user_id", profile.id)
      .order("started_at", { ascending: false }),
    // Get weekly activity for streak calculation (last 12 weeks)
    supabase
      .from("activity")
      .select("created_at")
      .eq("user_id", profile.id)
      .gte("created_at", twelveWeeksAgo)
      .order("created_at", { ascending: false }),
    // Get user's rank efficiently using SQL
    supabase.rpc("get_user_book_rank", { target_user_id: profile.id }),
    // Get books finished this year (for reading goal)
    supabase
      .from("user_books")
      .select("id", { count: "exact", head: true })
      .eq("user_id", profile.id)
      .gte("finished_at", yearStart)
      .lte("finished_at", yearEnd),
    // Get public lists count
    supabase
      .from("book_lists")
      .select("id", { count: "exact", head: true })
      .eq("user_id", profile.id)
      .eq("is_public", true),
  ]);

  const referralCount = referralResult.count || 0;
  const showSocialLinks = referralCount >= REFERRALS_REQUIRED;
  const isFollowing = !!followResult.data;
  const followersCount = followersResult.count || 0;
  const followingCount = followingResult.count || 0;
  const fictionCount = fictionResult.count || 0;
  const nonfictionCount = nonfictionResult.count || 0;
  const totalBooksRead = fictionCount + nonfictionCount;
  const wantToReadCount = wantToReadCountResult.count || 0;
  const listsCount = listsCountResult.count || 0;
  const favoriteBooks = favoritesResult.data;
  const currentlyReading = currentlyReadingResult.data || [];
  const hasFavorites = (favoriteBooks?.length || 0) > 0;

  // Calculate weekly streak
  const weeklyActivity = weeklyActivityResult.data || [];
  const weekStreak = calculateWeekStreak(weeklyActivity.map(a => new Date(a.created_at)));

  // Get rank from SQL function
  const userRank = userRankResult.data || 0;

  // Reading goal progress
  const readingGoal = profile.reading_goal_2025;
  const booksThisYear = booksThisYearResult.count || 0;
  const goalProgress = readingGoal ? Math.min((booksThisYear / readingGoal) * 100, 100) : 0;

  return (
    <>
      <HeaderWrapper />
      <main className="min-h-screen px-4 sm:px-6 py-6">
        <div className="max-w-2xl mx-auto">
          {/* Profile Info */}
          <div className="text-center mb-6">
            <div className="w-24 h-24 bg-gradient-to-br from-neutral-200 to-neutral-300 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl font-bold text-neutral-500 overflow-hidden">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                (profile.username)[0].toUpperCase()
              )}
            </div>
            <h1 className="text-2xl font-bold">
              {profile.username}
            </h1>
            <p className="text-neutral-500">@{profile.username}</p>
            {profile.bio && (
              <p className="text-neutral-600 mt-2 max-w-md mx-auto">{profile.bio}</p>
            )}

            {/* Social Links - only shown if unlocked via referrals */}
            {showSocialLinks && (profile.instagram || profile.twitter) && (
              <div className="flex justify-center gap-3 mt-3">
                {profile.instagram && (
                  <a
                    href={`https://instagram.com/${profile.instagram}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm rounded-full hover:opacity-90 transition-opacity"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                    @{profile.instagram}
                  </a>
                )}
                {profile.twitter && (
                  <a
                    href={`https://x.com/${profile.twitter}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-black text-white text-sm rounded-full hover:opacity-90 transition-opacity"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                    @{profile.twitter}
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Stats Row - Beli style */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            <div className="bg-white rounded-xl p-3 text-center border border-neutral-100">
              <p className="text-2xl font-bold">{totalBooksRead}</p>
              <p className="text-xs text-neutral-500">Read</p>
            </div>
            <div className="bg-white rounded-xl p-3 text-center border border-neutral-100">
              <p className="text-2xl font-bold">{weekStreak}</p>
              <p className="text-xs text-neutral-500">Week Streak</p>
            </div>
            <div className="bg-white rounded-xl p-3 text-center border border-neutral-100">
              <p className="text-2xl font-bold">#{userRank || "-"}</p>
              <p className="text-xs text-neutral-500">Rank</p>
            </div>
            <div className="bg-white rounded-xl p-3 text-center border border-neutral-100">
              <p className="text-2xl font-bold">{followersCount}</p>
              <p className="text-xs text-neutral-500">Followers</p>
            </div>
          </div>

          {/* 2025 Reading Goal */}
          {readingGoal && (
            <div className="bg-white rounded-xl p-4 border border-neutral-100 mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">2025 Reading Goal</span>
                <span className="text-sm text-neutral-500">
                  {booksThisYear} / {readingGoal} books
                </span>
              </div>
              <div className="w-full h-3 bg-neutral-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all duration-500"
                  style={{ width: `${goalProgress}%` }}
                />
              </div>
              {goalProgress >= 100 && (
                <p className="text-xs text-green-600 mt-2 text-center font-medium">
                  Goal achieved!
                </p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-center gap-3 mb-8">
            {isOwner && (
              <Link
                href="/profile/edit"
                className="px-4 py-2 text-sm text-neutral-600 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
              >
                Edit Profile
              </Link>
            )}
            <FollowButton
              targetUserId={profile.id}
              targetUsername={profile.username}
              isFollowing={isFollowing}
              currentUserId={user?.id || null}
            />
            <Link
              href={`/share/${username}`}
              className="px-4 py-2 text-sm text-neutral-600 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Share
            </Link>
          </div>

          {/* Favorite Books - User curated selection */}
          {(hasFavorites || isOwner) && (
            <section className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                  Favorite Books
                </h2>
                {isOwner && (
                  <Link
                    href="/profile/edit#favorites"
                    className="text-xs text-neutral-500 hover:text-neutral-700 transition-colors"
                  >
                    Edit
                  </Link>
                )}
              </div>
              <div className="grid grid-cols-4 gap-3">
                {favoriteBooks?.map((book) => (
                  <Link
                    key={book.id}
                    href={`/book/${(book.open_library_key || book.id).replace("/works/", "").replace("/books/", "")}`}
                    className="group relative aspect-[2/3] bg-neutral-100 rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-all hover:scale-105"
                  >
                    {book.cover_url ? (
                      <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center p-2 text-center">
                        <span className="text-xs text-neutral-400">{book.title}</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                      <div>
                        <p className="text-white text-sm font-medium leading-tight">{book.title}</p>
                        {book.author && <p className="text-white/70 text-xs mt-1">{book.author}</p>}
                      </div>
                    </div>
                  </Link>
                ))}
                {/* Empty slots - clickable for owner */}
                {Array.from({ length: Math.max(0, 4 - (favoriteBooks?.length || 0)) }).map((_, i) =>
                  isOwner ? (
                    <Link
                      key={`empty-${i}`}
                      href="/profile/edit#favorites"
                      className="aspect-[2/3] bg-neutral-100 rounded-lg border-2 border-dashed border-neutral-200 hover:border-neutral-400 hover:bg-neutral-50 transition-all flex items-center justify-center"
                    >
                      <span className="text-neutral-300 text-2xl">+</span>
                    </Link>
                  ) : (
                    <div
                      key={`empty-${i}`}
                      className="aspect-[2/3] bg-neutral-100 rounded-lg border-2 border-dashed border-neutral-200"
                    />
                  )
                )}
              </div>
            </section>
          )}

          {/* Reading Lists - Collapsible Beli style */}
          <section className="space-y-2 mb-8">
            {/* Currently Reading */}
            <Link
              href={`/profile/${username}/reading`}
              className="flex items-center justify-between p-4 bg-white rounded-xl border border-neutral-100 hover:bg-neutral-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium">Currently Reading</p>
                  <p className="text-sm text-neutral-500">{currentlyReading.length} {currentlyReading.length === 1 ? "book" : "books"}</p>
                </div>
              </div>
              <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>

            {/* Read */}
            <Link
              href={`/profile/${username}/read`}
              className="flex items-center justify-between p-4 bg-white rounded-xl border border-neutral-100 hover:bg-neutral-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium">Read</p>
                  <p className="text-sm text-neutral-500">{totalBooksRead} {totalBooksRead === 1 ? "book" : "books"}</p>
                </div>
              </div>
              <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>

            {/* Want to Read */}
            <Link
              href={`/profile/${username}/want-to-read`}
              className="flex items-center justify-between p-4 bg-white rounded-xl border border-neutral-100 hover:bg-neutral-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium">Want to Read</p>
                  <p className="text-sm text-neutral-500">{wantToReadCount} {wantToReadCount === 1 ? "book" : "books"}</p>
                </div>
              </div>
              <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>

            {/* Lists */}
            <Link
              href={`/profile/${username}/lists`}
              className="flex items-center justify-between p-4 bg-white rounded-xl border border-neutral-100 hover:bg-neutral-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium">Lists</p>
                  <p className="text-sm text-neutral-500">{listsCount} {listsCount === 1 ? "list" : "lists"}</p>
                </div>
              </div>
              <svg className="w-5 h-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </section>

          {/* Following Stats */}
          <div className="flex justify-center gap-8 text-sm text-neutral-500">
            <span><strong className="text-neutral-900">{followingCount}</strong> Following</span>
            <span><strong className="text-neutral-900">{followersCount}</strong> Followers</span>
          </div>
        </div>
      </main>
    </>
  );
}

function calculateWeekStreak(activityDates: Date[]): number {
  if (activityDates.length === 0) return 0;

  const now = new Date();
  const getWeekStart = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  };

  // Get unique weeks with activity
  const weeksWithActivity = new Set(activityDates.map(d => getWeekStart(d)));

  // Check current week
  const currentWeekStart = getWeekStart(now);
  const lastWeekStart = currentWeekStart - 7 * 24 * 60 * 60 * 1000;

  // Start counting from current or last week
  let streak = 0;
  let checkWeek = weeksWithActivity.has(currentWeekStart) ? currentWeekStart : lastWeekStart;

  while (weeksWithActivity.has(checkWeek)) {
    streak++;
    checkWeek -= 7 * 24 * 60 * 60 * 1000;
  }

  return streak;
}
