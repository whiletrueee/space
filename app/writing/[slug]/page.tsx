import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDate, formatTime, getPost, getPosts, SITE } from "@/lib/posts";
import { FitTitle } from "../fit-title";
import { Prose } from "../prose";

export const dynamicParams = false;

// A static export needs at least one param, so an empty blog exports a single 404 page
export function generateStaticParams() {
  const posts = getPosts();
  return posts.length ? posts.map((p) => ({ slug: p.slug })) : [{ slug: "_" }];
}

export async function generateMetadata({ params }: PageProps<"/writing/[slug]">): Promise<Metadata> {
  const post = getPost((await params).slug);
  if (!post) return {};
  const url = `${SITE}/writing/${post.slug}/`;
  return {
    title: `${post.title} — whiletrueee`,
    description: post.summary,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title: post.title,
      description: post.summary,
      publishedTime: post.date.toISOString(),
      authors: ["Harshit Singh"],
    },
  };
}

export default async function PostPage({ params }: PageProps<"/writing/[slug]">) {
  const { slug } = await params;
  const posts = getPosts();
  const i = posts.findIndex((p) => p.slug === slug);
  if (i === -1) notFound();
  const post = posts[i];
  const newer = posts[i - 1];
  const older = posts[i + 1];

  return (
    <article className="w-post w-grid">
      <header className="w-post-head">
        <p className="w-kicker">
          <Link href="/writing/">Writing</Link>
          <span className="sep">/</span>
          <time dateTime={post.date.toISOString()}>
            {formatDate(post.date)}
            <span className="sep">·</span>
            {formatTime(post.date)}
          </time>
          <span className="sep">·</span>
          {post.minutes} min read
        </p>
        <FitTitle as="h1" text={post.title} className="w-title" target={0.11} min={34} maxRatio={0.2} />
        <p className="w-dek">{post.summary}</p>
      </header>

      <Prose html={post.html} />

      <p className="w-end" aria-hidden>
        ∎
      </p>

      {(older || newer) && (
        <nav className="w-next">
          {older && (
            <Link href={`/writing/${older.slug}/`}>
              <span className="w-kicker">← Earlier</span>
              <span className="t">{older.title}</span>
            </Link>
          )}
          {newer && (
            <Link href={`/writing/${newer.slug}/`}>
              <span className="w-kicker">Later →</span>
              <span className="t">{newer.title}</span>
            </Link>
          )}
        </nav>
      )}
    </article>
  );
}
