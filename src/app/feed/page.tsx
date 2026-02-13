import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import HeaderWrapper from "@/components/HeaderWrapper";
import FeedTabs from "@/components/FeedTabs";

export default async function FeedPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Parallel fetch: following + profile
  const [{ data: following }, { data: currentProfile }] = await Promise.all([
    supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", user.id),
    supabase
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .single(),
  ]);

  const followingIds = following?.map(f => f.following_id) || [];

  return (
    <>
      <HeaderWrapper user={user} username={currentProfile?.username} />
      <main className="min-h-screen px-4 sm:px-6 py-6">
        <div className="max-w-2xl mx-auto">
          <FeedTabs
            currentUserId={user.id}
            followingIds={followingIds}
            currentUsername={currentProfile?.username || ""}
          />
        </div>
      </main>
    </>
  );
}
