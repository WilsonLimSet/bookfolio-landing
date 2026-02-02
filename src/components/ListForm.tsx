"use client";

import { useState } from "react";

interface ListFormProps {
  initialValues?: {
    name: string;
    description: string;
    is_public: boolean;
  };
  onSubmit: (data: { name: string; description: string; is_public: boolean }) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
  isLoading?: boolean;
}

export default function ListForm({
  initialValues = { name: "", description: "", is_public: true },
  onSubmit,
  onCancel,
  submitLabel = "Create List",
  isLoading = false,
}: ListFormProps) {
  const [name, setName] = useState(initialValues.name);
  const [description, setDescription] = useState(initialValues.description);
  const [isPublic, setIsPublic] = useState(initialValues.is_public);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("List name is required");
      return;
    }

    try {
      await onSubmit({ name: name.trim(), description: description.trim(), is_public: isPublic });
    } catch (err) {
      setError("Failed to save list. Please try again.");
      console.error(err);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-neutral-700 mb-1">
          List Name
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="My favorite books"
          maxLength={100}
          className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-neutral-400 focus:outline-none"
          disabled={isLoading}
        />
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-neutral-700 mb-1">
          Description <span className="text-neutral-400 font-normal">(optional)</span>
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What's this list about?"
          maxLength={500}
          rows={3}
          className="w-full px-4 py-3 rounded-xl border border-neutral-200 focus:border-neutral-400 focus:outline-none resize-none"
          disabled={isLoading}
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
          disabled={isLoading}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              isPublic ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
        <span className="text-sm text-neutral-700">
          {isPublic ? "Public" : "Private"} list
        </span>
      </div>
      <p className="text-xs text-neutral-500 -mt-2">
        {isPublic
          ? "Anyone can see this list"
          : "Only you can see this list"}
      </p>

      {/* Error */}
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isLoading || !name.trim()}
          className="flex-1 px-6 py-3 bg-neutral-900 text-white rounded-xl font-medium hover:bg-neutral-800 transition-colors disabled:opacity-50"
        >
          {isLoading ? "Saving..." : submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-6 py-3 border border-neutral-200 rounded-xl font-medium hover:bg-neutral-50 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
