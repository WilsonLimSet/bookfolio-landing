import Link from "next/link";
import { posts } from "./posts";

export const metadata = {
  title: "Blog - Bookfolio",
  description:
    "Read about book ranking, reading lists, and why readers are switching to Bookfolio.",
};

export default function BlogPage() {
  return (
    <main className="min-h-screen px-6 py-12">
      <div className="max-w-2xl mx-auto space-y-10">
        <div>
          <Link
            href="/"
            className="text-sm text-neutral-500 hover:text-neutral-900"
          >
            &larr; Back to home
          </Link>
          <h1 className="mt-6 text-3xl font-bold">Blog</h1>
          <p className="mt-2 text-neutral-600">
            Thoughts on reading, ranking, and building your book identity.
          </p>
        </div>

        <div className="space-y-8">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="block group"
            >
              <article className="space-y-2">
                <p className="text-sm text-neutral-400">{post.date}</p>
                <h2 className="text-xl font-semibold group-hover:underline">
                  {post.title}
                </h2>
                <p className="text-neutral-600 leading-relaxed">
                  {post.description}
                </p>
              </article>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
