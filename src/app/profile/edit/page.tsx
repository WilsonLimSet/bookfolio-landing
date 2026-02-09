"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { searchBooks, Book } from "@/lib/openLibrary";
import { revalidateProfile } from "@/app/actions";
import Link from "next/link";
import RankingFlow from "@/components/RankingFlow";
import Header from "@/components/Header";

interface FavoriteBook {
  id: string;
  position: number;
  title: string;
  author: string | null;
  cover_url: string | null;
  open_library_key: string | null;
}

interface RankedBook {
  id: string;
  title: string;
  author: string | null;
  cover_url: string | null;
  open_library_key: string | null;
  category: string;
  tier: string;
  rank_position: number;
  score: number;
}

export default function EditProfilePage() {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [username, setUsername] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [instagram, setInstagram] = useState("");
  const [twitter, setTwitter] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [referralCount, setReferralCount] = useState(0);
  const [copied, setCopied] = useState(false);
  const [favorites, setFavorites] = useState<FavoriteBook[]>([]);
  const [rankedBooks, setRankedBooks] = useState<RankedBook[]>([]);
  const [readingGoal, setReadingGoal] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const REFERRALS_REQUIRED = 3; // Number of referrals needed to unlock social links

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Book[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Ranking flow state
  const [bookToRank, setBookToRank] = useState<{
    key: string;
    title: string;
    author: string | null;
    coverUrl: string | null;
  } | null>(null);
  const [pendingPosition, setPendingPosition] = useState<number | null>(null);

  useEffect(() => {
    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setUserId(user.id);

      // Run all queries in parallel for faster loading
      const [profileResult, favoritesResult, rankedResult, referralsResult] = await Promise.all([
        supabase
          .from("profiles")
          .select("username, bio, avatar_url, instagram, twitter, referral_code, reading_goal_2025")
          .eq("id", user.id)
          .single(),
        supabase
          .from("favorite_books")
          .select("*")
          .eq("user_id", user.id)
          .order("position"),
        supabase
          .from("user_books")
          .select("*")
          .eq("user_id", user.id),
        supabase
          .from("referrals")
          .select("id", { count: "exact", head: true })
          .eq("referrer_id", user.id),
      ]);

      if (profileResult.data) {
        setUsername(profileResult.data.username);
        setBio(profileResult.data.bio || "");
        setAvatarUrl(profileResult.data.avatar_url || null);
        setInstagram(profileResult.data.instagram || "");
        setTwitter(profileResult.data.twitter || "");
        setReferralCode(profileResult.data.referral_code || profileResult.data.username);
        setReadingGoal(profileResult.data.reading_goal_2025 || null);
      }

      setReferralCount(referralsResult.count || 0);

      if (favoritesResult.data) {
        setFavorites(favoritesResult.data);
      }

      if (rankedResult.data) {
        setRankedBooks(rankedResult.data);
      }

      setLoading(false);
    }

    loadProfile();
  }, [router, supabase]);

  // Search books with debounce
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      const results = await searchBooks(searchQuery);
      setSearchResults(results);
      setIsSearching(false);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const getNextAvailablePosition = () => {
    const usedPositions = new Set(favorites.map((f) => f.position));
    for (let i = 1; i <= 4; i++) {
      if (!usedPositions.has(i)) return i;
    }
    return null;
  };

  const isBookAlreadyFavorite = (bookKey: string) => {
    return favorites.some((f) => f.open_library_key === bookKey);
  };

  const isBookRanked = (bookKey: string) => {
    return rankedBooks.find((b) => b.open_library_key === bookKey);
  };

  const handleSelectBook = async (book: Book) => {
    if (favorites.length >= 4) {
      alert("You can only have 4 favorite books. Remove one first.");
      return;
    }

    if (isBookAlreadyFavorite(book.key)) {
      alert("This book is already in your favorites.");
      return;
    }

    const position = getNextAvailablePosition();
    if (!position) return;

    const rankedEntry = isBookRanked(book.key);

    if (rankedEntry) {
      // Book is already ranked, add directly to favorites using the ranked book's cover
      await addToFavorites({
        key: book.key,
        title: rankedEntry.title,
        author: rankedEntry.author,
        coverUrl: rankedEntry.cover_url, // Use the cover they selected when ranking
      }, position);
    } else {
      // Book not ranked yet, trigger ranking flow
      setBookToRank({
        key: book.key,
        title: book.title,
        author: book.author,
        coverUrl: book.coverUrl,
      });
      setPendingPosition(position);
    }

    setSearchQuery("");
    setSearchResults([]);
  };

  const addToFavorites = async (
    book: { key: string; title: string; author: string | null; coverUrl: string | null },
    position: number
  ) => {
    if (!userId) return;

    const { data, error } = await supabase
      .from("favorite_books")
      .insert({
        user_id: userId,
        position,
        title: book.title,
        author: book.author,
        cover_url: book.coverUrl,
        open_library_key: book.key,
      })
      .select()
      .single();

    if (error) {
      console.error("Error adding favorite:", error);
      alert("Failed to add favorite book.");
      return;
    }

    setFavorites((prev) => [...prev, data].sort((a, b) => a.position - b.position));
    revalidateProfile(userId);
  };

  const handleRankingComplete = async () => {
    if (bookToRank && pendingPosition) {
      // Refresh ranked books list first to get the cover the user selected during ranking
      const { data: rankedData } = await supabase
        .from("user_books")
        .select("*")
        .eq("user_id", userId);

      if (rankedData) {
        setRankedBooks(rankedData);

        // Find the newly ranked book to get the cover they selected
        const newlyRanked = rankedData.find(b => b.open_library_key === bookToRank.key);
        if (newlyRanked) {
          await addToFavorites({
            key: bookToRank.key,
            title: newlyRanked.title,
            author: newlyRanked.author,
            coverUrl: newlyRanked.cover_url, // Use the cover selected during ranking
          }, pendingPosition);
        }
      }
    }

    setBookToRank(null);
    setPendingPosition(null);
  };

  const removeFavorite = async (favoriteId: string) => {
    const { error } = await supabase
      .from("favorite_books")
      .delete()
      .eq("id", favoriteId);

    if (error) {
      console.error("Error removing favorite:", error);
      return;
    }

    setFavorites((prev) => prev.filter((f) => f.id !== favoriteId));
    if (userId) revalidateProfile(userId);
  };

  const swapFavorites = async (position1: number, position2: number) => {
    const fav1 = favorites.find(f => f.position === position1);
    const fav2 = favorites.find(f => f.position === position2);

    if (!fav1 || !fav2) return;

    // Optimistic update
    setFavorites(prev => prev.map(f => {
      if (f.id === fav1.id) return { ...f, position: position2 };
      if (f.id === fav2.id) return { ...f, position: position1 };
      return f;
    }).sort((a, b) => a.position - b.position));

    // Update in database
    await Promise.all([
      supabase.from("favorite_books").update({ position: position2 }).eq("id", fav1.id),
      supabase.from("favorite_books").update({ position: position1 }).eq("id", fav2.id),
    ]);
  };

  const moveFavorite = async (favoriteId: string, direction: "left" | "right") => {
    const fav = favorites.find(f => f.id === favoriteId);
    if (!fav) return;

    const newPosition = direction === "left" ? fav.position - 1 : fav.position + 1;
    if (newPosition < 1 || newPosition > 4) return;

    const otherFav = favorites.find(f => f.position === newPosition);
    if (otherFav) {
      await swapFavorites(fav.position, newPosition);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert("Image must be less than 2MB");
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const saveProfile = async () => {
    if (!userId) return;

    setSaving(true);

    try {
      let newAvatarUrl = avatarUrl;

      // Upload avatar if changed
      if (avatarFile) {
        const fileExt = avatarFile.name.split(".").pop();
        const filePath = `${userId}/avatar.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(filePath, avatarFile, { upsert: true });

        if (uploadError) {
          console.error("Error uploading avatar:", uploadError);
          alert("Failed to upload avatar");
          setSaving(false);
          return;
        }

        const { data: { publicUrl } } = supabase.storage
          .from("avatars")
          .getPublicUrl(filePath);

        newAvatarUrl = publicUrl;
      }

      // Update profile
      const { error } = await supabase
        .from("profiles")
        .update({
          bio: bio || null,
          avatar_url: newAvatarUrl,
          instagram: instagram || null,
          twitter: twitter || null,
          reading_goal_2025: readingGoal || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (error) {
        console.error("Error updating profile:", error);
        alert("Failed to save profile");
        setSaving(false);
        return;
      }

      setAvatarUrl(newAvatarUrl);
      setAvatarFile(null);
      setAvatarPreview(null);
      revalidateProfile(userId);
      alert("Profile saved!");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin" />
      </main>
    );
  }

  return (
    <>
      <Header user={{ id: userId! }} username={username} />
      <main className="min-h-screen px-4 sm:px-6 py-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Settings</h1>
            <Link
              href={`/profile/${username}`}
              className="text-sm text-neutral-600 hover:text-neutral-900"
            >
              View Profile
            </Link>
          </div>

        <div className="space-y-8">
          {/* Profile Details */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold">Profile</h2>

            {/* Avatar */}
            <div className="flex items-center gap-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-20 h-20 rounded-full bg-gradient-to-br from-neutral-200 to-neutral-300 flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity overflow-hidden relative"
              >
                {avatarPreview || avatarUrl ? (
                  <Image
                    src={avatarPreview || avatarUrl!}
                    alt="Avatar"
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                ) : (
                  <span className="text-2xl font-bold text-neutral-500">
                    {username[0]?.toUpperCase()}
                  </span>
                )}
              </div>
              <div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-sm font-medium text-neutral-900 hover:underline"
                >
                  Change photo
                </button>
                <p className="text-xs text-neutral-500 mt-1">
                  JPG, PNG. Max 2MB.
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Username
              </label>
              <input
                type="text"
                value={username}
                disabled
                className="w-full px-4 py-3 rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-500"
              />
              <p className="text-xs text-neutral-500 mt-1">
                Username cannot be changed
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Bio
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell others about yourself and your reading interests..."
                className="w-full px-4 py-3 rounded-lg border border-neutral-200 focus:border-neutral-400 focus:outline-none resize-none h-24"
                maxLength={500}
              />
              <p className="text-xs text-neutral-500 mt-1 text-right">
                {bio.length}/500
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                2025 Reading Goal
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={readingGoal || ""}
                  onChange={(e) => setReadingGoal(e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="e.g. 24"
                  min={1}
                  max={365}
                  className="w-24 px-4 py-3 rounded-lg border border-neutral-200 focus:border-neutral-400 focus:outline-none"
                />
                <span className="text-neutral-600">books this year</span>
              </div>
              <p className="text-xs text-neutral-500 mt-1">
                Set a goal to track your reading progress
              </p>
            </div>

            <button
              onClick={saveProfile}
              disabled={saving}
              className="px-4 py-2 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Profile"}
            </button>
          </section>

          {/* Social Links */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold">Social Links</h2>
            {referralCount >= REFERRALS_REQUIRED ? (
              <>
                <p className="text-sm text-green-600">
                  Unlocked! Your social links are visible on your profile.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Instagram
                    </label>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-neutral-200 bg-neutral-50 text-neutral-500 text-sm">
                        @
                      </span>
                      <input
                        type="text"
                        value={instagram}
                        onChange={(e) => setInstagram(e.target.value.replace(/^@/, ""))}
                        placeholder="username"
                        className="flex-1 px-3 py-2 rounded-r-lg border border-neutral-200 focus:border-neutral-400 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Twitter / X
                    </label>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-neutral-200 bg-neutral-50 text-neutral-500 text-sm">
                        @
                      </span>
                      <input
                        type="text"
                        value={twitter}
                        onChange={(e) => setTwitter(e.target.value.replace(/^@/, ""))}
                        placeholder="username"
                        className="flex-1 px-3 py-2 rounded-r-lg border border-neutral-200 focus:border-neutral-400 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="p-4 bg-neutral-50 rounded-xl">
                <p className="text-sm text-neutral-600 mb-2">
                  Invite <span className="font-semibold">{REFERRALS_REQUIRED - referralCount} more {REFERRALS_REQUIRED - referralCount === 1 ? "friend" : "friends"}</span> to unlock social links on your profile.
                </p>
                <div className="flex items-center gap-2">
                  {[...Array(REFERRALS_REQUIRED)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        i < referralCount
                          ? "bg-green-500 text-white"
                          : "bg-neutral-200 text-neutral-400"
                      }`}
                    >
                      {i < referralCount ? "✓" : i + 1}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Referral Link */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold">Invite Friends</h2>
            <p className="text-sm text-neutral-600">
              Share your referral link. When friends sign up, you&apos;ll unlock social links on your profile.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={`${typeof window !== "undefined" ? window.location.origin : ""}/login?ref=${referralCode}`}
                className="flex-1 px-4 py-3 rounded-lg border border-neutral-200 bg-neutral-50 text-neutral-600 text-sm"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/login?ref=${referralCode}`);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="px-4 py-2 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <p className="text-xs text-neutral-500">
              {referralCount} {referralCount === 1 ? "friend has" : "friends have"} signed up with your link
            </p>
          </section>

          {/* Favorite Books */}
          <section className="space-y-4" id="favorites">
            <h2 className="text-lg font-semibold">Favorite Books</h2>
            <p className="text-sm text-neutral-600">
              Choose up to 4 books that are most meaningful to you. They&apos;ll be displayed prominently on your profile.
            </p>

            {/* Current Favorites Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[1, 2, 3, 4].map((position) => {
                const favorite = favorites.find((f) => f.position === position);
                const canMoveLeft = favorite && position > 1 && favorites.some(f => f.position === position - 1);
                const canMoveRight = favorite && position < 4 && favorites.some(f => f.position === position + 1);

                return favorite ? (
                  <div key={position} className="relative group">
                    <div className="aspect-[2/3] bg-neutral-100 rounded-lg overflow-hidden shadow-sm relative">
                      {favorite.cover_url ? (
                        <Image
                          src={favorite.cover_url}
                          alt={favorite.title}
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center p-2 text-center">
                          <span className="text-xs text-neutral-400">{favorite.title}</span>
                        </div>
                      )}
                    </div>
                    {/* Remove button */}
                    <button
                      onClick={() => removeFavorite(favorite.id)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-sm font-bold"
                    >
                      ×
                    </button>
                    {/* Reorder buttons */}
                    <div className="absolute bottom-0 inset-x-0 flex justify-center gap-1 pb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {canMoveLeft && (
                        <button
                          onClick={() => moveFavorite(favorite.id, "left")}
                          className="w-6 h-6 bg-black/70 text-white rounded-full flex items-center justify-center text-xs hover:bg-black transition-colors"
                        >
                          ←
                        </button>
                      )}
                      {canMoveRight && (
                        <button
                          onClick={() => moveFavorite(favorite.id, "right")}
                          className="w-6 h-6 bg-black/70 text-white rounded-full flex items-center justify-center text-xs hover:bg-black transition-colors"
                        >
                          →
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-neutral-600 mt-1 truncate">{favorite.title}</p>
                  </div>
                ) : (
                  <div key={position} className="aspect-[2/3] bg-neutral-100 rounded-lg border-2 border-dashed border-neutral-200 flex items-center justify-center">
                    <span className="text-neutral-300 text-2xl">+</span>
                  </div>
                );
              })}
            </div>

            {/* Quick pick from ranked books */}
            {favorites.length < 4 && rankedBooks.length > 0 && (
              <div>
                <p className="text-xs text-neutral-500 mb-2">Quick pick from your ranked books:</p>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {rankedBooks
                    .filter((b) => !isBookAlreadyFavorite(b.open_library_key || ""))
                    .sort((a, b) => b.score - a.score)
                    .slice(0, 8)
                    .map((book) => (
                      <button
                        key={book.id}
                        onClick={() => {
                          const position = getNextAvailablePosition();
                          if (position) {
                            addToFavorites({
                              key: book.open_library_key || book.id,
                              title: book.title,
                              author: book.author,
                              coverUrl: book.cover_url,
                            }, position);
                          }
                        }}
                        className="flex-shrink-0 w-12 aspect-[2/3] bg-neutral-100 rounded-lg overflow-hidden hover:ring-2 hover:ring-neutral-900 transition-all relative"
                        title={book.title}
                      >
                        {book.cover_url ? (
                          <Image src={book.cover_url} alt={book.title} fill sizes="48px" className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[8px] text-neutral-400 p-1">
                            {book.title}
                          </div>
                        )}
                      </button>
                    ))}
                </div>
              </div>
            )}

            {/* Book Search */}
            {favorites.length < 4 && (
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Or search for any book..."
                  className="w-full px-4 py-3 rounded-lg border border-neutral-200 focus:border-neutral-400 focus:outline-none"
                />

                {isSearching && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-neutral-300 border-t-neutral-600 rounded-full animate-spin" />
                  </div>
                )}

                {searchResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-2 bg-white rounded-lg border border-neutral-200 shadow-lg max-h-80 overflow-y-auto">
                    {searchResults.map((book) => {
                      const alreadyFavorite = isBookAlreadyFavorite(book.key);
                      const ranked = isBookRanked(book.key);

                      return (
                        <button
                          key={book.key}
                          onClick={() => handleSelectBook(book)}
                          disabled={alreadyFavorite}
                          className={`w-full flex items-center gap-3 p-3 hover:bg-neutral-50 transition-colors text-left ${
                            alreadyFavorite ? "opacity-50 cursor-not-allowed" : ""
                          }`}
                        >
                          <div className="w-10 h-[60px] bg-neutral-100 rounded overflow-hidden flex-shrink-0 relative">
                            {book.coverUrl && (
                              <Image
                                src={book.coverUrl}
                                alt=""
                                fill
                                sizes="40px"
                                className="object-cover"
                              />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{book.title}</p>
                            <p className="text-xs text-neutral-500 truncate">
                              {book.author || "Unknown author"}
                            </p>
                            {ranked && (
                              <span className="inline-block mt-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                                Already ranked
                              </span>
                            )}
                          </div>
                          {alreadyFavorite && (
                            <span className="text-xs text-neutral-400">Added</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <p className="text-xs text-neutral-500">
              {favorites.length < 4
                ? `You can add ${4 - favorites.length} more favorite${4 - favorites.length !== 1 ? "s" : ""}.`
                : "You've selected all 4 favorites."
              }
              {" "}Books must be ranked before adding to favorites.
            </p>
          </section>

          {/* Import Section */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold">Import Books</h2>
            <p className="text-sm text-neutral-600">
              Import your reading history from Goodreads to quickly build your ranked list.
            </p>
            <Link
              href="/import"
              className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Import from Goodreads
            </Link>
          </section>

          {/* Sign Out */}
          <section className="pt-6 border-t border-neutral-200">
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="px-4 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
              >
                Sign Out
              </button>
            </form>
          </section>
        </div>
      </div>

      {/* Ranking Flow Modal */}
      {bookToRank && (
        <RankingFlow
          book={bookToRank}
          onClose={() => {
            setBookToRank(null);
            setPendingPosition(null);
          }}
          onComplete={handleRankingComplete}
        />
      )}
    </main>
    </>
  );
}
