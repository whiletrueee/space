import type { Metadata } from "next";
import Link from "next/link";
import { formatDate, getPosts, yearOf } from "@/lib/posts";

export const metadata: Metadata = {
  title: "Writing — whiletrueee",
  description: "Engineering, written while it happened.",
  alternates: { types: { "application/rss+xml": "/writing/rss.xml" } },
};

export default function WritingIndex() {
  const posts = getPosts();
  const years = [...new Set(posts.map((p) => yearOf(p.date)))];

  return (
    <main className="w-index w-grid">
      <header className="w-hero">
        <p className="w-kicker">
          Writing<span className="sep">/</span>
          {posts.length} {posts.length === 1 ? "piece" : "pieces"}
        </p>
        <h1 className="w-title">
          Notes from <em>the work</em>
        </h1>
        <p className="w-dek">
          Engineering, written while it happened. The failures with their numbers, ideas borrowed from other fields,
          and the measuring that comes before the building.
        </p>
      </header>

      {posts.length === 0 && <p className="w-empty">Nothing here yet.</p>}

      {years.map((year) => (
        <section key={year} className="w-year">
          <h2>{year}</h2>
          <ol>
            {posts
              .filter((p) => yearOf(p.date) === year)
              .map((p) => (
                <li key={p.slug}>
                  <Link href={`/writing/${p.slug}/`} className="w-row">
                    <time dateTime={p.date.toISOString()}>{formatDate(p.date).replace(/ \d{4}$/, "")}</time>
                    <span>
                      <span className="t">
                        {p.title}
                        {p.draft && " (draft)"}
                        <span className="arrow">→</span>
                      </span>
                      <span className="s">{p.summary}</span>
                    </span>
                    <span className="min">{p.minutes} min</span>
                  </Link>
                </li>
              ))}
          </ol>
        </section>
      ))}
    </main>
  );
}
