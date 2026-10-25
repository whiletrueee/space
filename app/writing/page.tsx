import type { Metadata } from "next";
import { formatDate, getPosts } from "@/lib/posts";
import { Cinema, type Showing } from "./cinema";

export const metadata: Metadata = {
  title: "Writing — whiletrueee",
  description: "Engineering, written while it happened.",
};

export default function WritingIndex() {
  const posts = getPosts();
  // pieces are numbered in the order they were written; the programme lists the newest first
  const showings: Showing[] = posts.map((p, i) => ({
    slug: p.slug,
    no: posts.length - i,
    title: p.draft ? `${p.title} (draft)` : p.title,
    summary: p.summary,
    date: formatDate(p.date),
    iso: p.date.toISOString(),
    minutes: p.minutes,
    frame: p.frame,
  }));
  const frames = posts.filter((p) => p.frame).length + 5;
  const minutes = posts.reduce((n, p) => n + p.minutes, 0);

  return (
    <Cinema
      posts={showings}
      credits={[
        ["Written by", "Harshit Singh"],
        ["Running time", `${minutes} minutes in ${posts.length} parts`],
        ["Display type", "Instrument Serif"],
        ["Text type", "Newsreader"],
        ["Slates", "Geist Mono"],
        ["Typesetting", "Pretext, after Knuth & Plass"],
        ["Frames", `${frames} generated stills`],
        ["Shot on location", "Bangalore, India"],
      ]}
    />
  );
}
