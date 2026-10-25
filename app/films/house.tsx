"use client";

import { useEffect, useState } from "react";
import { FitTitle } from "../writing/fit-title";

export type Concept = { slug: string; title: string; logline: string; status: string; tone?: string; still?: { small: string; large: string } };

const FRAMES = [1, 2, 3, 4, 5].map((i) => ({
  small: `/films/frames/leader-${i}-960.jpg`,
  large: `/films/frames/leader-${i}-1920.jpg`,
  xl: `/films/frames/leader-${i}-2880.jpg`,
}));
const COUNT = [5, 4, 3, 2];
const TICK = 820; // ms per number, close to a real leader's one second per foot
const HOLD = 7000; // ms each frame of the opening stays on screen
const SEEN = "films-leader-seen";

/**
 * The film section's front door. It opens on an Academy leader, the countdown spliced onto the
 * head of every reel, and the countdown never reaches a picture: it lands on a sentence instead,
 * because none of these films has been shot yet.
 */
export function FilmHouse({ concepts, stages }: { concepts: Concept[]; stages: [string, string][] }) {
  const [n, setN] = useState<number | null>(COUNT[0]);
  const [frame, setFrame] = useState(0);

  // the leader plays once a session; reduced motion, a click or a key skips it
  useEffect(() => {
    let seen = false;
    try {
      seen = sessionStorage.getItem(SEEN) === "1";
    } catch {}
    if (seen || matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // the server renders the leader, so it can only be skipped once the page is in the browser
      const skip = requestAnimationFrame(() => setN(null));
      return () => cancelAnimationFrame(skip);
    }
    let i = 0;
    const t = setInterval(() => {
      i++;
      if (i < COUNT.length) setN(COUNT[i]);
      else {
        clearInterval(t);
        setN(0); // the two-pop: one white frame, then the picture
        setTimeout(() => setN(null), 90);
        try {
          sessionStorage.setItem(SEEN, "1");
        } catch {}
      }
    }, TICK);
    const skip = () => {
      clearInterval(t);
      setN(null);
    };
    addEventListener("keydown", skip, { once: true });
    return () => {
      clearInterval(t);
      removeEventListener("keydown", skip);
    };
  }, []);

  const rolling = n === null;
  useEffect(() => {
    if (!rolling) return;
    const t = setInterval(() => setFrame((f) => (f + 1) % FRAMES.length), HOLD);
    return () => clearInterval(t);
  }, [rolling]);

  return (
    <main className={`c-cinema f-house ${rolling ? "is-rolling" : "is-leader"}`}>
      <div className="c-screen" aria-hidden>
        {FRAMES.map((f, i) => (
          <div key={f.large} className={`c-layer${rolling && frame === i ? " on" : ""}`}>
            {/* eslint-disable-next-line @next/next/no-img-element -- static export, no optimizer */}
            <img src={f.large} srcSet={`${f.small} 960w, ${f.large} 1920w, ${f.xl} 2880w`} sizes="100vw" alt="" />
          </div>
        ))}
      </div>

      {n !== null && (
        <button type="button" className={`f-leader${n === 0 ? " is-pop" : ""}`} onClick={() => setN(null)} aria-label="Skip the countdown">
          {n > 0 && (
            <span className="f-dial" key={n}>
              <span className="f-sweep" />
              <span className="f-num">{n}</span>
            </span>
          )}
          <span className="f-skip">Click to skip</span>
        </button>
      )}

      <section className="f-open">
        <p className="c-slate">
          <span>Films</span>
          <span>In development · not yet shot</span>
          <span>
            Frame {frame + 1} / {FRAMES.length}
          </span>
        </p>
        <div className="f-open-title">
          <FitTitle as="h1" text="Films I haven't made yet." className="c-display" target={0.3} min={44} maxRatio={0.4} />
          <p className="f-lede">
            Each of these exists, so far, only as a frame in my head. This is where they wait, named and written down,
            until there is a camera and a reason to shoot them.
          </p>
        </div>
        <p className="c-cue">The slate ↓</p>
      </section>

      <section className="f-slate" aria-labelledby="slate-title">
        <header className="f-slate-head">
          <h2 id="slate-title" className="c-meta">
            In development
          </h2>
          <p className="c-meta">
            {concepts.length === 0 ? "Awaiting the first reel" : `${concepts.length} ${concepts.length === 1 ? "concept" : "concepts"}`}
          </p>
        </header>

        {concepts.length === 0 ? (
          <div className="f-empty">
            <div className="f-strip" aria-hidden>
              {Array.from({ length: 7 }, (_, i) => (
                <span key={i} />
              ))}
            </div>
            <p>The first concepts are being written up. Each one arrives here with a title, a still, and a single line about what it is.</p>
          </div>
        ) : (
          <ol className="f-sheets">
            {concepts.map((c, i) => (
              <li key={c.slug} className="f-sheet">
                <div className="f-still">
                  {c.still && (
                    // eslint-disable-next-line @next/next/no-img-element -- static export, no optimizer
                    <img src={c.still.large} srcSet={`${c.still.small} 960w, ${c.still.large} 1920w`} sizes="(min-width: 900px) 60vw, 100vw" alt="" loading="lazy" />
                  )}
                </div>
                <div className="f-sheet-text">
                  <p className="c-meta">
                    No. {String(concepts.length - i).padStart(2, "0")}
                    <span className="sep">·</span>
                    {c.status}
                  </p>
                  <h3 className="f-sheet-title">{c.title}</h3>
                  <p className="f-logline">{c.logline}</p>
                  {c.tone && <p className="c-meta f-tone">{c.tone}</p>}
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="f-stages" aria-label="How a concept becomes a film">
        <ol>
          {stages.map(([stage, meaning], i) => (
            <li key={stage}>
              <span className="c-meta">{String(i + 1).padStart(2, "0")}</span>
              <span className="f-stage">{stage}</span>
              <span className="f-meaning">{meaning}</span>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
