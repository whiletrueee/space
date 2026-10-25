---
title: A taxonomy of AI-generated PR bloat, with numbers
date: 2026-10-21T23:08:00+05:30
summary: I audited nine AI-assisted PRs for code that could go without losing any behaviour. The removable share ran from about 1% to 85%, and most of it was not where I expected.
---

The most bloated PR I audited was 85% removable, and very little of it was bad code. It was two unrelated fixes riding along on a 30-line change. The leanest came in at about 1%.

I've been auditing AI-assisted PRs in the frontend I work on for one thing only: the smallest diff that keeps every behaviour. Not style, and not bugs. Removing a behaviour counts as a failure, even if the diff shrinks. Nine PRs so far:

| What the PR did | Diff (code) | Removable |
|---|---|---|
| A 30-line fix that grew | +223 / −29 | ~85%, about 190 lines that belong in two other PRs |
| Remove a legacy flow, rename the rest | +666 / −1,033 | ~49% of 1,226 added lines, plus ~210 renamed lines that should be deleted |
| New modal primitive | +2,683, plus +2,364 tests | ~22% (~1,130 lines), almost all tests |
| Swap the API transport | +3,630 / −5,481 | ~15% (~555 lines) |
| Select with a search fallback | +516, plus +162 tests | ~15% (~100 lines) |
| Theme and density toolbar | +485 / −182 | ~5% for sure, up to 15% |
| Data hook and its API call | +240 / −262 | ~4% (~15 lines) |
| Picker component | +385 / −135 | ~3% (~12 lines) |
| Mapping page | +1,750 / −1 | ~1% low-risk, ~2–3% in total |

Size doesn't predict bloat. The largest code diff was 15%, and a small fix was 85%. The modal primitive looks bad at 22%, but its shipped code was close to minimal at about 35 lines, or 1.3%. The other 1,092 lines were tests.

## The categories, roughly by lines recovered

**Architecture.** Check this first, because the wins are biggest here. A new module where extending an existing one would work. The same fix patched in N consumers instead of once at the source. The same fact stored in two places. A generic framework with exactly one caller. In the transport swap, the AI rebuilt a type tree that another module already owned. The new file had 0 importers outside its own folder, and its only consumer cast the value straight back to the existing type, about 140 lines. It also copied the code generator's Input/Output type split into hand-written types. The generator needed that split. Hand-written types don't, which was another ~85 lines.

**Scope creep.** Unrelated config, docs, agent skills or lint changes that ride along. The legacy-flow PR carried +229 lines of agent tooling that had nothing to do with the flow. The fix is to split these out, not delete them.

**Test bloat.** This is the biggest single item I've found. The modal PR had a 1,127-line "parity" folder. It rendered inline copies of six call sites and asserted on its own `jest.fn()` callbacks, so the assertions were testing the test. It held 3 pins that no other test covered. Port those 3 and drop the rest. Smaller versions of the same thing: two tests that pin the same branch, and tests that assert an exact cache-key string instead of the behaviour the key exists for.

**Dead on arrival.** Code that nothing ships. The legacy-flow PR deleted the flow, then renamed and kept four files that only the deleted flow imported, 212 lines in total. A grep at the PR head finds only their definitions.

**Duplicates of existing truth.** Two identical types in the same file. A day-of-week constant that already existed under another name. The same UI string declared twice under two keys.

**Single-use indirection.** An identity map (`primary → primary`) where the value could be used directly. A helper in the lint config that grouped 98 overrides into 4 when a plain `map` did the same job. One-line re-export stubs. A barrel file with 0 importers.

**Defensive noise.** `?.` and `??` on values typed non-null. `useMemo` on cheap values passed to children that aren't memoised.

**Effects that copy state.** A `useEffect` that mirrors one piece of state into another, when the setter could do it.

**Comment narration.** The same comment pasted into two files. A comment that restates the next line. A JSDoc block that copies a section of the plan doc. A comment pointing at a file that isn't in the repo.

Bloat isn't only a line-count problem. In one PR, the commits that addressed review feedback moved some styles into a new file. Along the way they referenced two design tokens that don't exist. The CSS tool emitted invalid values, so a 52px thumbnail lost its size and a title lost its line height. The move added 57 lines and caused a visual regression.

## Signals are leads, not verdicts

I run a script first. It counts new files, narration comments, hook density, exports with few importers and duplicate names. Then I check every lead before I call it bloat.

The transport-swap PR flagged `??` 69 times. 36 of those were in moved code, on a type where every field really is nullable. Most of the rest were in tests. The real non-null noise was about 3 tokens. The same PR had 8 `try` blocks, and each one added behaviour: new error copy, partial-failure handling, a refresh fallback. None of them was log-and-rethrow.

> Removing a behaviour is a failure even if the diff shrinks.

What keeps me honest is a behaviour ledger, written before I judge any code. It is a numbered list of everything the PR must do, taken from the PR body, the commits, the test names and the user-visible strings: UI states, validation rules, permission gates, analytics events, API fields, and edge cases that a test pins. The transport swap had 28 items. After the trim, every item has to point at the file and line that still implements it. Any item without a home means that commit gets reverted.

Before I re-read the PR's solution, I also sketch the minimal design from the ledger alone. Big gaps between that sketch and the PR are the highest-value findings.

Some things look like bloat and aren't:

- Explicit per-token style calls that exist because the CSS extractor can't see computed strings.
- `try/catch` around `localStorage`, because privacy modes throw.
- Nullable handling for older backend versions. Check the API history before you remove it.
- Exhaustive pattern matches over variants that do different things. A map isn't shorter, and you lose the exhaustiveness check.

When I can't prove it, I tag it UNSURE and leave it for a human. Across the nine PRs, the low numbers matter as much as the high ones. Several of the feature PRs were already near-minimal. The bloat clustered around tests, scope and refactors nobody asked for.

Next: turning the signal script into a sweep that ranks a batch of PRs before anyone reads a line.
