import type { Metadata } from "next";
import Link from "next/link";

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

export default function About() {
  return (
    <main className="ab-root">
      <header>
        <p className="ab-name">Harshit Singh</p>
        <p className="ab-role">
          Senior Software Engineer ·{" "}
          <a href="https://www.headout.com" target="_blank" rel="noreferrer">
            Headout
          </a>{" "}
          · Bangalore
        </p>
        <h1 className="ab-thesis">
          Code is cheap now. <em>Judgment isn&rsquo;t.</em>
        </h1>
      </header>

      <div className="ab-sections">
        {sections.map((s) => (
          <section key={s.title} className="ab-section">
            <h2>{s.title}</h2>
            <p>{s.body}</p>
          </section>
        ))}
      </div>

      <footer className="ab-foot">
        <p>
          Off the clock: <Link href="/films/">films not yet shot</Link>, photographs.
        </p>
        <ul className="ab-links">
          {links.map((l) => (
            <li key={l.label}>
              <a href={l.href} target="_blank" rel="noreferrer">
                {l.label} ↗
              </a>
            </li>
          ))}
        </ul>
      </footer>
    </main>
  );
}
