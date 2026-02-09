import Image from "next/image";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  return {
    title: `${username}'s Favorite Books | Bookfolio`,
    description: `Check out ${username}'s favorite books on Bookfolio`,
    openGraph: {
      title: `${username}'s Favorite Books`,
      description: `Check out ${username}'s favorite books on Bookfolio`,
      images: [`${siteUrl}/api/og/${username}`],
    },
    twitter: {
      card: "summary_large_image",
      title: `${username}'s Favorite Books`,
      description: `Check out ${username}'s favorite books on Bookfolio`,
      images: [`${siteUrl}/api/og/${username}`],
    },
  };
}

export default async function SharePage({ params }: PageProps) {
  const { username } = await params;
  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, avatar_url, bio")
    .eq("username", username)
    .single();

  if (!profile) {
    notFound();
  }

  const { data: favorites } = await supabase
    .from("favorite_books")
    .select("*")
    .eq("user_id", profile.id)
    .order("position");

  const { count: bookCount } = await supabase
    .from("user_books")
    .select("id", { count: "exact", head: true })
    .eq("user_id", profile.id);

  return (
    <main className="min-h-screen bg-neutral-50 px-4 py-12">
      <div className="max-w-lg mx-auto">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="p-6 text-center border-b border-neutral-100">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-neutral-200 to-neutral-300 overflow-hidden relative">
              {profile.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt={profile.username}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl font-bold text-neutral-500">
                  {profile.username[0].toUpperCase()}
                </div>
              )}
            </div>
            <h1 className="text-xl font-bold">@{profile.username}</h1>
            {profile.bio && (
              <p className="text-neutral-600 text-sm mt-1">{profile.bio}</p>
            )}
            <p className="text-neutral-400 text-xs mt-2">
              {bookCount || 0} books ranked
            </p>
          </div>

          {/* Favorite Books */}
          <div className="p-6">
            <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-4">
              Favorite Books
            </h2>
            {favorites && favorites.length > 0 ? (
              <div className="grid grid-cols-4 gap-3">
                {favorites.map((book) => (
                  <div key={book.id} className="text-center">
                    <div className="aspect-[2/3] bg-neutral-100 rounded-lg overflow-hidden shadow-md relative">
                      {book.cover_url ? (
                        <Image
                          src={book.cover_url}
                          alt={book.title}
                          fill
                          sizes="25vw"
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[8px] text-neutral-400 p-1">
                          {book.title}
                        </div>
                      )}
                    </div>
                    <p className="text-[10px] text-neutral-600 mt-1 truncate">
                      {book.title}
                    </p>
                  </div>
                ))}
                {Array.from({ length: 4 - favorites.length }).map((_, i) => (
                  <div
                    key={`empty-${i}`}
                    className="aspect-[2/3] bg-neutral-100 rounded-lg border-2 border-dashed border-neutral-200"
                  />
                ))}
              </div>
            ) : (
              <p className="text-neutral-500 text-sm text-center py-4">
                No favorites yet
              </p>
            )}
          </div>

          {/* CTA */}
          <div className="p-6 bg-neutral-50 text-center">
            <Link
              href={`/profile/${username}`}
              className="inline-block px-6 py-3 bg-neutral-900 text-white rounded-lg font-medium hover:bg-neutral-800 transition-colors"
            >
              View full profile
            </Link>
            <p className="text-xs text-neutral-400 mt-3">
              Track and share your reading on Bookfolio
            </p>
          </div>
        </div>

        {/* Share image preview */}
        <div className="mt-8 text-center">
          <p className="text-sm text-neutral-500 mb-3">Share this image:</p>
          <Image
            src={`${siteUrl}/api/og/${username}`}
            alt="Share card"
            width={600}
            height={315}
            className="rounded-xl shadow-lg mx-auto"
            unoptimized
          />
          <p className="text-xs text-neutral-400 mt-2">
            Right-click to save image
          </p>
        </div>
      </div>
    </main>
  );
}
