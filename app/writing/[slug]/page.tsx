import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDate, formatTime, getPost, getPosts, SITE } from "@/lib/posts";
import { FitTitle } from "../fit-title";
import { Prose } from "../prose";
import { Screening } from "../screening";

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

  // each section opens on different coverage of the same frame: a wide, then close-ups around
  // its focal point, the way one location is shot from several setups
  const focus = parseFloat(post.frame?.focus ?? "50");
  const shots = [
    [50, 0, 1],
    [28, -6, 1.7],
    [72, 8, 1.45],
    [42, 12, 2.1],
    [62, -10, 1.3],
  ];
  let scene = 0;
  const html = post.frame
    ? post.html.replace(/<h2 /g, () => {
        const [x, dy, z] = shots[scene % shots.length];
        const y = Math.min(95, Math.max(5, focus + dy));
        scene++;
        const label = `Scene ${String(scene).padStart(2, "0")}`;
        return `<figure class="shot" aria-hidden="true" style="--x:${x}%;--y:${y}%;--z:${z}"><span>${label}</span></figure><h2 `;
      })
    : post.html;
  const no = posts.length - i;

  return (
    <Screening frame={post.frame} minutes={post.minutes}>
      <article
        className="s-post"
        style={post.frame ? ({ "--frame": `url(${post.frame.large})`, "--tone": post.frame.tone } as CSSProperties) : undefined}
      >
        <header className="s-open">
          <p className="c-slate">
            <span>
              <Link href="/writing/">Writing</Link> · No. {String(no).padStart(2, "0")}
            </span>
            {post.frame && <span>Frame {post.frame.number} · 2.39 : 1</span>}
          </p>
          <div className="s-open-title">
            <p className="c-meta">
              <time dateTime={post.date.toISOString()}>
                {formatDate(post.date)}
                <span className="sep">·</span>
                {formatTime(post.date)}
              </time>
              <span className="sep">·</span>
              {post.minutes} min
            </p>
            <FitTitle as="h1" text={post.title} className="s-title" target={0.12} min={40} maxRatio={0.22} />
            <p className="s-dek">{post.summary}</p>
          </div>
          <p className="c-cue">Scroll to begin ↓</p>
        </header>

        <div className="s-reel w-grid">
          <Prose html={html} />
          <p className="s-fin">Fin.</p>
        </div>

        {(older || newer) && (
          <nav className="s-next" aria-label="More writing">
            {[older && { p: older, label: "← Earlier screening" }, newer && { p: newer, label: "Later screening →" }]
              .filter((x) => !!x)
              .map(({ p, label }) => (
                <Link key={p.slug} href={`/writing/${p.slug}/`} className="s-card" style={{ background: p.frame?.tone }}>
                  {p.frame && (
                    // eslint-disable-next-line @next/next/no-img-element -- static export, no optimizer
                    <img src={p.frame.small} alt="" loading="lazy" style={{ objectPosition: `50% ${p.frame.focus}` }} />
                  )}
                  <span className="c-meta">{label}</span>
                  <span className="s-card-title">{p.title}</span>
                </Link>
              ))}
          </nav>
        )}
      </article>
    </Screening>
  );
}
