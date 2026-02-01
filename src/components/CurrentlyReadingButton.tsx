"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface CurrentlyReadingButtonProps {
  book: {
    key: string;
    title: string;
    author: string | null;
    coverUrl: string | null;
  };
  isReading: boolean;
}

export default function CurrentlyReadingButton({ book, isReading }: CurrentlyReadingButtonProps) {
  const [reading, setReading] = useState(isReading);
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

    if (reading) {
      // Remove from list
      await supabase
        .from("currently_reading")
        .delete()
        .eq("user_id", user.id)
        .eq("open_library_key", book.key);
      setReading(false);
    } else {
      // Add to list
      await supabase.from("currently_reading").insert({
        user_id: user.id,
        title: book.title,
        author: book.author,
        cover_url: book.coverUrl,
        open_library_key: book.key,
      });

      // Log activity
      await supabase.from("activity").insert({
        user_id: user.id,
        action_type: "started_reading",
        book_title: book.title,
        book_author: book.author,
        book_cover_url: book.coverUrl,
        book_key: book.key,
      });

      // Remove from want_to_read if it was there
      await supabase
        .from("want_to_read")
        .delete()
        .eq("user_id", user.id)
        .eq("open_library_key", book.key);

      setReading(true);
    }
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
        reading
          ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
          : "border border-neutral-300 text-neutral-700 hover:bg-neutral-50"
      }`}
    >
      {loading ? "..." : reading ? "📖 Reading" : "📖 Start Reading"}
    </button>
  );
}
