import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import HeaderWrapper from "@/components/HeaderWrapper";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ username: string }>;
}

export default async function CurrentlyReadingPage({ params }: PageProps) {
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
    .from("currently_reading")
    .select("*")
    .eq("user_id", profile.id)
    .order("started_at", { ascending: false });

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
              <h1 className="text-xl font-bold">Currently Reading</h1>
              <p className="text-sm text-neutral-500">@{username}</p>
            </div>
          </div>

          {/* Books */}
          {books && books.length > 0 ? (
            <div className="space-y-3">
              {books.map((book) => (
                <Link
                  key={book.id}
                  href={`/book/${book.open_library_key.replace("/works/", "").replace("/books/", "")}`}
                  className="flex gap-4 p-4 bg-white rounded-xl border border-blue-100 hover:bg-blue-50 transition-colors"
                >
                  <div className="w-16 h-24 bg-neutral-100 rounded-lg overflow-hidden flex-shrink-0 ring-2 ring-blue-500 shadow-md">
                    {book.cover_url ? (
                      <img
                        src={book.cover_url}
                        alt={book.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-neutral-400 p-2">
                        {book.title}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <p className="font-medium truncate">{book.title}</p>
                    {book.author && (
                      <p className="text-sm text-neutral-500 truncate">{book.author}</p>
                    )}
                    <p className="text-xs text-blue-600 mt-1">
                      Started {new Date(book.started_at).toLocaleDateString()}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <p className="text-neutral-500">Not currently reading anything</p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
