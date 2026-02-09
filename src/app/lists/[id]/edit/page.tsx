"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { revalidateProfile } from "@/app/actions";
import Header from "@/components/Header";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";

interface ListItem {
  id: string;
  open_library_key: string;
  title: string;
  author: string | null;
  cover_url: string | null;
  position: number;
}

export default function EditListPage() {
  const router = useRouter();
  const params = useParams();
  const listId = params.id as string;
  const supabase = createClient();

  const [items, setItems] = useState<ListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);

  const loadList = useCallback(async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
      router.push("/login");
      return;
    }

    setUser(authUser);

    // Get username for header
    const { data: profile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", authUser.id)
      .single();
    setUsername(profile?.username || null);

    const { data: listData } = await supabase
      .from("book_lists")
      .select("*")
      .eq("id", listId)
      .single();

    if (!listData || listData.user_id !== authUser.id) {
      router.push("/lists");
      return;
    }

    setName(listData.name);
    setDescription(listData.description || "");
    setIsPublic(listData.is_public);

    const { data: itemsData } = await supabase
      .from("book_list_items")
      .select("*")
      .eq("list_id", listId)
      .order("position", { ascending: true });

    setItems(itemsData || []);
    setLoading(false);
  }, [supabase, listId, router]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  async function handleSave() {
    setSaving(true);

    try {
      await supabase
        .from("book_lists")
        .update({
          name,
          description: description || null,
          is_public: isPublic,
          updated_at: new Date().toISOString(),
        })
        .eq("id", listId);

      if (user) await revalidateProfile(user.id);
      router.push(`/lists/${listId}`);
    } catch (error) {
      console.error("Error saving list:", error);
      alert("Failed to save changes");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this list? This cannot be undone.")) {
      return;
    }

    setDeleting(true);

    try {
      if (user) await revalidateProfile(user.id);
      await supabase.from("book_lists").delete().eq("id", listId);
      router.push("/lists");
    } catch (error) {
      console.error("Error deleting list:", error);
      alert("Failed to delete list");
      setDeleting(false);
    }
  }

  async function handleRemoveItem(itemId: string) {
    try {
      await supabase.from("book_list_items").delete().eq("id", itemId);
      setItems(items.filter(i => i.id !== itemId));
    } catch (error) {
      console.error("Error removing item:", error);
    }
  }

  async function moveItem(index: number, direction: "up" | "down") {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === items.length - 1)
    ) {
      return;
    }

    const newItems = [...items];
    const swapIndex = direction === "up" ? index - 1 : index + 1;

    // Swap positions
    [newItems[index], newItems[swapIndex]] = [newItems[swapIndex], newItems[index]];

    // Update positions
    newItems.forEach((item, i) => {
      item.position = i + 1;
    });

    setItems(newItems);

    // Save to database
    try {
      await Promise.all([
        supabase
          .from("book_list_items")
          .update({ position: newItems[index].position })
          .eq("id", newItems[index].id),
        supabase
          .from("book_list_items")
          .update({ position: newItems[swapIndex].position })
          .eq("id", newItems[swapIndex].id),
      ]);
    } catch (error) {
      console.error("Error reordering:", error);
    }
  }

  if (loading) {
    return (
      <>
        <Header user={user} username={username} />
        <main className="min-h-screen px-4 sm:px-6 py-6">
          <div className="max-w-2xl mx-auto flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin" />
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header user={user} username={username} />
      <main className="min-h-screen px-4 sm:px-6 py-6">
        <div className="max-w-2xl mx-auto">
          {/* Back button */}
          <Link
            href={`/lists/${listId}`}
            className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-700 mb-6"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to List
          </Link>

          <h1 className="text-2xl font-bold mb-6">Edit List</h1>

          {/* List Settings */}
          <div className="bg-white rounded-xl border border-neutral-100 p-4 mb-6">
            <h2 className="font-semibold mb-4">List Settings</h2>

            <div className="space-y-4">
              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-neutral-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={100}
                  className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-neutral-400 focus:outline-none"
                />
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-neutral-700 mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={500}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-neutral-400 focus:outline-none resize-none"
                />
              </div>

              {/* Visibility */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsPublic(!isPublic)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    isPublic ? "bg-neutral-900" : "bg-neutral-200"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isPublic ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
                <span className="text-sm text-neutral-700">
                  {isPublic ? "Public" : "Private"}
                </span>
              </div>

              {/* Save button */}
              <button
                onClick={handleSave}
                disabled={saving || !name.trim()}
                className="w-full px-6 py-3 bg-neutral-900 text-white rounded-xl font-medium hover:bg-neutral-800 transition-colors disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>

          {/* Books */}
          <div className="bg-white rounded-xl border border-neutral-100 p-4 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Books ({items.length})</h2>
              <p className="text-xs text-neutral-500">Add books from book pages</p>
            </div>

            {items.length > 0 ? (
              <div className="space-y-2">
                {items.map((item, index) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-50"
                  >
                    {/* Position controls */}
                    <div className="flex flex-col gap-0.5">
                      <button
                        onClick={() => moveItem(index, "up")}
                        disabled={index === 0}
                        className="p-0.5 text-neutral-400 hover:text-neutral-700 disabled:opacity-30"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      </button>
                      <button
                        onClick={() => moveItem(index, "down")}
                        disabled={index === items.length - 1}
                        className="p-0.5 text-neutral-400 hover:text-neutral-700 disabled:opacity-30"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>

                    {/* Position number */}
                    <span className="w-6 text-center text-sm text-neutral-400 font-medium">
                      {index + 1}
                    </span>

                    {/* Cover */}
                    <div className="w-10 h-[60px] bg-neutral-100 rounded overflow-hidden flex-shrink-0 relative">
                      {item.cover_url ? (
                        <Image
                          src={item.cover_url}
                          alt={item.title}
                          fill
                          sizes="40px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[8px] text-neutral-400">
                          No cover
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.title}</p>
                      {item.author && (
                        <p className="text-xs text-neutral-500 truncate">{item.author}</p>
                      )}
                    </div>

                    {/* Remove button */}
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className="p-2 text-neutral-400 hover:text-red-500"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-neutral-500 py-8">
                No books yet. Visit a book page and click &quot;Add to list&quot; to add books.
              </p>
            )}
          </div>

          {/* Delete List */}
          <div className="border-t border-neutral-100 pt-6">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="w-full px-6 py-3 border border-red-200 text-red-600 rounded-xl font-medium hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              {deleting ? "Deleting..." : "Delete List"}
            </button>
          </div>
        </div>
      </main>
    </>
  );
}
