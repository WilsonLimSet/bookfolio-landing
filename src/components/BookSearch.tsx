"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { searchBooks, type Book } from "@/lib/openLibrary";
import { SearchResultsSkeleton } from "./Skeleton";

// In-memory cache for search results
const searchCache = new Map<string, { results: Book[]; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCachedResults(query: string): Book[] | null {
  const cached = searchCache.get(query.toLowerCase().trim());
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.results;
  }
  return null;
}

function setCachedResults(query: string, results: Book[]) {
  searchCache.set(query.toLowerCase().trim(), {
    results,
    timestamp: Date.now(),
  });
  // Limit cache size
  if (searchCache.size > 100) {
    const oldestKey = searchCache.keys().next().value;
    if (oldestKey) searchCache.delete(oldestKey);
  }
}

interface BookSearchProps {
  onSelect: (book: Book) => void;
  placeholder?: string;
}

export default function BookSearch({
  onSelect,
  placeholder = "Search for a book...",
}: BookSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!query.trim()) {
      debounceRef.current = setTimeout(() => setResults([]), 0);
      return;
    }

    // Check cache first
    const cached = getCachedResults(query);
    if (cached) {
      setResults(cached);
      setLoading(false);
      return;
    }

    setLoading(true);

    debounceRef.current = setTimeout(async () => {
      const books = await searchBooks(query);
      setCachedResults(query, books);
      setResults(books);
      setLoading(false);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(book: Book) {
    onSelect(book);
    setQuery("");
    setResults([]);
    setShowResults(false);
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setShowResults(true)}
          placeholder={placeholder}
          className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all"
        />

        <AnimatePresence>
          {loading && (
            <motion.div
              className="absolute right-3 top-1/2 -translate-y-1/2"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <motion.div
                className="w-5 h-5 border-2 border-neutral-300 border-t-neutral-900 rounded-full"
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showResults && (loading || results.length > 0 || (query && !loading)) && (
          <motion.div
            className="absolute z-10 w-full mt-2 bg-white rounded-xl border border-neutral-200 shadow-xl max-h-80 overflow-hidden"
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          >
            <div className="overflow-y-auto max-h-80">
              {loading && results.length === 0 ? (
                <div className="p-2">
                  <SearchResultsSkeleton count={4} />
                </div>
              ) : results.length > 0 ? (
                results.map((book, index) => (
                  <motion.button
                    key={book.key}
                    onClick={() => handleSelect(book)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-neutral-50 transition-colors text-left"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    whileHover={{ backgroundColor: "#f5f5f5" }}
                  >
                    <motion.div
                      className="w-10 h-14 bg-neutral-100 rounded-md overflow-hidden flex-shrink-0 shadow-sm relative"
                      whileHover={{ scale: 1.05 }}
                    >
                      {book.coverUrl ? (
                        <Image
                          src={book.coverUrl}
                          alt=""
                          fill
                          sizes="40px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-neutral-400 text-xs">
                          ?
                        </div>
                      )}
                    </motion.div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-neutral-900 truncate">
                        {book.title}
                      </p>
                      <p className="text-sm text-neutral-600 truncate">
                        {book.author}
                        {book.year && <span className="text-neutral-400"> ({book.year})</span>}
                      </p>
                    </div>
                  </motion.button>
                ))
              ) : query && !loading ? (
                <motion.div
                  className="p-6 text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <p className="text-neutral-500">No books found</p>
                  <p className="text-xs text-neutral-400 mt-1">
                    Try the original title or author name for translated works
                  </p>
                </motion.div>
              ) : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
