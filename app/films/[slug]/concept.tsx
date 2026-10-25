"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { FitTitle } from "../../writing/fit-title";

type Section = { heading: string; html: string; lines: string[] };
export type ConceptProps = {
  no: number;
  title: string;
  logline: string;
  status: string;
  tone?: string;
  place?: string;
  still?: { small: string; large: string; xl: string };
  sections: Section[];
};

const byHeading = (sections: Section[], h: string) => sections.find((s) => s.heading.toLowerCase() === h.toLowerCase());

/**
 * A concept, played rather than read. The still holds the screen; the voice-over runs as subtitles,
 * one line lit at a time; the cities and the shot are cards from a director's notebook; and it ends
 * the way the voice-over does, by freezing into a photograph.
 */
export function Concept({ no, title, logline, status, tone, place, still, sections }: ConceptProps) {
  const [lit, setLit] = useState(-1);
  const [stage, setStage] = useState<"open" | "reel" | "notes" | "freeze">("open");
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    // a subtitle is lit while it sits in the middle of the screen
    const subs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setLit(Number((e.target as HTMLElement).dataset.i));
      },
      { rootMargin: "-42% 0px -42% 0px" },
    );
    el.querySelectorAll("[data-i]").forEach((s) => subs.observe(s));
    // the grade follows where the reader is: bright at the open, dark for the voice-over and notes
    const scenes = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setStage((e.target as HTMLElement).dataset.stage as typeof stage);
      },
      { rootMargin: "-50% 0px -50% 0px" },
    );
    el.querySelectorAll("[data-stage]").forEach((s) => scenes.observe(s));
    return () => {
      subs.disconnect();
      scenes.disconnect();
    };
  }, []);

  const vo = byHeading(sections, "Voice-over");
  const night = byHeading(sections, "The night city");
  const morning = byHeading(sections, "The morning city");
  const shot = byHeading(sections, "The shot");
  const known = ["voice-over", "the night city", "the morning city", "the shot"];
  const notes = sections.filter((s) => !known.includes(s.heading.toLowerCase()));

  return (
    <main ref={root} className={`c-cinema k-concept is-${stage}`}>
      {still && (
        <div className="c-screen" aria-hidden>
          <div className="c-layer on">
            {/* eslint-disable-next-line @next/next/no-img-element -- static export, no optimizer */}
            <img src={still.large} srcSet={`${still.small} 960w, ${still.large} 1920w, ${still.xl} 2880w`} sizes="100vw" alt="" />
          </div>
        </div>
      )}

      <section className="k-open" data-stage="open">
        <p className="c-slate">
          <span>
            <Link href="/films/">Films</Link> · No. {String(no).padStart(2, "0")}
          </span>
          <span>
            {status}
            {place && ` · ${place}`}
          </span>
        </p>
        <div className="k-open-title">
          <p className="c-meta">A film I haven&apos;t made yet</p>
          <FitTitle as="h1" text={title} className="c-display" target={0.3} min={44} maxRatio={0.4} />
          <p className="k-logline">{logline}</p>
          {tone && <p className="c-meta k-tone">{tone}</p>}
        </div>
        <p className="c-cue">Roll ↓</p>
      </section>

      {vo && (
        <section className="k-reel" data-stage="reel" aria-label="Voice-over">
          <p className="c-meta k-label">Voice-over · draft</p>
          {vo.lines.map((line, i) => (
            <p key={i} data-i={i} className={`k-sub${lit === i ? " lit" : ""}${lit > i ? " past" : ""}`}>
              {line}
            </p>
          ))}
        </section>
      )}

      <div className="k-notes" data-stage="notes">
        {(night || morning) && (
          <section className="k-cities" aria-label="The city">
            {[night && { s: night, hour: "02:00 – 05:00", cls: "night" }, morning && { s: morning, hour: "07:00", cls: "morning" }]
              .filter((x) => !!x)
              .map(({ s, hour, cls }) => (
                <article key={s.heading} className={`k-city ${cls}`}>
                  <p className="k-hour">{hour}</p>
                  <h2 className="c-meta">{s.heading}</h2>
                  <div className="k-prose" dangerouslySetInnerHTML={{ __html: s.html }} />
                </article>
              ))}
          </section>
        )}

        {shot && (
          <section className="k-shot" aria-label="The shot">
            <header>
              <span className="c-meta">Shot 01</span>
              <h2 className="k-h">{shot.heading}</h2>
            </header>
            <div className="k-prose" dangerouslySetInnerHTML={{ __html: shot.html }} />
          </section>
        )}

        {notes.length > 0 && (
          <section className="k-more">
            {notes.map((s) => (
              <article key={s.heading}>
                <h2 className="k-h">{s.heading}</h2>
                <div className="k-prose" dangerouslySetInnerHTML={{ __html: s.html }} />
              </article>
            ))}
          </section>
        )}
      </div>

      {/* the voice-over ends with a photograph of the mess, so the page does too */}
      <section className="k-freeze" data-stage="freeze">
        {still && (
          <figure className={`k-photo${stage === "freeze" ? " taken" : ""}`}>
            {/* eslint-disable-next-line @next/next/no-img-element -- static export, no optimizer */}
            <img src={still.small} alt="" loading="lazy" />
            <figcaption>The mess. Kept.</figcaption>
          </figure>
        )}
        <p className="s-fin">Fin.</p>
        <p className="k-back">
          <Link href="/films/">← Back to the slate</Link>
        </p>
      </section>
    </main>
  );
}
