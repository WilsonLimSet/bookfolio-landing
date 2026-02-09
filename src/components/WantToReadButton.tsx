"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { revalidateProfile } from "@/app/actions";

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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    const wasInList = inList;
    setInList(!wasInList);
    setLoading(true);

    try {
      if (wasInList) {
        const { error } = await supabase
          .from("want_to_read")
          .delete()
          .eq("user_id", user.id)
          .eq("open_library_key", book.key);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("want_to_read").insert({
          user_id: user.id,
          title: book.title,
          author: book.author,
          cover_url: book.coverUrl,
          open_library_key: book.key,
        });
        if (error) throw error;

        // Log activity (don't block on this)
        supabase.from("activity").insert({
          user_id: user.id,
          action_type: "want_to_read",
          book_title: book.title,
          book_author: book.author,
          book_cover_url: book.coverUrl,
          book_key: book.key,
        });
      }
      await revalidateProfile(user.id);
      router.refresh();
    } catch {
      setInList(wasInList);
    } finally {
      setLoading(false);
    }
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
