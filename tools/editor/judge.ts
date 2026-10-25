import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import { ask, noul, score } from "./jev.ts";
import { AUDIENCE, PARAGRAPH, PIECE, TITLE, verdict, type Scores } from "./rubric.ts";

/**
 * The editor. Jev judges, code decides, a person (or Claude) rewrites.
 *
 *   node tools/editor/judge.ts content/writing/*.md          scorecard for every piece
 *   node tools/editor/judge.ts --rank content/writing/*.md   which one piece the reader would pick
 *   node tools/editor/judge.ts --cuts <post.md>              paragraphs a reader would not miss
 *   node tools/editor/judge.ts --titles <post.md> <t1> <t2>  rank candidate titles
 */

const REPORTS = join(import.meta.dirname, "reports");

function read(file: string) {
  const raw = readFileSync(file, "utf8");
  const m = raw.match(/^---\n([\s\S]*?)\n---\n?/)!;
  const fm = Object.fromEntries(
    m[1].split("\n").map((l) => [l.slice(0, l.indexOf(":")).trim(), l.slice(l.indexOf(":") + 1).trim().replace(/^"|"$/g, "")]),
  );
  const body = raw.slice(m[0].length).trim();
  // prose paragraphs only: code, tables and lists are judged as part of the whole
  const paragraphs = body.split(/\n{2,}/).filter((p) => /^[A-Za-z"“*_[(]/.test(p.trim()));
  return { title: fm.title, summary: fm.summary, body, paragraphs };
}

async function scorecard(files: string[]) {
  const rows = [];
  for (const file of files) {
    const p = read(file);
    const a = await ask({ audience: AUDIENCE, piece: { title: p.title, opening: p.paragraphs[0], body: p.body } }, PIECE);
    const s: Scores = {
      takeaway: score(a.takeaway)!.score,
      novelty: score(a.novelty)!.score,
      evidence: score(a.evidence)!.score,
      transfer: score(a.transfer)!.score,
      opening: score(a.opening)!.score,
      share: score(a.share)!.score,
      one_idea: noul(a.one_idea),
      already_believed: noul(a.already_believed),
      diary: noul(a.diary),
      padding: noul(a.padding),
    };
    rows.push({ file: basename(file), title: p.title, ...s, ...verdict(s), raw: a });
    process.stderr.write(".");
  }
  rows.sort((x, y) => y.value - x.value);
  console.log(`\n${"value".padEnd(6)} ${"call".padEnd(8)} ${"nov  shr  evid xfer take open one  old  diar pad".padEnd(50)} title`);
  for (const r of rows)
    console.log(
      `${r.value.toFixed(2).padEnd(6)} ${r.call.padEnd(8)} ${[r.novelty, r.share, r.evidence, r.transfer, r.takeaway, r.opening, r.one_idea, r.already_believed, r.diary, r.padding]
        .map((n) => n.toFixed(2).padEnd(4))
        .join(" ")}  ${r.title}${r.problems.length ? `\n${"".padEnd(66)}↳ ${r.problems.join("; ")}` : ""}`,
    );
  save("scorecard", rows);
}

async function rank(files: string[]) {
  const pieces = files.map((f) => ({ id: basename(f, ".md"), ...read(f) }));
  const criteria = Object.fromEntries(pieces.map((p) => [p.id, `${p.title}. ${p.summary}`]));
  const a = await ask(
    { audience: AUDIENCE },
    {
      first: {
        type: "choice",
        instructions:
          "A reader described in `audience` has time for exactly one of these pieces this week. Which one gives them the most?",
        criteria,
      },
    },
  );
  const probs = (a.first as unknown as { probabilities: Record<string, number> }).probabilities;
  for (const [id, pr] of Object.entries(probs).sort((x, y) => y[1] - x[1])) console.log(`${pr.toFixed(3)}  ${id}`);
  save("rank", probs);
}

async function cuts(file: string) {
  const p = read(file);
  const questions = Object.fromEntries(p.paragraphs.map((_, i) => [`p${i}`, PARAGRAPH(`\`paragraphs[${i}]\``)]));
  const a = await ask({ audience: AUDIENCE, title: p.title, paragraphs: p.paragraphs }, questions);
  const rows = p.paragraphs.map((text, i) => ({ i, need: score(a[`p${i}`])!.score, text }));
  for (const r of rows.filter((r) => r.need < 1).sort((x, y) => x.need - y.need))
    console.log(`${r.need.toFixed(2)}  ¶${r.i}  ${r.text.slice(0, 140).replace(/\n/g, " ")}…`);
  save(`cuts-${basename(file, ".md")}`, rows);
}

async function titles(file: string, candidates: string[]) {
  const p = read(file);
  // one request per title so each is judged alone, not against the others
  const rows = await Promise.all(
    candidates.map(async (title) => {
      const a = await ask({ audience: AUDIENCE, title, piece_summary: p.summary }, TITLE);
      return { title, pull: score(a.pull)!.score, honest: noul(a.honest) };
    }),
  );
  rows.sort((x, y) => (y.honest > 0.5 ? y.pull : -1) - (x.honest > 0.5 ? x.pull : -1));
  for (const r of rows) console.log(`${r.pull.toFixed(2)}  honest ${r.honest.toFixed(2)}  ${r.title}`);
  save(`titles-${basename(file, ".md")}`, rows);
}

function save(name: string, data: unknown) {
  mkdirSync(REPORTS, { recursive: true });
  writeFileSync(join(REPORTS, `${name}.json`), JSON.stringify(data, null, 2));
}

const [flag, ...rest] = process.argv.slice(2);
if (flag === "--cuts") await cuts(rest[0]);
else if (flag === "--rank") await rank(rest);
else if (flag === "--titles") await titles(rest[0], rest.slice(1));
else await scorecard([flag, ...rest].filter(Boolean));
