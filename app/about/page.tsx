import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "About — whiletrueee",
  description:
    "Harshit Singh, senior software engineer at Headout. I build the supply side of marketplaces and redesign how engineering teams work now that AI writes the code.",
};

const trusted = [
  "Getting small businesses onto a global marketplace, and finding the step where they quietly give up.",
  "Moving live prices across countries without breaking anyone's revenue.",
  "Making a team faster with AI without drowning it in AI-written code.",
  "Owning an outcome end to end: the product call, frontend, backend, data and on-call.",
];

const beliefs = [
  "Writing code isn't the bottleneck anymore. Deciding what shouldn't exist is.",
  "Every line that shouldn't exist is a tax: review time today, on-call risk tomorrow. I call it the slop tax.",
  "The best AI-assisted PR is smaller than the one a human would have written.",
  "If an agent needs a better prompt, the codebase is usually what's wrong.",
  "A migration that moves real money teaches more than any greenfield project.",
];

const stack = ["What to build", "What to skip", "What to delete", "What to verify", "The code"];

const links = [
  { label: "GitHub", href: "https://github.com/whiletrueee" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/harshitportal" },
];

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="ab-row">
      <h2 className="ab-label">{label}</h2>
      <div className="ab-body">{children}</div>
    </section>
  );
}

export default function About() {
  return (
    <main className="ab-root">
      <header className="ab-head">
        <p className="ab-kicker">
          Harshit Singh · Senior software engineer at{" "}
          <a href="https://www.headout.com" target="_blank" rel="noreferrer">
            Headout
          </a>
        </p>
        <h1>
          Code is cheap now.
          <br />
          <em>Judgment isn&rsquo;t.</em>
        </h1>
        <p className="ab-lede">
          I build the supply side of marketplaces, and I redesign how engineering teams work now that AI writes most of the
          code.
        </p>
      </header>

      <Row label="What I do">
        <p>
          Marketplaces are won on the supply side. I build the tools tour operators, museums and guides use to get listed and
          start earning. The number I care about isn&rsquo;t signups. It&rsquo;s <strong>time to first earn</strong>: how long
          a small business takes to go from interested to paid.
        </p>
        <p>
          I also changed how my team uses AI, from a private habit to a shared practice. How we investigate incidents, verify
          changes, review code and hand over on-call is written down, versioned and shared. The judgment belongs to the team,
          not to one person&rsquo;s prompt history.
        </p>
      </Row>

      <Row label="Trusted with">
        <ul className="ab-list">
          {trusted.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </Row>

      <Row label="I believe">
        <ul className="ab-list">
          {beliefs.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
      </Row>

      <Row label="How I work">
        <p>Most of the work happens before the first line gets written. I go through it in this order:</p>
        <ol className="ab-stack">
          {stack.map((s, i) => (
            <li key={s}>
              <span>0{i + 1}</span>
              {s}
            </li>
          ))}
        </ol>
        <p>I measure before I build, and I prove a feature is dead before I delete it.</p>
      </Row>

      <Row label="Off the clock">
        <p>
          I write <Link href="/films/">films I haven&rsquo;t shot yet</Link> and photograph the things I want to remember.
        </p>
      </Row>

      <Row label="Elsewhere">
        <ul className="ab-links">
          {links.map((l) => (
            <li key={l.label}>
              <a href={l.href} target="_blank" rel="noreferrer">
                {l.label} ↗
              </a>
            </li>
          ))}
        </ul>
      </Row>

      <p className="ab-close">The code is the easy part.</p>
    </main>
  );
}
