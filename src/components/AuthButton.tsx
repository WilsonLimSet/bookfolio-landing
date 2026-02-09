import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function AuthButton() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .maybeSingle();

    return (
      <div className="flex items-center gap-4">
        <Link
          href="/feed"
          className="text-sm text-neutral-600 hover:text-neutral-900"
        >
          Feed
        </Link>
        <Link
          href="/leaderboard"
          className="text-sm text-neutral-600 hover:text-neutral-900"
        >
          Leaderboard
        </Link>
        <Link
          href={profile ? `/profile/${profile.username}` : "/profile"}
          className="text-sm text-neutral-600 hover:text-neutral-900"
        >
          {profile?.username || "Profile"}
        </Link>
        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="px-3 py-1.5 text-sm border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
          >
            Sign Out
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <Link
        href="/leaderboard"
        className="text-sm text-neutral-600 hover:text-neutral-900"
      >
        Leaderboard
      </Link>
      <Link
        href="/login"
        className="px-4 py-2 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors"
      >
        Sign In
      </Link>
    </div>
  );
}
