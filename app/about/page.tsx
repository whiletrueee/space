import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties } from "react";
import { Clock } from "./clock";

export const metadata: Metadata = {
  title: "About — whiletrueee",
  description:
    "Harshit Singh, senior software engineer at Headout. Building the supply side of marketplaces and AI-native engineering.",
};

const sections = [
  {
    title: "Building the supply side of marketplaces",
    body: "A marketplace is only as good as what's on it. The work: getting tour operators, museums and guides listed and selling with as little friction as possible, and fixing what breaks for them after.",
  },
  {
    title: "AI-native engineering",
    body: "Agents write most of the code now. The craft has moved to deciding what's worth building, and keeping codebases clear enough that agents and people both get them right.",
  },
];

const links = [
  { label: "GitHub", href: "https://github.com/whiletrueee" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/harshitportal" },
];

// stagger for the entrance, in steps of 120ms
const step = (i: number) => ({ "--i": i }) as CSSProperties;

export default function About() {
  return (
    <main className="ab-root">
      <header className="ab-head">
        <p className="ab-meta ab-rise" style={step(0)}>
          <span className="ab-name">Harshit Singh</span>
          <span className="ab-role">
            Senior Software Engineer ·{" "}
            <a href="https://www.headout.com" target="_blank" rel="noreferrer">
              Headout
            </a>
          </span>
          <span className="ab-place">
            Bangalore <Clock />
          </span>
        </p>
        <h1 className="ab-thesis">
          <span className="ab-rise" style={step(1)}>
            Code is cheap now.
          </span>{" "}
          <em className="ab-rise" style={step(2)}>
            Judgment isn&rsquo;t.<span className="ab-caret" aria-hidden />
          </em>
        </h1>
      </header>

      <ol className="ab-sections">
        {sections.map((s, i) => (
          <li key={s.title} className="ab-section ab-rise" style={step(3 + i)}>
            <span className="ab-no">0{i + 1}</span>
            <h2>{s.title}</h2>
            <p>{s.body}</p>
          </li>
        ))}
      </ol>

      <footer className="ab-foot ab-rise" style={step(5)}>
        <p>
          Off the clock: <Link href="/films/">films not yet shot</Link>, photographs.
        </p>
        <ul className="ab-links">
          {links.map((l) => (
            <li key={l.label}>
              <a href={l.href} target="_blank" rel="noreferrer">
                {l.label} <span aria-hidden>↗</span>
              </a>
            </li>
          ))}
        </ul>
      </footer>
    </main>
  );
}
