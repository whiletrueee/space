import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { Marked } from "marked";
import { parseFrontmatter } from "./posts";

/**
 * Films that exist so far only as concepts. One file per film in content/films/<slug>.md:
 *
 *   title:   working title
 *   logline: one sentence, what it is about
 *   status:  spark | treatment | script | shooting
 *   tone:    the feeling, in a few words ("quiet, salt-bleached, a little funny")
 *   date:    when the idea arrived (ISO)
 *   frame:   optional still, public/films/frames/<slug>-{960,1920}.jpg
 *
 * The body is the treatment, in `## ` sections. The concept page gives a few of them their own
 * treatment by name: "Voice-over" plays as subtitles, "The shot" as a shot card.
 */

export const STAGES = {
  spark: "An image or a line that will not leave",
  treatment: "The story, start to end, in prose",
  script: "Written scene by scene",
  shooting: "On its way to being a film",
} as const;
export type Stage = keyof typeof STAGES;

export type Film = {
  slug: string;
  title: string;
  logline: string;
  status: Stage;
  tone?: string;
  date: Date;
  place?: string;
  still?: { small: string; large: string; xl: string };
  sections: { heading: string; html: string; lines: string[] }[];
};

const md = new Marked({ gfm: true });

// split the body on its headings; keep each section's paragraphs too, for the subtitle reel
function sections(body: string) {
  return body
    .split(/^## /m)
    .slice(1)
    .map((chunk) => {
      const [heading, ...rest] = chunk.split("\n");
      const text = rest.join("\n").trim();
      return {
        heading: heading.trim(),
        html: md.parse(text, { async: false }),
        lines: text.split(/\n{2,}/).map((l) => l.trim()).filter(Boolean),
      };
    });
}

const DIR = join(process.cwd(), "content/films");
const STILLS = join(process.cwd(), "public/films/frames");

export function getFilms(): Film[] {
  if (!existsSync(DIR)) return [];
  return readdirSync(DIR)
    .filter((f) => f.endsWith(".md"))
    .map((f) => {
      const file = join(DIR, f);
      const slug = f.replace(/\.md$/, "");
      const { data, body } = parseFrontmatter(readFileSync(file, "utf8"), file);
      for (const k of ["title", "logline", "status", "date"]) if (!data[k]) throw new Error(`${file}: missing "${k}"`);
      if (!(data.status in STAGES)) throw new Error(`${file}: status must be one of ${Object.keys(STAGES).join(", ")}`);
      return {
        slug,
        title: data.title,
        logline: data.logline,
        status: data.status as Stage,
        tone: data.tone,
        date: new Date(data.date),
        place: data.place,
        still: existsSync(join(STILLS, `${slug}-960.jpg`))
          ? {
              small: `/films/frames/${slug}-960.jpg`,
              large: `/films/frames/${slug}-1920.jpg`,
              xl: `/films/frames/${slug}-2880.jpg`,
            }
          : undefined,
        sections: sections(body),
      };
    })
    .sort((a, b) => b.date.getTime() - a.date.getTime());
}

export const getFilm = (slug: string) => getFilms().find((f) => f.slug === slug);
