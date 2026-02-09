import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import HeaderWrapper from "@/components/HeaderWrapper";
import { getLeaderboardData } from "@/lib/supabase/cached";

export default async function LeaderboardPage() {
  const supabase = await createClient();

  const { likedBooks, activeUsers: activeUsersData } = await getLeaderboardData();

  // Aggregate all liked books by open_library_key, majority-rules category
  const bookMap = new Map<string, {
    open_library_key: string;
    title: string;
    author: string | null;
    cover_url: string | null;
    scores: number[];
    count: number;
    fictionVotes: number;
    nonfictionVotes: number;
  }>();

  for (const book of likedBooks || []) {
    const key = book.open_library_key;
    if (!key) continue;

    if (!bookMap.has(key)) {
      bookMap.set(key, {
        ...book,
        scores: [Number(book.score)],
        count: 1,
        fictionVotes: book.category === "fiction" ? 1 : 0,
        nonfictionVotes: book.category === "nonfiction" ? 1 : 0,
      });
    } else {
      const existing = bookMap.get(key)!;
      existing.scores.push(Number(book.score));
      existing.count++;
      if (book.category === "fiction") existing.fictionVotes++;
      else existing.nonfictionVotes++;
    }
  }

  const allBooks = Array.from(bookMap.values()).map(b => ({
    ...b,
    avgScore: (b.scores.reduce((a, c) => a + c, 0) / b.scores.length).toFixed(1),
    category: b.fictionVotes > b.nonfictionVotes ? "fiction" as const : "nonfiction" as const,
  }));

  const topFictionAggregated = allBooks
    .filter(b => b.category === "fiction")
    .sort((a, b) => parseFloat(b.avgScore) - parseFloat(a.avgScore))
    .slice(0, 10);
  const topNonfictionAggregated = allBooks
    .filter(b => b.category === "nonfiction")
    .sort((a, b) => parseFloat(b.avgScore) - parseFloat(a.avgScore))
    .slice(0, 10);

  // Count books per user
  const userCounts = new Map<string, number>();
  for (const entry of activeUsersData || []) {
    userCounts.set(entry.user_id, (userCounts.get(entry.user_id) || 0) + 1);
  }

  // Get top 10 user IDs by count
  const topUserIds = Array.from(userCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([id]) => id);

  // Fetch profiles for top users
  const { data: topProfiles } = await supabase
    .from("profiles")
    .select("id, username, avatar_url")
    .in("id", topUserIds.length > 0 ? topUserIds : ["none"]);

  const profileMap = new Map(topProfiles?.map(p => [p.id, p]) || []);

  const topUsers = topUserIds.map(userId => ({
    userId,
    count: userCounts.get(userId) || 0,
    profile: profileMap.get(userId),
  }));

  return (
    <>
      <HeaderWrapper />
      <main className="min-h-screen px-4 sm:px-6 py-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Leaderboard</h1>

          <div className="grid md:grid-cols-2 gap-6">
          {/* Top Fiction */}
          <section>
            <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-4">
              Top Fiction
            </h2>
            {topFictionAggregated.length > 0 ? (
              <div className="space-y-2">
                {topFictionAggregated.map((book, index) => (
                  <Link
                    key={book.open_library_key}
                    href={`/book/${book.open_library_key?.replace("/works/", "").replace("/books/", "") || ""}`}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-neutral-50 transition-colors"
                  >
                    <span className="w-6 text-right font-mono font-bold text-neutral-300">
                      {index + 1}
                    </span>
                    <div className="w-10 h-[60px] bg-neutral-100 rounded overflow-hidden flex-shrink-0 relative">
                      {book.cover_url && (
                        <Image src={book.cover_url} alt="" fill sizes="40px" className="object-cover" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{book.title}</p>
                      <p className="text-xs text-neutral-500 truncate">{book.author}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-green-600 font-bold">{book.avgScore}</p>
                      <p className="text-xs text-neutral-400">{book.count} rating{book.count > 1 ? 's' : ''}</p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-neutral-500 text-sm">No ratings yet</p>
            )}
          </section>

          {/* Top Non-Fiction */}
          <section>
            <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-4">
              Top Non-Fiction
            </h2>
            {topNonfictionAggregated.length > 0 ? (
              <div className="space-y-2">
                {topNonfictionAggregated.map((book, index) => (
                  <Link
                    key={book.open_library_key}
                    href={`/book/${book.open_library_key?.replace("/works/", "").replace("/books/", "") || ""}`}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-neutral-50 transition-colors"
                  >
                    <span className="w-6 text-right font-mono font-bold text-neutral-300">
                      {index + 1}
                    </span>
                    <div className="w-10 h-[60px] bg-neutral-100 rounded overflow-hidden flex-shrink-0 relative">
                      {book.cover_url && (
                        <Image src={book.cover_url} alt="" fill sizes="40px" className="object-cover" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{book.title}</p>
                      <p className="text-xs text-neutral-500 truncate">{book.author}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-green-600 font-bold">{book.avgScore}</p>
                      <p className="text-xs text-neutral-400">{book.count} rating{book.count > 1 ? 's' : ''}</p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-neutral-500 text-sm">No ratings yet</p>
            )}
          </section>
        </div>

        {/* Top Readers */}
        <section className="mt-12">
          <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-4">
            Most Active Readers
          </h2>
          {topUsers.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {topUsers.map((user, index) => (
                <Link
                  key={user.userId}
                  href={`/profile/${user.profile?.username}`}
                  className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-neutral-100 hover:border-neutral-300 transition-colors"
                >
                  <span className="text-lg font-bold text-neutral-300">#{index + 1}</span>
                  <div className="w-10 h-10 bg-neutral-200 rounded-full flex items-center justify-center font-bold text-neutral-500 overflow-hidden relative">
                    {user.profile?.avatar_url ? (
                      <Image src={user.profile.avatar_url} alt="" fill sizes="40px" className="object-cover" />
                    ) : (
                      (user.profile?.username || "?")[0].toUpperCase()
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-sm">
                      {user.profile?.username}
                    </p>
                    <p className="text-xs text-neutral-500">{user.count} books ranked</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-neutral-500 text-sm">No users yet</p>
          )}
        </section>
      </div>
    </main>
    </>
  );
}
