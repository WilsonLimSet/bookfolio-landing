"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

// Animation variants
const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
} as const;

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 300, damping: 30 },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 20,
    transition: { duration: 0.2 },
  },
};

const stepVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 100 : -100,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: { type: "spring" as const, stiffness: 300, damping: 30 },
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -100 : 100,
    opacity: 0,
    transition: { duration: 0.2 },
  }),
};

const bookCardVariants = {
  idle: { scale: 1, y: 0 },
  hover: { scale: 1.02, y: -4, transition: { type: "spring" as const, stiffness: 400, damping: 25 } },
  tap: { scale: 0.98 },
  selected: {
    scale: 1.05,
    y: -8,
    boxShadow: "0 20px 40px rgba(0,0,0,0.15)",
    transition: { type: "spring" as const, stiffness: 400, damping: 25 },
  },
  exit: {
    scale: 0.8,
    opacity: 0,
    transition: { duration: 0.3 },
  },
};

const pulseVariants = {
  pulse: {
    scale: [1, 1.05, 1],
    transition: { repeat: Infinity, duration: 2 },
  },
};

export default function RankingFlow({
  book,
  onClose,
  onComplete,
  existingEntry,
}: RankingFlowProps) {
  const supabase = createClient();

  const [step, setStep] = useState<Step>("cover");
  const [direction, setDirection] = useState(1); // For step transition direction
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
  const [finishedAt, setFinishedAt] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  // For comparison step
  const [userBooksCache, setUserBooksCache] = useState<Record<string, UserBook[]>>({});
  const [loadingBooks, setLoadingBooks] = useState(true);
  const [compareIndex, setCompareIndex] = useState(0);
  const [low, setLow] = useState(0);
  const [high, setHigh] = useState(0);
  const [finalPosition, setFinalPosition] = useState<number | null>(null);
  const [selectedBook, setSelectedBook] = useState<"new" | "existing" | null>(null);
  const [isComparing, setIsComparing] = useState(false);
  const [comparisonInitialized, setComparisonInitialized] = useState(false);

  // Get user books for current category from cache
  const userBooks = useMemo(() => {
    return category ? (userBooksCache[category] || []) : [];
  }, [category, userBooksCache]);

  // Only compare against books in the same tier (liked vs liked, fine vs fine, etc.)
  const tierBooks = useMemo(() => {
    if (!tier) return [];
    return userBooks.filter(b => b.tier === tier);
  }, [userBooks, tier]);

  // Prefetch user books for BOTH categories on mount
  useEffect(() => {
    let cancelled = false;

    async function prefetchBooks() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      // Fetch both categories in parallel
      const [fictionResult, nonfictionResult] = await Promise.all([
        supabase
          .from("user_books")
          .select("*")
          .eq("user_id", user.id)
          .eq("category", "fiction")
          .order("rank_position"),
        supabase
          .from("user_books")
          .select("*")
          .eq("user_id", user.id)
          .eq("category", "nonfiction")
          .order("rank_position"),
      ]);

      if (cancelled) return;

      setUserBooksCache({
        fiction: (fictionResult.data || []).filter(b => b.open_library_key !== book.key),
        nonfiction: (nonfictionResult.data || []).filter(b => b.open_library_key !== book.key),
      });

      setLoadingBooks(false);
    }

    prefetchBooks();

    return () => {
      cancelled = true;
    };
  }, [supabase, book.key]);

  // Load editions for cover selection
  useEffect(() => {
    let cancelled = false;

    async function loadEditions() {
      setLoadingEditions(true);
      const editionList = await getEditions(book.key);
      if (cancelled) return;
      setEditions(editionList);
      setLoadingEditions(false);
    }
    loadEditions();

    return () => {
      cancelled = true;
    };
  }, [book.key]);

  // Initialize binary search when entering compare step (only compare within same tier)
  // Only runs once per compare session to prevent resetting mid-comparison
  useEffect(() => {
    if (step === "compare" && category && tier && !loadingBooks && !comparisonInitialized) {
      const allBooks = userBooksCache[category] || [];
      const booksInTier = allBooks.filter(b => b.tier === tier);

      if (booksInTier.length === 0) {
        // First book in this tier - position after all higher-tier books
        const tierOrder = { liked: 0, fine: 1, disliked: 2 };
        const higherTierBooks = allBooks.filter(b => tierOrder[b.tier as Tier] < tierOrder[tier]);
        setFinalPosition(higherTierBooks.length + 1);
      } else {
        setLow(0);
        setHigh(booksInTier.length);
        setCompareIndex(Math.floor(booksInTier.length / 2));
      }
      setComparisonInitialized(true);
    }
  }, [step, category, tier, loadingBooks, userBooksCache, comparisonInitialized]);

  const goToStep = useCallback((newStep: Step, dir: number = 1) => {
    setDirection(dir);
    setStep(newStep);
  }, []);

  function handleCategorySelect(cat: Category) {
    setCategory(cat);
    goToStep("tier");
  }

  function handleTierSelect(t: Tier) {
    setTier(t);
    goToStep("compare");
  }

  async function handlePrefer(preferNew: boolean) {
    // Show selection animation
    setSelectedBook(preferNew ? "new" : "existing");
    setIsComparing(true);

    // Wait for animation
    await new Promise(resolve => setTimeout(resolve, 400));

    // Binary search logic within tier
    let newLow = low;
    let newHigh = high;

    if (preferNew) {
      newHigh = compareIndex;
    } else {
      newLow = compareIndex + 1;
    }

    if (newLow >= newHigh) {
      // Position = higher tier books + position within this tier
      const tierOrder = { liked: 0, fine: 1, disliked: 2 };
      const higherTierBooks = userBooks.filter(b => tierOrder[b.tier as Tier] < tierOrder[tier!]);
      setFinalPosition(higherTierBooks.length + newLow + 1);
    } else {
      setLow(newLow);
      setHigh(newHigh);
      setCompareIndex(Math.floor((newLow + newHigh) / 2));
    }

    setSelectedBook(null);
    setIsComparing(false);
  }

  function handleSkip() {
    // Position = higher tier books + mid position within this tier
    const tierOrder = { liked: 0, fine: 1, disliked: 2 };
    const higherTierBooks = userBooks.filter(b => tierOrder[b.tier as Tier] < tierOrder[tier!]);
    const midPositionInTier = Math.floor((low + high) / 2);
    setFinalPosition(higherTierBooks.length + midPositionInTier + 1);
  }

  // Go to review step when we have final position
  useEffect(() => {
    if (finalPosition !== null && category && tier && step === "compare") {
      const timer = setTimeout(() => goToStep("review"), 0);
      return () => clearTimeout(timer);
    }
  }, [finalPosition, category, tier, step, goToStep]);

  async function saveBook() {
    goToStep("saving");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const totalBooks = userBooks.length + 1;
    const score = calculateScore(finalPosition!, totalBooks, tier!);

    // Delete existing entry if re-ranking
    if (existingEntry) {
      await supabase.from("user_books").delete().eq("id", existingEntry.id);
    }

    // Shift positions of books at or after this position (batch update)
    const booksToShift = userBooks.filter(b => b.rank_position >= finalPosition!);
    if (booksToShift.length > 0) {
      await Promise.all(
        booksToShift.map(b =>
          supabase
            .from("user_books")
            .update({ rank_position: b.rank_position + 1 })
            .eq("id", b.id)
        )
      );
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
      finished_at: finishedAt || null,
    });

    // Parallel post-insert operations
    await Promise.all([
      recalculateScores(user.id, category!),
      supabase.from("activity").insert({
        user_id: user.id,
        action_type: "ranked",
        book_title: book.title,
        book_author: book.author,
        book_cover_url: selectedCover,
        book_key: book.key,
        book_score: score,
        book_category: category,
      }),
      supabase
        .from("want_to_read")
        .delete()
        .eq("user_id", user.id)
        .eq("open_library_key", book.key),
    ]);

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

    // Batch all score updates
    await Promise.all(
      books.map(b => {
        const newScore = calculateScore(b.rank_position, books.length, b.tier);
        return supabase
          .from("user_books")
          .update({ score: newScore, updated_at: new Date().toISOString() })
          .eq("id", b.id);
      })
    );
  }

  function calculateScore(position: number, total: number, bookTier: string): number {
    const tierRanges = {
      liked: { min: 6.7, max: 10 },
      fine: { min: 3.4, max: 6.6 },
      disliked: { min: 0, max: 3.3 },
    };

    const range = tierRanges[bookTier as Tier];

    if (total === 1) {
      return Math.round(((range.min + range.max) / 2) * 10) / 10;
    }

    const booksInTier = userBooks.filter(b => b.tier === bookTier).length + 1;
    const positionInTier = userBooks
      .filter(b => b.tier === bookTier && b.rank_position < position)
      .length + 1;

    const ratio = (booksInTier - positionInTier) / (booksInTier - 1 || 1);
    const score = range.min + ratio * (range.max - range.min);

    return Math.round(score * 10) / 10;
  }

  const currentCompareBook = tierBooks[compareIndex];
  const stepIndex = ["cover", "category", "tier", "compare", "review", "saving"].indexOf(step);
  const progress = ((stepIndex + 1) / 5) * 100;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          variants={overlayVariants}
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
          variants={modalVariants}
        >
          {/* Progress bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-neutral-100">
            <motion.div
              className="h-full bg-gradient-to-r from-neutral-800 to-neutral-600"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
            />
          </div>

          {/* Header */}
          <div className="p-4 pt-5 border-b border-neutral-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                className="relative"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                {selectedCover ? (
                  <img
                    src={selectedCover}
                    alt=""
                    className="w-10 h-14 object-cover rounded shadow-md"
                  />
                ) : (
                  <div className="w-10 h-14 bg-neutral-200 rounded flex items-center justify-center">
                    <span className="text-[8px] text-neutral-400">No cover</span>
                  </div>
                )}
              </motion.div>
              <div>
                <p className="font-semibold truncate max-w-[200px]">{book.title}</p>
                {book.author && (
                  <p className="text-sm text-neutral-500 truncate max-w-[200px]">
                    {book.author}
                  </p>
                )}
              </div>
            </div>
            <motion.button
              onClick={onClose}
              className="p-2 hover:bg-neutral-100 rounded-full"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </motion.button>
          </div>

          {/* Content with step transitions */}
          <div className="p-6 min-h-[320px]">
            <AnimatePresence mode="wait" custom={direction}>
              {step === "cover" && (
                <motion.div
                  key="cover"
                  custom={direction}
                  variants={stepVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="space-y-4"
                >
                  <h2 className="text-lg font-semibold text-center">
                    {existingEntry ? "Change cover" : "Choose a cover"}
                  </h2>
                  {loadingEditions ? (
                    <div className="flex justify-center py-8">
                      <motion.div
                        className="w-10 h-10 border-3 border-neutral-200 border-t-neutral-800 rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                      />
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-4 gap-3 max-h-64 overflow-y-auto">
                        {book.coverUrl && (
                          <motion.button
                            onClick={() => setSelectedCover(book.coverUrl)}
                            className={`aspect-[2/3] rounded-lg overflow-hidden border-2 ${
                              selectedCover === book.coverUrl
                                ? "border-neutral-900 ring-2 ring-neutral-900 ring-offset-2"
                                : "border-transparent hover:border-neutral-300"
                            }`}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <img
                              src={book.coverUrl}
                              alt="Original cover"
                              className="w-full h-full object-cover"
                            />
                          </motion.button>
                        )}
                        {editions
                          .filter((e) => e.coverUrl !== book.coverUrl)
                          .map((edition, i) => (
                            <motion.button
                              key={edition.key}
                              onClick={() => setSelectedCover(edition.coverUrl)}
                              className={`aspect-[2/3] rounded-lg overflow-hidden border-2 ${
                                selectedCover === edition.coverUrl
                                  ? "border-neutral-900 ring-2 ring-neutral-900 ring-offset-2"
                                  : "border-transparent hover:border-neutral-300"
                              }`}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.05 }}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              {edition.coverUrl && (
                                <img
                                  src={edition.coverUrl}
                                  alt={edition.title}
                                  className="w-full h-full object-cover"
                                />
                              )}
                            </motion.button>
                          ))}
                      </div>
                      {editions.length === 0 && !book.coverUrl && (
                        <p className="text-center text-neutral-500 text-sm py-4">
                          No covers available for this book
                        </p>
                      )}
                    </>
                  )}
                  <motion.button
                    onClick={() => goToStep("category")}
                    className="w-full py-3 bg-neutral-900 text-white rounded-xl font-medium"
                    whileHover={{ scale: 1.02, backgroundColor: "#262626" }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {selectedCover ? "Continue" : "Skip"}
                  </motion.button>
                </motion.div>
              )}

              {step === "category" && (
                <motion.div
                  key="category"
                  custom={direction}
                  variants={stepVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="space-y-4"
                >
                  <h2 className="text-lg font-semibold text-center">
                    {existingEntry ? "Change category" : "Add to my list of"}
                  </h2>
                  {existingEntry && (
                    <p className="text-sm text-neutral-500 text-center">
                      Currently in: <span className="font-medium">{existingEntry.category}</span>
                    </p>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <motion.button
                      onClick={() => handleCategorySelect("fiction")}
                      className={`p-6 border-2 rounded-xl ${
                        existingEntry?.category === "fiction"
                          ? "border-neutral-900 bg-neutral-50"
                          : "border-neutral-200"
                      }`}
                      variants={bookCardVariants}
                      initial="idle"
                      whileHover="hover"
                      whileTap="tap"
                    >
                      <motion.span
                        className="text-3xl mb-3 block"
                        animate={{ rotate: [0, -10, 10, 0] }}
                        transition={{ repeat: Infinity, duration: 3, repeatDelay: 2 }}
                      >
                        📖
                      </motion.span>
                      <span className="font-semibold">Fiction</span>
                      <p className="text-xs text-neutral-500 mt-1">
                        {userBooksCache.fiction?.length || 0} books
                      </p>
                    </motion.button>
                    <motion.button
                      onClick={() => handleCategorySelect("nonfiction")}
                      className={`p-6 border-2 rounded-xl ${
                        existingEntry?.category === "nonfiction"
                          ? "border-neutral-900 bg-neutral-50"
                          : "border-neutral-200"
                      }`}
                      variants={bookCardVariants}
                      initial="idle"
                      whileHover="hover"
                      whileTap="tap"
                    >
                      <motion.span
                        className="text-3xl mb-3 block"
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ repeat: Infinity, duration: 3, repeatDelay: 2 }}
                      >
                        📚
                      </motion.span>
                      <span className="font-semibold">Non-Fiction</span>
                      <p className="text-xs text-neutral-500 mt-1">
                        {userBooksCache.nonfiction?.length || 0} books
                      </p>
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {step === "tier" && (
                <motion.div
                  key="tier"
                  custom={direction}
                  variants={stepVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="space-y-6"
                >
                  <h2 className="text-lg font-semibold text-center">
                    {existingEntry ? "Change rating" : "How was it?"}
                  </h2>
                  <div className="flex justify-center gap-8">
                    {[
                      { id: "liked", icon: "check", color: "green", label: "Liked it" },
                      { id: "fine", icon: "dot", color: "yellow", label: "It was fine" },
                      { id: "disliked", icon: "x", color: "red", label: "Didn't like it" },
                    ].map((t, i) => (
                      <motion.button
                        key={t.id}
                        onClick={() => handleTierSelect(t.id as Tier)}
                        className="flex flex-col items-center gap-3"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                      >
                        <motion.div
                          className={`w-18 h-18 rounded-full flex items-center justify-center ${
                            existingEntry?.tier === t.id
                              ? `bg-${t.color}-200 ring-2 ring-${t.color}-500 ring-offset-2`
                              : `bg-${t.color}-100`
                          }`}
                          style={{
                            width: 72,
                            height: 72,
                            backgroundColor: existingEntry?.tier === t.id
                              ? t.color === "green" ? "#bbf7d0" : t.color === "yellow" ? "#fef08a" : "#fecaca"
                              : t.color === "green" ? "#dcfce7" : t.color === "yellow" ? "#fef9c3" : "#fee2e2",
                          }}
                          whileHover={{
                            scale: 1.1,
                            backgroundColor: t.color === "green" ? "#bbf7d0" : t.color === "yellow" ? "#fef08a" : "#fecaca",
                          }}
                          whileTap={{ scale: 0.95 }}
                          variants={pulseVariants}
                          animate={existingEntry?.tier === t.id ? "pulse" : undefined}
                        >
                          {t.icon === "check" && (
                            <svg className="w-9 h-9 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <motion.path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2.5}
                                d="M5 13l4 4L19 7"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ duration: 0.5, delay: 0.2 }}
                              />
                            </svg>
                          )}
                          {t.icon === "dot" && (
                            <motion.div
                              className="w-4 h-4 rounded-full bg-yellow-500"
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ repeat: Infinity, duration: 2 }}
                            />
                          )}
                          {t.icon === "x" && (
                            <svg className="w-9 h-9 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          )}
                        </motion.div>
                        <span className="text-sm font-medium text-neutral-600">{t.label}</span>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}

              {step === "compare" && (
                <motion.div
                  key="compare"
                  custom={direction}
                  variants={stepVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="space-y-4"
                >
                  {loadingBooks ? (
                    <div className="text-center py-12">
                      <motion.div
                        className="w-12 h-12 border-3 border-neutral-200 border-t-neutral-800 rounded-full mx-auto"
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                      />
                      <p className="text-neutral-500 mt-4">Loading your books...</p>
                    </div>
                  ) : finalPosition !== null ? (
                    <div className="text-center py-12">
                      <motion.div
                        className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      >
                        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </motion.div>
                      <p className="text-neutral-600 font-medium">
                        {tierBooks.length === 0 ? "First in this rating!" : "Ranked!"}
                      </p>
                    </div>
                  ) : !currentCompareBook ? (
                    <div className="text-center py-12">
                      <p className="text-neutral-500">No books to compare against yet.</p>
                    </div>
                  ) : (
                    <>
                      <div className="text-center">
                        <h2 className="text-lg font-semibold">Which do you prefer?</h2>
                      </div>

                      <div className="flex items-stretch gap-4">
                        {/* New book */}
                        <motion.button
                          onClick={() => !isComparing && handlePrefer(true)}
                          className={`flex-1 p-4 border-2 rounded-xl overflow-hidden ${
                            selectedBook === "new" ? "border-green-500 bg-green-50" : "border-neutral-200"
                          }`}
                          variants={bookCardVariants}
                          initial="idle"
                          animate={selectedBook === "new" ? "selected" : selectedBook === "existing" ? "exit" : "idle"}
                          whileHover={!isComparing ? "hover" : undefined}
                          whileTap={!isComparing ? "tap" : undefined}
                          disabled={isComparing}
                        >
                          <motion.div
                            className="aspect-[2/3] bg-neutral-100 rounded-lg overflow-hidden mb-3 mx-auto max-w-[120px]"
                            layoutId="new-book-cover"
                          >
                            {selectedCover ? (
                              <img src={selectedCover} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xs text-neutral-400 p-2 text-center">
                                {book.title}
                              </div>
                            )}
                          </motion.div>
                          <p className="font-medium text-sm truncate">{book.title}</p>
                          {book.author && (
                            <p className="text-xs text-neutral-500 truncate">{book.author}</p>
                          )}
                        </motion.button>

                        {/* VS indicator */}
                        <div className="flex-shrink-0 flex items-center">
                          <motion.div
                            className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center text-sm font-bold text-neutral-400"
                            animate={{
                              scale: [1, 1.1, 1],
                              backgroundColor: ["#f5f5f5", "#e5e5e5", "#f5f5f5"],
                            }}
                            transition={{ repeat: Infinity, duration: 2 }}
                          >
                            VS
                          </motion.div>
                        </div>

                        {/* Existing book */}
                        <AnimatePresence mode="wait">
                          <motion.button
                            key={currentCompareBook.id}
                            onClick={() => !isComparing && handlePrefer(false)}
                            className={`flex-1 p-4 border-2 rounded-xl overflow-hidden ${
                              selectedBook === "existing" ? "border-green-500 bg-green-50" : "border-neutral-200"
                            }`}
                            variants={bookCardVariants}
                            initial={{ opacity: 0, x: 50 }}
                            animate={selectedBook === "existing" ? "selected" : selectedBook === "new" ? "exit" : "idle"}
                            exit={{ opacity: 0, x: -50 }}
                            whileHover={!isComparing ? "hover" : undefined}
                            whileTap={!isComparing ? "tap" : undefined}
                            disabled={isComparing}
                          >
                            <motion.div
                              className="aspect-[2/3] bg-neutral-100 rounded-lg overflow-hidden mb-3 mx-auto max-w-[120px]"
                            >
                              {currentCompareBook.cover_url ? (
                                <img src={currentCompareBook.cover_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-xs text-neutral-400 p-2 text-center">
                                  {currentCompareBook.title}
                                </div>
                              )}
                            </motion.div>
                            <p className="font-medium text-sm truncate">{currentCompareBook.title}</p>
                            <p className="text-xs text-neutral-500">
                              {currentCompareBook.author && <span className="truncate">{currentCompareBook.author} · </span>}
                              <span className="text-neutral-900 font-semibold">{currentCompareBook.score}</span>
                            </p>
                          </motion.button>
                        </AnimatePresence>
                      </div>

                      {/* Skip button */}
                      <motion.div
                        className="flex justify-center pt-2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                      >
                        <motion.button
                          onClick={handleSkip}
                          className="px-4 py-2 text-sm text-neutral-400 hover:text-neutral-600 transition-colors"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          disabled={isComparing}
                        >
                          Too tough · Skip
                        </motion.button>
                      </motion.div>
                    </>
                  )}
                </motion.div>
              )}

              {step === "review" && (
                <motion.div
                  key="review"
                  custom={direction}
                  variants={stepVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="space-y-4"
                >
                  <h2 className="text-lg font-semibold text-center">When did you finish?</h2>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Date finished
                    </label>
                    <input
                      type="date"
                      value={finishedAt}
                      onChange={(e) => setFinishedAt(e.target.value)}
                      max={new Date().toISOString().split("T")[0]}
                      className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100 focus:outline-none transition-all"
                    />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Review (optional)
                    </label>
                    <textarea
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      placeholder="What did you think? Any highlights, quotes, or takeaways..."
                      className="w-full h-24 px-4 py-3 rounded-xl border border-neutral-200 focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100 focus:outline-none resize-none transition-all"
                      maxLength={1000}
                    />
                    <p className="text-xs text-neutral-400 text-right">{reviewText.length}/1000</p>
                  </motion.div>

                  <motion.button
                    onClick={() => saveBook()}
                    className="w-full py-3 bg-neutral-900 text-white rounded-xl font-medium"
                    whileHover={{ scale: 1.02, backgroundColor: "#262626" }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    Save
                  </motion.button>
                </motion.div>
              )}

              {step === "saving" && (
                <motion.div
                  key="saving"
                  custom={direction}
                  variants={stepVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="text-center py-12"
                >
                  <motion.div
                    className="w-16 h-16 mx-auto mb-4 relative"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  >
                    <motion.div
                      className="absolute inset-0 border-3 border-neutral-200 border-t-neutral-800 rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    />
                    <motion.div
                      className="absolute inset-2 border-2 border-neutral-100 border-b-neutral-600 rounded-full"
                      animate={{ rotate: -360 }}
                      transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                    />
                  </motion.div>
                  <motion.p
                    className="text-neutral-600 font-medium"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    Saving to your list...
                  </motion.p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
