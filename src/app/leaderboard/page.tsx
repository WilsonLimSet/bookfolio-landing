import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import HeaderWrapper from "@/components/HeaderWrapper";

export default async function LeaderboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Get top rated books (averaged across users)
  const { data: topFiction } = await supabase
    .from("user_books")
    .select(`
      open_library_key,
      title,
      author,
      cover_url,
      score
    `)
    .eq("category", "fiction")
    .eq("tier", "liked")
    .order("score", { ascending: false })
    .limit(20);

  const { data: topNonfiction } = await supabase
    .from("user_books")
    .select(`
      open_library_key,
      title,
      author,
      cover_url,
      score
    `)
    .eq("category", "nonfiction")
    .eq("tier", "liked")
    .order("score", { ascending: false })
    .limit(20);

  // Aggregate books by title (simple deduplication)
  const aggregateBooks = (books: any[]) => {
    const map = new Map();
    for (const book of books || []) {
      const key = book.title.toLowerCase();
      if (!map.has(key)) {
        map.set(key, { ...book, scores: [book.score], count: 1 });
      } else {
        const existing = map.get(key);
        existing.scores.push(book.score);
        existing.count++;
      }
    }
    return Array.from(map.values())
      .map(b => ({
        ...b,
        avgScore: (b.scores.reduce((a: number, c: number) => a + c, 0) / b.scores.length).toFixed(1),
      }))
      .sort((a, b) => parseFloat(b.avgScore) - parseFloat(a.avgScore))
      .slice(0, 10);
  };

  const topFictionAggregated = aggregateBooks(topFiction || []);
  const topNonfictionAggregated = aggregateBooks(topNonfiction || []);

  // Get most active users - count all books per user
  const { data: activeUsers } = await supabase
    .from("user_books")
    .select("user_id")
    .limit(1000);

  const userCounts = new Map<string, number>();
  for (const entry of activeUsers || []) {
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
    .select("id, username")
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
                    <div className="w-10 h-[60px] bg-neutral-100 rounded overflow-hidden flex-shrink-0">
                      {book.cover_url && (
                        <img src={book.cover_url} alt="" className="w-full h-full object-cover" />
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
                    <div className="w-10 h-[60px] bg-neutral-100 rounded overflow-hidden flex-shrink-0">
                      {book.cover_url && (
                        <img src={book.cover_url} alt="" className="w-full h-full object-cover" />
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
                  <div className="w-10 h-10 bg-neutral-200 rounded-full flex items-center justify-center font-bold text-neutral-500">
                    {(user.profile?.username || "?")[0].toUpperCase()}
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
