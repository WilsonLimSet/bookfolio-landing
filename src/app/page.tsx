import AuthButton from "@/components/AuthButton";
import HomeSearch from "@/components/HomeSearch";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col px-6 py-12">
      {/* Header with Auth */}
      <header className="w-full max-w-4xl mx-auto flex justify-end mb-8">
        <AuthButton />
      </header>

      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="max-w-md w-full text-center space-y-8">
          {/* Logo */}
          <div className="flex flex-col items-center gap-3">
            <img
              src="/logo-512x512.png"
              alt="Bookfolio logo"
              className="w-16 h-16"
            />
            <span className="text-3xl font-semibold tracking-tight">
              Bookfolio
            </span>
          </div>

          {/* Tagline */}
          <div className="space-y-3">
            <h1 className="text-4xl font-bold tracking-tight">
              Beli for Books
            </h1>
            <p className="text-neutral-600 text-lg">
              Rank books head-to-head. Build your list. See how you compare.
            </p>
          </div>

          {/* Search */}
          <HomeSearch />
        </div>
      </div>

      <footer className="w-full max-w-4xl mx-auto pt-8 flex justify-center gap-6 text-sm text-neutral-400">
        <Link href="/privacy" className="hover:text-neutral-600">
          Privacy Policy
        </Link>
        <Link href="/terms" className="hover:text-neutral-600">
          Terms of Service
        </Link>
      </footer>
    </main>
  );
}
