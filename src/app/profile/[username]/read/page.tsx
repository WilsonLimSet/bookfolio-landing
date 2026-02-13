import Image from "next/image";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import HeaderWrapper from "@/components/HeaderWrapper";

interface PageProps {
  params: Promise<{ username: string }>;
}

export default async function ReadBooksPage({ params }: PageProps) {
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

  const [fictionResult, nonfictionResult] = await Promise.all([
    supabase
      .from("user_books")
      .select("id, title, author, cover_url, open_library_key, tier, rank_position, score, category, review_text, finished_at")
      .eq("user_id", profile.id)
      .eq("category", "fiction")
      .order("rank_position"),
    supabase
      .from("user_books")
      .select("id, title, author, cover_url, open_library_key, tier, rank_position, score, category, review_text, finished_at")
      .eq("user_id", profile.id)
      .eq("category", "nonfiction")
      .order("rank_position"),
  ]);

  const fictionBooks = fictionResult.data || [];
  const nonfictionBooks = nonfictionResult.data || [];
  const totalBooks = fictionBooks.length + nonfictionBooks.length;

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
              <h1 className="text-xl font-bold">Read</h1>
              <p className="text-sm text-neutral-500">@{username} &middot; {totalBooks} books</p>
            </div>
          </div>

          {totalBooks > 0 ? (
            <div className="space-y-8">
              {/* Fiction */}
              {fictionBooks.length > 0 && (
                <section>
                  <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-4">
                    Fiction ({fictionBooks.length})
                  </h2>
                  <div className="space-y-2">
                    {fictionBooks.map((book, index) => (
                      <div key={book.id} className="rounded-xl hover:bg-neutral-50 transition-colors group">
                        <Link
                          href={`/book/${(book.open_library_key || book.id).replace("/works/", "").replace("/books/", "")}`}
                          className="flex items-center gap-4 p-3"
                        >
                          <span className="w-8 text-right font-mono text-lg font-bold text-neutral-300 group-hover:text-neutral-900 transition-colors">
                            {index + 1}
                          </span>
                          <div className="w-12 h-[72px] bg-neutral-100 rounded-lg overflow-hidden flex-shrink-0 shadow-sm group-hover:shadow-md transition-shadow relative">
                            {book.cover_url ? (
                              <Image src={book.cover_url} alt="" fill sizes="48px" className="object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[8px] text-neutral-400 p-1">
                                {book.title}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{book.title}</p>
                            {book.author && (
                              <p className="text-sm text-neutral-500 truncate">{book.author}</p>
                            )}
                            {book.finished_at && (
                              <p className="text-xs text-neutral-400">
                                Finished {new Date(book.finished_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                              </p>
                            )}
                          </div>
                          <div className={`text-lg font-bold ${
                            book.tier === 'liked' ? 'text-green-600' :
                            book.tier === 'fine' ? 'text-yellow-600' :
                            'text-red-500'
                          }`}>
                            {book.score}
                          </div>
                        </Link>
                        {book.review_text && (
                          <p className="ml-[76px] mr-3 pb-3 text-sm text-neutral-600 italic">
                            &ldquo;{book.review_text.length > 150 ? book.review_text.slice(0, 150) + "..." : book.review_text}&rdquo;
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Non-Fiction */}
              {nonfictionBooks.length > 0 && (
                <section>
                  <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-4">
                    Non-Fiction ({nonfictionBooks.length})
                  </h2>
                  <div className="space-y-2">
                    {nonfictionBooks.map((book, index) => (
                      <div key={book.id} className="rounded-xl hover:bg-neutral-50 transition-colors group">
                        <Link
                          href={`/book/${(book.open_library_key || book.id).replace("/works/", "").replace("/books/", "")}`}
                          className="flex items-center gap-4 p-3"
                        >
                          <span className="w-8 text-right font-mono text-lg font-bold text-neutral-300 group-hover:text-neutral-900 transition-colors">
                            {index + 1}
                          </span>
                          <div className="w-12 h-[72px] bg-neutral-100 rounded-lg overflow-hidden flex-shrink-0 shadow-sm group-hover:shadow-md transition-shadow relative">
                            {book.cover_url ? (
                              <Image src={book.cover_url} alt="" fill sizes="48px" className="object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[8px] text-neutral-400 p-1">
                                {book.title}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{book.title}</p>
                            {book.author && (
                              <p className="text-sm text-neutral-500 truncate">{book.author}</p>
                            )}
                            {book.finished_at && (
                              <p className="text-xs text-neutral-400">
                                Finished {new Date(book.finished_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                              </p>
                            )}
                          </div>
                          <div className={`text-lg font-bold ${
                            book.tier === 'liked' ? 'text-green-600' :
                            book.tier === 'fine' ? 'text-yellow-600' :
                            'text-red-500'
                          }`}>
                            {book.score}
                          </div>
                        </Link>
                        {book.review_text && (
                          <p className="ml-[76px] mr-3 pb-3 text-sm text-neutral-600 italic">
                            &ldquo;{book.review_text.length > 150 ? book.review_text.slice(0, 150) + "..." : book.review_text}&rdquo;
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-neutral-500">No books read yet</p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
