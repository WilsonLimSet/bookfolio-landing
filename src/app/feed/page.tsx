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

  // Get users this person follows
  const { data: following } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", user.id);

  const followingIds = following?.map(f => f.following_id) || [];

  // Get current user's profile
  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .single();

  return (
    <>
      <HeaderWrapper />
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
