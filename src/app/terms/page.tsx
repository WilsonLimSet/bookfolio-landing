import Link from "next/link";

export const metadata = {
  title: "Terms of Service - Bookfolio",
};

export default function TermsOfService() {
  return (
    <main className="min-h-screen px-6 py-12">
      <div className="max-w-2xl mx-auto space-y-8">
        <Link
          href="/"
          className="text-sm text-neutral-500 hover:text-neutral-900"
        >
          &larr; Back to home
        </Link>

        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Terms of Service</h1>
          <p className="text-neutral-500 text-sm">
            Last updated: February 6, 2026
          </p>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">1. Acceptance of Terms</h2>
            <p className="text-neutral-700 leading-relaxed">
              By accessing or using Bookfolio, you agree to be bound by these
              terms. If you do not agree, please do not use the service.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">2. Account</h2>
            <p className="text-neutral-700 leading-relaxed">
              You are responsible for maintaining the security of your account.
              You must provide accurate information when creating your account and
              keep it up to date. You must not use another person&apos;s account
              without permission.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">3. Acceptable Use</h2>
            <p className="text-neutral-700 leading-relaxed">
              You agree not to misuse the service, including but not limited to:
              creating fake accounts, harassing other users, posting offensive
              content in reviews or lists, or attempting to interfere with the
              operation of the service.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">4. Content</h2>
            <p className="text-neutral-700 leading-relaxed">
              You retain ownership of content you create (reviews, lists, etc.).
              By posting content on Bookfolio, you grant us a non-exclusive
              license to display it as part of the service. Book metadata and
              cover images are sourced from Open Library and are subject to their
              respective licenses.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">5. Termination</h2>
            <p className="text-neutral-700 leading-relaxed">
              We may suspend or terminate your account if you violate these terms.
              You may delete your account at any time by contacting us.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">6. Disclaimer</h2>
            <p className="text-neutral-700 leading-relaxed">
              Bookfolio is provided &quot;as is&quot; without warranties of any
              kind. We do not guarantee that the service will be uninterrupted or
              error-free.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">7. Changes</h2>
            <p className="text-neutral-700 leading-relaxed">
              We may update these terms from time to time. Continued use of the
              service after changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">8. Contact</h2>
            <p className="text-neutral-700 leading-relaxed">
              Questions about these terms? Contact us at{" "}
              <a
                href="mailto:wilsonlimsetiawan@gmail.com"
                className="underline hover:text-neutral-900"
              >
                wilsonlimsetiawan@gmail.com
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
