"use client";

import { useState, useEffect, useRef } from "react";
import { searchBooks, type Book } from "@/lib/openLibrary";

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

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!query.trim()) {
      setResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      const books = await searchBooks(query);
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
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setShowResults(true)}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
      />

      {loading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="w-5 h-5 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin" />
        </div>
      )}

      {showResults && results.length > 0 && (
        <div className="absolute z-10 w-full mt-2 bg-white rounded-lg border border-neutral-200 shadow-lg max-h-80 overflow-y-auto">
          {results.map((book) => (
            <button
              key={book.key}
              onClick={() => handleSelect(book)}
              className="w-full flex items-center gap-3 p-3 hover:bg-neutral-50 transition-colors text-left"
            >
              <div className="w-10 h-14 bg-neutral-100 rounded overflow-hidden flex-shrink-0">
                {book.coverUrl ? (
                  <img
                    src={book.coverUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-neutral-400 text-xs">
                    ?
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-neutral-900 truncate">
                  {book.title}
                </p>
                <p className="text-sm text-neutral-600 truncate">
                  {book.author}
                  {book.year && <span className="text-neutral-400"> ({book.year})</span>}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {showResults && query && !loading && results.length === 0 && (
        <div className="absolute z-10 w-full mt-2 bg-white rounded-lg border border-neutral-200 shadow-lg p-4 text-center text-neutral-500">
          No books found
        </div>
      )}
    </div>
  );
}
