"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { searchBooks, Book } from "@/lib/openLibrary";
import Link from "next/link";
import RankingFlow from "@/components/RankingFlow";
import Header from "@/components/Header";

interface FavoriteBook {
  id: string;
  position: number;
  title: string;
  author: string | null;
  cover_url: string | null;
  open_library_key: string | null;
}

interface RankedBook {
  id: string;
  title: string;
  author: string | null;
  cover_url: string | null;
  open_library_key: string | null;
  category: string;
  tier: string;
  rank_position: number;
  score: number;
}

export default function EditProfilePage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<FavoriteBook[]>([]);
  const [rankedBooks, setRankedBooks] = useState<RankedBook[]>([]);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Book[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Ranking flow state
  const [bookToRank, setBookToRank] = useState<{
    key: string;
    title: string;
    author: string | null;
    coverUrl: string | null;
  } | null>(null);
  const [pendingPosition, setPendingPosition] = useState<number | null>(null);

  useEffect(() => {
    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setUserId(user.id);

      const { data: profile } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .single();

      if (profile) {
        setUsername(profile.username);
      }

      // Load favorites
      const { data: favoritesData } = await supabase
        .from("favorite_books")
        .select("*")
        .eq("user_id", user.id)
        .order("position");

      if (favoritesData) {
        setFavorites(favoritesData);
      }

      // Load ranked books
      const { data: rankedData } = await supabase
        .from("user_books")
        .select("*")
        .eq("user_id", user.id);

      if (rankedData) {
        setRankedBooks(rankedData);
      }

      setLoading(false);
    }

    loadProfile();
  }, [router, supabase]);

  // Search books with debounce
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      const results = await searchBooks(searchQuery);
      setSearchResults(results);
      setIsSearching(false);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const getNextAvailablePosition = () => {
    const usedPositions = new Set(favorites.map((f) => f.position));
    for (let i = 1; i <= 4; i++) {
      if (!usedPositions.has(i)) return i;
    }
    return null;
  };

  const isBookAlreadyFavorite = (bookKey: string) => {
    return favorites.some((f) => f.open_library_key === bookKey);
  };

  const isBookRanked = (bookKey: string) => {
    return rankedBooks.find((b) => b.open_library_key === bookKey);
  };

  const handleSelectBook = async (book: Book) => {
    if (favorites.length >= 4) {
      alert("You can only have 4 favorite books. Remove one first.");
      return;
    }

    if (isBookAlreadyFavorite(book.key)) {
      alert("This book is already in your favorites.");
      return;
    }

    const position = getNextAvailablePosition();
    if (!position) return;

    const rankedEntry = isBookRanked(book.key);

    if (rankedEntry) {
      // Book is already ranked, add directly to favorites
      await addToFavorites(book, position);
    } else {
      // Book not ranked yet, trigger ranking flow
      setBookToRank({
        key: book.key,
        title: book.title,
        author: book.author,
        coverUrl: book.coverUrl,
      });
      setPendingPosition(position);
    }

    setSearchQuery("");
    setSearchResults([]);
  };

  const addToFavorites = async (
    book: { key: string; title: string; author: string | null; coverUrl: string | null },
    position: number
  ) => {
    if (!userId) return;

    const { data, error } = await supabase
      .from("favorite_books")
      .insert({
        user_id: userId,
        position,
        title: book.title,
        author: book.author,
        cover_url: book.coverUrl,
        open_library_key: book.key,
      })
      .select()
      .single();

    if (error) {
      console.error("Error adding favorite:", error);
      alert("Failed to add favorite book.");
      return;
    }

    setFavorites((prev) => [...prev, data].sort((a, b) => a.position - b.position));
  };

  const handleRankingComplete = async () => {
    if (bookToRank && pendingPosition) {
      await addToFavorites(bookToRank, pendingPosition);

      // Refresh ranked books list
      const { data: rankedData } = await supabase
        .from("user_books")
        .select("*")
        .eq("user_id", userId);

      if (rankedData) {
        setRankedBooks(rankedData);
      }
    }

    setBookToRank(null);
    setPendingPosition(null);
  };

  const removeFavorite = async (favoriteId: string) => {
    const { error } = await supabase
      .from("favorite_books")
      .delete()
      .eq("id", favoriteId);

    if (error) {
      console.error("Error removing favorite:", error);
      return;
    }

    setFavorites((prev) => prev.filter((f) => f.id !== favoriteId));
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin" />
      </main>
    );
  }

  return (
    <>
      <Header user={{ id: userId! }} username={username} />
      <main className="min-h-screen px-4 sm:px-6 py-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Settings</h1>
            <Link
              href={`/profile/${username}`}
              className="text-sm text-neutral-600 hover:text-neutral-900"
            >
              View Profile
            </Link>
          </div>

        <div className="space-y-8">
          {/* Profile Details */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold">Profile</h2>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Username
              </label>
              <input
                type="text"
                value={username}
                disabled
                className="w-full px-4 py-3 rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-500"
              />
              <p className="text-xs text-neutral-500 mt-1">
                Username cannot be changed
              </p>
            </div>
          </section>

          {/* Favorite Books */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold">Favorite Books</h2>
            <p className="text-sm text-neutral-600">
              Choose up to 4 books that are most meaningful to you. They&apos;ll be displayed prominently on your profile.
            </p>

            {/* Current Favorites Grid */}
            <div className="grid grid-cols-4 gap-3">
              {[1, 2, 3, 4].map((position) => {
                const favorite = favorites.find((f) => f.position === position);

                return favorite ? (
                  <div key={position} className="relative group">
                    <div className="aspect-[2/3] bg-neutral-100 rounded-lg overflow-hidden shadow-sm">
                      {favorite.cover_url ? (
                        <img
                          src={favorite.cover_url}
                          alt={favorite.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center p-2 text-center">
                          <span className="text-xs text-neutral-400">{favorite.title}</span>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => removeFavorite(favorite.id)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-sm font-bold"
                    >
                      ×
                    </button>
                    <p className="text-xs text-neutral-600 mt-1 truncate">{favorite.title}</p>
                  </div>
                ) : (
                  <div key={position} className="aspect-[2/3] bg-neutral-100 rounded-lg border-2 border-dashed border-neutral-200 flex items-center justify-center">
                    <span className="text-neutral-300 text-2xl">+</span>
                  </div>
                );
              })}
            </div>

            {/* Book Search */}
            {favorites.length < 4 && (
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for a book to add..."
                  className="w-full px-4 py-3 rounded-lg border border-neutral-200 focus:border-neutral-400 focus:outline-none"
                />

                {isSearching && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-neutral-300 border-t-neutral-600 rounded-full animate-spin" />
                  </div>
                )}

                {searchResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-2 bg-white rounded-lg border border-neutral-200 shadow-lg max-h-80 overflow-y-auto">
                    {searchResults.map((book) => {
                      const alreadyFavorite = isBookAlreadyFavorite(book.key);
                      const ranked = isBookRanked(book.key);

                      return (
                        <button
                          key={book.key}
                          onClick={() => handleSelectBook(book)}
                          disabled={alreadyFavorite}
                          className={`w-full flex items-center gap-3 p-3 hover:bg-neutral-50 transition-colors text-left ${
                            alreadyFavorite ? "opacity-50 cursor-not-allowed" : ""
                          }`}
                        >
                          <div className="w-10 h-[60px] bg-neutral-100 rounded overflow-hidden flex-shrink-0">
                            {book.coverUrl && (
                              <img
                                src={book.coverUrl}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{book.title}</p>
                            <p className="text-xs text-neutral-500 truncate">
                              {book.author || "Unknown author"}
                            </p>
                            {ranked && (
                              <span className="inline-block mt-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                                Already ranked
                              </span>
                            )}
                          </div>
                          {alreadyFavorite && (
                            <span className="text-xs text-neutral-400">Added</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <p className="text-xs text-neutral-500">
              {favorites.length < 4
                ? `You can add ${4 - favorites.length} more favorite${4 - favorites.length !== 1 ? "s" : ""}.`
                : "You've selected all 4 favorites."
              }
              {" "}Books must be ranked before adding to favorites.
            </p>
          </section>

          {/* Import Section */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold">Import Books</h2>
            <p className="text-sm text-neutral-600">
              Import your reading history from Goodreads to quickly build your ranked list.
            </p>
            <Link
              href="/import"
              className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Import from Goodreads
            </Link>
          </section>

          {/* Sign Out */}
          <section className="pt-6 border-t border-neutral-200">
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="px-4 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
              >
                Sign Out
              </button>
            </form>
          </section>
        </div>
      </div>

      {/* Ranking Flow Modal */}
      {bookToRank && (
        <RankingFlow
          book={bookToRank}
          onClose={() => {
            setBookToRank(null);
            setPendingPosition(null);
          }}
          onComplete={handleRankingComplete}
        />
      )}
    </main>
    </>
  );
}
