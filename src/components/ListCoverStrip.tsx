"use client";

import Image from "next/image";

interface BookItem {
  open_library_key: string;
  title: string;
  cover_url: string | null;
}

interface ListCoverStripProps {
  books: BookItem[];
  maxCount?: number;
}

export default function ListCoverStrip({ books, maxCount = 8 }: ListCoverStripProps) {
  const displayBooks = books.slice(0, maxCount);

  if (displayBooks.length === 0) {
    return (
      <div className="flex items-center justify-center h-20 bg-neutral-50 rounded-lg text-sm text-neutral-400">
        No books yet
      </div>
    );
  }

  return (
    <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
      {displayBooks.map((book, index) => (
        <div
          key={book.open_library_key || index}
          className="w-12 h-[72px] bg-neutral-100 rounded overflow-hidden flex-shrink-0 relative"
        >
          {book.cover_url ? (
            <Image
              src={book.cover_url}
              alt={book.title}
              fill
              sizes="48px"
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[8px] text-neutral-400 p-1 text-center leading-tight">
              {book.title.slice(0, 20)}
            </div>
          )}
        </div>
      ))}
      {books.length > maxCount && (
        <div className="w-12 h-[72px] bg-neutral-100 rounded flex-shrink-0 flex items-center justify-center text-xs text-neutral-500 font-medium">
          +{books.length - maxCount}
        </div>
      )}
    </div>
  );
}
