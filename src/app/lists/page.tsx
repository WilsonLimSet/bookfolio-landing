import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import HeaderWrapper from "@/components/HeaderWrapper";
import ListCard from "@/components/ListCard";

export const dynamic = "force-dynamic";

export default async function ListsPage() {
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

  // Get recent books added to friends' lists
  let friendsBooks: Array<{
    open_library_key: string;
    title: string;
    cover_url: string | null;
    list_name: string;
    added_at: string;
  }> = [];

  if (followingIds.length > 0) {
    const { data: recentItems } = await supabase
      .from("book_list_items")
      .select(`
        open_library_key,
        title,
        cover_url,
        added_at,
        list_id,
        book_lists!inner (
          id,
          name,
          user_id,
          is_public
        )
      `)
      .in("book_lists.user_id", followingIds)
      .eq("book_lists.is_public", true)
      .order("added_at", { ascending: false })
      .limit(20);

    if (recentItems) {
      friendsBooks = recentItems.map((item) => {
        const bookList = item.book_lists as unknown as { name: string } | { name: string }[];
        const listName = Array.isArray(bookList) ? bookList[0]?.name : bookList?.name;
        return {
          open_library_key: item.open_library_key,
          title: item.title,
          cover_url: item.cover_url,
          list_name: listName || "Unknown",
          added_at: item.added_at,
        };
      });
    }
  }

  // Get all public lists with their items and creators
  const { data: publicLists } = await supabase
    .from("book_lists")
    .select("id, name, description, user_id, created_at")
    .eq("is_public", true)
    .order("updated_at", { ascending: false })
    .limit(20);

  // Get profiles for list creators
  const creatorIds = [...new Set(publicLists?.map(l => l.user_id) || [])];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, username, avatar_url")
    .in("id", creatorIds.length > 0 ? creatorIds : ["none"]);

  const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

  // Get items for each list (first 8)
  const listItems = new Map<string, Array<{ open_library_key: string; title: string; cover_url: string | null }>>();
  if (publicLists && publicLists.length > 0) {
    const { data: items } = await supabase
      .from("book_list_items")
      .select("list_id, open_library_key, title, cover_url, position")
      .in("list_id", publicLists.map(l => l.id))
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
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Lists</h1>
            <Link
              href="/lists/new"
              className="px-4 py-2 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New List
            </Link>
          </div>

          {/* New from friends */}
          {friendsBooks.length > 0 && (
            <section className="mb-8">
              <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-4">
                New from friends
              </h2>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {friendsBooks.map((book, index) => (
                  <Link
                    key={`${book.open_library_key}-${index}`}
                    href={`/book/${book.open_library_key.replace("/works/", "")}`}
                    className="w-16 h-24 bg-neutral-100 rounded-lg overflow-hidden flex-shrink-0 shadow-sm hover:shadow-md transition-shadow"
                  >
                    {book.cover_url ? (
                      <img
                        src={book.cover_url}
                        alt={book.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[8px] text-neutral-400 p-1 text-center">
                        {book.title.slice(0, 20)}
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* All Lists */}
          <section>
            <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-4">
              Browse Lists
            </h2>
            {publicLists && publicLists.length > 0 ? (
              <div className="space-y-4">
                {publicLists.map((list) => (
                  <ListCard
                    key={list.id}
                    list={list}
                    creator={profileMap.get(list.user_id) || null}
                    books={listItems.get(list.id) || []}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-neutral-500">
                <svg className="w-12 h-12 mx-auto mb-3 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <p>No public lists yet.</p>
                <p className="text-sm mt-1">Be the first to create one!</p>
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  );
}
