import Link from "next/link";

export const metadata = {
  title: "Privacy Policy - Bookfolio",
};

export default function PrivacyPolicy() {
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
          <h1 className="text-3xl font-bold">Privacy Policy</h1>
          <p className="text-neutral-500 text-sm">
            Last updated: February 6, 2026
          </p>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">1. Information We Collect</h2>
            <p className="text-neutral-700 leading-relaxed">
              When you create an account, we collect your email address, username,
              and profile information. If you sign in with Google, we receive your
              name and email from your Google account. We also collect data about
              the books you rate, rank, and add to your lists.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">2. How We Use Your Information</h2>
            <p className="text-neutral-700 leading-relaxed">
              We use your information to provide and improve Bookfolio, including
              personalizing your experience, displaying your public profile and
              book rankings, and enabling social features like following other
              users. We may use anonymized, aggregated data for analytics.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">3. Information Sharing</h2>
            <p className="text-neutral-700 leading-relaxed">
              Your username, book rankings, reviews, and lists are publicly
              visible on your profile. We do not sell your personal information to
              third parties. We may share data with service providers (such as
              Supabase for hosting and Vercel for deployment) that help us operate
              the service.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">4. Data Storage and Security</h2>
            <p className="text-neutral-700 leading-relaxed">
              Your data is stored securely using Supabase with row-level security
              policies. We use industry-standard measures to protect your
              information, but no method of transmission over the internet is 100%
              secure.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">5. Cookies</h2>
            <p className="text-neutral-700 leading-relaxed">
              We use cookies to maintain your authentication session. We may also
              use analytics cookies to understand how the service is used.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">6. Your Rights</h2>
            <p className="text-neutral-700 leading-relaxed">
              You can update or delete your profile information at any time. To
              request deletion of your account and all associated data, please
              contact us at the email below.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold">7. Contact</h2>
            <p className="text-neutral-700 leading-relaxed">
              If you have questions about this privacy policy, contact us at{" "}
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
