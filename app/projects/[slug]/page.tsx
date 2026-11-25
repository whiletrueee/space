import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { CSSProperties } from "react";
import { getProject, getProjects, STATUS } from "@/lib/projects";
import { formatDate, SITE } from "@/lib/posts";

export const dynamicParams = false;

// A static export needs at least one param, so an empty list exports a single 404 page
export function generateStaticParams() {
  const projects = getProjects();
  return projects.length ? projects.map((p) => ({ slug: p.slug })) : [{ slug: "_" }];
}

export async function generateMetadata({ params }: PageProps<"/projects/[slug]">): Promise<Metadata> {
  const p = getProject((await params).slug);
  if (!p) return {};
  const image = p.cover ? `${SITE}${p.cover}` : undefined;
  return {
    title: `${p.title} — whiletrueee`,
    description: p.logline,
    openGraph: { title: p.title, description: p.logline, url: `${SITE}/projects/${p.slug}/`, images: image ? [image] : undefined },
    twitter: { card: "summary_large_image", title: p.title, description: p.logline, images: image ? [image] : undefined },
  };
}

const step = (i: number) => ({ "--i": i }) as CSSProperties;

export default async function ProjectPage({ params }: PageProps<"/projects/[slug]">) {
  const p = getProject((await params).slug);
  if (!p) notFound();
  const host = new URL(p.url).host;

  return (
    <main className="pj-root">
      <header className="pj-head">
        <p className="pj-meta pj-rise" style={step(0)}>
          <span className="pj-meta-a">
            <Link href="/projects/">Projects</Link>
          </span>
          <span className="pj-meta-b">
            {STATUS[p.status]} · {formatDate(p.date)}
          </span>
          <span className="pj-meta-c">
            <a href={p.url} target="_blank" rel="noopener noreferrer">
              {host} <span aria-hidden>↗</span>
            </a>
          </span>
        </p>
        <h1 className="pj-thesis">
          <span className="pj-rise" style={step(1)}>
            {p.title}
          </span>
        </h1>
        <p className="pj-lede pj-rise" style={step(2)}>
          {p.logline}
        </p>
        <p className="pj-lede-links pj-rise" style={step(2)}>
          <a href={p.url} target="_blank" rel="noopener noreferrer" className="pj-open">
            Open {host} <span aria-hidden>↗</span>
          </a>
        </p>
      </header>

      {p.cover && (
        <figure className="pj-hero pj-rise" style={step(3)}>
          <img src={p.cover} alt={`${p.title}, in the browser`} decoding="async" />
        </figure>
      )}

      {(p.stats.length > 0 || p.stack.length > 0) && (
        <dl className="pj-facts pj-rise" style={step(4)}>
          {p.stats.map((s) => {
            const [n, ...rest] = s.split(" ");
            return (
              <div key={s}>
                <dt>{n}</dt>
                <dd>{rest.join(" ")}</dd>
              </div>
            );
          })}
          {p.stack.length > 0 && (
            <div className="pj-stack">
              <dt>Made with</dt>
              <dd>{p.stack.join(" · ")}</dd>
            </div>
          )}
        </dl>
      )}

      <article className="pj-body" dangerouslySetInnerHTML={{ __html: p.html }} />

      <footer className="pj-foot">
        <p>
          <Link href="/projects/">← All projects</Link>
        </p>
        <ul className="pj-links">
          <li>
            <a href={p.url} target="_blank" rel="noopener noreferrer">
              Open {host} <span aria-hidden>↗</span>
            </a>
          </li>
        </ul>
      </footer>
    </main>
  );
}
