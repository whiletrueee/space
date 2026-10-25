import { existsSync, readdirSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { Marked, type Tokens } from "marked";

// Published posts are committed. Drafts are gitignored and only build in dev.
const PUBLISHED = join(process.cwd(), "content/writing");
const DRAFTS = join(process.cwd(), "content/drafts");
const BANNED = process.env.WRITING_BANNED ?? join(homedir(), ".config/whiletrueee/banned.txt");
const TZ = "Asia/Kolkata";

export const SITE = "https://whiletrueee.com";

export type Post = {
  slug: string;
  title: string;
  summary: string;
  date: Date;
  draft: boolean;
  minutes: number;
  html: string;
  frame?: Frame;
};

/** The still that gives a post its spine on the index and its opening shot on the page */
export type Frame = { number: string; small: string; large: string; xl: string; tone: string; focus: string };

const FRAMES = join(process.cwd(), "public/writing/frames");

function frameOf(slug: string, data: Record<string, string>): Frame | undefined {
  if (!data.frame || !existsSync(join(FRAMES, `${slug}-960.jpg`))) return undefined;
  return {
    number: data.frame,
    small: `/writing/frames/${slug}-960.jpg`,
    large: `/writing/frames/${slug}-1920.jpg`,
    xl: `/writing/frames/${slug}-2880.jpg`,
    tone: data.tone || "#1d1a17",
    focus: data.focus || "50%",
  };
}

export function parseFrontmatter(raw: string, file: string) {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!m) throw new Error(`${file}: missing frontmatter`);
  const data: Record<string, string> = {};
  for (const line of m[1].split("\n")) {
    const i = line.indexOf(":");
    if (i === -1) continue;
    data[line.slice(0, i).trim()] = line
      .slice(i + 1)
      .trim()
      .replace(/^["']|["']$/g, "");
  }
  return { data, body: raw.slice(m[0].length), bodyLine: m[0].split("\n").length };
}

// The scrub gate: a post that names anything on the banned list fails the build.
// The list lives outside the repo so the names on it are never published.
function scrub(posts: { file: string; raw: string }[]) {
  if (!existsSync(BANNED)) {
    if (process.env.WRITING_SKIP_SCRUB === "1") return;
    throw new Error(`Scrub list not found at ${BANNED}. Create it, or set WRITING_SKIP_SCRUB=1.`);
  }
  const patterns = readFileSync(BANNED, "utf8")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"))
    .map((l) => new RegExp(l, "i"));
  const hits: string[] = [];
  for (const { file, raw } of posts) {
    raw.split("\n").forEach((line, i) => {
      for (const re of patterns) if (re.test(line)) hits.push(`  ${file}:${i + 1}  /${re.source}/  ${line.trim()}`);
    });
  }
  if (hits.length) throw new Error(`Scrub failed — banned terms in posts:\n${hits.join("\n")}`);
}

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/<[^>]+>/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const md = new Marked({
  gfm: true,
  renderer: {
    heading({ tokens, depth }) {
      const text = this.parser.parseInline(tokens);
      return `<h${depth} id="${slugify(text)}">${text}</h${depth}>\n`;
    },
    // A paragraph holding only an image becomes a figure with its title as caption
    paragraph({ tokens }) {
      const only = tokens.length === 1 && tokens[0].type === "image" ? (tokens[0] as Tokens.Image) : null;
      if (!only) return `<p>${this.parser.parseInline(tokens)}</p>\n`;
      const caption = only.title ? `<figcaption>${only.title}</figcaption>` : "";
      return `<figure><img src="${only.href}" alt="${only.text}" loading="lazy" />${caption}</figure>\n`;
    },
  },
});

function load(dir: string, draft: boolean) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .map((f) => ({ file: join(dir, f), slug: f.replace(/\.md$/, ""), raw: readFileSync(join(dir, f), "utf8"), draft }));
}

let cache: Post[] | undefined;

export function getPosts(): Post[] {
  if (cache) return cache;
  const files = [...load(PUBLISHED, false), ...(process.env.NODE_ENV === "development" ? load(DRAFTS, true) : [])];
  scrub(files);
  cache = files
    .map(({ file, slug, raw, draft }) => {
      const { data, body } = parseFrontmatter(raw, file);
      for (const k of ["title", "date", "summary"]) if (!data[k]) throw new Error(`${file}: missing "${k}"`);
      const date = new Date(data.date);
      if (Number.isNaN(date.getTime())) throw new Error(`${file}: bad date "${data.date}"`);
      return {
        slug,
        title: data.title,
        summary: data.summary,
        date,
        draft,
        minutes: Math.max(1, Math.round(body.split(/\s+/).length / 230)),
        html: md.parse(body, { async: false }),
        frame: frameOf(slug, data),
      };
    })
    .sort((a, b) => b.date.getTime() - a.date.getTime());
  return cache;
}

export const getPost = (slug: string) => getPosts().find((p) => p.slug === slug);

export const formatDate = (d: Date) =>
  new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: TZ }).format(d);

export const formatTime = (d: Date) =>
  `${new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: TZ }).format(d)} IST`;

export const yearOf = (d: Date) => new Intl.DateTimeFormat("en-GB", { year: "numeric", timeZone: TZ }).format(d);
