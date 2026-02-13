import Image from "next/image";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import HeaderWrapper from "@/components/HeaderWrapper";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ListPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Get the list
  const { data: list } = await supabase
    .from("book_lists")
    .select("id, name, description, user_id, is_public, created_at")
    .eq("id", id)
    .single();

  if (!list) {
    notFound();
  }

  // Check if user can view this list (public or own)
  if (!list.is_public && list.user_id !== user?.id) {
    notFound();
  }

  const isOwner = user?.id === list.user_id;

  // Parallel fetch: creator profile + list items
  const [{ data: creator }, { data: items }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, username, avatar_url")
      .eq("id", list.user_id)
      .single(),
    supabase
      .from("book_list_items")
      .select("id, open_library_key, title, author, cover_url, position")
      .eq("list_id", id)
      .order("position", { ascending: true }),
  ]);

  return (
    <>
      <HeaderWrapper user={user} />
      <main className="min-h-screen px-4 sm:px-6 py-6">
        <div className="max-w-2xl mx-auto">
          {/* Back button */}
          <Link
            href="/lists"
            className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-700 mb-6"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Lists
          </Link>

          {/* Header */}
          <div className="mb-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h1 className="text-2xl font-bold mb-2">{list.name}</h1>
                {list.description && (
                  <p className="text-neutral-600 mb-4">{list.description}</p>
                )}
                {/* Creator info */}
                <Link
                  href={`/profile/${creator?.username}`}
                  className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-700"
                >
                  <div className="w-6 h-6 bg-neutral-200 rounded-full overflow-hidden flex items-center justify-center text-xs font-bold text-neutral-500 relative">
                    {creator?.avatar_url ? (
                      <Image
                        src={creator.avatar_url}
                        alt={creator.username}
                        fill
                        sizes="24px"
                        className="object-cover"
                      />
                    ) : (
                      (creator?.username || "?")[0].toUpperCase()
                    )}
                  </div>
                  {creator?.username}
                </Link>
              </div>
              {isOwner && (
                <Link
                  href={`/lists/${id}/edit`}
                  className="px-4 py-2 border border-neutral-200 rounded-lg text-sm font-medium hover:bg-neutral-50 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
                </Link>
              )}
            </div>
            <p className="text-sm text-neutral-400 mt-3">
              {items?.length || 0} {(items?.length || 0) === 1 ? "book" : "books"}
              {!list.is_public && (
                <span className="ml-2 px-2 py-0.5 bg-neutral-100 rounded text-xs">Private</span>
              )}
            </p>
          </div>

          {/* Books Grid */}
          {items && items.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
              {items.map((item) => (
                <Link
                  key={item.id}
                  href={`/book/${item.open_library_key.replace("/works/", "").replace("/books/", "")}`}
                  className="group"
                >
                  <div className="aspect-[2/3] bg-neutral-100 rounded-lg overflow-hidden shadow-sm group-hover:shadow-lg transition-all group-hover:scale-105 relative">
                    {item.cover_url ? (
                      <Image
                        src={item.cover_url}
                        alt={item.title}
                        fill
                        sizes="(min-width: 640px) 25vw, 33vw"
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-neutral-400 p-2 text-center">
                        {item.title}
                      </div>
                    )}
                  </div>
                  <div className="mt-2">
                    <p className="text-sm font-medium truncate">{item.title}</p>
                    {item.author && (
                      <p className="text-xs text-neutral-500 truncate">{item.author}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-neutral-500">
              <svg className="w-12 h-12 mx-auto mb-3 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <p>No books in this list yet.</p>
              {isOwner && (
                <Link
                  href={`/lists/${id}/edit`}
                  className="text-sm text-neutral-900 underline mt-2 inline-block"
                >
                  Add some books
                </Link>
              )}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
