/**
 * Enough of Fountain (fountain.io), the plain-text screenplay format, to set a concept as pages.
 * Blocks are separated by blank lines:
 *
 *   INT. THE FLAT - NIGHT        scene heading (INT/EXT/I/E, or forced with a leading ".")
 *   INSERT - PHONE SCREEN        a single upper-case line: a shot
 *   ME (V.O.)                    an upper-case line with lines under it: a character and dialogue
 *   (beat)                       a parenthetical, inside dialogue
 *   CUT TO:                      a transition (ends in TO:, starts with FADE/FREEZE, or forced with ">")
 *   >THE END<                    centred
 *   anything else                action
 */

export type Element =
  | { type: "scene"; text: string; no: number }
  | { type: "shot" | "action" | "transition" | "centered"; text: string }
  | { type: "dialogue"; character: string; lines: { paren: boolean; text: string }[] };

const SCENE = /^(INT|EXT|EST|INT\.?\/EXT|I\/E)[ .]/i;
const TRANSITION = /^(FADE (IN|OUT)|FREEZE FRAME|SMASH CUT|MATCH CUT|CUT TO BLACK)|TO:$/;
const UPPER = (s: string) => /[A-Z]/.test(s) && s === s.toUpperCase();

export function parseFountain(source: string): Element[] {
  const out: Element[] = [];
  let scene = 0;
  for (const block of source.trim().split(/\n\s*\n/)) {
    const lines = block.split("\n").map((l) => l.trimEnd());
    const [first, ...rest] = lines;
    const head = first.trim();
    if (/^>.*<$/.test(head)) out.push({ type: "centered", text: head.slice(1, -1).trim() });
    else if (head.startsWith(">")) out.push({ type: "transition", text: head.slice(1).trim() });
    else if ((SCENE.test(head) || /^\.[^.]/.test(head)) && UPPER(head.replace(/^\./, ""))) {
      out.push({ type: "scene", text: head.replace(/^\./, ""), no: ++scene });
      if (rest.length) out.push({ type: "action", text: rest.join("\n") });
    } else if (UPPER(head) && TRANSITION.test(head) && !rest.length) out.push({ type: "transition", text: head });
    else if (UPPER(head) && rest.length)
      out.push({
        type: "dialogue",
        character: head,
        lines: rest.map((l) => ({ paren: /^\s*\(.*\)\s*$/.test(l), text: l.trim() })),
      });
    else if (UPPER(head) && !rest.length && head.length < 60) out.push({ type: "shot", text: head });
    else out.push({ type: "action", text: lines.join("\n") });
  }
  return out;
}
