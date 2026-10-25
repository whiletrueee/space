---
title: Fix the codebase, not the prompt
date: 2026-08-12T15:22:00+05:30
summary: A codebase a designer can safely change is the same codebase an agent can safely change. Prompts are the wrong place to put that work; lint rules and structure are the right one.
---

A codebase that a non-engineer can change correctly is the same codebase an LLM can change correctly. Both need one property: there is one obvious way to do each thing, and the code says what it is for. I spent a while treating "make agents better at our repo" and "make our repo easier for product and design to touch" as two projects. They are one project with one prerequisite.

The internal tool I work on is a large Next.js dashboard. Every week someone in product or design knows exactly what they want changed: a label, a column, a modal state, a filter. Every week that change waits for an engineer. The change isn't hard. The repo just doesn't tell you where it lives or how it's built. We had three ways to write a modal, two component libraries, colour tokens that named a hex value instead of a purpose, and dead modules that still compiled. A 10-line change cost three hours of archaeology, and only a few people could do the archaeology.

An agent hits the same wall, but it doesn't stop. It picks one of the three modal patterns at random and keeps going.

## The prompt is the wrong layer

The first instinct is to write it all down. Our `AGENTS.md` grew to about 60 non-negotiables: no default exports outside `pages/`, `type` instead of `interface`, no inline `style={{}}`, no raw SVG, no TS enums, no barrel files, kebab-case filenames, and so on.

That file is prose. Every human and every agent has to remember it and choose to follow it. Agents mostly do, until the context gets long or the nearest example in the file they're editing does the opposite. Then they copy the example, because the example is code and the rule is a paragraph.

So I flipped the bar. An agent with no prior context should be able to read the repo and infer the correct change. If it can't, that's a defect in the code, not in the prompt, and the fix goes in the code. The strongest version of that is simple to say:

> The wrong pattern shouldn't compile.

Most of those 60 rules can be checked statically. Turning them into lint rules means nobody has to remember them, human or model.

## Getting to a linter that can say it

We couldn't do any of this on ESLint 7 with an eslintrc. The rules I wanted needed flat config and current plugins, so the boring part came first: Prettier 2 to 3, ESLint 7 to 9 with flat config, Husky 7 to 9. Three PRs, no behaviour change, no new rules.

The upgrade had one finding that dwarfed everything else. The new Next.js ESLint config pulls in `eslint-plugin-react-hooks@7`, and its recommended preset adds 14 React Compiler rules, all at `error`. That one transitive bump was 219 of the 231 new errors. Any plan that missed it would hit a wall of errors it couldn't explain.

| Stage | Errors | Warnings |
|---|---|---|
| Before | 0 | 319 |
| Flat config, raw | 546 | 640 |
| After `eslint --fix` | 13 | 636 |
| After 13 hand-fixes | 0 | 636 |

The raw number looks scary, but `import/order` (533) and `prettier/prettier` (425) were fully autofixable. Most of it was one mechanical commit. The 219 compiler findings shipped as warnings. They aren't noise, though: 50 `set-state-in-effect` and 145 `refs` hits are exactly the class of bug behind the render loops we'd been chasing.

Two traps are worth writing down. If you leave out `eslint-config-next/typescript`, the base `no-unused-vars` and `no-undef` run on TypeScript files and you get 1,027 and 239 false errors. And `no-non-null-assertion` left typescript-eslint's recommended set a few majors ago, so a rule our docs promised quietly stopped being enforced. I added it back by hand.

## Encoding the rules

The prize is turning the prose into rules. One flat-config detail shapes the whole design: when two blocks set the same rule key, the later one replaces the earlier one. Options don't merge. You can't stack five scoped `no-restricted-imports` blocks and have them add up. Every new import restriction has to join one consolidated block or become a small custom rule with its own key. A repo with lots of custom `local/*` rules isn't doing NIH. It's working around this.

The adoption trick is to ship every rule now, as a counted debt marker:

```js
"import/no-default-export": "warn", // TODO: ~269 files. Fix, then promote to "error".
```

Rules with zero violations ship at `error` on day one and can't regress. Everything else ships at `warn` with a count, then gets burned down and promoted one line at a time. The grep estimates were not small:

| Rule | Approx. violations |
|---|---|
| No default exports outside `pages/` | ~269 files |
| No barrel files | ~154 |
| Raw `<svg>` instead of the icon component | ~114 |
| `interface` instead of `type` | ~64 |
| Inline `style={{}}` | ~63 |
| TS `enum` | ~52 |
| Non-kebab-case filenames | 805 of 2,198 |

When a rule reaches `error`, its bullet comes out of `AGENTS.md`. The prose stops carrying weight. Each rule ends up in one of three places: an enforced rule, a counted warning with a TODO, or an explicit list of things that can't be checked statically ("avoid `useEffect` unless necessary", "match the surrounding patterns"). Nothing gets a silent fourth option.

There's a risk I'm watching. CI already ignores warnings, so `warn` can turn into a permanent parking lot. The counted TODO is the only thing stopping that, and it only works if review enforces it.

## Where prose still belongs

Not everything should become a rule. For long agent-driven migrations, I keep two kinds of file. Markdown holds the decisions: why something was deferred, the constraints, the ambiguities we resolved. YAML holds the lookups: source-to-target paths, dependencies, per-item status, temporary hacks with a `remove_when`.

In practice the split is roughly 70/30 each way. Markdown carries most of the planning value and YAML carries most of the execution value. `status: DEFERRED` tells an agent nothing about what to do differently. "Deferred because a shallow merge would wipe 40 keys" stopped an actual mistake. But a file path buried in a paragraph is slow to find, and a structured field is instant. Below about 20 items, Markdown alone is fine. Above 50, YAML becomes the source of truth and the Markdown shrinks to context. Never put the same fact in both, because they drift.

None of this is a bet on models getting smarter. It removes the variance that makes any contributor guess, whether that's a junior engineer, a designer, or an agent. Each ambiguity we delete raises the ceiling for all three at once.

Next: the issue-to-PR bot for the bounded stuff, like copy, tokens, list columns and filters, where the issue itself is the whole handoff.
