---
title: The bloat in AI PRs is in the tests, not the code
date: 2026-10-21T23:08:00+05:30
summary: I measured nine AI-assisted PRs for code that could go without losing a single behaviour. The shipped code was usually close to minimal. The bloat was in the tests, the scope and the refactors nobody asked for.
frame: 048
tone: "#b6a381"
focus: 50%
---

The usual complaint about AI-written pull requests is that the code is bloated: too many helpers, too much defensive checking, comments narrating every line. I measured nine of them for one thing only, the smallest diff that keeps every behaviour, and the code was mostly not the problem. Across the nine, the removable share ran from about 1% to 85%. The 85% was a 30-line fix carrying two unrelated changes. A 2,683-line feature had 35 removable lines of shipped code and 1,092 removable lines of tests.

If you review AI-assisted PRs by reading the code for verbosity, you are looking at the cheapest part.

## The numbers

| What the PR did | Diff | Removable |
|---|---|---|
| A 30-line fix that grew | +223 / −29 | ~85%, two other PRs riding along |
| Remove a legacy flow, rename the rest | +666 / −1,033 | ~49%, mostly files only the deleted flow used |
| New modal primitive | +2,683, plus +2,364 tests | ~22%, almost all of it tests |
| Swap the API transport | +3,630 / −5,481 | ~15%, a duplicated type tree |
| Select with a search fallback | +516, plus +162 tests | ~15% |
| Theme and density toolbar | +485 / −182 | 5–15% |
| Data hook and its API call | +240 / −262 | ~4% |
| Picker component | +385 / −135 | ~3% |
| Mapping page | +1,750 / −1 | ~1–3% |

Size predicts nothing. The largest code diff was 15% removable and one of the smallest was 85%. Several feature PRs were already near the minimum, and saying so is part of the result: an audit that only ever finds bloat is not measuring anything.

## Where it actually was, by lines recovered

**Architecture, first and largest.** A new module where extending an existing one would do. The same fix patched in every consumer instead of once at the source. A generic framework with one caller. In the transport swap, the model rebuilt a type tree that another module already owned. The new file had no importers outside its own folder, and its only consumer cast the value straight back to the existing type. That one decision was about 140 lines, and no amount of line-level tidying would have found it.

**Scope creep.** Config, docs, agent tooling and lint changes that ride along with the real change. The legacy-flow PR carried 229 lines of unrelated agent tooling. These are not deletions, they are separate PRs, and splitting them is what makes the real change reviewable.

**Tests that test themselves.** The single biggest item. The modal PR had a 1,127-line "parity" folder that rendered inline copies of six call sites and asserted on its own mock callbacks. Only three of its assertions covered anything no other test did. Port those three and the rest goes. Smaller versions are common: two tests pinning the same branch, or a test asserting an exact cache-key string instead of the behaviour the key exists for.

**Dead on arrival.** The legacy-flow PR deleted the flow, then renamed and kept four files that only the deleted flow imported, 212 lines. A grep at the PR head finds their definitions and nothing else.

The categories people usually mean by "AI bloat" were real but small: duplicate types and constants, single-use indirection like identity maps and re-export stubs, `?.` on values typed non-null, effects that copy one piece of state into another, comments that restate the next line. Together they were tens of lines per PR, not hundreds.

## The method that keeps it honest

The hard constraint is that removing a behaviour counts as a failure, however much the diff shrinks. Two habits enforce it.

> Write down what the PR must do before you read how it does it.

The first is a behaviour ledger, written before judging any code: a numbered list of everything the PR must do, taken from the description, the commits, the test names and the user-visible strings. UI states, validation rules, permission checks, analytics events, API fields, the edge cases a test pins. The transport swap had 28 items. After the trim, every item must point at the file and line that still implements it. An item with no home means the change that orphaned it gets reverted.

The second is to sketch the minimal design from the ledger alone, before re-reading the PR's own solution. The largest gaps between your sketch and the PR are the highest-value findings, and they are always architectural.

Automated signals help you find leads, and they are bad at verdicts. A script counting `??` flagged 69 in the transport swap. Thirty-six were in moved code on a type where every field really is nullable, most of the rest were in tests, and the real noise was about three tokens. The same PR had eight `try` blocks and every one added behaviour. Some things look like bloat and are not: `try/catch` around `localStorage`, because private browsing throws; nullable handling kept for older API versions; exhaustive matches over variants that really do different things, where a lookup table would be no shorter and would lose the exhaustiveness check. When you cannot prove a line is removable, mark it unsure and leave it for a person.

## What to change in review

Read AI-assisted PRs in the order the bloat is distributed, not the order the diff is printed. First ask whether this needed a new module at all. Then check what else is riding along and ask for it to be split. Then read the tests and ask what each one would catch that another doesn't. Read the shipped code last, and expect it to be the cleanest part.
