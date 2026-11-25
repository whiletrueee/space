import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { Marked } from "marked";
import { parseFrontmatter } from "./posts";

/**
 * Things I built that you can open in a browser. One file per project in content/projects/<slug>.md:
 *
 *   title:   the project's name
 *   logline: one or two sentences, what it is
 *   status:  live | building
 *   url:     where to open it
 *   date:    when it went live (ISO)
 *   stack:   the main tools, separated by " · "
 *   stats:   optional, a few numbers separated by " | " ("15 characters | 80 questions")
 *
 * Images live in public/projects/<slug>/; cover.jpg is the card and the opening shot. The body is markdown.
 * An image becomes a figure with its alt text as the caption; a paragraph of several images becomes a grid.
 */

export const STATUS = { live: "Live", building: "Building" } as const;
export type Status = keyof typeof STATUS;

export type Project = {
  slug: string;
  title: string;
  logline: string;
  status: Status;
  url: string;
  date: Date;
  stack: string[];
  stats: string[];
  cover?: string;
  html: string;
};

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
const md = new Marked({
  gfm: true,
  renderer: {
    image({ href, text }) {
      return `<span class="pj-fig"><img src="${esc(href)}" alt="${esc(text)}" loading="lazy" decoding="async" /><span class="pj-cap">${esc(text)}</span></span>`;
    },
    link({ href, tokens }) {
      const external = /^https?:/.test(href);
      return `<a href="${esc(href)}"${external ? ' target="_blank" rel="noopener noreferrer"' : ""}>${this.parser.parseInline(tokens)}</a>`;
    },
  },
});

const DIR = join(process.cwd(), "content/projects");
const PUBLIC = join(process.cwd(), "public/projects");

export function getProjects(): Project[] {
  if (!existsSync(DIR)) return [];
  return readdirSync(DIR)
    .filter((f) => f.endsWith(".md"))
    .map((f) => {
      const file = join(DIR, f);
      const slug = f.replace(/\.md$/, "");
      const { data, body } = parseFrontmatter(readFileSync(file, "utf8"), file);
      for (const k of ["title", "logline", "status", "url", "date"]) if (!data[k]) throw new Error(`${file}: missing "${k}"`);
      if (!(data.status in STATUS)) throw new Error(`${file}: status must be one of ${Object.keys(STATUS).join(", ")}`);
      return {
        slug,
        title: data.title,
        logline: data.logline,
        status: data.status as Status,
        url: data.url,
        date: new Date(data.date),
        stack: (data.stack || "").split("·").map((s) => s.trim()).filter(Boolean),
        stats: (data.stats || "").split("|").map((s) => s.trim()).filter(Boolean),
        cover: existsSync(join(PUBLIC, slug, "cover.jpg")) ? `/projects/${slug}/cover.jpg` : undefined,
        html: md.parse(body, { async: false }),
      };
    })
    .sort((a, b) => b.date.getTime() - a.date.getTime());
}

export function getProject(slug: string) {
  return getProjects().find((p) => p.slug === slug);
}
