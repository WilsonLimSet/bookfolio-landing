"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { revalidateProfile } from "@/app/actions";
import Header from "@/components/Header";
import ListForm from "@/components/ListForm";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";

export default function NewListPage() {
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkAuth() {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        router.push("/login");
      } else {
        setUser(authUser);
        setIsAuthenticated(true);

        // Get username for header
        const { data: profile } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", authUser.id)
          .single();
        setUsername(profile?.username || null);
      }
    }
    checkAuth();
  }, [supabase, router]);

  async function handleSubmit(data: { name: string; description: string; is_public: boolean }) {
    setIsLoading(true);

    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) throw new Error("Not logged in");

      const { data: newList, error } = await supabase
        .from("book_lists")
        .insert({
          user_id: authUser.id,
          name: data.name,
          description: data.description || null,
          is_public: data.is_public,
        })
        .select()
        .single();

      if (error) throw error;

      if (data.is_public) {
        await revalidateProfile(authUser.id);
      }

      // Redirect to the edit page to add books
      router.push(`/lists/${newList.id}/edit`);
    } catch (error) {
      console.error("Error creating list:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }

  if (isAuthenticated === null) {
    return (
      <>
        <Header user={null} username={null} />
        <main className="min-h-screen px-4 sm:px-6 py-6">
          <div className="max-w-md mx-auto flex justify-center py-12">
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
        <div className="max-w-md mx-auto">
          {/* Back button */}
          <Link
            href="/lists"
            className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-700 mb-6"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Lists
          </Link>

          <h1 className="text-2xl font-bold mb-6">Create a new list</h1>

          <ListForm
            onSubmit={handleSubmit}
            onCancel={() => router.push("/lists")}
            submitLabel="Create List"
            isLoading={isLoading}
          />
        </div>
      </main>
    </>
  );
}
