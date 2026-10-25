"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Frame } from "@/lib/posts";

const pad = (n: number) => String(Math.floor(n)).padStart(2, "0");
const timecode = (s: number) => `${pad(s / 3600)}:${pad((s / 60) % 60)}:${pad(s % 60)}`;

/**
 * A post as a screening. Its frame fills the screen behind the page: bright under the opening
 * title, then blurred and graded down once the reading starts, so the text sits in the film's light.
 * A timecode in the corner runs through the piece's reading time as the reader scrolls.
 */
export function Screening({ frame, minutes, children }: { frame?: Frame; minutes: number; children: ReactNode }) {
  const [reading, setReading] = useState(false);
  const code = useRef<HTMLSpanElement>(null);
  const runtime = minutes * 60;

  useEffect(() => {
    let frameId = 0;
    const update = () => {
      frameId = 0;
      setReading(scrollY > innerHeight * 0.55);
      const max = document.documentElement.scrollHeight - innerHeight;
      const at = max > 0 ? Math.min(1, scrollY / max) : 0;
      // written straight to the node: re-rendering the page on every scroll frame would cost the typesetting
      if (code.current) code.current.textContent = timecode(at * runtime);
    };
    const onScroll = () => {
      if (!frameId) frameId = requestAnimationFrame(update);
    };
    update();
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frameId);
      removeEventListener("scroll", onScroll);
      removeEventListener("resize", onScroll);
    };
  }, [runtime]);

  return (
    <div className={`s-screening ${reading ? "is-reading" : "is-open"}`}>
      {frame && (
        <div className="c-screen" aria-hidden>
          <div className="c-layer on" style={{ background: frame.tone }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- static export, no optimizer */}
            <img
              src={frame.large}
              srcSet={`${frame.small} 960w, ${frame.large} 1920w, ${frame.xl} 2880w`}
              sizes="100vw"
              alt=""
              fetchPriority="high"
              style={{ objectPosition: `50% ${frame.focus}` }}
            />
          </div>
        </div>
      )}
      {children}
      <p className="s-timecode" aria-hidden>
        <span>TC</span>
        <span ref={code}>00:00:00</span>
        <span className="of">/ {timecode(runtime)}</span>
      </p>
    </div>
  );
}
