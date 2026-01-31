import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import FollowButton from "@/components/FollowButton";
import HeaderWrapper from "@/components/HeaderWrapper";

interface PageProps {
  params: Promise<{ username: string }>;
}

export default async function ProfilePage({ params }: PageProps) {
  const { username } = await params;
  const supabase = await createClient();

  // Get profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .single();

  if (!profile) {
    notFound();
  }

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  const isOwner = user?.id === profile.id;

  // Check if current user follows this profile
  let isFollowing = false;
  if (user && !isOwner) {
    const { data: follow } = await supabase
      .from("follows")
      .select("id")
      .eq("follower_id", user.id)
      .eq("following_id", profile.id)
      .single();
    isFollowing = !!follow;
  }

  // Get follower/following counts
  const { count: followersCount } = await supabase
    .from("follows")
    .select("*", { count: "exact", head: true })
    .eq("following_id", profile.id);

  const { count: followingCount } = await supabase
    .from("follows")
    .select("*", { count: "exact", head: true })
    .eq("follower_id", profile.id);

  // Get ranked books
  const { data: fictionBooks } = await supabase
    .from("user_books")
    .select("*")
    .eq("user_id", profile.id)
    .eq("category", "fiction")
    .order("rank_position");

  const { data: nonfictionBooks } = await supabase
    .from("user_books")
    .select("*")
    .eq("user_id", profile.id)
    .eq("category", "nonfiction")
    .order("rank_position");

  // Get want to read
  const { data: wantToRead } = await supabase
    .from("want_to_read")
    .select("*")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(8);

  // Get user's favorite books (explicit selection)
  const { data: favoriteBooks } = await supabase
    .from("favorite_books")
    .select("*")
    .eq("user_id", profile.id)
    .order("position");

  const hasRankedBooks = (fictionBooks?.length || 0) + (nonfictionBooks?.length || 0) > 0;
  const hasFavorites = (favoriteBooks?.length || 0) > 0;

  return (
    <>
      <HeaderWrapper />
      <main className="min-h-screen px-4 sm:px-6 py-6">
        <div className="max-w-2xl mx-auto">
          {/* Profile Info */}
          <div className="text-center mb-8">
          <div className="w-24 h-24 bg-gradient-to-br from-neutral-200 to-neutral-300 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl font-bold text-neutral-500">
            {(profile.username)[0].toUpperCase()}
          </div>
          <h1 className="text-2xl font-bold">
            {profile.username}
          </h1>
          <p className="text-neutral-500">@{profile.username}</p>

            {/* Stats */}
            <div className="flex justify-center gap-6 mt-4">
              <div className="text-center">
                <p className="text-xl font-bold">{(fictionBooks?.length || 0) + (nonfictionBooks?.length || 0)}</p>
                <p className="text-xs text-neutral-500">Books</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold">{followersCount || 0}</p>
                <p className="text-xs text-neutral-500">Followers</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold">{followingCount || 0}</p>
                <p className="text-xs text-neutral-500">Following</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-center gap-3 mt-4">
              {isOwner && (
                <Link
                  href="/profile/edit"
                  className="px-4 py-2 text-sm text-neutral-600 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
                >
                  Edit Profile
                </Link>
              )}
              <FollowButton
                targetUserId={profile.id}
                targetUsername={profile.username}
                isFollowing={isFollowing}
                currentUserId={user?.id || null}
              />
            </div>
          </div>

        {/* Favorite Books - User curated selection */}
        {hasFavorites && (
          <section className="mb-10">
            <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-4">
              Favorite Books
            </h2>
            <div className="grid grid-cols-4 gap-3">
              {favoriteBooks?.map((book) => (
                <Link
                  key={book.id}
                  href={`/book/${(book.open_library_key || book.id).replace("/works/", "").replace("/books/", "")}`}
                  className="group relative aspect-[2/3] bg-neutral-100 rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-all hover:scale-105"
                >
                  {book.cover_url ? (
                    <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center p-2 text-center">
                      <span className="text-xs text-neutral-400">{book.title}</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                    <div>
                      <p className="text-white text-sm font-medium leading-tight">{book.title}</p>
                      {book.author && <p className="text-white/70 text-xs mt-1">{book.author}</p>}
                    </div>
                  </div>
                </Link>
              ))}
              {/* Empty slots if less than 4 */}
              {Array.from({ length: Math.max(0, 4 - (favoriteBooks?.length || 0)) }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="aspect-[2/3] bg-neutral-100 rounded-lg border-2 border-dashed border-neutral-200"
                />
              ))}
            </div>
          </section>
        )}

        {/* Want to Read */}
        {wantToRead && wantToRead.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-4">
              Want to Read
            </h2>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {wantToRead.map((book) => (
                <Link
                  key={book.id}
                  href={`/book/${book.open_library_key.replace("/works/", "").replace("/books/", "")}`}
                  className="flex-shrink-0 w-16 aspect-[2/3] bg-neutral-100 rounded-lg overflow-hidden hover:opacity-80 transition-opacity"
                >
                  {book.cover_url ? (
                    <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[8px] text-neutral-400 p-1">
                      {book.title}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Ranked Books */}
        {hasRankedBooks ? (
          <div className="space-y-10">
            {fictionBooks && fictionBooks.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-4">
                  Fiction
                </h2>
                <div className="space-y-2">
                  {fictionBooks.map((book, index) => (
                    <Link
                      key={book.id}
                      href={`/book/${(book.open_library_key || book.id).replace("/works/", "").replace("/books/", "")}`}
                      className="flex items-center gap-4 p-3 rounded-xl hover:bg-neutral-50 transition-colors group"
                    >
                      <span className="w-8 text-right font-mono text-lg font-bold text-neutral-300 group-hover:text-neutral-900 transition-colors">
                        {index + 1}
                      </span>
                      <div className="w-12 h-[72px] bg-neutral-100 rounded-lg overflow-hidden flex-shrink-0 shadow-sm group-hover:shadow-md transition-shadow">
                        {book.cover_url ? (
                          <img src={book.cover_url} alt="" className="w-full h-full object-cover" />
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
                      </div>
                      <div className={`text-lg font-bold ${
                        book.tier === 'liked' ? 'text-green-600' :
                        book.tier === 'fine' ? 'text-yellow-600' :
                        'text-red-500'
                      }`}>
                        {book.score}
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {nonfictionBooks && nonfictionBooks.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-4">
                  Non-Fiction
                </h2>
                <div className="space-y-2">
                  {nonfictionBooks.map((book, index) => (
                    <Link
                      key={book.id}
                      href={`/book/${(book.open_library_key || book.id).replace("/works/", "").replace("/books/", "")}`}
                      className="flex items-center gap-4 p-3 rounded-xl hover:bg-neutral-50 transition-colors group"
                    >
                      <span className="w-8 text-right font-mono text-lg font-bold text-neutral-300 group-hover:text-neutral-900 transition-colors">
                        {index + 1}
                      </span>
                      <div className="w-12 h-[72px] bg-neutral-100 rounded-lg overflow-hidden flex-shrink-0 shadow-sm group-hover:shadow-md transition-shadow">
                        {book.cover_url ? (
                          <img src={book.cover_url} alt="" className="w-full h-full object-cover" />
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
                      </div>
                      <div className={`text-lg font-bold ${
                        book.tier === 'liked' ? 'text-green-600' :
                        book.tier === 'fine' ? 'text-yellow-600' :
                        'text-red-500'
                      }`}>
                        {book.score}
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-neutral-500 mb-4">No books ranked yet</p>
            {isOwner && (
              <Link
                href="/"
                className="inline-block px-6 py-3 bg-neutral-900 text-white rounded-lg font-medium hover:bg-neutral-800 transition-colors"
              >
                Find books to rank
              </Link>
            )}
          </div>
        )}
      </div>
    </main>
    </>
  );
}
