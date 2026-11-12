import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About — whiletrueee",
  description: "Harshit Singh, senior software engineer at Headout.",
};

const links = [
  { label: "GitHub", href: "https://github.com/whiletrueee" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/harshitportal" },
];

export default function About() {
  return (
    <main className="ab-root">
      <h1 className="ab-title">
        I&rsquo;m Harshit, a senior software engineer at{" "}
        <a href="https://www.headout.com" target="_blank" rel="noreferrer">
          Headout
        </a>
        .
      </h1>

      <ul className="ab-links">
        {links.map((l) => (
          <li key={l.label}>
            <a href={l.href} target="_blank" rel="noreferrer">
              {l.label} ↗
            </a>
          </li>
        ))}
      </ul>
    </main>
  );
}
