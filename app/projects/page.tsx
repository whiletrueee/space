import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties } from "react";
import { getProjects, STATUS } from "@/lib/projects";

export const metadata: Metadata = {
  title: "Projects — whiletrueee",
  description: "Things I built that you can open in a browser.",
};

// stagger for the entrance, in steps of 120ms (as on the About page)
const step = (i: number) => ({ "--i": i }) as CSSProperties;

export default function ProjectsIndex() {
  const projects = getProjects();
  return (
    <main className="pj-root">
      <header className="pj-head">
        <p className="pj-meta pj-rise" style={step(0)}>
          <span className="pj-meta-a">Projects</span>
          <span className="pj-meta-b">Made with a team of AI coding agents</span>
          <span className="pj-meta-c">{String(projects.length).padStart(2, "0")} live</span>
        </p>
        <h1 className="pj-thesis">
          <span className="pj-rise" style={step(1)}>
            Insomnia, given a shape.
          </span>{" "}
          <em className="pj-rise" style={step(2)}>
            Walk in.
          </em>
        </h1>
      </header>

      <ol className="pj-rows">
        {projects.map((p, i) => (
          <li key={p.slug} className="pj-row pj-rise" style={step(3 + i)}>
            <span className="pj-no">{String(i + 1).padStart(2, "0")}</span>
            <h2>
              <Link href={`/projects/${p.slug}/`}>{p.title}</Link>
              <span className="pj-status">{STATUS[p.status]}</span>
            </h2>
            <div className="pj-row-body">
              <p>{p.logline}</p>
              {p.cover && (
                <Link href={`/projects/${p.slug}/`} className="pj-row-img" aria-label={p.title}>
                  <img src={p.cover} alt="" loading={i ? "lazy" : "eager"} decoding="async" />
                </Link>
              )}
              <p className="pj-row-links">
                <Link href={`/projects/${p.slug}/`}>
                  How it was made <span aria-hidden>→</span>
                </Link>
                <a href={p.url} target="_blank" rel="noopener noreferrer">
                  Open {new URL(p.url).host} <span aria-hidden>↗</span>
                </a>
              </p>
            </div>
          </li>
        ))}
      </ol>
    </main>
  );
}
