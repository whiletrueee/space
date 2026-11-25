import type { Metadata } from "next";
import Link from "next/link";
import { getProjects, STATUS } from "@/lib/projects";

export const metadata: Metadata = {
  title: "Projects — whiletrueee",
  description: "Things I built that you can open in a browser.",
};

export default function ProjectsIndex() {
  const projects = getProjects();
  return (
    <main className="pj-root">
      <header className="pj-head">
        <p className="w-kicker">Projects</p>
        <h1 className="pj-title">Things you can open in a browser</h1>
        <p className="pj-lede">Each one is small, finished enough to share, and made with a team of AI coding agents. Open one, then read how it was made.</p>
      </header>

      <ol className="pj-list">
        {projects.map((p, i) => (
          <li key={p.slug} className="pj-card">
            <Link href={`/projects/${p.slug}/`} className="pj-card-link">
              {p.cover && (
                <span className="pj-card-img">
                  <img src={p.cover} alt="" loading={i ? "lazy" : "eager"} decoding="async" />
                </span>
              )}
              <span className="pj-card-body">
                <span className="pj-card-meta">
                  <span className={`pj-status pj-status-${p.status}`}>{STATUS[p.status]}</span>
                  <span>{String(projects.length - i).padStart(2, "0")}</span>
                </span>
                <span className="pj-card-title">{p.title}</span>
                <span className="pj-card-line">{p.logline}</span>
                <span className="pj-card-more">How it was made →</span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </main>
  );
}
