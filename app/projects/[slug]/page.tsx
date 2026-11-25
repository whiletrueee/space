import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
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

export default async function ProjectPage({ params }: PageProps<"/projects/[slug]">) {
  const p = getProject((await params).slug);
  if (!p) notFound();
  const host = new URL(p.url).host;

  return (
    <main className="pj-root">
      <header className="pj-head pj-head-detail">
        <p className="w-kicker">
          <Link href="/projects/">Projects</Link> / {p.title}
        </p>
        <h1 className="pj-title">{p.title}</h1>
        <p className="pj-lede">{p.logline}</p>
        <div className="pj-actions">
          <a className="pj-open" href={p.url} target="_blank" rel="noopener noreferrer">
            Open {host} <span aria-hidden>↗</span>
          </a>
          <span className={`pj-status pj-status-${p.status}`}>{STATUS[p.status]}</span>
          <span className="pj-date">{formatDate(p.date)}</span>
        </div>
      </header>

      {p.cover && (
        <figure className="pj-hero">
          <img src={p.cover} alt={`${p.title}, in the browser`} decoding="async" />
        </figure>
      )}

      {(p.stats.length > 0 || p.stack.length > 0) && (
        <dl className="pj-facts">
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

      <footer className="pj-end">
        <a className="pj-open" href={p.url} target="_blank" rel="noopener noreferrer">
          Open {host} <span aria-hidden>↗</span>
        </a>
        <Link href="/projects/" className="pj-back">
          ← All projects
        </Link>
      </footer>
    </main>
  );
}
