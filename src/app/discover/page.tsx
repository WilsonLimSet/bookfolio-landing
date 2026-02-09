import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import HeaderWrapper from "@/components/HeaderWrapper";
import UserSearch from "@/components/UserSearch";

interface SuggestedUser {
  id: string;
  username: string;
  bookCount: number;
}

export default async function DiscoverPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get suggested users (most active, not already following)
  const { data: following } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", user.id);

  const followingIds = following?.map(f => f.following_id) || [];

  // Get active users with book counts
  const { data: activeUsers } = await supabase
    .from("user_books")
    .select("user_id")
    .limit(500);

  const userCounts = new Map<string, number>();
  for (const entry of activeUsers || []) {
    if (entry.user_id !== user.id && !followingIds.includes(entry.user_id)) {
      userCounts.set(entry.user_id, (userCounts.get(entry.user_id) || 0) + 1);
    }
  }

  const suggestedUserIds = Array.from(userCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([id]) => id);

  const { data: suggestedProfiles } = await supabase
    .from("profiles")
    .select("id, username")
    .in("id", suggestedUserIds.length > 0 ? suggestedUserIds : ["none"]);

  const suggestedUsers: SuggestedUser[] = suggestedUserIds
    .map(id => {
      const profile = suggestedProfiles?.find(p => p.id === id);
      return profile ? { ...profile, bookCount: userCounts.get(id) || 0 } : null;
    })
    .filter((user): user is SuggestedUser => user !== null);

  // Get recently active users (from activity)
  const { data: recentActivity } = await supabase
    .from("activity")
    .select("user_id")
    .neq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  const recentUserIds = [...new Set(recentActivity?.map(a => a.user_id) || [])]
    .filter(id => !followingIds.includes(id))
    .slice(0, 8);

  const { data: recentProfiles } = await supabase
    .from("profiles")
    .select("id, username")
    .in("id", recentUserIds.length > 0 ? recentUserIds : ["none"]);

  return (
    <>
      <HeaderWrapper />
      <main className="min-h-screen px-4 sm:px-6 py-6">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Discover</h1>

          {/* User Search */}
          <section className="mb-8">
            <UserSearch currentUserId={user.id} followingIds={followingIds} />
          </section>

          {/* Suggested Users */}
          {suggestedUsers.length > 0 && (
            <section className="mb-8">
              <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-4">
                Suggested for you
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {suggestedUsers.map((user) => (
                  <Link
                    key={user.id}
                    href={`/profile/${user.username}`}
                    className="flex items-center gap-3 p-3 bg-white border border-neutral-100 rounded-xl hover:border-neutral-300 transition-colors"
                  >
                    <div className="w-10 h-10 bg-neutral-200 rounded-full flex items-center justify-center text-sm font-bold text-neutral-500 flex-shrink-0">
                      {user.username[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{user.username}</p>
                      <p className="text-xs text-neutral-500">{user.bookCount} books</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Recently Active */}
          {recentProfiles && recentProfiles.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-4">
                Recently active
              </h2>
              <div className="space-y-2">
                {recentProfiles.map((profile) => (
                  <Link
                    key={profile.id}
                    href={`/profile/${profile.username}`}
                    className="flex items-center gap-3 p-3 bg-white border border-neutral-100 rounded-xl hover:border-neutral-300 transition-colors"
                  >
                    <div className="w-10 h-10 bg-neutral-200 rounded-full flex items-center justify-center text-sm font-bold text-neutral-500 flex-shrink-0">
                      {profile.username[0].toUpperCase()}
                    </div>
                    <p className="font-medium text-sm">{profile.username}</p>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {suggestedUsers.length === 0 && (!recentProfiles || recentProfiles.length === 0) && (
            <div className="text-center py-12 text-neutral-500">
              <p>No users to discover yet. Be the first to rank some books!</p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
