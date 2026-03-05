import { PulsingDots } from "@/components/Skeleton";

export default function ProfileRedirectLoading() {
  return (
    <>
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-black/[0.05]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            <div className="w-7 h-7 bg-neutral-200 rounded animate-pulse" />
            <div className="flex gap-2">
              <div className="w-8 h-8 bg-neutral-100 rounded-lg animate-pulse" />
              <div className="w-8 h-8 bg-neutral-100 rounded-lg animate-pulse" />
            </div>
          </div>
        </div>
      </header>

      <main className="min-h-screen flex items-center justify-center">
        <PulsingDots />
      </main>
    </>
  );
}
