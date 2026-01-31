"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface WantToReadButtonProps {
  book: {
    key: string;
    title: string;
    author: string | null;
    coverUrl: string | null;
  };
  isInList: boolean;
}

export default function WantToReadButton({ book, isInList }: WantToReadButtonProps) {
  const [inList, setInList] = useState(isInList);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleToggle() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    if (inList) {
      // Remove from list
      await supabase
        .from("want_to_read")
        .delete()
        .eq("user_id", user.id)
        .eq("open_library_key", book.key);
      setInList(false);
    } else {
      // Add to list
      await supabase.from("want_to_read").insert({
        user_id: user.id,
        title: book.title,
        author: book.author,
        cover_url: book.coverUrl,
        open_library_key: book.key,
      });

      // Log activity
      await supabase.from("activity").insert({
        user_id: user.id,
        action_type: "want_to_read",
        book_title: book.title,
        book_author: book.author,
        book_cover_url: book.coverUrl,
        book_key: book.key,
      });

      setInList(true);
    }
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
        inList
          ? "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
          : "border border-neutral-300 text-neutral-700 hover:bg-neutral-50"
      }`}
    >
      {loading ? "..." : inList ? "✓ Want to Read" : "+ Want to Read"}
    </button>
  );
}
