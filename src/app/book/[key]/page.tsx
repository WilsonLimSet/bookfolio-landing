import { notFound, redirect } from "next/navigation";
import Image from "next/image";
import type { Metadata } from "next";
import { getBookDetails } from "@/lib/openLibrary";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import AddToListButton from "@/components/AddToListButton";
import WantToReadButton from "@/components/WantToReadButton";
import CurrentlyReadingButton from "@/components/CurrentlyReadingButton";
import AddToBookListButton from "@/components/AddToBookListButton";
import HeaderWrapper from "@/components/HeaderWrapper";
import ExpandableText from "@/components/ExpandableText";

interface PageProps {
  params: Promise<{ key: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { key } = await params;
  const decodedKey = decodeURIComponent(key);
  if (decodedKey.endsWith("M") || decodedKey.includes("/books/")) {
    return { title: "Book | Bookfolio" };
  }
  const workKey = decodedKey.startsWith("/works/") ? decodedKey : `/works/${decodedKey}`;
  const book = await getBookDetails(workKey);
  if (!book) {
    return { title: "Book not found | Bookfolio" };
  }
  const title = `${book.title} by ${book.author || "Unknown"} | Bookfolio`;
  const description = book.description
    ? book.description.slice(0, 160)
    : `Read reviews of ${book.title} on Bookfolio.`;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      ...(book.coverUrl ? { images: [book.coverUrl] } : {}),
    },
  };
}

async function getWorkKeyFromEdition(editionKey: string): Promise<string | null> {
  try {
    const response = await fetch(`https://openlibrary.org${editionKey}.json`);
    if (!response.ok) return null;
    const data = await response.json();
    // Edition has works array with references to parent work
    if (data.works && data.works.length > 0) {
      return data.works[0].key;
    }
    return null;
  } catch {
    return null;
  }
}

export default async function BookPage({ params }: PageProps) {
  const { key } = await params;
  const decodedKey = decodeURIComponent(key);

  // Detect if this is an edition key (ends with M) vs work key (ends with W)
  let workKey: string;
  if (decodedKey.endsWith("M") || decodedKey.includes("/books/")) {
    // This is an edition key, need to get the parent work
    const editionKey = decodedKey.startsWith("/books/") ? decodedKey : `/books/${decodedKey}`;
    const parentWorkKey = await getWorkKeyFromEdition(editionKey);
    if (parentWorkKey) {
      // Redirect to the work page
      redirect(`/book/${parentWorkKey.replace("/works/", "")}`);
    }
    notFound();
  } else {
    // Handle works: "OL12345W" or "/works/OL12345W"
    workKey = decodedKey.startsWith("/works/") ? decodedKey : `/works/${decodedKey}`;
  }

  // Parallel fetch: book details + Supabase setup
  const supabase = await createClient();
  const [book, { data: { user } }, { data: allRatings }] = await Promise.all([
    getBookDetails(workKey),
    supabase.auth.getUser(),
    supabase
      .from("user_books")
      .select("id, user_id, score, tier, review_text, created_at")
      .eq("open_library_key", workKey)
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  if (!book) {
    notFound();
  }

  // Check if user has this book ranked, in want to read, or currently reading
  let userBookEntry = null;
  let isInWantToRead = false;
  let isCurrentlyReading = false;

  // Parallel fetch: user's book status + reviewer profiles
  const reviewerIds = [...new Set(allRatings?.map(r => r.user_id) || [])];

  const [userStatusResults, { data: reviewerProfiles }] = await Promise.all([
    user
      ? Promise.all([
          supabase
            .from("user_books")
            .select("id, user_id, title, author, cover_url, open_library_key, category, tier, rank_position, score, review_text, finished_at")
            .eq("user_id", user.id)
            .eq("open_library_key", workKey)
            .maybeSingle(),
          supabase
            .from("want_to_read")
            .select("id")
            .eq("user_id", user.id)
            .eq("open_library_key", workKey)
            .maybeSingle(),
          supabase
            .from("currently_reading")
            .select("id")
            .eq("user_id", user.id)
            .eq("open_library_key", workKey)
            .maybeSingle(),
        ])
      : Promise.resolve([null, null, null]),
    supabase
      .from("profiles")
      .select("id, username, avatar_url")
      .in("id", reviewerIds.length > 0 ? reviewerIds : ["none"]),
  ]);

  if (user && userStatusResults) {
    const [rankedResult, wtrResult, readingResult] = userStatusResults;
    userBookEntry = rankedResult?.data || null;
    isInWantToRead = !!wtrResult?.data;
    isCurrentlyReading = !!readingResult?.data;
  }

  const profileMap = new Map(reviewerProfiles?.map(p => [p.id, p]) || []);

  // Use user's chosen cover if they ranked this book, otherwise OpenLibrary's best edition
  const displayCover = userBookEntry?.cover_url || book.coverUrl;

  // Calculate average score
  const avgScore = allRatings && allRatings.length > 0
    ? (allRatings.reduce((sum, r) => sum + parseFloat(r.score), 0) / allRatings.length).toFixed(1)
    : null;

  // Get reviews with text
  const reviewsWithText = allRatings?.filter(r => r.review_text) || [];

  return (
    <>
      <HeaderWrapper user={user} />
      <main className="min-h-screen px-4 sm:px-6 py-6">
        <div className="max-w-4xl mx-auto">
          {/* Book Details */}
          <div className="flex flex-col md:flex-row gap-6 sm:gap-8">
          {/* Cover */}
          <div className="flex-shrink-0">
            <div className="w-48 md:w-64 bg-neutral-50 rounded-xl overflow-hidden shadow-lg mx-auto md:mx-0 relative group">
              {displayCover ? (
                <Image
                  src={displayCover}
                  alt={book.title}
                  width={256}
                  height={384}
                  sizes="(max-width: 768px) 192px, 256px"
                  className="w-full h-auto rounded-xl"
                  priority
                />
              ) : (
                <div className="w-full aspect-[2/3] flex items-center justify-center text-neutral-400 p-4 text-center bg-neutral-100">
                  {book.title}
                </div>
              )}
              {/* Spine shadow */}
              <div className="absolute left-0 inset-y-0 w-[4px] bg-gradient-to-r from-black/20 to-transparent pointer-events-none rounded-l-xl" />
              {/* Bottom shadow */}
              <div className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-black/10 to-transparent pointer-events-none rounded-b-xl" />
            </div>
          </div>

          {/* Info */}
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">{book.title}</h1>
            {book.author && (
              <p className="text-xl text-neutral-600 mb-1">
                {book.author}
                {book.translator && (
                  <span className="text-base text-neutral-400">
                    , {book.translator} <span className="text-sm">(Translator)</span>
                  </span>
                )}
              </p>
            )}
            {/* Metadata row */}
            <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-500 mb-4">
              {book.firstPublishYear && (
                <span>{book.firstPublishYear}</span>
              )}
              {book.pageCount && (
                <>
                  {book.firstPublishYear && <span>·</span>}
                  <span>{book.pageCount} pages</span>
                </>
              )}
            </div>

            {/* User's rating if exists */}
            {userBookEntry && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-neutral-100 rounded-full mb-6">
                <span className={`text-lg font-bold ${
                  userBookEntry.tier === 'liked' ? 'text-green-600' :
                  userBookEntry.tier === 'fine' ? 'text-yellow-600' :
                  'text-red-500'
                }`}>
                  {userBookEntry.score}
                </span>
                <span className="text-sm text-neutral-500">
                  #{userBookEntry.rank_position} in {userBookEntry.category}
                </span>
              </div>
            )}

            {/* Action buttons */}
            {user ? (
              <div className="flex flex-wrap gap-3 mb-6">
                <AddToListButton
                  book={{
                    key: workKey,
                    title: book.title,
                    author: book.author,
                    coverUrl: book.coverUrl,
                  }}
                  existingEntry={userBookEntry}
                />
                {!userBookEntry && (
                  <>
                    <CurrentlyReadingButton
                      book={{
                        key: workKey,
                        title: book.title,
                        author: book.author,
                        coverUrl: book.coverUrl,
                      }}
                      isReading={isCurrentlyReading}
                    />
                    {!isCurrentlyReading && (
                      <WantToReadButton
                        book={{
                          key: workKey,
                          title: book.title,
                          author: book.author,
                          coverUrl: book.coverUrl,
                        }}
                        isInList={isInWantToRead}
                      />
                    )}
                  </>
                )}
                <AddToBookListButton
                  book={{
                    key: workKey,
                    title: book.title,
                    author: book.author,
                    coverUrl: book.coverUrl,
                  }}
                />
              </div>
            ) : (
              <Link
                href="/login"
                className="inline-block px-6 py-3 bg-neutral-900 text-white rounded-lg font-medium hover:bg-neutral-800 transition-colors mb-6"
              >
                Sign in to rank this book
              </Link>
            )}

            {/* Description */}
            {book.description ? (
              <div className="mt-4">
                <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                  Description
                </h2>
                <ExpandableText
                  text={book.description}
                  maxLength={500}
                  className="text-neutral-700 leading-relaxed"
                />
              </div>
            ) : book.subjects.length > 0 ? (
              <div className="mt-4">
                <p className="text-sm text-neutral-400 italic">
                  No description available
                </p>
              </div>
            ) : null}

            {/* Subjects/Tags */}
            {book.subjects.length > 0 && (
              <div className="mt-4">
                <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                  Topics
                </h2>
                <div className="flex flex-wrap gap-2">
                  {book.subjects.map((subject) => (
                    <span
                      key={subject}
                      className="px-3 py-1 bg-neutral-100 text-neutral-600 rounded-full text-sm"
                    >
                      {subject}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Community Rating */}
            {avgScore && allRatings && allRatings.length > 0 && (
              <div className="mt-6 p-4 bg-neutral-50 rounded-xl">
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-green-600">{avgScore}</p>
                    <p className="text-xs text-neutral-500">avg score</p>
                  </div>
                  <div className="h-10 w-px bg-neutral-200" />
                  <div className="text-center">
                    <p className="text-3xl font-bold text-neutral-700">{allRatings.length}</p>
                    <p className="text-xs text-neutral-500">{allRatings.length === 1 ? "rating" : "ratings"}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Reviews Section */}
        {reviewsWithText.length > 0 && (
          <div className="mt-12">
            <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-4">
              Reviews
            </h2>
            <div className="space-y-4">
              {reviewsWithText.map((review) => {
                const reviewer = profileMap.get(review.user_id);
                return (
                  <div key={review.id} className="p-4 bg-white border border-neutral-100 rounded-xl">
                    <div className="flex items-center gap-3 mb-3">
                      <Link
                        href={`/profile/${reviewer?.username}`}
                        className="w-8 h-8 bg-neutral-200 rounded-full flex items-center justify-center text-sm font-bold text-neutral-500 hover:bg-neutral-300 transition-colors overflow-hidden relative"
                      >
                        {reviewer?.avatar_url ? (
                          <Image
                            src={reviewer.avatar_url}
                            alt={reviewer.username}
                            fill
                            sizes="32px"
                            className="object-cover"
                          />
                        ) : (
                          (reviewer?.username || "?")[0].toUpperCase()
                        )}
                      </Link>
                      <div>
                        <Link
                          href={`/profile/${reviewer?.username}`}
                          className="font-medium text-sm hover:underline"
                        >
                          {reviewer?.username || "Anonymous"}
                        </Link>
                        <p className="text-xs text-neutral-500">
                          rated{" "}
                          <span className={`font-bold ${
                            review.tier === "liked" ? "text-green-600" :
                            review.tier === "fine" ? "text-yellow-600" :
                            "text-red-500"
                          }`}>
                            {review.score}
                          </span>
                        </p>
                      </div>
                    </div>
                    <p className="text-neutral-700 text-sm leading-relaxed">{review.review_text}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </main>
    </>
  );
}
