import type { Question } from "./jev.ts";

/**
 * The editor's judgment, as narrow questions Jev can answer, plus the policy code applies to them.
 * Every question is asked from the reader's side: what does this give someone who does not know me?
 */

export const AUDIENCE =
  "Senior and staff software engineers and engineering leads who read Hacker News, Lobsters and engineering newsletters. " +
  "They have shipped large frontend and backend systems, they use AI coding agents daily, they have read a thousand " +
  "posts about React, TypeScript, refactoring and AI, and they skip anything that does not change how they work. " +
  "They do not know the author, his employer, his codebase or his teammates, and do not care about any of them.";

// Each piece is scored on what a reader leaves with, then gated on what would make a reader leave
export const PIECE: Record<string, Question> = {
  takeaway: {
    type: "score",
    instructions:
      "After reading `piece.body` once, what can a reader described in `audience` do differently in their own work?",
    criteria: [
      "Nothing they can use: the piece reports what happened to the author and stops there",
      "A reminder of something they already practise, such as 'measure first' or 'write tests'",
      "A specific technique, check or command they could apply to their own system this week",
      "A reusable way of thinking about a class of problems, with a concrete method, that changes how they approach future work",
    ],
  },
  novelty: {
    type: "score",
    instructions:
      "How new is the central idea of `piece.body` to a reader described in `audience`, who has read widely on these topics?",
    criteria: [
      "The same point made in many existing posts, with nothing added",
      "A familiar topic with one detail or number that most posts on it lack",
      "A familiar topic seen from an angle these readers rarely meet, such as an idea imported from another field",
      "An idea these readers have probably never seen written down",
    ],
  },
  evidence: {
    type: "score",
    instructions: "How well does `piece.body` support its central claim for a sceptical reader described in `audience`?",
    criteria: [
      "Assertions and opinions with no supporting detail",
      "Anecdote: one story told from memory, with no numbers or artefacts",
      "Concrete artefacts: numbers, code, before and after, or a reproduction the reader can check",
      "Measured evidence across several cases that rules out the obvious alternative explanations",
    ],
  },
  transfer: {
    type: "score",
    instructions:
      "How much of `piece.body` still makes sense and is useful to a reader described in `audience` who works on a completely different codebase?",
    criteria: [
      "Little: it depends on the author's internal systems, names and history",
      "Some: the lesson is there, but the reader has to dig it out of internal detail",
      "Most: internal detail is only the example, and the lesson is stated in general terms",
      "All: the specific case is used only to illustrate a general principle the reader can carry anywhere",
    ],
  },
  opening: {
    type: "score",
    instructions:
      "Judge only the first paragraph, `piece.opening`. Would a reader described in `audience` keep reading after it?",
    criteria: [
      "No: it is throat clearing, background, or a setup about the author",
      "Maybe: it names the topic but gives no reason to care",
      "Yes: it states a concrete surprising fact, a stake, or a question the reader wants answered",
    ],
  },
  share: {
    type: "score",
    instructions:
      "Would a reader described in `audience`, having finished `piece.body`, send it to a colleague or save it to come back to?",
    criteria: [
      "No: they got what they needed from the title, or nothing at all",
      "Only if the exact topic is a live problem for them this week",
      "Yes: it says something they will want to point other engineers to, even ones outside their team",
    ],
  },
  one_idea: {
    type: "noul",
    instructions:
      "`piece.body` is built around one central idea that can be stated in a single sentence, and nearly every section serves that idea.",
  },
  already_believed: {
    type: "noul",
    instructions:
      "The central lesson of `piece.body` is something most readers described in `audience` already believe before reading it, such as 'measure first', 'delete dead code' or 'read the error'.",
  },
  diary: {
    type: "noul",
    instructions:
      "`piece.body` is mainly a diary of the author's own mistakes, work and feelings, rather than an argument written to be useful to a reader described in `audience`.",
  },
  padding: {
    type: "noul",
    instructions:
      "`piece.body` could lose a third of its length without the reader described in `audience` losing anything they would value.",
  },
};

export const TITLE: Record<string, Question> = {
  pull: {
    type: "score",
    instructions:
      "A reader described in `audience` sees only `title` in a list of fifty links. How likely are they to open it?",
    criteria: [
      "They skip it: it is vague, generic, or about the author rather than the reader",
      "They might open it if the topic happens to interest them that day",
      "They open it: it names a specific, surprising claim or result they want to understand",
    ],
  },
  honest: {
    type: "noul",
    instructions: "`title` promises something that `piece_summary` actually delivers, without exaggeration or clickbait.",
  },
};

// A paragraph earns its place if this reader would miss it
export const PARAGRAPH = (path: string): Question => ({
  type: "score",
  instructions: `If ${path} were deleted from the piece, how much would a reader described in \`audience\` lose?`,
  criteria: [
    "Nothing: it repeats, narrates the author's process, or exists only for the author",
    "A little: some context or colour, but the argument stands without it",
    "Something they need: a step, number, example or claim the argument depends on",
  ],
});

/** Policy: weighted value, then hard gates. Weights are taste; change them without re-asking Jev. */
export type Scores = {
  takeaway: number;
  novelty: number;
  evidence: number;
  transfer: number;
  opening: number;
  share: number;
  one_idea: number;
  already_believed: number;
  diary: number;
  padding: number;
};

export function verdict(s: Scores) {
  // takeaway barely separates pieces in practice, so novelty and shareability carry the weight
  const value =
    0.3 * (s.novelty / 3) + 0.25 * (s.share / 2) + 0.2 * (s.evidence / 3) + 0.15 * (s.transfer / 3) + 0.1 * (s.takeaway / 3);
  const problems = [
    s.already_believed > 0.5 && "readers already believe this",
    s.one_idea < 0.5 && "no single idea",
    s.diary > 0.5 && "reads as a diary, not an argument",
    s.padding > 0.6 && "a third could go",
    s.opening < 1.5 && "weak opening",
    s.transfer < 1.5 && "too tied to one codebase",
    s.takeaway < 1.5 && "no takeaway",
  ].filter(Boolean) as string[];
  const call = value >= 0.6 && problems.length === 0 ? "ship" : value >= 0.45 ? "rewrite" : "cut";
  return { value, problems, call };
}
