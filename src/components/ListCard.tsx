import Link from "next/link";
import ListCoverStrip from "./ListCoverStrip";

interface BookItem {
  open_library_key: string;
  title: string;
  cover_url: string | null;
}

interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
}

interface ListCardProps {
  list: {
    id: string;
    name: string;
    description: string | null;
    created_at: string;
  };
  creator: Profile | null;
  books: BookItem[];
}

export default function ListCard({ list, creator, books }: ListCardProps) {
  return (
    <Link
      href={`/lists/${list.id}`}
      className="block bg-white rounded-xl border border-neutral-100 p-4 hover:shadow-md transition-shadow"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-lg truncate flex-1">{list.name}</h3>
        {creator && (
          <div className="flex items-center gap-2 flex-shrink-0 ml-3">
            <span className="text-sm text-neutral-500">{creator.username}</span>
            <div className="w-7 h-7 bg-neutral-200 rounded-full overflow-hidden flex items-center justify-center text-xs font-bold text-neutral-500">
              {creator.avatar_url ? (
                <img
                  src={creator.avatar_url}
                  alt={creator.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                creator.username[0].toUpperCase()
              )}
            </div>
          </div>
        )}
      </div>

      {/* Book Covers */}
      <div className="mb-3">
        <ListCoverStrip books={books} maxCount={8} />
      </div>

      {/* Description */}
      {list.description && (
        <p className="text-sm text-neutral-600 line-clamp-2">{list.description}</p>
      )}

      {/* Book count */}
      <p className="text-xs text-neutral-400 mt-2">
        {books.length} {books.length === 1 ? "book" : "books"}
      </p>
    </Link>
  );
}
