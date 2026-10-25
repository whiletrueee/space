"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { FitTitle } from "./fit-title";

export type Showing = {
  slug: string;
  no: number;
  title: string;
  summary: string;
  date: string;
  iso: string;
  minutes: number;
  frame?: { number: string; small: string; large: string; xl: string; tone: string; focus: string };
};

const REEL = [1, 2, 3, 4, 5].map((i) => ({
  small: `/writing/frames/reel-${i}-960.jpg`,
  large: `/writing/frames/reel-${i}-1920.jpg`,
  xl: `/writing/frames/reel-${i}-2880.jpg`,
}));
const REEL_HOLD = 6500; // ms each opening frame stays on screen

/**
 * The index as a cinema programme. A fixed screen sits behind the page: the opening reel plays
 * under the title, then whichever piece is centred in the viewport (or hovered) takes the screen.
 */
export function Cinema({ posts, credits }: { posts: Showing[]; credits: [string, string][] }) {
  const [active, setActive] = useState<string>("reel");
  const [reel, setReel] = useState(0);
  const [seen, setSeen] = useState<Set<string>>(() => new Set());
  const hero = useRef<HTMLElement>(null);
  const list = useRef<HTMLOListElement>(null);
  const end = useRef<HTMLElement>(null);
  // the reel plays at the opening and again, graded down, under the end credits
  const reelOn = active === "reel" || active === "credits";

  // the opening reel cycles only while it is on screen
  useEffect(() => {
    if (!reelOn) return;
    const t = setInterval(() => setReel((r) => (r + 1) % REEL.length), REEL_HOLD);
    return () => clearInterval(t);
  }, [reelOn]);

  useEffect(() => {
    const items = [...(list.current?.querySelectorAll<HTMLElement>("[data-slug]") ?? [])];
    // a piece takes the screen when it crosses the middle band of the viewport
    const centre = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.getAttribute("data-slug")!);
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    // frames load a screen ahead of their piece, so nothing downloads until it might be shown
    const near = new IntersectionObserver(
      (entries) => {
        const add = entries.filter((e) => e.isIntersecting).map((e) => e.target.getAttribute("data-slug")!);
        if (add.length) setSeen((s) => new Set([...s, ...add]));
      },
      { rootMargin: "100% 0px" },
    );
    const top = new IntersectionObserver(([e]) => e.isIntersecting && setActive("reel"), { threshold: 0.35 });
    const credits = new IntersectionObserver(([e]) => e.isIntersecting && setActive("credits"), { threshold: 0.2 });
    if (end.current) credits.observe(end.current);
    for (const el of items) {
      centre.observe(el);
      near.observe(el);
    }
    if (hero.current) top.observe(hero.current);
    return () => [centre, near, top, credits].forEach((o) => o.disconnect());
  }, []);

  const first = posts.at(-1)?.date.replace(/^\d+ /, "");
  const last = posts[0]?.date.replace(/^\d+ /, "");

  return (
    <main className={`c-cinema ${active === "reel" ? "is-reel" : "is-showing"}`}>
      <div className="c-screen" aria-hidden>
        {REEL.map((f, i) => (
          <div key={f.large} className={`c-layer${reelOn && reel === i ? " on" : ""}`}>
            {/* eslint-disable-next-line @next/next/no-img-element -- static export, no optimizer */}
            <img src={f.large} srcSet={`${f.small} 960w, ${f.large} 1920w, ${f.xl} 2880w`} sizes="100vw" alt="" />
          </div>
        ))}
        {posts.map(
          (p) =>
            p.frame && (
              <div
                key={p.slug}
                className={`c-layer${active === p.slug ? " on" : ""}`}
                style={{ background: p.frame.tone }}
              >
                {seen.has(p.slug) && (
                  // eslint-disable-next-line @next/next/no-img-element -- static export, no optimizer
                  <img
                    src={p.frame.large}
                    srcSet={`${p.frame.small} 960w, ${p.frame.large} 1920w, ${p.frame.xl} 2880w`}
                    sizes="100vw"
                    alt=""
                    style={{ objectPosition: `50% ${p.frame.focus}` }}
                  />
                )}
              </div>
            ),
        )}
      </div>

      <section ref={hero} className="c-hero">
        <p className="c-slate">
          <span>Writing</span>
          <span>
            A programme in {posts.length} parts{first && ` · ${first} – ${last}`}
          </span>
          <span>
            Reel {reel + 1} / {REEL.length}
          </span>
        </p>
        <div className="c-hero-title">
          <FitTitle as="h1" text="Notes from the work" className="c-display" target={0.3} min={44} maxRatio={0.4} />
          <p className="c-dek">
            Engineering, written while it happened. The failures with their numbers, ideas borrowed from other fields,
            and the measuring that comes before the building.
          </p>
        </div>
        <p className="c-cue">Scroll for the programme ↓</p>
      </section>

      <ol ref={list} className="c-programme">
        {posts.map((p) => (
          <li
            key={p.slug}
            data-slug={p.slug}
            className={active === p.slug ? "lit" : undefined}
            onPointerEnter={(e) => e.pointerType === "mouse" && setActive(p.slug)}
          >
            <Link href={`/writing/${p.slug}/`} className="c-entry">
              <span className="c-no">No. {String(p.no).padStart(2, "0")}</span>
              <span className="c-meta">
                <time dateTime={p.iso}>{p.date}</time>
                <span className="sep">·</span>
                {p.minutes} min
                {p.frame && (
                  <>
                    <span className="sep">·</span>Frame {p.frame.number}
                  </>
                )}
              </span>
              <FitTitle text={p.title} className="c-title" target={0.095} min={24} maxRatio={0.15} />
              <span className="c-summary">{p.summary}</span>
            </Link>
          </li>
        ))}
      </ol>

      <section ref={end} className="c-credits">
        <dl>
          {credits.map(([role, name]) => (
            <div key={role}>
              <dt>{role}</dt>
              <dd>{name}</dd>
            </div>
          ))}
        </dl>
        <p className="c-fin">Fin.</p>
      </section>
    </main>
  );
}
