"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { getEditions, BookEdition } from "@/lib/openLibrary";

interface BookInfo {
  key: string;
  title: string;
  author: string | null;
  coverUrl: string | null;
}

interface UserBook {
  id: string;
  title: string;
  author: string | null;
  cover_url: string | null;
  rank_position: number;
  score: number;
  tier: string;
}

interface RankingFlowProps {
  book: BookInfo;
  onClose: () => void;
  onComplete: () => void;
  existingEntry?: {
    id: string;
    category: string;
    tier: string;
  } | null;
}

type Step = "cover" | "category" | "tier" | "compare" | "review" | "saving";
type Category = "fiction" | "nonfiction";
type Tier = "liked" | "fine" | "disliked";

export default function RankingFlow({
  book,
  onClose,
  onComplete,
  existingEntry,
}: RankingFlowProps) {
  const supabase = createClient();

  const [step, setStep] = useState<Step>("cover");
  const [selectedCover, setSelectedCover] = useState<string | null>(book.coverUrl);
  const [editions, setEditions] = useState<BookEdition[]>([]);
  const [loadingEditions, setLoadingEditions] = useState(true);

  const [category, setCategory] = useState<Category | null>(
    (existingEntry?.category as Category) || null
  );
  const [tier, setTier] = useState<Tier | null>(
    (existingEntry?.tier as Tier) || null
  );
  const [reviewText, setReviewText] = useState("");

  // For comparison step
  const [userBooks, setUserBooks] = useState<UserBook[]>([]);
  const [compareIndex, setCompareIndex] = useState(0);
  const [low, setLow] = useState(0);
  const [high, setHigh] = useState(0);
  const [finalPosition, setFinalPosition] = useState<number | null>(null);

  // Load editions for cover selection
  useEffect(() => {
    async function loadEditions() {
      setLoadingEditions(true);
      const editionList = await getEditions(book.key);
      setEditions(editionList);
      setLoadingEditions(false);
    }
    loadEditions();
  }, [book.key]);

  // Load user's books in category when we get to compare step
  useEffect(() => {
    if (step === "compare" && category) {
      loadUserBooks();
    }
  }, [step, category]);

  async function loadUserBooks() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("user_books")
      .select("*")
      .eq("user_id", user.id)
      .eq("category", category)
      .order("rank_position");

    const books = (data || []).filter(b => b.open_library_key !== book.key);
    setUserBooks(books);

    if (books.length === 0) {
      // First book in category, position 1
      setFinalPosition(1);
    } else {
      // Start binary search
      setLow(0);
      setHigh(books.length);
      setCompareIndex(Math.floor(books.length / 2));
    }
  }

  function handleCategorySelect(cat: Category) {
    setCategory(cat);
    setStep("tier");
  }

  function handleTierSelect(t: Tier) {
    setTier(t);
    setStep("compare");
  }

  function handlePrefer(preferNew: boolean) {
    // Binary search logic
    let newLow = low;
    let newHigh = high;

    if (preferNew) {
      // New book is better, search upper half (lower positions)
      newHigh = compareIndex;
    } else {
      // Existing book is better, search lower half (higher positions)
      newLow = compareIndex + 1;
    }

    if (newLow >= newHigh) {
      // Found position
      setFinalPosition(newLow + 1); // 1-indexed
    } else {
      setLow(newLow);
      setHigh(newHigh);
      setCompareIndex(Math.floor((newLow + newHigh) / 2));
    }
  }

  function handleSkip() {
    // Skip comparison, insert in middle of remaining range
    const midPosition = Math.floor((low + high) / 2) + 1;
    setFinalPosition(midPosition);
  }

  // Go to review step when we have final position
  useEffect(() => {
    if (finalPosition !== null && category && tier && step === "compare") {
      setStep("review");
    }
  }, [finalPosition, category, tier, step]);

  async function saveBook() {
    setStep("saving");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Calculate score based on position and tier
    const totalBooks = userBooks.length + 1;
    const score = calculateScore(finalPosition!, totalBooks, tier!);

    // Delete existing entry if re-ranking
    if (existingEntry) {
      await supabase.from("user_books").delete().eq("id", existingEntry.id);
    }

    // Shift positions of books at or after this position
    if (userBooks.length > 0) {
      const booksToShift = userBooks.filter(b => b.rank_position >= finalPosition!);
      for (const b of booksToShift) {
        await supabase
          .from("user_books")
          .update({ rank_position: b.rank_position + 1 })
          .eq("id", b.id);
      }
    }

    // Insert new book
    await supabase.from("user_books").insert({
      user_id: user.id,
      title: book.title,
      author: book.author,
      cover_url: selectedCover,
      open_library_key: book.key,
      category,
      tier,
      rank_position: finalPosition,
      score,
      review_text: reviewText || null,
    });

    // Recalculate all scores in category
    await recalculateScores(user.id, category!);

    // Log activity
    await supabase.from("activity").insert({
      user_id: user.id,
      action_type: "ranked",
      book_title: book.title,
      book_author: book.author,
      book_cover_url: selectedCover,
      book_key: book.key,
      book_score: score,
      book_category: category,
    });

    // Remove from want_to_read if it was there
    await supabase
      .from("want_to_read")
      .delete()
      .eq("user_id", user.id)
      .eq("open_library_key", book.key);

    onComplete();
  }

  async function recalculateScores(userId: string, cat: string) {
    const { data: books } = await supabase
      .from("user_books")
      .select("*")
      .eq("user_id", userId)
      .eq("category", cat)
      .order("rank_position");

    if (!books || books.length === 0) return;

    for (const b of books) {
      const newScore = calculateScore(b.rank_position, books.length, b.tier);
      await supabase
        .from("user_books")
        .update({ score: newScore, updated_at: new Date().toISOString() })
        .eq("id", b.id);
    }
  }

  function calculateScore(position: number, total: number, bookTier: string): number {
    // Tier boundaries
    const tierRanges = {
      liked: { min: 6.7, max: 10 },
      fine: { min: 3.4, max: 6.6 },
      disliked: { min: 0, max: 3.3 },
    };

    const range = tierRanges[bookTier as Tier];

    // If only one book, give it the middle of the tier
    if (total === 1) {
      return Math.round(((range.min + range.max) / 2) * 10) / 10;
    }

    // Count books in this tier
    const booksInTier = userBooks.filter(b => b.tier === bookTier).length + 1;
    const positionInTier = userBooks
      .filter(b => b.tier === bookTier && b.rank_position < position)
      .length + 1;

    // Linear interpolation within tier
    const ratio = (booksInTier - positionInTier) / (booksInTier - 1 || 1);
    const score = range.min + ratio * (range.max - range.min);

    return Math.round(score * 10) / 10;
  }

  const currentCompareBook = userBooks[compareIndex];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {selectedCover && (
              <img
                src={selectedCover}
                alt=""
                className="w-10 h-14 object-cover rounded"
              />
            )}
            <div>
              <p className="font-medium truncate max-w-[200px]">{book.title}</p>
              {book.author && (
                <p className="text-sm text-neutral-500 truncate max-w-[200px]">
                  {book.author}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === "cover" && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-center">Choose a cover</h2>
              {loadingEditions ? (
                <div className="flex justify-center py-8">
                  <div className="w-8 h-8 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin" />
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-4 gap-3 max-h-64 overflow-y-auto">
                    {/* Original cover */}
                    {book.coverUrl && (
                      <button
                        onClick={() => setSelectedCover(book.coverUrl)}
                        className={`aspect-[2/3] rounded-lg overflow-hidden border-2 transition-all ${
                          selectedCover === book.coverUrl
                            ? "border-neutral-900 ring-2 ring-neutral-900"
                            : "border-transparent hover:border-neutral-300"
                        }`}
                      >
                        <img
                          src={book.coverUrl}
                          alt="Original cover"
                          className="w-full h-full object-cover"
                        />
                      </button>
                    )}
                    {/* Edition covers */}
                    {editions
                      .filter((e) => e.coverUrl !== book.coverUrl)
                      .map((edition) => (
                        <button
                          key={edition.key}
                          onClick={() => setSelectedCover(edition.coverUrl)}
                          className={`aspect-[2/3] rounded-lg overflow-hidden border-2 transition-all ${
                            selectedCover === edition.coverUrl
                              ? "border-neutral-900 ring-2 ring-neutral-900"
                              : "border-transparent hover:border-neutral-300"
                          }`}
                        >
                          {edition.coverUrl && (
                            <img
                              src={edition.coverUrl}
                              alt={edition.title}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </button>
                      ))}
                  </div>
                  {editions.length === 0 && !book.coverUrl && (
                    <p className="text-center text-neutral-500 text-sm py-4">
                      No covers available for this book
                    </p>
                  )}
                </>
              )}
              <button
                onClick={() => setStep("category")}
                className="w-full py-3 bg-neutral-900 text-white rounded-lg font-medium hover:bg-neutral-800 transition-colors"
              >
                {selectedCover ? "Continue" : "Skip"}
              </button>
            </div>
          )}

          {step === "category" && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-center">Add to my list of</h2>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleCategorySelect("fiction")}
                  className="p-4 border-2 border-neutral-200 rounded-xl hover:border-neutral-900 hover:bg-neutral-50 transition-all"
                >
                  <span className="text-2xl mb-2 block">📖</span>
                  <span className="font-medium">Fiction</span>
                </button>
                <button
                  onClick={() => handleCategorySelect("nonfiction")}
                  className="p-4 border-2 border-neutral-200 rounded-xl hover:border-neutral-900 hover:bg-neutral-50 transition-all"
                >
                  <span className="text-2xl mb-2 block">📚</span>
                  <span className="font-medium">Non-Fiction</span>
                </button>
              </div>
            </div>
          )}

          {step === "tier" && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-center">How was it?</h2>
              <div className="flex justify-center gap-6">
                <button
                  onClick={() => handleTierSelect("liked")}
                  className="flex flex-col items-center gap-2 group"
                >
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-neutral-600">Liked it</span>
                </button>
                <button
                  onClick={() => handleTierSelect("fine")}
                  className="flex flex-col items-center gap-2 group"
                >
                  <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center group-hover:bg-yellow-200 transition-colors">
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  </div>
                  <span className="text-sm font-medium text-neutral-600">It was fine</span>
                </button>
                <button
                  onClick={() => handleTierSelect("disliked")}
                  className="flex flex-col items-center gap-2 group"
                >
                  <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center group-hover:bg-red-200 transition-colors">
                    <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-neutral-600">Didn&apos;t like it</span>
                </button>
              </div>
            </div>
          )}

          {step === "compare" && finalPosition === null && currentCompareBook && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-center">Which do you prefer?</h2>
              <div className="flex items-center gap-4">
                {/* New book */}
                <button
                  onClick={() => handlePrefer(true)}
                  className="flex-1 p-4 border-2 border-neutral-200 rounded-xl hover:border-neutral-900 transition-all group"
                >
                  <div className="aspect-[2/3] bg-neutral-100 rounded-lg overflow-hidden mb-3 group-hover:shadow-lg transition-shadow">
                    {selectedCover ? (
                      <img src={selectedCover} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-neutral-400 p-2 text-center">
                        {book.title}
                      </div>
                    )}
                  </div>
                  <p className="font-medium text-sm truncate">{book.title}</p>
                  {book.author && (
                    <p className="text-xs text-neutral-500 truncate">{book.author}</p>
                  )}
                </button>

                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center text-sm font-medium text-neutral-500">
                  OR
                </div>

                {/* Existing book */}
                <button
                  onClick={() => handlePrefer(false)}
                  className="flex-1 p-4 border-2 border-neutral-200 rounded-xl hover:border-neutral-900 transition-all group"
                >
                  <div className="aspect-[2/3] bg-neutral-100 rounded-lg overflow-hidden mb-3 group-hover:shadow-lg transition-shadow">
                    {currentCompareBook.cover_url ? (
                      <img src={currentCompareBook.cover_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-neutral-400 p-2 text-center">
                        {currentCompareBook.title}
                      </div>
                    )}
                  </div>
                  <p className="font-medium text-sm truncate">{currentCompareBook.title}</p>
                  <p className="text-xs text-neutral-500">
                    {currentCompareBook.author && <span className="truncate">{currentCompareBook.author} · </span>}
                    <span className="text-neutral-900 font-medium">{currentCompareBook.score}</span>
                  </p>
                </button>
              </div>

              {/* Actions */}
              <div className="flex justify-center gap-4 pt-2">
                <button
                  onClick={handleSkip}
                  className="px-4 py-2 text-sm text-neutral-500 hover:text-neutral-700"
                >
                  Too tough · Skip
                </button>
              </div>
            </div>
          )}

          {step === "compare" && finalPosition === null && !currentCompareBook && userBooks.length === 0 && (
            <div className="text-center py-8">
              <div className="w-12 h-12 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin mx-auto" />
              <p className="text-neutral-500 mt-4">Loading your books...</p>
            </div>
          )}

          {step === "review" && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-center">Add a review (optional)</h2>
              <p className="text-sm text-neutral-500 text-center">
                Share your thoughts about this book
              </p>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="What did you think? Any highlights, quotes, or takeaways..."
                className="w-full h-32 px-4 py-3 rounded-lg border border-neutral-200 focus:border-neutral-400 focus:outline-none resize-none"
                maxLength={1000}
              />
              <p className="text-xs text-neutral-400 text-right">{reviewText.length}/1000</p>
              <div className="flex gap-3">
                <button
                  onClick={() => saveBook()}
                  className="flex-1 py-3 text-neutral-600 border border-neutral-200 rounded-lg font-medium hover:bg-neutral-50 transition-colors"
                >
                  Skip
                </button>
                <button
                  onClick={() => saveBook()}
                  className="flex-1 py-3 bg-neutral-900 text-white rounded-lg font-medium hover:bg-neutral-800 transition-colors"
                >
                  {reviewText.trim() ? "Save with review" : "Save"}
                </button>
              </div>
            </div>
          )}

          {step === "saving" && (
            <div className="text-center py-8">
              <div className="w-12 h-12 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin mx-auto" />
              <p className="text-neutral-500 mt-4">Saving to your list...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
