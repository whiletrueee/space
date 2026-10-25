import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

/**
 * A thin System One client. Two ways in, same contract:
 * - TYPESAFE_API_KEY: the TypeSafe API, model jev-latest
 * - otherwise an OpenCode key, model JEV_MODEL: jev-1.13-free while OpenCode's free quota lasts,
 *   jev-1.13 from the account balance once it runs out
 */

export type Score = { type: "score"; instructions: unknown; criteria: unknown[] };
export type Noul = { type: "noul"; instructions: unknown; criteria?: { true?: unknown; false?: unknown } };
export type Choice = { type: "choice"; instructions: unknown; criteria: Record<string, unknown> };
export type Question = Score | Noul | Choice;

export type ScoreAnswer = { type: "score"; score: number; confidence: number; probabilities: Record<string, number> };
export type NoulAnswer = { type: "noul"; noul: number };
export type Answer = ScoreAnswer | NoulAnswer;

// an OpenCode key kept outside the repo wins over the one `opencode auth` stored
const KEY_FILE = join(homedir(), ".config/whiletrueee/opencode.key");

function openCodeKey() {
  if (process.env.OPENCODE_API_KEY) return process.env.OPENCODE_API_KEY;
  if (existsSync(KEY_FILE)) return readFileSync(KEY_FILE, "utf8").trim();
  return JSON.parse(readFileSync(join(homedir(), ".local/share/opencode/auth.json"), "utf8")).opencode.key as string;
}

function endpoint() {
  if (process.env.TYPESAFE_API_KEY)
    return { url: "https://api.typesafe.ai/v1/systemone", key: process.env.TYPESAFE_API_KEY, model: "jev-latest" };
  return {
    url: "https://opencode.ai/inference/systemone/v1/systemone",
    key: openCodeKey(),
    model: process.env.JEV_MODEL ?? "jev-1.13-free",
  };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// what this run has cost, as OpenCode reports it (TypeSafe's API does not return a cost)
let spent = 0;
process.on("exit", () => spent && process.stderr.write(`\nJev spend this run: $${spent.toFixed(5)}\n`));

export async function ask(state: unknown, questions: Record<string, Question>): Promise<Record<string, Answer>> {
  const { url, key, model } = endpoint();
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, state, questions }),
    });
    if (res.ok) {
      const data = await res.json();
      spent += data.usage?.cost ?? 0;
      return data.answers;
    }
    const body = await res.text();
    // a usage cap will not lift by retrying, so stop and say which way in ran out
    if (body.includes("FreeUsageLimitError"))
      throw new Error(`Free Jev quota is used up on OpenCode. Set TYPESAFE_API_KEY to use the TypeSafe API.`);
    if ((res.status === 429 || res.status >= 500) && attempt < 4) {
      await sleep(1000 * 2 ** attempt);
      continue;
    }
    throw new Error(`Jev ${res.status}: ${body.slice(0, 400)}`);
  }
}

export const score = (a: Answer | undefined) => (a?.type === "score" ? a : undefined);
export const noul = (a: Answer | undefined) => (a?.type === "noul" ? a.noul : NaN);
