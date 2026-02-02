"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

interface BookInfo {
  key: string;
  title: string;
  author: string | null;
  coverUrl: string | null;
}

interface UserList {
  id: string;
  name: string;
  hasBook: boolean;
}

interface AddToListModalProps {
  book: BookInfo;
  isOpen: boolean;
  onClose: () => void;
}

export default function AddToListModal({ book, isOpen, onClose }: AddToListModalProps) {
  const supabase = createClient();
  const [lists, setLists] = useState<UserList[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedLists, setSelectedLists] = useState<Set<string>>(new Set());
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [error, setError] = useState("");

  const loadLists = useCallback(async () => {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    // Get user's lists
    const { data: userLists } = await supabase
      .from("book_lists")
      .select("id, name")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (userLists) {
      // Check which lists already have this book
      const { data: existingItems } = await supabase
        .from("book_list_items")
        .select("list_id")
        .eq("open_library_key", book.key)
        .in("list_id", userLists.map(l => l.id));

      const listsWithBook = new Set(existingItems?.map(i => i.list_id) || []);

      setLists(userLists.map(l => ({
        ...l,
        hasBook: listsWithBook.has(l.id)
      })));

      // Pre-select lists that already have the book
      setSelectedLists(listsWithBook);
    }

    setLoading(false);
  }, [supabase, book.key]);

  useEffect(() => {
    if (isOpen) {
      loadLists();
    }
  }, [isOpen, loadLists]);

  function toggleList(listId: string) {
    const newSelected = new Set(selectedLists);
    if (newSelected.has(listId)) {
      newSelected.delete(listId);
    } else {
      newSelected.add(listId);
    }
    setSelectedLists(newSelected);
  }

  async function handleCreateList() {
    if (!newListName.trim()) return;

    setSaving(true);
    setError("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");

      const { data: newList, error: createError } = await supabase
        .from("book_lists")
        .insert({
          user_id: user.id,
          name: newListName.trim(),
          is_public: true,
        })
        .select()
        .single();

      if (createError) throw createError;

      // Add the new list and select it
      setLists([{ id: newList.id, name: newList.name, hasBook: false }, ...lists]);
      setSelectedLists(new Set([...selectedLists, newList.id]));
      setNewListName("");
      setShowCreateForm(false);
    } catch (err) {
      console.error("Error creating list:", err);
      setError("Failed to create list");
    } finally {
      setSaving(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setError("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");

      // Find lists to add to and remove from
      const originalSelected = new Set(lists.filter(l => l.hasBook).map(l => l.id));
      const toAdd = [...selectedLists].filter(id => !originalSelected.has(id));
      const toRemove = [...originalSelected].filter(id => !selectedLists.has(id));

      // Add book to new lists
      for (const listId of toAdd) {
        // Get max position
        const { data: items } = await supabase
          .from("book_list_items")
          .select("position")
          .eq("list_id", listId)
          .order("position", { ascending: false })
          .limit(1);

        const nextPosition = items && items.length > 0 ? items[0].position + 1 : 1;

        await supabase.from("book_list_items").insert({
          list_id: listId,
          open_library_key: book.key,
          title: book.title,
          author: book.author,
          cover_url: book.coverUrl,
          position: nextPosition,
        });
      }

      // Remove book from deselected lists
      for (const listId of toRemove) {
        await supabase
          .from("book_list_items")
          .delete()
          .eq("list_id", listId)
          .eq("open_library_key", book.key);
      }

      onClose();
    } catch (err) {
      console.error("Error saving:", err);
      setError("Failed to save changes");
    } finally {
      setSaving(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-neutral-100">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Add to list</h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-neutral-100 rounded-full transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-sm text-neutral-500 mt-1 truncate">{book.title}</p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-2">
              {/* Create new list */}
              {showCreateForm ? (
                <div className="p-3 bg-neutral-50 rounded-xl space-y-2">
                  <input
                    type="text"
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    placeholder="List name"
                    maxLength={100}
                    className="w-full px-3 py-2 rounded-lg border border-neutral-200 focus:border-neutral-400 focus:outline-none text-sm"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleCreateList}
                      disabled={!newListName.trim() || saving}
                      className="flex-1 px-3 py-2 bg-neutral-900 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                    >
                      Create
                    </button>
                    <button
                      onClick={() => {
                        setShowCreateForm(false);
                        setNewListName("");
                      }}
                      className="px-3 py-2 border border-neutral-200 rounded-lg text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="w-full p-3 border-2 border-dashed border-neutral-200 rounded-xl text-sm text-neutral-500 hover:border-neutral-300 hover:text-neutral-700 transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create new list
                </button>
              )}

              {/* Existing lists */}
              {lists.length > 0 ? (
                lists.map((list) => (
                  <button
                    key={list.id}
                    onClick={() => toggleList(list.id)}
                    className={`w-full p-3 rounded-xl border text-left flex items-center gap-3 transition-colors ${
                      selectedLists.has(list.id)
                        ? "border-neutral-900 bg-neutral-50"
                        : "border-neutral-200 hover:border-neutral-300"
                    }`}
                  >
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      selectedLists.has(list.id)
                        ? "border-neutral-900 bg-neutral-900"
                        : "border-neutral-300"
                    }`}>
                      {selectedLists.has(list.id) && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className="font-medium">{list.name}</span>
                  </button>
                ))
              ) : !showCreateForm ? (
                <p className="text-center text-neutral-500 py-4">
                  No lists yet. Create one above!
                </p>
              ) : null}
            </div>
          )}

          {error && (
            <p className="text-sm text-red-500 mt-3">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-100">
          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="w-full px-6 py-3 bg-neutral-900 text-white rounded-xl font-medium hover:bg-neutral-800 transition-colors disabled:opacity-50"
          >
            {saving ? "Saving..." : "Done"}
          </button>
        </div>
      </div>
    </div>
  );
}
