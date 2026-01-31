"use client";

import { useState, useEffect } from "react";
import { getEditions, type Book, type BookEdition } from "@/lib/openLibrary";

interface EditionPickerProps {
  book: Book;
  onSelect: (edition: BookEdition) => void;
  onClose: () => void;
  onUseDefault: () => void;
}

export default function EditionPicker({
  book,
  onSelect,
  onClose,
  onUseDefault,
}: EditionPickerProps) {
  const [editions, setEditions] = useState<BookEdition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEditions() {
      setLoading(true);
      const results = await getEditions(book.key);
      setEditions(results);
      setLoading(false);
    }
    fetchEditions();
  }, [book.key]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-neutral-200 flex-shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-semibold text-lg">Choose a cover</h2>
              <p className="text-sm text-neutral-500 mt-1">
                {book.title} by {book.author}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <svg
                className="w-5 h-5 text-neutral-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin" />
            </div>
          ) : editions.length > 0 ? (
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3">
              {editions.map((edition) => (
                <button
                  key={edition.key}
                  onClick={() => onSelect(edition)}
                  className="group"
                >
                  <div className="aspect-[2/3] bg-neutral-100 rounded-lg overflow-hidden ring-2 ring-transparent group-hover:ring-neutral-900 transition-all group-hover:scale-105">
                    {edition.coverUrl ? (
                      <img
                        src={edition.coverUrl}
                        alt={edition.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-neutral-400 text-xs p-2 text-center">
                        No cover
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-neutral-500 mt-1.5 truncate text-center">
                    {edition.year || edition.publisher || "—"}
                  </p>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-neutral-500">
              <p>No edition covers found</p>
              <p className="text-sm mt-1">Using default cover instead</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-200 flex-shrink-0">
          <button
            onClick={onUseDefault}
            className="w-full px-4 py-2.5 bg-neutral-900 text-white rounded-lg font-medium hover:bg-neutral-800 transition-colors text-sm"
          >
            Use default cover
          </button>
        </div>
      </div>
    </div>
  );
}
