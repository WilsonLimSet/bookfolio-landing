import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import HeaderWrapper from "@/components/HeaderWrapper";
import ListCard from "@/components/ListCard";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ username: string }>;
}

export default async function ProfileListsPage({ params }: PageProps) {
  const { username } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Get profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .single();

  if (!profile) {
    notFound();
  }

  const isOwnProfile = user?.id === profile.id;

  // Get user's lists (public only unless viewing own profile)
  let query = supabase
    .from("book_lists")
    .select("*")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false });

  if (!isOwnProfile) {
    query = query.eq("is_public", true);
  }

  const { data: lists } = await query;

  // Get items for each list (first 8)
  const listItems = new Map<string, Array<{ open_library_key: string; title: string; cover_url: string | null }>>();
  if (lists && lists.length > 0) {
    const { data: items } = await supabase
      .from("book_list_items")
      .select("list_id, open_library_key, title, cover_url, position")
      .in("list_id", lists.map(l => l.id))
      .order("position", { ascending: true });

    items?.forEach(item => {
      const existing = listItems.get(item.list_id) || [];
      if (existing.length < 8) {
        existing.push({
          open_library_key: item.open_library_key,
          title: item.title,
          cover_url: item.cover_url,
        });
        listItems.set(item.list_id, existing);
      }
    });
  }

  return (
    <>
      <HeaderWrapper />
      <main className="min-h-screen px-4 sm:px-6 py-6">
        <div className="max-w-2xl mx-auto">
          {/* Back button */}
          <Link
            href={`/profile/${username}`}
            className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-700 mb-6"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Profile
          </Link>

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">
              {isOwnProfile ? "Your Lists" : `${username}'s Lists`}
            </h1>
            {isOwnProfile && (
              <Link
                href="/lists/new"
                className="px-4 py-2 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New List
              </Link>
            )}
          </div>

          {/* Lists */}
          {lists && lists.length > 0 ? (
            <div className="space-y-4">
              {lists.map((list) => (
                <ListCard
                  key={list.id}
                  list={list}
                  creator={profile}
                  books={listItems.get(list.id) || []}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-neutral-500">
              <svg className="w-12 h-12 mx-auto mb-3 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <p>
                {isOwnProfile
                  ? "You haven't created any lists yet."
                  : `${username} hasn't created any public lists yet.`}
              </p>
              {isOwnProfile && (
                <Link
                  href="/lists/new"
                  className="text-sm text-neutral-900 underline mt-2 inline-block"
                >
                  Create your first list
                </Link>
              )}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
