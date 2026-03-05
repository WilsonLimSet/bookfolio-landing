"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { saveAvatar } from "../actions";

interface ProfilePhotoStepProps {
  onContinue: () => void;
  onBack: () => void;
  onSkip: () => void;
}

export default function ProfilePhotoStep({ onContinue, onBack, onSkip }: ProfilePhotoStepProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!selected.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    if (selected.size > 2 * 1024 * 1024) {
      setError("Image must be less than 2MB");
      return;
    }

    setError(null);
    setFile(selected);
    // Revoke old URL to prevent memory leak
    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(selected));
  }

  async function handleContinue() {
    if (!file) return;

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("avatar", file);

    const result = await saveAvatar(formData);
    if ("error" in result) {
      setError(result.error);
      setUploading(false);
      return;
    }

    onContinue();
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <div className="p-4">
        <button onClick={onBack} className="p-2 -ml-2 text-neutral-400 hover:text-neutral-600 transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center px-8 pt-8">
        <h1 className="text-3xl font-bold text-neutral-900 mb-2 text-center">Add your profile photo</h1>
        <p className="text-neutral-500 mb-12 text-center">Show off the face behind the books</p>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-36 h-36 rounded-full bg-neutral-100 flex items-center justify-center overflow-hidden hover:bg-neutral-200 transition-colors relative"
        >
          {preview ? (
            <Image src={preview} alt="Preview" fill className="object-cover" />
          ) : (
            <svg className="w-12 h-12 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          )}
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="mt-4 text-sm font-medium hover:underline"
          style={{ color: "var(--onboarding-accent)" }}
        >
          {preview ? "Change photo" : "Choose a photo"}
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        {error && <p className="mt-4 text-sm text-red-500">{error}</p>}
      </div>

      <div className="px-8 pb-12 space-y-3">
        <button
          onClick={handleContinue}
          disabled={!file || uploading}
          className="w-full py-4 rounded-full text-lg font-semibold text-white transition-colors disabled:opacity-40"
          style={{ background: "var(--onboarding-teal)" }}
        >
          {uploading ? "Uploading..." : "Continue"}
        </button>
        <button
          onClick={onSkip}
          className="w-full text-center text-neutral-400 text-sm hover:text-neutral-600 transition-colors"
        >
          Not now
        </button>
      </div>
    </div>
  );
}
