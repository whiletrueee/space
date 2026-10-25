import type { Metadata } from "next";
import Link from "next/link";
import { formatDate, getPosts, yearOf } from "@/lib/posts";
import { FitTitle } from "./fit-title";

export const metadata: Metadata = {
  title: "Writing — whiletrueee",
  description: "Engineering, written while it happened.",
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
        <section key={year} className="w-wall">
          <h2 className="w-kicker">{year}</h2>
          <ol>
            {posts
              .filter((p) => yearOf(p.date) === year)
              .map((p) => (
                <li key={p.slug}>
                  <Link href={`/writing/${p.slug}/`} className="w-entry">
                    {p.frame && (
                      <span className="spine" style={{ background: p.frame.tone }} aria-hidden>
                        {/* eslint-disable-next-line @next/next/no-img-element -- static export, no optimizer */}
                        <img src={p.frame.small} alt="" loading="lazy" style={{ objectPosition: `50% ${p.frame.focus}` }} />
                        <span className="no">{p.frame.number}</span>
                      </span>
                    )}
                    <span className="w-kicker meta">
                      <time dateTime={p.date.toISOString()}>{formatDate(p.date).replace(/ \d{4}$/, "")}</time>
                      <span className="sep">·</span>
                      {p.minutes} min
                      {p.draft && <span className="sep">· draft</span>}
                    </span>
                    <FitTitle text={p.title} className="t" />
                    <span className="s">{p.summary}</span>
                  </Link>
                </li>
              ))}
          </ol>
        </section>
      ))}
    </main>
  );
}
