---
title: Build tools for the people who aren't engineers
date: 2026-07-21T16:14:00+05:30
summary: A design lab where designers build screens in real code, and a JSON playground where PMs and QA can see how a payload renders. Both are small, and both removed a queue.
---

Some of the most useful things I've built this year have no engineers as users. One is a folder where designers build screens in our real codebase instead of in Figma. The other is a playground where a PM or QA can paste a payload and see exactly how it renders. Neither one ships to production. Both removed a queue that used to run through me.

The pattern is the same in both. Find the question someone keeps asking an engineer, then build the smallest thing that lets them answer it without us.

## The design lab

A Figma file and the shipped screen disagree in small ways. A gap is off by a step, a colour gets eyeballed to the nearest token, and someone files a "spacing is off" ticket later. The handoff is a picture of code, so fidelity depends on whoever reads the picture.

The design lab makes the handoff real code. Designers cut a branch from `main`, build their screen in `src/design-lab/<project>/` using our real primitives and tokens, and push. A developer pulls the branch and moves the markup into the real module. Because the reference is real JSX built from the same components, token and spacing fidelity comes free.

The rules are deliberately loose:

- **No PR and no review gate.** The branch is a reference, like a Figma file. It never merges. That removes PR clutter, and it removes the quiet "will this pass review" tax that makes people design timidly.
- **No lint walls.** Instead of import restrictions, a nested `CLAUDE.md` in the folder steers the agent the designer is working with.
- **One-way street.** Design lab feeds real code, never the other way. Devs read the folder and never write into it. A `CODEOWNERS` entry gives it to the design team.

The nested file is short:

```md
You're in the design lab. Build whatever the designer asks: screens,
components, forms. Use only our primitives, tokens and icons, with static
mock data. Ignore the module-structure, API and state rules from the root
AGENTS.md. Nothing here ships. Optimize for visual fidelity, not architecture.
```

Soft guidance is fine here, and only here, because nothing in the folder ships. The developer who re-implements the screen is the enforcement layer. Everywhere else in the repo I want rules that fail the build. This is the one place where strictness costs more than it saves.

"No rules" breaks two things, and each needed a fix.

The lab has to live on `main` so every designer branch inherits it, but it can never reach production. The plumbing is merged once and the route is gated on `process.env.NODE_ENV !== "production"`. The screens themselves stay on branches.

The second problem is that screens have to show up with zero bookkeeping. A manual registry fails, because designers work alone and no dev will be around to fix a missing entry. So the index page uses webpack's `require.context` to find every `src/design-lab/**/screen.tsx`. Drop a folder in and it appears at `/design-lab`.

| Part | Owner | Lifecycle |
|---|---|---|
| Routing, index page, auto-discovery, nested `CLAUDE.md`, env gate | Dev | Merged to `main` once |
| `screen.tsx` + mock data per project | Designer | Lives on branches, never merged |

The blast radius is a folder no dev depends on and prod never serves. That's what makes it safe to have no rules.

## The playground

The second tool came from a different queue. One of our rendered documents is driven by a large JSON payload: a handful of required fields and 50-plus optional ones that switch layouts, callouts and states on and off. Every "why does this look wrong for this case?" question used to start with an engineer reproducing the case locally.

The playground is a small separate app. On the left there's a Monaco editor with a JSON payload. On the right, an iframe loads the real renderer from the main app on an embed route, and the parent sends it the payload over `postMessage` every time the JSON changes:

```ts
iframeRef.current?.contentWindow?.postMessage(payload, targetOrigin);
```

The embed page listens for the message and renders the document with the same component production uses. No real IDs, no seeded database, no deploy. Edit the JSON and the preview updates.

A gallery of fixtures makes it useful on day one. Each fixture is a JSON file plus a little metadata: a name, a status, some tags. The testing checklist covers 24 variations: cancelled, pending, multi-page, each ticket format, hidden callouts and so on. Anyone can pick the nearest one and tweak a field.

What changed is who can debug. PM, QA and backend engineers can take a payload, paste it in, and see for themselves how it renders. A backend engineer changing the schema can check the frontend result without asking anyone. It also made a later schema migration less scary, because checking a case no longer needed an engineer in the loop.

## What the two have in common

Both tools are cheap because they reuse production code instead of imitating it. The lab uses the real primitives. The playground uses the real renderer. If either one had re-implemented the thing it previews, it would drift and people would quickly stop trusting it.

Both also have a hard edge between "this is a sandbox" and "this ships." The lab is env-gated and never merged. The playground is a separate app that only talks to an embed route. Inside that edge you can be relaxed about rules. Outside it, you shouldn't be.

There are open questions. Static screens only, or interactive states like tabs and modals? Static is far cheaper to govern. Local `yarn dev` or a hosted dev container, so designers don't have to set up Node? I don't know yet. The second matters more than I expected, because setup friction is where non-engineers give up.

Next: getting a hosted environment working so a designer can open the lab without installing anything.
