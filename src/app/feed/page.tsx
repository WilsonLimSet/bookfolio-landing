import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import HeaderWrapper from "@/components/HeaderWrapper";

export default async function FeedPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get users this person follows
  const { data: following } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", user.id);

  const followingIds = following?.map(f => f.following_id) || [];

  // Get activity - from followed users if following anyone, otherwise everyone
  let activities;
  if (followingIds.length > 0) {
    const { data } = await supabase
      .from("activity")
      .select("*")
      .in("user_id", followingIds)
      .order("created_at", { ascending: false })
      .limit(50);
    activities = data;
  } else {
    const { data } = await supabase
      .from("activity")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    activities = data;
  }

  // Get profiles for activities
  const userIds = [...new Set(activities?.map(a => a.user_id) || [])];
  const targetUserIds = [...new Set(activities?.filter(a => a.target_user_id).map(a => a.target_user_id) || [])];
  const allProfileIds = [...new Set([...userIds, ...targetUserIds])];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username")
    .in("id", allProfileIds.length > 0 ? allProfileIds : ["none"]);

  const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

  return (
    <>
      <HeaderWrapper />
      <main className="min-h-screen px-4 sm:px-6 py-6">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Activity Feed</h1>

        {followingIds.length === 0 && (
          <div className="bg-neutral-50 rounded-xl p-4 mb-6 text-center">
            <p className="text-neutral-600 text-sm">
              You&apos;re not following anyone yet. Here&apos;s what everyone is reading.
            </p>
          </div>
        )}

        {activities && activities.length > 0 ? (
          <div className="space-y-4">
            {activities.map((activity) => (
              <ActivityItem
                key={activity.id}
                activity={activity}
                profile={profileMap.get(activity.user_id)}
                targetProfile={activity.target_user_id ? profileMap.get(activity.target_user_id) : null}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-neutral-500">
            No activity yet. Start following people to see their updates!
          </div>
        )}
      </div>
    </main>
    </>
  );
}

function ActivityItem({
  activity,
  profile,
  targetProfile,
}: {
  activity: any;
  profile: any;
  targetProfile: any;
}) {
  const timeAgo = getTimeAgo(new Date(activity.created_at));

  if (activity.action_type === "ranked") {
    return (
      <div className="flex gap-4 p-4 bg-white rounded-xl border border-neutral-100">
        <Link
          href={`/book/${activity.book_key?.replace("/works/", "").replace("/books/", "") || ""}`}
          className="w-12 h-[72px] bg-neutral-100 rounded-lg overflow-hidden flex-shrink-0"
        >
          {activity.book_cover_url && (
            <img
              src={activity.book_cover_url}
              alt=""
              className="w-full h-full object-cover"
            />
          )}
        </Link>
        <div className="flex-1 min-w-0">
          <p className="text-sm">
            <Link
              href={`/profile/${profile?.username}`}
              className="font-medium hover:underline"
            >
              {profile?.username || "Someone"}
            </Link>
            {" ranked "}
            <Link
              href={`/book/${activity.book_key?.replace("/works/", "").replace("/books/", "") || ""}`}
              className="font-medium hover:underline"
            >
              {activity.book_title}
            </Link>
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-lg font-bold ${
              parseFloat(activity.book_score) >= 6.7 ? 'text-green-600' :
              parseFloat(activity.book_score) >= 3.4 ? 'text-yellow-600' :
              'text-red-500'
            }`}>
              {activity.book_score}
            </span>
            <span className="text-xs text-neutral-400">in {activity.book_category}</span>
          </div>
          <p className="text-xs text-neutral-400 mt-1">{timeAgo}</p>
        </div>
      </div>
    );
  }

  if (activity.action_type === "want_to_read") {
    return (
      <div className="flex gap-4 p-4 bg-white rounded-xl border border-neutral-100">
        <Link
          href={`/book/${activity.book_key?.replace("/works/", "").replace("/books/", "") || ""}`}
          className="w-12 h-[72px] bg-neutral-100 rounded-lg overflow-hidden flex-shrink-0"
        >
          {activity.book_cover_url && (
            <img
              src={activity.book_cover_url}
              alt=""
              className="w-full h-full object-cover"
            />
          )}
        </Link>
        <div className="flex-1 min-w-0">
          <p className="text-sm">
            <Link
              href={`/profile/${profile?.username}`}
              className="font-medium hover:underline"
            >
              {profile?.username || "Someone"}
            </Link>
            {" wants to read "}
            <Link
              href={`/book/${activity.book_key?.replace("/works/", "").replace("/books/", "") || ""}`}
              className="font-medium hover:underline"
            >
              {activity.book_title}
            </Link>
          </p>
          <p className="text-xs text-neutral-400 mt-1">{timeAgo}</p>
        </div>
      </div>
    );
  }

  if (activity.action_type === "followed") {
    return (
      <div className="flex gap-4 p-4 bg-white rounded-xl border border-neutral-100">
        <div className="w-12 h-12 bg-neutral-200 rounded-full flex items-center justify-center text-lg font-bold text-neutral-500 flex-shrink-0">
          {(targetProfile?.username || "?")[0].toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm">
            <Link
              href={`/profile/${profile?.username}`}
              className="font-medium hover:underline"
            >
              {profile?.username || "Someone"}
            </Link>
            {" started following "}
            <Link
              href={`/profile/${targetProfile?.username}`}
              className="font-medium hover:underline"
            >
              {targetProfile?.username || "someone"}
            </Link>
          </p>
          <p className="text-xs text-neutral-400 mt-1">{timeAgo}</p>
        </div>
      </div>
    );
  }

  return null;
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString();
}
