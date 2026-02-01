"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import RankingFlow from "./RankingFlow";

interface BookInfo {
  key: string;
  title: string;
  author: string | null;
  coverUrl: string | null;
}

interface ExistingEntry {
  id: string;
  category: string;
  tier: string;
  rank_position: number;
  score: number;
}

interface AddToListButtonProps {
  book: BookInfo;
  existingEntry: ExistingEntry | null;
}

export default function AddToListButton({ book, existingEntry }: AddToListButtonProps) {
  const [showFlow, setShowFlow] = useState(false);
  const router = useRouter();

  if (existingEntry) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className={`px-4 py-2 rounded-lg font-medium ${
            existingEntry.tier === 'liked' ? 'bg-green-100 text-green-800' :
            existingEntry.tier === 'fine' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {existingEntry.tier === 'liked' ? 'Liked it' :
             existingEntry.tier === 'fine' ? 'It was fine' :
             "Didn't like it"}
          </div>
          <span className="text-neutral-500">
            in {existingEntry.category}
          </span>
          <button
            onClick={() => setShowFlow(true)}
            className="px-3 py-1.5 text-sm text-neutral-600 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            Edit
          </button>
        </div>

        {showFlow && (
          <RankingFlow
            book={book}
            onClose={() => setShowFlow(false)}
            onComplete={() => {
              setShowFlow(false);
              router.refresh();
            }}
            existingEntry={existingEntry}
          />
        )}
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowFlow(true)}
        className="px-6 py-3 bg-neutral-900 text-white rounded-lg font-medium hover:bg-neutral-800 transition-colors"
      >
        Add to my list
      </button>

      {showFlow && (
        <RankingFlow
          book={book}
          onClose={() => setShowFlow(false)}
          onComplete={() => {
            setShowFlow(false);
            router.refresh();
          }}
        />
      )}
    </>
  );
}
