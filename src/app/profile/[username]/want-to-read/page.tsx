import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import HeaderWrapper from "@/components/HeaderWrapper";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ username: string }>;
}

export default async function WantToReadPage({ params }: PageProps) {
  const { username } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username")
    .eq("username", username)
    .single();

  if (!profile) {
    notFound();
  }

  const { data: books } = await supabase
    .from("want_to_read")
    .select("*")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false });

  return (
    <>
      <HeaderWrapper />
      <main className="min-h-screen px-4 sm:px-6 py-6">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Link
              href={`/profile/${username}`}
              className="p-2 -ml-2 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-xl font-bold">Want to Read</h1>
              <p className="text-sm text-neutral-500">@{username} &middot; {books?.length || 0} books</p>
            </div>
          </div>

          {/* Books */}
          {books && books.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {books.map((book) => (
                <Link
                  key={book.id}
                  href={`/book/${book.open_library_key.replace("/works/", "").replace("/books/", "")}`}
                  className="group"
                >
                  <div className="aspect-[2/3] bg-neutral-100 rounded-lg overflow-hidden shadow-sm group-hover:shadow-lg transition-all group-hover:scale-105">
                    {book.cover_url ? (
                      <img
                        src={book.cover_url}
                        alt={book.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-neutral-400 p-2 text-center">
                        {book.title}
                      </div>
                    )}
                  </div>
                  <p className="text-sm font-medium mt-2 truncate">{book.title}</p>
                  {book.author && (
                    <p className="text-xs text-neutral-500 truncate">{book.author}</p>
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </div>
              <p className="text-neutral-500">No books on the reading list yet</p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
