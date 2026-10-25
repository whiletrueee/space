import { clearCache, measureNaturalWidth, prepareWithSegments } from "@chenglou/pretext";

/**
 * Wood-type titles: the title is split into lines, and each line gets its own font size so that
 * it runs exactly the full width, the way a letterpress poster is set. Pretext measures every
 * candidate line at a reference size; widths scale linearly with size, so one measurement per
 * line is enough to try every split.
 *
 * CSS can scale a whole element to fit, but not size each line independently.
 */

const REF = 100; // px; every candidate line is measured at this size
const MAX_LINES = 6;

type Options = {
  target: number; // preferred size as a fraction of the width
  min: number; // px, below this a line is unreadable as a headline
  maxRatio: number; // a line may not be larger than this fraction of the width
};

type Line = { text: string; size: number };

function split(words: string[], width: number, measure: (s: string) => number, o: Options): Line[] | null {
  const target = Math.min(Math.max(width * o.target, o.min * 1.4), 140);
  let best: Line[] | null = null;
  let bestScore = Infinity;

  // every way to cut the words into k lines; titles are short, so brute force is a few hundred tries
  const walk = (from: number, lines: Line[]) => {
    if (from === words.length) {
      const logs = lines.map((l) => Math.log(l.size));
      const spread = Math.max(...logs) - Math.min(...logs);
      const score = logs.reduce((s, l) => s + (l - Math.log(target)) ** 2, 0) / lines.length + spread ** 2;
      if (score < bestScore) [best, bestScore] = [lines, score];
      return;
    }
    if (lines.length === MAX_LINES) return;
    for (let to = from + 1; to <= words.length; to++) {
      const text = words.slice(from, to).join(" ");
      const size = (REF * width) / measure(text);
      if (size > Math.max(width * o.maxRatio, 64)) continue; // too few words to fill the line without shouting
      if (size < o.min) break; // adding words only makes it smaller
      walk(to, [...lines, { text, size }]);
    }
  };
  walk(0, []);
  return best;
}

/** Fits the text of `el` line by line. Returns a cleanup that restores the original text. */
export function fitTitle(el: HTMLElement, o: Options): () => void {
  const original = el.textContent ?? "";
  const words = original.trim().split(/\s+/);
  let cancelled = false;
  let observer: ResizeObserver | undefined;
  let lastWidth = 0;
  let measure: (s: string) => number = () => 0;
  let tracking = 0; // letter-spacing in px at the reference size

  const run = () => {
    const width = el.clientWidth;
    if (!width || width === lastWidth) return;
    lastWidth = width;
    const lines = split(words, width, measure, o);
    if (!lines) {
      el.replaceChildren(original);
      el.classList.remove("is-fit");
      return;
    }
    const spans = lines.map((line, i) => {
      const span = document.createElement("span");
      span.className = "fit-line";
      span.style.setProperty("--i", String(i));
      span.style.fontSize = `${line.size}px`;
      span.textContent = line.text;
      return span;
    });
    // spaces between the lines keep copy-paste and screen readers reading one sentence
    el.replaceChildren(...spans.flatMap((s, i) => (i ? [" ", s] : [s])));
    // correct the last pixels against what the browser actually painted; the box ends one
    // letter-space short of the ink when tracking is negative, so aim past the edge by that much
    for (const span of spans) {
      for (let pass = 0; pass < 3; pass++) {
        const size = parseFloat(span.style.fontSize);
        const goal = width - (tracking * size) / REF;
        const painted = span.getBoundingClientRect().width;
        if (!painted || Math.abs(painted - goal) < 0.25) break;
        span.style.fontSize = `${(size * goal) / painted}px`;
      }
    }
    el.classList.add("is-fit");
  };

  const s = getComputedStyle(el);
  const font = `${s.fontStyle} ${s.fontWeight} ${REF}px ${s.fontFamily}`;
  // fonts.ready can settle before a face this element needs has even been requested, so ask for it
  Promise.all([document.fonts.ready, document.fonts.load(font, original)]).then(() => {
    if (cancelled) return;
    clearCache();
    const px = parseFloat(s.fontSize);
    tracking = s.letterSpacing === "normal" ? 0 : (parseFloat(s.letterSpacing) / px) * REF;
    const cache = new Map<string, number>();
    measure = (text) => {
      let w = cache.get(text);
      if (w === undefined) {
        w = measureNaturalWidth(prepareWithSegments(text, font, { letterSpacing: tracking }));
        cache.set(text, w);
      }
      return w;
    };
    run();
    let frame = 0;
    observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(run);
    });
    observer.observe(el);
  });

  return () => {
    cancelled = true;
    observer?.disconnect();
    el.replaceChildren(original);
    el.classList.remove("is-fit");
  };
}
