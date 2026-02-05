"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { searchBooks, Book } from "@/lib/openLibrary";

interface HeaderProps {
  user?: { id: string } | null;
  username?: string | null;
}

interface UserResult {
  id: string;
  username: string;
  avatar_url: string | null;
}

export default function Header({ user, username }: HeaderProps) {
  const pathname = usePathname();
  const supabase = createClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [bookResults, setBookResults] = useState<Book[]>([]);
  const [userResults, setUserResults] = useState<UserResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close search when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearch(false);
        setBookResults([]);
        setUserResults([]);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search - books AND users
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!searchQuery.trim()) {
      // Use timeout to avoid synchronous setState in effect
      searchTimeoutRef.current = setTimeout(() => {
        setBookResults([]);
        setUserResults([]);
        setIsSearching(false);
      }, 0);
      return;
    }

    // Use immediate timeout to set loading state (to avoid synchronous setState)
    const loadingTimeout = setTimeout(() => setIsSearching(true), 0);

    searchTimeoutRef.current = setTimeout(async () => {
      // Search books and users in parallel
      const [books, usersResult] = await Promise.all([
        searchBooks(searchQuery),
        supabase
          .from("profiles")
          .select("id, username, avatar_url")
          .ilike("username", `%${searchQuery}%`)
          .limit(5),
      ]);

      setBookResults(books);
      setUserResults(usersResult.data || []);
      setIsSearching(false);
    }, 300);

    return () => {
      clearTimeout(loadingTimeout);
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, supabase]);

  const navLinks = user
    ? [
        { href: "/feed", label: "Feed" },
        { href: "/leaderboard", label: "Leaderboard" },
      ]
    : [];

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-neutral-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link
            href={user ? "/feed" : "/"}
            onClick={(e) => {
              // If already on the target page, just scroll to top instead of reloading
              const targetPath = user ? "/feed" : "/";
              if (pathname === targetPath) {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: "smooth" });
              }
            }}
            className="flex items-center gap-2 text-neutral-900 hover:text-neutral-600 transition-colors"
          >
            <img src="/logo-512x512.png" alt="Bookfolio" className="w-7 h-7" />
            <span className="font-semibold hidden sm:inline">Bookfolio</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? "bg-neutral-100 text-neutral-900"
                    : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Search */}
            {user && (
              <div ref={searchRef} className="relative">
                <button
                  onClick={() => setShowSearch(!showSearch)}
                  className="p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
                  aria-label="Search books"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>

                {showSearch && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-lg border border-neutral-200 overflow-hidden">
                    <div className="p-2">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search books..."
                        className="w-full px-3 py-2 rounded-lg border border-neutral-200 focus:border-neutral-400 focus:outline-none text-sm"
                        autoFocus
                      />
                    </div>

                    {isSearching && (
                      <div className="p-4 text-center">
                        <div className="w-5 h-5 border-2 border-neutral-300 border-t-neutral-600 rounded-full animate-spin mx-auto" />
                      </div>
                    )}

                    {(userResults.length > 0 || bookResults.length > 0) && (
                      <div className="max-h-96 overflow-y-auto border-t border-neutral-100">
                        {/* Users Section */}
                        {userResults.length > 0 && (
                          <div>
                            <p className="px-3 py-2 text-xs font-semibold text-neutral-400 uppercase tracking-wider bg-neutral-50">
                              People
                            </p>
                            {userResults.map((profile) => (
                              <Link
                                key={profile.id}
                                href={`/profile/${profile.username}`}
                                onClick={() => {
                                  setShowSearch(false);
                                  setSearchQuery("");
                                  setBookResults([]);
                                  setUserResults([]);
                                }}
                                className="flex items-center gap-3 p-3 hover:bg-neutral-50 transition-colors"
                              >
                                <div className="w-8 h-8 bg-neutral-200 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center text-sm font-bold text-neutral-500">
                                  {profile.avatar_url ? (
                                    <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    profile.username[0].toUpperCase()
                                  )}
                                </div>
                                <p className="font-medium text-sm">@{profile.username}</p>
                              </Link>
                            ))}
                          </div>
                        )}

                        {/* Books Section */}
                        {bookResults.length > 0 && (
                          <div>
                            <p className="px-3 py-2 text-xs font-semibold text-neutral-400 uppercase tracking-wider bg-neutral-50">
                              Books
                            </p>
                            {bookResults.map((book) => (
                              <Link
                                key={book.key}
                                href={`/book/${book.key.replace("/works/", "")}`}
                                onClick={() => {
                                  setShowSearch(false);
                                  setSearchQuery("");
                                  setBookResults([]);
                                  setUserResults([]);
                                }}
                                className="flex items-center gap-3 p-3 hover:bg-neutral-50 transition-colors"
                              >
                                <div className="w-8 h-12 bg-neutral-100 rounded overflow-hidden flex-shrink-0">
                                  {book.coverUrl && (
                                    <img src={book.coverUrl} alt="" className="w-full h-full object-cover" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm truncate">{book.title}</p>
                                  <p className="text-xs text-neutral-500 truncate">{book.author}</p>
                                </div>
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {searchQuery && !isSearching && bookResults.length === 0 && userResults.length === 0 && (
                      <p className="p-4 text-sm text-neutral-500 text-center">No results found</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Profile / Auth */}
            {user ? (
              <Link
                href={username ? `/profile/${username}` : "/profile/edit"}
                className={`p-2 rounded-lg transition-colors ${
                  pathname.startsWith("/profile")
                    ? "bg-neutral-100 text-neutral-900"
                    : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50"
                }`}
                aria-label="Profile"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </Link>
            ) : (
              <Link
                href="/login"
                className="px-4 py-1.5 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800 transition-colors"
              >
                Sign in
              </Link>
            )}

            {/* Mobile menu toggle */}
            {user && (
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="md:hidden p-2 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
                aria-label="Menu"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {showMobileMenu ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Mobile menu */}
        {showMobileMenu && user && (
          <nav className="md:hidden py-2 border-t border-neutral-100">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setShowMobileMenu(false)}
                className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? "bg-neutral-100 text-neutral-900"
                    : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}
