---
title: If your linter can check it, it doesn't belong in the prompt
date: 2026-08-12T15:22:00+05:30
summary: Agents follow the code next to them over the rules you wrote down, every time. Every rule your linter could check is a rule that doesn't belong in a prompt. Here is how to move them, and the flat-config traps on the way.
frame: 030
tone: "#888178"
focus: 45%
---

An agent editing your code will follow the example in the file over the rule in your prompt. It reads the rule once, at the top of a long context. It reads the example right next to the line it is changing. When the two disagree, the example wins, and it should: the example is evidence of how this codebase actually works, and the rule is a claim about how someone wishes it did.

So most of the time spent tuning `AGENTS.md` is spent on the wrong layer. If a rule can be checked by a machine, it belongs in the linter, where it holds for every contributor without anyone remembering it. The prompt should keep only what can't be checked.

## The audit

The file I started from had grown to about 60 "non-negotiables": no default exports outside `pages/`, `type` over `interface`, no inline styles, no raw SVG, no TypeScript enums, no barrel files, kebab-case filenames, and so on. Agents mostly obeyed them until the context got long or the nearest example did the opposite, which in a codebase that had broken every one of those rules hundreds of times was often.

Sorting the 60 by whether a static check could enforce them gave a clear split: most could. A rough grep showed what each one would cost:

| Rule | Existing violations |
|---|---|
| No default exports outside `pages/` | ~269 files |
| No barrel files | ~154 |
| Raw `<svg>` instead of the icon component | ~114 |
| `interface` instead of `type` | ~64 |
| Inline `style={{}}` | ~63 |
| TS `enum` | ~52 |
| Non-kebab-case filenames | 805 of 2,198 |

Those counts are why the rules were prose in the first place. Nobody turns on a rule that fails the build in 269 files.

## Ship every rule now, as counted debt

The way round that is to ship every rule on the same day, at one of two levels:

```js
"no-var": "error",                   // 0 violations: it can never come back
"import/no-default-export": "warn", // TODO: ~269 files. Fix, then promote to "error".
```

A rule with no violations goes in at `error` and can never regress. A rule with violations goes in at `warn` with its count in a comment, and gets burned down and promoted one line at a time. When a rule reaches `error`, its bullet comes out of `AGENTS.md`, because the prose no longer carries any weight.

> The wrong pattern shouldn't compile.

Every rule ends up in exactly one of three places: enforced, counted, or on a short explicit list of things that genuinely can't be checked ("avoid `useEffect` unless necessary", "match the surrounding patterns"). That list is the only part of the prompt that should still be about style. The risk to watch is that `warn` becomes a permanent parking lot, since CI usually ignores warnings. The count in the comment is what stops that, and only if review holds people to it.

## Traps on the way to flat config

None of this works on an old ESLint. Custom and scoped rules want flat config and current plugins, so the boring upgrade comes first and should land with no new rules at all, so that every new error is attributable to the upgrade. Four things are worth knowing before you start.

**One transitive bump will dominate.** The current Next.js ESLint config pulls in `eslint-plugin-react-hooks@7`, whose recommended preset adds 14 React Compiler rules at `error`. In our upgrade that was 219 of the 231 new errors. Ship them as warnings, and read them: the `set-state-in-effect` and `refs` findings are exactly the class of bug behind render loops.

**The raw number is not the work.** Flat config took the count from 0 errors to 546, but `import/order` and `prettier/prettier` accounted for most of it and were fully autofixable. After `eslint --fix` there were 13 left to fix by hand.

**Missing the TypeScript layer floods you with false errors.** Leave out `eslint-config-next/typescript` and the base `no-unused-vars` and `no-undef` run on TypeScript files: 1,027 and 239 errors that mean nothing.

**Rule options don't merge.** When two flat-config blocks set the same rule, the later one replaces the earlier one entirely. You cannot stack five scoped `no-restricted-imports` blocks and have them add up. Each new restriction has to join one consolidated block or become a small custom rule with its own name. A repo full of `local/*` rules isn't reinventing anything. It's working around this.

Also check what your docs claim is enforced. `no-non-null-assertion` left typescript-eslint's recommended set a few major versions ago, so a rule the team believed in had quietly stopped running.

## What the prompt is for

What's left for prose is what can't be expressed as a check: why a decision was made, which constraint rules out the obvious approach, what was tried and abandoned. For long agent-driven migrations I split even that in two. Markdown holds the reasoning, because "deferred because a shallow merge would wipe 40 keys" stops a real mistake where `status: DEFERRED` stops nothing. YAML holds the lookups an agent needs instantly: source and target paths, per-item status, temporary workarounds with a condition for removing them. Never put the same fact in both, because they drift.

This isn't a bet on models getting better at following rules. It removes the reason any contributor has to guess. The same change that stops an agent picking the wrong one of three modal patterns stops a new hire doing it, and it does both without anyone reading a word.
