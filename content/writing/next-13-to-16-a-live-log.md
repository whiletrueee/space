---
title: Next 13 to 16, a live log
date: 2026-08-03T23:42:00+05:30
summary: A running diary of dragging a large Pages Router dashboard from Next 13.5 and React 18 up to Next 16, React 19 and Turbopack. Written while shipping, timestamps and all.
---

This is a log, not a guide. I kept it open in a second window while dragging a large Next.js dashboard from Next 13.5 and React 18 up to Next 16 and React 19, one rung at a time. Pages Router, 60 routes, an internal design-system package, and a lot of dependencies nobody had looked at since 2023. Rules: timestamps, no filler, ship first, apologise later.

## Rung 1: Next 13.5 to 14.2

**11:42pm.** The app has been sitting on Next 13.5 like it's still 2023. The plan says start easy: 13.5 to 14.2, no React change, just deprecation warnings. Easy step. Famous last words.

**11:48pm.** First thing, the codemod the internet swears by: `npx @next/codemod@14.2.35 upgrade 14`. It laughs at me. `Invalid transform choice`. Turns out `upgrade` isn't a command in 14.2.35. It parsed "upgrade" as a transform name and "14" as a file path. The interactive `upgrade` flow only exists on `@latest`. So the version I pinned is exactly the version that can't do the thing. Cute.

**11:55pm.** Fine. Run one transform by hand, `next-og-import`. It refuses because the git tree is dirty. Add `--force`. It "processes" 2125 files and hands back `1699 errors`. My heart does a thing.

**12:01am.** It's fake. Every "error" is jscodeshift's old parser gagging on modern TypeScript: `satisfies`, const type params. It can't read our code and calls that an error. The transform was pointless anyway; it rewrites `ImageResponse` imports for the App Router, and we're Pages Router. Nothing changed.

Lesson: don't run codemods à la carte. Run the real `upgrade` on `@latest` and let it fire only the transforms that matter.

**12:20am.** Bumped Next to 14.2. `yarn build`. There it is:

```
./node_modules/<our design-system package>/dist/chunk-6EGEBILV.jsx
Module parse failed: Unexpected token (34:9)
> return <Element
```

Webpack can't parse JSX. In our own design system. On a version bump that "doesn't touch React."

**12:34am.** The design-system package ships untranspiled `.jsx` in its `dist`. The only reason it ever worked is `next-transpile-modules` was running it through the loader. And `next-transpile-modules` is dead on Next 14. It hooks internal webpack config that changed, so it just silently stops. No error. It quietly does nothing and lets raw JSX walk straight into the loader, which dies.

So the failure isn't React, isn't the codemod, isn't the design system. It's a dead shim pretending to be alive.

**12:41am.** Three edits: kill the `withTM` require, add the package to `transpilePackages`, unwrap `withPWA(withTM(nextConfig))`. `transpilePackages` has been native since 13.1, so this is where it always should have lived. The plan assumed the shim breaks at 15. It breaks at 14.

**12:49am.** `Done in 237.50s.` Green. One down.

## Rung 2: Next 14.2 to 15

**2:10am.** Bumped to 15. The build gets further, then face-plants with two errors that don't belong in a Pages Router app:

```
./src/modules/authentication/utils/auth.ts
× You have a Server Component that imports next/router. Use next/navigation instead.

./src/services/logger/logger.tsx
× You're importing a component that needs `useEffect`. ... mark ... with "use client".
```

Server Components? We don't have an `app/` directory.

**2:22am.** It's `middleware.ts`. In 15 the middleware's whole module graph is compiled under the edge ruleset, no client-only code allowed. Our middleware innocently imports two things that drag half the client in with them: `auth.ts`, which imports `next/router` at the top, and the logger, whose file also holds a small component with a `useEffect`. The middleware only wants one pure redirect helper and `logger.captureException`. But an import is an import.

**2:40am.** Fix is decoupling, not hacks. Move the `useEffect` component into its own file, and do not re-export it through the logger barrel, or it crawls back into every consumer's graph. Pull the two pure auth helpers into an edge-safe file with zero `next/router`, and have `auth.ts` re-export them so nothing else changes.

**3:05am.** `Done in 59.47s.` Both errors gone. Freebie: the middleware bundle dropped from 252kB to 189kB, because it's no longer carrying code it never used.

**Later. Committed already. Feeling good.** Click around before moving on. `/login`: white screen. Everything else works.

**A minute in.** Of course it's `/login`. It's one of the exact routes the middleware matches, the middleware I rewrote an hour ago. So obviously I broke it with the split. That's the story that writes itself.

**Ten minutes in.** `curl` says HTTP 200. But the body is zero bytes. No `Content-Type`. The dev log never prints `Compiling /login`. A 200 with no body is the most annoying kind of broken: everything says it's fine.

**Fifteen minutes in.** Strip the middleware down to the dumbest possible thing:

```ts
export async function middleware() { return NextResponse.next(); }
export const config = { matcher: ["/login/"] };
```

No auth, no logger, no imports. Still blank. So it's not my refactor.

**Twenty minutes in.** Brute-force the matcher:

```
["/login/"]  → 200, 0 bytes      ← blank
["/login"]   → 200, 10474 bytes  ← works
```

The trailing slash. With `trailingSlash: true` in the config, Next 15 chokes when the matcher also has a trailing slash, and `NextResponse.next()` silently returns nothing. Drop the slash and it still matches `/login/` requests. Next 14 shrugged this off.

One-character fix. If I'd trusted the story that wrote itself, I'd have spent an hour re-reading a perfectly fine edge split. Strip to the dumbest repro, always.

## Rung 3: Next 15 to 16, React 19

**9:15pm.** The big one. 16 forces React 19, so this is two bumps at once. Two decisions up front. `next-pwa` is archived upstream and is a webpack plugin, so Turbopack can't run it even if I wanted to. And 16 makes Turbopack the default. I could pin `--webpack` and change nothing. No. Our webpack config only does two things, a `DefinePlugin` and one alias, so port them and drop webpack for real.

**9:24pm.** You don't rip out a shipped feature on a hunch, so I checked who actually depended on the PWA. Almost nobody, and nothing in it was offline-first: every feature needs the network anyway, and no React code touches a service-worker API. `next-pwa` was only ever the packaging. Gone.

**9:32pm.** Edits in: Next 16, React 19, `images.domains` to `remotePatterns`, the `DefinePlugin` constant moves to `env`, the alias becomes `turbopack.resolveAlias`. Also, 16 removed `next lint`. Just deleted the command out from under everyone. Rewire the scripts to call `eslint` directly, and don't get dragged into a flat-config migration in the same PR. One climb at a time.

**9:50pm.** Type-check: 72 errors. Expected. React 19 killed the global `JSX` namespace and made `useRef()` require an argument. Don't hand-fix 72 things; run `types-react-codemod preset-19 --yes`. 26 files rewritten. 72 to 13.

**10:04pm.** 8 of the 13 are react-select: `cannot be used as a JSX component`. Bump react-select. Still 8. Open its `.d.ts` and there's the tell: its components return `@emotion/react`'s `JSX.Element`, not React's. Our pinned emotion predated React 19. Pin a newer emotion in `resolutions`. All 8 vanish. The library breaking wasn't either one I was looking at.

**10:20pm.** Stragglers: a story that does `export const ButtonGroup = () => <ButtonGroup>…`, shadowing its own import and rendering itself recursively. React 19 types caught a bug that was always there. And a missing `key` in an early return inside a `.map`. Type-check clean. Feeling smug. That lasted eleven minutes.

**10:31pm.** `yarn build`. Turbopack compiles, then:

```
We detected TypeScript ... reconfigured your tsconfig.json for you.
  - moduleResolution was set to bundler
```

Next 16 doesn't ask. Re-run the type-check: 305 errors, 52 files. From zero.

**10:44pm.** 48 of the 52 files import jotai, so the lazy conclusion is "jotai 1.x is dead under bundler resolution, migrate to v2." A breaking, 48-file migration. I almost wrote it up as exactly that. Keep pulling the thread instead.

**11:09pm.** It was one transitive dependency missing a `types` condition in its exports map. One patch bump: 305 to 4. That one gets [its own post](/writing/305-type-errors-one-missing-types-condition/).

**11:26pm.** Build, round two. Two failures at once. One:

```
Module not found: Can't resolve './Users/.../@radix-ui/react-slot/dist/index.js'
server relative imports are not implemented yet.
```

My own doing. The alias used `require.resolve(...)`, which returns an absolute path. That's the webpack trick. Turbopack read it as relative and glued `./` on the front. And `resolutions` already pins that package to one copy, so the alias was solving a problem that no longer existed. Delete the block.

**11:33pm.** Two: the edge ghost from Rung 2 is back. A utils file pulled into the middleware imports `NextRouter`, but only uses it as a type. `import type { NextRouter }`. One keyword.

**11:41pm.** Round three. Compiles, then dies collecting page data:

```
Failed to load external module @react-google-maps/api:
TypeError: Cannot read properties of undefined (reading 'ReactCurrentOwner')
```

`ReactCurrentOwner` is a React internal that 19 deleted, and the old maps library reaches for it at module load. No type-check could catch that. Bump it.

**11:47pm.** `Done in 32.63s.` Turbopack production build, React 19, no webpack, no PWA, no `next lint`. 16 wants `middleware.ts` renamed to `proxy.ts`, but that flips the runtime from edge to node, so it gets its own PR.

## Rung 4: Storybook 7 to 10

**Fresh session.** Storybook 7 can't build on Next 16 at all. The plan said "upgrade to 8." The plan was stale: 8 and 9 both cap at Next 15. Only 10 claims Next 16. So it's three majors in one hop.

`npx storybook@10.5.5 upgrade --yes` refuses with a false positive: "Next.js 14.1 support removed." It's misreading our 16. `--force`. Nine automigrations fire.

The trap: it quietly switched the framework to the Vite builder. Looks modern. But our Storybook config has a `webpackFinal` hook that forces the design-system package through a loader, because it ships untranspiled JSX. The Rung 1 ghost, still not exorcised. Under Vite that hook doesn't run, and nothing would error until components exploded at render. Reverted to the webpack builder. The load-bearing hack stays load-bearing.

`build-storybook`: exit 0, about 21s. Last rung of the build. Not the last rung.

## Rung 5: Local green is not CI green

**Push.** The pipeline lights up red in places my machine never warned me about.

**Node engines.** `yarn install` dies on CI: a transitive ESLint package wants Node `^20.19 || ^22.13 || >=24`, CI has 20.16. Pin it, the next one surfaces: a testing-library release wants 22. Yarn stops at the first incompatible module, so every fix reveals the next. The pattern is the message. Bump Node to 22.19 everywhere: workflows, the Dockerfile, `engines`, a new `.nvmrc`. One honest bump instead of ten cowardly pins.

**The OOM.** Type-check and lint both run out of heap on the runner. First instinct: bump the heap on both. Then the question I should have asked first: why is lint running `tsc` at all? Because the lint script was `yarn check-types && eslint …`. So `tsc` ran three times per PR: in lint, in the type-check job, in `next build`. Strip it from lint. Lint lints now.

**Does tsc really need the memory?** Measure, don't assert. `--extendedDiagnostics`: 6,551 files, 1.25M types, 3.3GB peak. And the free win hiding in there: `exclude` was just `node_modules`, and a greedy `**/*.js` include was sweeping in 833 files of built Storybook output plus `coverage/`. Exclude build output. 3.3GB to 2.4GB, 22% faster. One line.

**Lighthouse.** The slowest job, and it kept OOMing. Before nursing it back: does it earn its keep? Every assertion in its config is `"warn"`. In `lhci autorun`, warn can't fail the run. A 10/100 passes. It goes red for the wrong reasons and never the right ones. Deleted.

**The date that broke a test.** A date-filter test fails, byte-identical to `main`. Passed on Jul 31, fails on Aug 2. It picks yesterday off the real clock, and so does the date picker. They agree every day until the calendar lands somewhere the picker renders differently. Mocking our own `getToday` made it worse: four more tests broke, because now the test and the picker disagreed about what day it was. The real chokepoint is `today()` from `@internationalized/date`, which both read. Freeze that. Deterministic forever.

Half of what went red was environmental, and the best fix twice wasn't the one I reached for: not "bump the heap" but "stop running tsc three times," not "fix Lighthouse" but "it was never a gate."

## Rung 6: The worker that wouldn't die

**Local, eyeballing the app.** The console is bleeding `503` on images. I just migrated `images.domains` to `remotePatterns`, so of course I broke images. Story writes itself. Again.

**Wrong again.** A `remotePatterns` mismatch returns 400. Nothing in the image pipeline mints a 503. Something is sitting between the page and the network.

**That's a service worker.** The `next-pwa` output, `sw.js` plus its workbox sidecar, was gitignored but still sitting in my `public/`, and `next dev` serves `public/` verbatim. My browser had registered it weeks ago and was still routing every fetch through it. Delete, unregister, reload. Fixed locally in five minutes.

**Then the real question.** What happens in prod? The old config registered the worker for every production user. And when we deploy, `/sw.js` 404s, and a 404 does not unregister a service worker. The browser keeps the last one it installed. Every user would keep running dead workbox against the new build: stale chunks, 503s, maybe frozen on the old app shell forever.

> You don't kill a service worker by deleting it. You kill it by replacing it.

Ship a real `sw.js` at the same path that, on activate, clears every cache, calls `self.registration.unregister()` and reloads open tabs. Each browser's routine update check fetches it, installs it, and it self-destructs. Two caveats: don't serve `/sw.js` with a long cache, and idle tabs only clear on their next navigation.

Removing a feature is not the same as removing its residue in the field. The build forgot about `next-pwa` the moment I deleted the config. Every browser that had loaded the app did not.

## Rung 7: The 404 that wanted to be Rung 6

**Fresh session.** Storybook console: one `404`, no URL. After six rungs my pattern-matcher is trained. Something in `public/` rising from the dead, obviously the worker again.

A service worker is bound to its origin. The app is on `:3000`, Storybook on `:6006`. It can't reach across the port, and nothing in Storybook registers it anyway. Fonts come from a third-party CDN, so they'd fail as network errors, not same-server 404s. `ls public/`: no favicon. Storybook asks for one on load. 404, every time, harmless.

Six rungs of "it's never the thing you changed, dig for the root." And the seventh root is a browser asking for a favicon that isn't there. The reflex that saved me a 48-file migration is the same reflex that would have had me hunting a ghost across a port it can't cross. Usually distrusting the dramatic read means dig deeper. Once in a while it means it's the favicon, go home.

Next up: `middleware.ts` to `proxy.ts`, and finding out what the edge-to-node runtime flip breaks.
