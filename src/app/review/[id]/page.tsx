import Image from "next/image";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import HeaderWrapper from "@/components/HeaderWrapper";
import LikeButton from "@/components/LikeButton";
import CommentSection from "@/components/CommentSection";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ReviewPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Get the review
  const { data: review } = await supabase
    .from("user_books")
    .select("id, user_id, title, author, cover_url, open_library_key, category, tier, score, review_text, finished_at, created_at")
    .eq("id", id)
    .single();

  if (!review) {
    notFound();
  }

  // Parallel fetch: reviewer profile + like count + user like check
  const [{ data: profile }, likesResult, userLikeResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, username, avatar_url")
      .eq("id", review.user_id)
      .single(),
    supabase
      .from("review_likes")
      .select("id", { count: "exact", head: true })
      .eq("review_id", id),
    user
      ? supabase
          .from("review_likes")
          .select("id")
          .eq("review_id", id)
          .eq("user_id", user.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const likeCount = likesResult.count || 0;
  const isLiked = !!userLikeResult.data;

  return (
    <>
      <HeaderWrapper user={user} />
      <main className="min-h-screen px-4 sm:px-6 py-6">
        <div className="max-w-2xl mx-auto">
          {/* Back button */}
          <Link
            href="/feed"
            className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-700 mb-6"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Feed
          </Link>

          {/* Review Card */}
          <div className="bg-white rounded-xl border border-neutral-100 overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b border-neutral-100">
              <Link
                href={`/profile/${profile?.username}`}
                className="w-12 h-12 bg-neutral-200 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center text-lg font-bold text-neutral-500 relative"
              >
                {profile?.avatar_url ? (
                  <Image src={profile.avatar_url} alt="" fill sizes="48px" className="object-cover" />
                ) : (
                  (profile?.username || "?")[0].toUpperCase()
                )}
              </Link>
              <div>
                <Link href={`/profile/${profile?.username}`} className="font-medium hover:underline">
                  {profile?.username}
                </Link>
                <p className="text-sm text-neutral-500">
                  {new Date(review.created_at).toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>

            {/* Book Info */}
            <div className="flex gap-4 p-4">
              <Link
                href={`/book/${review.open_library_key?.replace("/works/", "").replace("/books/", "") || ""}`}
                className="w-24 h-36 bg-neutral-100 rounded-lg overflow-hidden flex-shrink-0 shadow-md relative"
              >
                {review.cover_url && (
                  <Image src={review.cover_url} alt="" fill sizes="96px" className="object-cover" />
                )}
              </Link>
              <div className="flex-1 min-w-0">
                <Link
                  href={`/book/${review.open_library_key?.replace("/works/", "").replace("/books/", "") || ""}`}
                  className="text-xl font-bold hover:underline block"
                >
                  {review.title}
                </Link>
                {review.author && (
                  <p className="text-neutral-500">{review.author}</p>
                )}
                <div className="flex items-center gap-2 mt-3">
                  <span className={`text-2xl font-bold ${
                    review.tier === 'liked' ? 'text-green-600' :
                    review.tier === 'fine' ? 'text-yellow-600' :
                    'text-red-500'
                  }`}>
                    {review.score}
                  </span>
                  {review.tier === 'liked' && <span className="text-xl">❤️</span>}
                </div>
                {review.finished_at && (
                  <p className="text-sm text-neutral-400 mt-2">
                    Finished {new Date(review.finished_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                  </p>
                )}
                <p className="text-xs text-neutral-400 mt-1">
                  in {review.category}
                </p>
              </div>
            </div>

            {/* Review Text */}
            {review.review_text ? (
              <div className="px-4 pb-4">
                <p className="text-neutral-700 leading-relaxed whitespace-pre-wrap">
                  {review.review_text}
                </p>
              </div>
            ) : (
              <div className="px-4 pb-4">
                <p className="text-neutral-400 italic">No written review</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-4 px-4 py-3 border-t border-neutral-100">
              {user ? (
                <LikeButton
                  reviewId={review.id}
                  initialLiked={isLiked}
                  initialCount={likeCount}
                  currentUserId={user.id}
                  reviewUserId={review.user_id}
                />
              ) : (
                <Link href="/login" className="text-sm text-neutral-500 hover:text-neutral-700 flex items-center gap-1.5">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  {likeCount > 0 ? likeCount : "Like"}
                </Link>
              )}
              <Link
                href={`/book/${review.open_library_key?.replace("/works/", "").replace("/books/", "") || ""}`}
                className="text-sm text-neutral-500 hover:text-neutral-700 flex items-center gap-1 ml-auto"
              >
                View Book
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Comments Section */}
          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-4">Comments</h2>
            <CommentSection
              reviewId={review.id}
              reviewUserId={review.user_id}
              reviewBookTitle={review.title}
              currentUserId={user?.id || null}
            />
          </div>
        </div>
      </main>
    </>
  );
}
