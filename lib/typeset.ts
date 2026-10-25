import { clearCache, prepareWithSegments } from "@chenglou/pretext";

/**
 * Book-style paragraphs: Pretext measures every word with the real font, then
 * Knuth-Plass picks the line breaks for the whole paragraph at once, not one
 * line at a time as CSS does. Each line is painted as its own nowrap block, so
 * the browser only stretches the spaces and never re-wraps.
 *
 * Paragraphs that hold anything but text and simple inline tags are left to CSS.
 *
 * The last long paragraph is set as a cul-de-lampe: each line a little narrower than the one
 * above, centred, so the piece tapers to a point the way old books closed a chapter.
 */

type Seg = { type: "box" | "glue" | "break"; w: number; text: string; item: number };
type Item = { text: string; font: string; chain: Element[] };
type Para = { p: HTMLElement; items: Item[]; segs: Seg[]; original: Node[]; lead: HTMLElement[]; shape?: "taper" | "tail" };

const INLINE = new Set(["A", "ABBR", "B", "CITE", "CODE", "EM", "I", "KBD", "MARK", "Q", "S", "SMALL", "STRONG"]);
const DROPCAP_LINES = 3;
const JUSTIFY_MIN_WIDTH = 480; // narrower than this, lines stay ragged-right
const LOOSEST = 3; // first pass rejects lines stretched past this ratio
const TAPER_MIN_WORDS = 30; // shorter than this, a paragraph has too few lines to make a shape
const TAPER_FLOOR = 0.22; // the width of the last tapered line, as a fraction of the measure

const fontOf = (el: Element) => {
  const s = getComputedStyle(el);
  return `${s.fontStyle} ${s.fontWeight} ${s.fontSize} ${s.fontFamily}`;
};

const spaceWidths = new Map<string, number>();
function spaceWidth(font: string) {
  let w = spaceWidths.get(font);
  if (w === undefined) {
    const prep = prepareWithSegments("x x", font);
    w = prep.widths[prep.kinds.indexOf("space")] ?? 4;
    spaceWidths.set(font, w);
  }
  return w;
}

// Flatten a paragraph into runs of text, each with its font and its wrapping tags
function collect(node: Element, chain: Element[], items: Item[]): boolean {
  for (const child of node.childNodes) {
    if (child.nodeType === Node.TEXT_NODE) {
      if (child.textContent) items.push({ text: child.textContent, font: fontOf(node), chain });
    } else if (child instanceof Element && INLINE.has(child.tagName)) {
      if (!collect(child, [...chain, child], items)) return false;
    } else if (child.nodeType !== Node.COMMENT_NODE) {
      return false;
    }
  }
  return true;
}

function segment(items: Item[]): Seg[] {
  const segs: Seg[] = [];
  items.forEach((item, idx) => {
    for (const tok of item.text.split(/(\s+)/)) {
      if (!tok) continue;
      if (/^\s+$/.test(tok)) {
        if (segs.length && segs.at(-1)!.type !== "glue")
          segs.push({ type: "glue", w: spaceWidth(item.font), text: " ", item: idx });
        continue;
      }
      // Pretext splits a word where a line may break inside it (after a hyphen, a slash, between CJK)
      const prep = prepareWithSegments(tok, item.font);
      prep.segments.forEach((text, i) => {
        const kind = prep.kinds[i];
        if (kind === "soft-hyphen") return;
        if (kind === "zero-width-break") {
          segs.push({ type: "break", w: 0, text: "", item: idx });
          return;
        }
        if (i > 0 && segs.at(-1)?.type === "box") segs.push({ type: "break", w: 0, text: "", item: idx });
        segs.push({ type: "box", w: prep.widths[i], text, item: idx });
      });
    }
  });
  while (segs.at(-1)?.type === "glue") segs.pop();
  return segs;
}

type Node_ = { pos: number; start: number; line: number; dem: number; prev: Node_ | null };

// Knuth-Plass total fit: minimise the summed badness of every line in the paragraph
// Ragged lines paint their spaces at natural width, so only justified lines may shrink
function breakLines(
  segs: Seg[],
  widthAt: (line: number) => number,
  loosest: number,
  justify: boolean,
  distinct = DROPCAP_LINES, // lines past this all share one width, so nodes beyond it can be merged
): [number, number][] | null {
  const n = segs.length;
  const W = [0], Y = [0], Z = [0];
  for (const s of segs) {
    const glue = s.type === "glue";
    W.push(W.at(-1)! + s.w);
    Y.push(Y.at(-1)! + (glue ? s.w * 0.5 : 0)); // stretch
    Z.push(Z.at(-1)! + (glue && justify ? s.w * 0.3 : 0)); // shrink
  }

  let active: Node_[] = [{ pos: 0, start: 0, line: 0, dem: 0, prev: null }];
  for (let j = 1; j <= n; j++) {
    if (j < n && segs[j].type === "box") continue;
    const last = j === n;
    const best = new Map<number, Node_>();
    const keep: Node_[] = [];
    for (const a of active) {
      const natural = W[j] - W[a.start];
      const L = widthAt(a.line);
      let r: number;
      if (natural <= L) {
        const stretch = Y[j] - Y[a.start];
        r = last ? 0 : stretch > 0 ? (L - natural) / stretch : Infinity;
      } else {
        const shrink = Z[j] - Z[a.start];
        r = shrink > 0 ? (L - natural) / shrink : -Infinity;
      }
      if (r < -1) continue; // too tight, and every later break from here is tighter
      keep.push(a);
      if (r > loosest) continue;
      const badness = Math.min(100 * Math.abs(r) ** 3, 1e7);
      const dem = a.dem + (10 + badness) ** 2 + (segs[j]?.type === "break" ? 2500 : 0);
      // widths only differ for the first few lines, so that is all a node needs to remember
      const key = Math.min(a.line + 1, distinct);
      const cur = best.get(key);
      if (!cur || dem < cur.dem) best.set(key, { pos: j, start: j + 1, line: a.line + 1, dem, prev: a });
    }
    active = [...keep, ...best.values()];
    if (!active.length) return null;
  }

  const end = active.filter((a) => a.pos === n).sort((a, b) => a.dem - b.dem)[0];
  if (!end) return null;
  const lines: [number, number][] = [];
  for (let node: Node_ | null = end; node?.prev; node = node.prev) lines.unshift([node.prev.start, node.pos]);
  return lines;
}

function paint(para: Para, lines: [number, number][], justify: boolean, widthAt: (line: number) => number) {
  const { segs, items } = para;
  const taper = para.shape === "taper";
  const out = lines.map(([from, to], li) => {
    const line = document.createElement("span");
    line.className = justify && li < lines.length - 1 ? "tl tl-justify" : "tl";
    if (taper) line.style.width = `${widthAt(li)}px`;
    let i = from, end = to;
    while (i < end && segs[i].type === "glue") i++;
    while (end > i && segs[end - 1].type === "glue") end--;
    if (justify && li < lines.length - 1) {
      // CSS justify only stretches spaces; a line Knuth-Plass chose to tighten is shrunk here
      let natural = 0, gaps = 0;
      for (let k = i; k < end; k++) {
        natural += segs[k].w;
        if (segs[k].type === "glue") gaps++;
      }
      const L = widthAt(li);
      if (natural > L && gaps) line.style.wordSpacing = `${(L - natural) / gaps}px`;
    }
    while (i < end) {
      const item = segs[i].item;
      let text = "";
      for (; i < end && segs[i].item === item; i++) text += segs[i].text;
      let node: globalThis.Node = document.createTextNode(text);
      for (const tag of [...items[item].chain].reverse()) {
        const wrap = tag.cloneNode(false);
        wrap.appendChild(node);
        node = wrap;
      }
      line.append(node);
    }
    return line;
  });
  para.p.replaceChildren(...para.lead, ...out);
}

// The first letter moves into a floated cap; the lines beside it are set narrower
function addDropcap(para: Para) {
  const first = para.items[0];
  const m = first?.chain.length === 0 && first.text.match(/^\s*(["“‘']?\p{L})/u);
  if (!m) return;
  first.text = first.text.slice(m[0].length);
  const dc = document.createElement("span");
  dc.className = "dc";
  dc.setAttribute("aria-hidden", "true");
  dc.textContent = m[1];
  // the cap is hidden from screen readers, so they read this copy of the letter
  const sr = document.createElement("span");
  sr.className = "sr-only";
  sr.textContent = m[1];
  para.lead = [sr, dc];
}

// For each line count, widths curve from the full measure down to the floor; the count whose
// last line comes out fullest wins, so the shape closes on a point instead of trailing off
function taperLines(segs: Seg[], width: number) {
  let best: { lines: [number, number][]; widthAt: (line: number) => number; score: number } | null = null;
  for (let n = 4; n <= 24; n++) {
    const widthAt = (line: number) =>
      Math.floor(width * (1 - (1 - TAPER_FLOOR) * Math.min(1, line / (n - 1)) ** 1.3)) - 1;
    const lines =
      breakLines(segs, widthAt, LOOSEST, true, Infinity) ?? breakLines(segs, widthAt, Infinity, true, Infinity);
    // the last line costs nothing in Knuth-Plass, so it may end the paragraph early and leave a stub
    if (!lines || lines.length > n || lines.length < 3) continue;
    const [from, to] = lines.at(-1)!;
    let natural = 0;
    for (let k = from; k < to; k++) natural += segs[k].w;
    const score = Math.abs(1 - natural / widthAt(lines.length - 1)) + (n - lines.length) * 0.5;
    if (!best || score < best.score) best = { lines, widthAt, score };
  }
  return best;
}

// The closing paragraph tapers; a short sign-off line after it sits centred under the point
function shapeEnding(paras: Para[], root: HTMLElement) {
  const words = (p: Para) => p.items.reduce((n, i) => n + i.text.split(/\s+/).filter(Boolean).length, 0);
  const last = paras.at(-1);
  if (!last || last.p !== root.lastElementChild) return;
  if (words(last) >= TAPER_MIN_WORDS) {
    last.shape = "taper";
    return;
  }
  const prev = paras.at(-2);
  if (prev && prev.p === last.p.previousElementSibling && words(prev) >= TAPER_MIN_WORDS && !prev.lead.length) {
    prev.shape = "taper";
    last.shape = "tail";
  }
}

/** Typesets every top-level paragraph in `root`. Returns a cleanup that restores the original DOM. */
export function typeset(root: HTMLElement): () => void {
  let cancelled = false;
  let paras: Para[] = [];
  let observer: ResizeObserver | undefined;
  let lastWidth = 0;

  const run = () => {
    const width = Math.floor(root.querySelector<HTMLElement>(":scope > p")?.clientWidth ?? 0);
    if (!width || width === lastWidth) return;
    lastWidth = width;
    const justify = width >= JUSTIFY_MIN_WIDTH;
    for (const para of paras) {
      // the drop cap is painted first so its real width can be measured
      para.p.classList.toggle("is-taper", justify && para.shape === "taper");
      para.p.classList.toggle("is-tail", justify && para.shape === "tail");
      if (justify && para.shape === "taper") {
        const shaped = taperLines(para.segs, width);
        if (shaped) {
          paint(para, shaped.lines, true, shaped.widthAt);
          continue;
        }
        para.p.classList.remove("is-taper");
      }
      const dc = para.lead[1];
      if (dc) para.p.replaceChildren(...para.lead);
      const dcWidth = dc ? dc.getBoundingClientRect().width + parseFloat(getComputedStyle(dc).marginRight) : 0;
      const widthAt = (line: number) => (line < DROPCAP_LINES ? width - dcWidth : width) - 1;
      const lines =
        breakLines(para.segs, widthAt, LOOSEST, justify) ?? breakLines(para.segs, widthAt, Infinity, justify);
      if (lines) paint(para, lines, justify, widthAt);
      else para.p.replaceChildren(...para.original);
    }
  };

  document.fonts.ready.then(() => {
    if (cancelled) return;
    clearCache(); // anything measured before the web font loaded used the fallback
    paras = [...root.querySelectorAll<HTMLElement>(":scope > p")].flatMap((p) => {
      const items: Item[] = [];
      if (!collect(p, [], items)) return [];
      return [{ p, items, segs: [], original: [...p.childNodes], lead: [] }];
    });
    const opener = root.firstElementChild;
    if (root.classList.contains("has-dropcap") && paras[0] && paras[0].p === opener) addDropcap(paras[0]);
    shapeEnding(paras, root);
    for (const para of paras) para.segs = segment(para.items);
    run();
    root.classList.add("is-set");
    let frame = 0;
    observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(run);
    });
    observer.observe(root);
  });

  return () => {
    cancelled = true;
    observer?.disconnect();
    for (const para of paras) {
      para.p.replaceChildren(...para.original);
      para.p.classList.remove("is-taper", "is-tail");
    }
    root.classList.remove("is-set");
  };
}
