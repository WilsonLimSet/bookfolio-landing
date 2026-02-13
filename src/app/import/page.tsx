"use client";

import { useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import {
  searchBooks,
  fetchWorkSubjects,
  detectCategory,
} from "@/lib/openLibrary";
import Link from "next/link";

interface GoodreadsBook {
  title: string;
  author: string;
  rating: number;
  shelves: string;
}

interface MatchedBook {
  title: string;
  author: string;
  rating: number;
  openLibraryKey: string | null;
  coverUrl: string | null;
  category: "fiction" | "nonfiction";
  detectedSubjects?: string[];
}

type Step = "upload" | "matching" | "categorize" | "rank" | "importing" | "done";

export default function ImportPage() {
  const supabase = createClient();

  const [step, setStep] = useState<Step>("upload");
  const [books, setBooks] = useState<GoodreadsBook[]>([]);
  const [matchedBooks, setMatchedBooks] = useState<MatchedBook[]>([]);
  const [currentRatingGroup, setCurrentRatingGroup] = useState(5);
  const [rankedBooks, setRankedBooks] = useState<MatchedBook[]>([]);
  const [progress, setProgress] = useState(0);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    const parsed = parseGoodreadsCSV(text);
    setBooks(parsed);
    setStep("matching");

    // Match books with Open Library
    await matchBooks(parsed);
  }

  function parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (inQuotes) {
        if (char === '"' && nextChar === '"') {
          // Escaped quote
          current += '"';
          i++;
        } else if (char === '"') {
          // End of quoted field
          inQuotes = false;
        } else {
          current += char;
        }
      } else {
        if (char === '"') {
          // Start of quoted field
          inQuotes = true;
        } else if (char === ",") {
          // End of field
          result.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
    }
    result.push(current.trim());
    return result;
  }

  function parseGoodreadsCSV(csv: string): GoodreadsBook[] {
    const lines = csv.split("\n");
    const headers = parseCSVLine(lines[0]);

    const titleIdx = headers.findIndex((h) => h === "Title");
    const authorIdx = headers.findIndex((h) => h === "Author");
    const ratingIdx = headers.findIndex((h) => h === "My Rating");
    const shelvesIdx = headers.findIndex((h) => h === "Bookshelves");
    const exclusiveShelfIdx = headers.findIndex((h) => h === "Exclusive Shelf");

    const books: GoodreadsBook[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;

      const values = parseCSVLine(line);

      const rating = parseInt(values[ratingIdx]) || 0;
      if (rating === 0) continue; // Skip unrated books

      // Combine bookshelves and exclusive shelf for better categorization
      const shelves = `${values[shelvesIdx] || ""} ${values[exclusiveShelfIdx] || ""}`;

      books.push({
        title: values[titleIdx] || "",
        author: values[authorIdx] || "",
        rating,
        shelves,
      });
    }

    return books.sort((a, b) => b.rating - a.rating);
  }

  async function matchBooks(books: GoodreadsBook[]) {
    const matched: MatchedBook[] = new Array(books.length);
    const BATCH_SIZE = 5;

    for (let batchStart = 0; batchStart < books.length; batchStart += BATCH_SIZE) {
      const batch = books.slice(batchStart, batchStart + BATCH_SIZE);

      const results = await Promise.all(
        batch.map(async (book, i) => {
          const idx = batchStart + i;
          const searchResults = await searchBooks(`${book.title} ${book.author}`);

          if (searchResults.length > 0) {
            const best = searchResults[0];
            const subjects = await fetchWorkSubjects(best.key);
            return {
              idx,
              match: {
                title: book.title,
                author: book.author,
                rating: book.rating,
                openLibraryKey: best.key,
                coverUrl: best.coverUrl,
                category: guessCategory(book.shelves, subjects),
                detectedSubjects: subjects.slice(0, 10),
              } as MatchedBook,
            };
          }

          return {
            idx,
            match: {
              title: book.title,
              author: book.author,
              rating: book.rating,
              openLibraryKey: null,
              coverUrl: null,
              category: guessCategory(book.shelves),
              detectedSubjects: [],
            } as MatchedBook,
          };
        })
      );

      for (const { idx, match } of results) {
        matched[idx] = match;
      }

      setProgress(Math.round(((batchStart + batch.length) / books.length) * 100));

      // Rate limit between batches
      if (batchStart + BATCH_SIZE < books.length) {
        await new Promise((r) => setTimeout(r, 200));
      }
    }

    setMatchedBooks(matched);
    setStep("categorize");
  }

  function guessCategory(shelves: string, subjects?: string[]): "fiction" | "nonfiction" {
    // Primary signal: weighted detection from OpenLibrary subjects
    if (subjects && subjects.length > 0) {
      const detected = detectCategory(subjects);
      if (detected) return detected;
    }

    // Fallback: keyword matching from Goodreads shelves
    const text = shelves.toLowerCase();

    const fictionKeywords = [
      "fiction", "novel", "fantasy", "sci-fi", "science-fiction", "romance",
      "mystery", "thriller", "horror", "dystopia", "dystopian", "young-adult",
      "ya", "literary-fiction", "historical-fiction", "adventure", "comics",
      "graphic-novel", "manga", "fairy-tale", "mythology", "paranormal",
      "urban-fantasy", "epic-fantasy", "crime", "detective", "suspense",
      "magical-realism", "contemporary-fiction", "classics", "short-stories"
    ];

    const nonfictionKeywords = [
      "non-fiction", "nonfiction", "self-help", "biography", "autobiography",
      "memoir", "business", "history", "science", "psychology", "philosophy",
      "economics", "politics", "sociology", "anthropology", "true-crime",
      "travel", "cooking", "health", "fitness", "spirituality", "religion",
      "self-improvement", "productivity", "leadership", "management",
      "finance", "investing", "marketing", "entrepreneurship", "education",
      "parenting", "relationships", "nature", "environment", "technology",
      "programming", "design", "art", "music", "sports", "journalism",
      "essays", "reference", "textbook", "academic", "how-to", "guide",
      "true-story", "documentary", "current-events", "war", "military"
    ];

    let fictionScore = 0;
    let nonfictionScore = 0;

    for (const keyword of fictionKeywords) {
      if (text.includes(keyword)) fictionScore++;
    }

    for (const keyword of nonfictionKeywords) {
      if (text.includes(keyword)) nonfictionScore++;
    }

    // Default to fiction if no strong signal (most books on Goodreads are fiction)
    return nonfictionScore > fictionScore ? "nonfiction" : "fiction";
  }

  function toggleCategory(index: number) {
    const updated = [...matchedBooks];
    updated[index].category =
      updated[index].category === "fiction" ? "nonfiction" : "fiction";
    setMatchedBooks(updated);
  }

  function startRanking() {
    setStep("rank");
    setCurrentRatingGroup(5);
  }

  function getBooksInRatingGroup(rating: number) {
    return matchedBooks.filter((b) => b.rating === rating);
  }

  function moveBook(fromIndex: number, direction: "up" | "down") {
    const booksInGroup = getBooksInRatingGroup(currentRatingGroup);
    const toIndex = direction === "up" ? fromIndex - 1 : fromIndex + 1;
    if (toIndex < 0 || toIndex >= booksInGroup.length) return;

    const newOrder = [...booksInGroup];
    [newOrder[fromIndex], newOrder[toIndex]] = [newOrder[toIndex], newOrder[fromIndex]];

    // Update matchedBooks with new order
    const otherBooks = matchedBooks.filter((b) => b.rating !== currentRatingGroup);
    setMatchedBooks([...otherBooks, ...newOrder]);
  }

  function nextRatingGroup() {
    // Save current group's order to rankedBooks
    const booksInGroup = getBooksInRatingGroup(currentRatingGroup);
    setRankedBooks([...rankedBooks, ...booksInGroup]);

    if (currentRatingGroup > 1) {
      setCurrentRatingGroup(currentRatingGroup - 1);
    } else {
      importBooks();
    }
  }

  async function importBooks() {
    setStep("importing");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const allRanked = [...rankedBooks, ...getBooksInRatingGroup(currentRatingGroup)];

    // Group by category and build batch rows
    const fiction = allRanked.filter((b) => b.category === "fiction" && b.openLibraryKey);
    const nonfiction = allRanked.filter((b) => b.category === "nonfiction" && b.openLibraryKey);

    const buildRows = (books: MatchedBook[], category: string) =>
      books.map((book, i) => {
        const tier = book.rating >= 4 ? "liked" : book.rating >= 3 ? "fine" : "disliked";
        return {
          user_id: user.id,
          title: book.title,
          author: book.author,
          cover_url: book.coverUrl,
          open_library_key: book.openLibraryKey,
          category,
          tier,
          rank_position: i + 1,
          score: calculateImportScore(i + 1, books.length, tier),
        };
      });

    const fictionRows = buildRows(fiction, "fiction");
    const nonfictionRows = buildRows(nonfiction, "nonfiction");

    // Batch upsert fiction
    if (fictionRows.length > 0) {
      await supabase.from("user_books").upsert(fictionRows, {
        onConflict: "user_id,open_library_key,category",
      });
    }
    setProgress(50);

    // Batch upsert nonfiction
    if (nonfictionRows.length > 0) {
      await supabase.from("user_books").upsert(nonfictionRows, {
        onConflict: "user_id,open_library_key,category",
      });
    }
    setProgress(100);

    setStep("done");
  }

  function calculateImportScore(position: number, total: number, tier: string): number {
    const tierRanges: Record<string, { min: number; max: number }> = {
      liked: { min: 6.7, max: 10 },
      fine: { min: 3.4, max: 6.6 },
      disliked: { min: 0, max: 3.3 },
    };

    const range = tierRanges[tier];
    if (total <= 1) return range.max;

    // Match rank_book RPC: spread_factor prevents min score from hitting absolute floor
    const fullRange = range.max - range.min;
    const spreadFactor = (total - 1) / total;
    const positionFraction = (position - 1) / (total - 1);
    return Math.round((range.max - positionFraction * fullRange * spreadFactor) * 10) / 10;
  }

  return (
    <main className="min-h-screen px-4 sm:px-6 py-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/feed"
            className="inline-flex items-center gap-2 text-neutral-600 hover:text-neutral-900"
          >
            <Image src="/logo-512x512.png" alt="Bookfolio logo" width={28} height={28} />
            <span className="font-semibold">Bookfolio</span>
          </Link>
          <Link
            href="/profile/edit"
            className="text-sm text-neutral-500 hover:text-neutral-700"
          >
            Back to settings
          </Link>
        </div>

        <h1 className="text-2xl font-bold mb-2">Import from Goodreads</h1>
        <p className="text-neutral-600 mb-8">
          Export your Goodreads library and import your ranked books here.
        </p>

        {step === "upload" && (
          <div className="space-y-6">
            <div className="bg-neutral-50 rounded-xl p-6">
              <h2 className="font-semibold mb-3">How to export from Goodreads:</h2>
              <ol className="list-decimal list-inside space-y-2 text-sm text-neutral-600">
                <li>
                  Go to{" "}
                  <a
                    href="https://www.goodreads.com/review/import"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline hover:text-blue-800"
                  >
                    goodreads.com/review/import
                  </a>
                  {" "}(or My Books → Import and Export)
                </li>
                <li>Click the <strong>&quot;Export Library&quot;</strong> button at the top</li>
                <li>Wait for Goodreads to prepare your file (you&apos;ll get an email)</li>
                <li>Download the CSV file from the email or the page</li>
                <li>Upload the file below</li>
              </ol>
              <p className="mt-4 text-xs text-neutral-500">
                Only books you&apos;ve rated will be imported. We&apos;ll automatically categorize them as Fiction or Non-Fiction based on your shelves.
              </p>
            </div>

            <label className="block">
              <div className="border-2 border-dashed border-neutral-300 rounded-xl p-8 text-center hover:border-neutral-400 transition-colors cursor-pointer">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <svg className="w-10 h-10 text-neutral-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="font-medium">Click to upload CSV</p>
                <p className="text-sm text-neutral-500 mt-1">goodreads_library_export.csv</p>
              </div>
            </label>
          </div>
        )}

        {step === "matching" && (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin mx-auto mb-4" />
            <p className="font-medium">Matching books...</p>
            <p className="text-neutral-500">{progress}% complete</p>
            <p className="text-sm text-neutral-400 mt-2">{books.length} books found</p>
          </div>
        )}

        {step === "categorize" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <p className="text-neutral-600">
                Tap the category to toggle Fiction/Non-Fiction:
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setMatchedBooks(matchedBooks.map(b => ({ ...b, category: "fiction" })))}
                  className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200"
                >
                  All Fiction
                </button>
                <button
                  onClick={() => setMatchedBooks(matchedBooks.map(b => ({ ...b, category: "nonfiction" })))}
                  className="px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded-full hover:bg-purple-200"
                >
                  All Non-Fiction
                </button>
              </div>
            </div>

            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {matchedBooks.map((book, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 bg-white rounded-lg border border-neutral-100"
                >
                  <div className="w-10 h-14 bg-neutral-100 rounded overflow-hidden flex-shrink-0 relative">
                    {book.coverUrl && (
                      <Image src={book.coverUrl} alt="" fill sizes="40px" className="object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{book.title}</p>
                    <p className="text-xs text-neutral-500">{book.author} · {book.rating}★</p>
                    {book.detectedSubjects && book.detectedSubjects.length > 0 && (
                      <p className="text-[10px] text-neutral-400 mt-1 truncate">
                        {book.detectedSubjects.slice(0, 3).join(", ")}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => toggleCategory(index)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium flex-shrink-0 ${
                      book.category === "fiction"
                        ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                        : "bg-purple-100 text-purple-700 hover:bg-purple-200"
                    }`}
                  >
                    {book.category === "fiction" ? "Fiction" : "Non-Fiction"}
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={startRanking}
              className="w-full px-4 py-3 bg-neutral-900 text-white rounded-lg font-medium hover:bg-neutral-800"
            >
              Continue to ranking
            </button>
          </div>
        )}

        {step === "rank" && (
          <div className="space-y-6">
            <div className="text-center">
              <p className="text-4xl font-bold text-yellow-500 mb-2">
                {"★".repeat(currentRatingGroup)}{"☆".repeat(5 - currentRatingGroup)}
              </p>
              <p className="text-neutral-600">
                Drag to rank your {currentRatingGroup}-star books (best at top)
              </p>
            </div>

            <div className="space-y-2">
              {getBooksInRatingGroup(currentRatingGroup).map((book, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 bg-white rounded-lg border border-neutral-100"
                >
                  <span className="w-6 text-center font-mono font-bold text-neutral-300">
                    {index + 1}
                  </span>
                  <div className="w-8 h-12 bg-neutral-100 rounded overflow-hidden flex-shrink-0 relative">
                    {book.coverUrl && (
                      <Image src={book.coverUrl} alt="" fill sizes="32px" className="object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{book.title}</p>
                    <p className="text-xs text-neutral-500">{book.author}</p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => moveBook(index, "up")}
                      disabled={index === 0}
                      className="p-1 text-neutral-400 hover:text-neutral-600 disabled:opacity-30"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => moveBook(index, "down")}
                      disabled={index === getBooksInRatingGroup(currentRatingGroup).length - 1}
                      className="p-1 text-neutral-400 hover:text-neutral-600 disabled:opacity-30"
                    >
                      ↓
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {getBooksInRatingGroup(currentRatingGroup).length === 0 && (
              <p className="text-center text-neutral-500">No {currentRatingGroup}-star books</p>
            )}

            <button
              onClick={nextRatingGroup}
              className="w-full px-4 py-3 bg-neutral-900 text-white rounded-lg font-medium hover:bg-neutral-800"
            >
              {currentRatingGroup > 1 ? `Next: ${currentRatingGroup - 1}-star books` : "Import books"}
            </button>
          </div>
        )}

        {step === "importing" && (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin mx-auto mb-4" />
            <p className="font-medium">Importing books...</p>
            <p className="text-neutral-500">{progress}% complete</p>
          </div>
        )}

        {step === "done" && (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">🎉</div>
            <h2 className="text-xl font-bold mb-2">Import complete!</h2>
            <p className="text-neutral-600 mb-6">
              Your books have been imported and ranked.
            </p>
            <Link
              href="/profile"
              className="inline-block px-6 py-3 bg-neutral-900 text-white rounded-lg font-medium hover:bg-neutral-800"
            >
              View your profile
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
