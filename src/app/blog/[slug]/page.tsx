import Link from "next/link";
import { notFound } from "next/navigation";
import { posts } from "../posts";

export function generateStaticParams() {
  return posts.map((post) => ({ slug: post.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const post = posts.find((p) => p.slug === params.slug);
  if (!post) return {};
  return {
    title: `${post.title} - Bookfolio`,
    description: post.description,
    alternates: {
      canonical: `https://bookfolioapp.com/blog/${post.slug}`,
    },
  };
}

function BlogJsonLd({ post }: { post: { title: string; description: string; slug: string } }) {
  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: "2026-02-06",
    dateModified: "2026-02-06",
    author: {
      "@type": "Organization",
      name: "Bookfolio",
      url: "https://bookfolioapp.com",
    },
    publisher: {
      "@type": "Organization",
      name: "Bookfolio",
      url: "https://bookfolioapp.com",
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://bookfolioapp.com/blog/${post.slug}`,
    },
  });

  return <script type="application/ld+json">{jsonLd}</script>;
}

export default function BlogPost({ params }: { params: { slug: string } }) {
  const post = posts.find((p) => p.slug === params.slug);

  if (!post) {
    notFound();
  }

  return (
    <main className="min-h-screen px-6 py-12">
      <BlogJsonLd post={post} />
      <div className="max-w-2xl mx-auto space-y-8">
        <Link
          href="/blog"
          className="text-sm text-neutral-500 hover:text-neutral-900"
        >
          &larr; Back to blog
        </Link>

        <article className="space-y-6">
          <div>
            <p className="text-sm text-neutral-400">{post.date}</p>
            <h1 className="mt-2 text-3xl font-bold">{post.title}</h1>
          </div>

          <div className="prose prose-neutral max-w-none">
            {post.content
              .trim()
              .split("\n\n")
              .map((block, i) => {
                if (block.startsWith("## ")) {
                  return (
                    <h2
                      key={i}
                      className="text-xl font-semibold mt-8 mb-3"
                    >
                      {block.replace("## ", "")}
                    </h2>
                  );
                }
                if (block.startsWith("- ")) {
                  return (
                    <ul key={i} className="list-disc pl-6 space-y-1 text-neutral-700">
                      {block.split("\n").map((line, j) => (
                        <li key={j}>{line.replace(/^- /, "")}</li>
                      ))}
                    </ul>
                  );
                }
                if (block.startsWith("1. ")) {
                  return (
                    <ol key={i} className="list-decimal pl-6 space-y-1 text-neutral-700">
                      {block.split("\n").map((line, j) => (
                        <li key={j}>
                          {line.replace(/^\d+\.\s/, "").replace(/\*\*(.*?)\*\*/g, "$1")}
                        </li>
                      ))}
                    </ol>
                  );
                }
                // Handle bold text within paragraphs
                const parts = block.split(/\*\*(.*?)\*\*/g);
                return (
                  <p key={i} className="text-neutral-700 leading-relaxed">
                    {parts.map((part, j) =>
                      j % 2 === 1 ? (
                        <strong key={j}>{part}</strong>
                      ) : (
                        part
                      )
                    )}
                  </p>
                );
              })}
          </div>
        </article>

        <div className="border-t border-neutral-100 pt-8">
          <p className="text-neutral-600">
            Ready to start ranking?{" "}
            <Link href="/login" className="font-medium underline hover:text-neutral-900">
              Create your Bookfolio
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
