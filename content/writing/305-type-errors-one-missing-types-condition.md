---
title: 305 type errors were one missing types condition
date: 2026-08-02T20:17:00+05:30
summary: Switching TypeScript to bundler module resolution turned a clean type-check into 305 errors across 52 files. The cause was one transitive dependency whose exports map had no types entry.
---

One line in a dependency's `package.json` produced 305 TypeScript errors across 52 files in our codebase, and it had been sitting there harmlessly for years. It only went off when the compiler started reading export maps.

I was moving a large Next.js dashboard onto Next 16. The type-check was clean. Then I ran a production build and Next printed this:

```
We detected TypeScript ... reconfigured your tsconfig.json for you.
  - moduleResolution was set to bundler
```

It doesn't ask, and there is no opt-out. Turbopack resolves modules the way a bundler does, so Next makes `tsc` resolve them the same way. That is reasonable. The previous big upgrade, to Next 15, had left our `tsconfig.json` untouched, so this was the first time the app had been type-checked under anything but the old `node` resolution.

Re-ran the type-check: 305 errors, 52 files.

## The wrong conclusion was right there

I grouped the errors. 93 were "property does not exist," 83 were "is of type `unknown`." A wall of `unknown` is what it looks like when type inference silently collapses somewhere upstream and everything downstream inherits the hole.

Then the file list: 48 of the 52 files imported jotai, our old state library, still on 1.x. So the obvious write-up was "jotai 1 doesn't survive bundler resolution, migrate to v2." That is a breaking, 48-file migration across most of the app. I almost wrote the ticket.

## Trace one value

Instead I picked a single error and followed it.

```ts
const details = useAtomValue(detailsAtom); // unknown
```

The atom was a focused atom:

```ts
const detailsAtom = focusAtom(formDataAtom, (o) => o.prop("details"));
```

`focusAtom` comes from `jotai/optics`, and its return type is computed through a separate library, `optics-ts`. So I opened `optics-ts@2.3.0`'s `package.json`:

```jsonc
"exports": {
  ".": {
    "import": "./dist/mjs/index.js",
    "require": "./dist/cjs/index.js"
  }
}
```

No `types` condition.

## Why it worked for years

Under `moduleResolution: "node"`, TypeScript ignores `exports` entirely. It walks the package directory the old way, finds `index.d.ts` at the package root, and everything types fine. The exports map might as well not exist.

Under `"bundler"` (and `"node16"`/`"nodenext"`), TypeScript obeys `exports`. If a package has an exports map, that map is the only way in. It looks for a `types` condition. Without one, it takes the JS target it matched and looks for a declaration file next to it, `./dist/mjs/index.d.ts`. Nothing there. The declarations at the root are now unreachable, because the exports map doesn't point at them.

So the chain went:

1. `optics-ts` resolves to no types, so it's implicitly `any`.
2. `focusAtom` can't infer its optic, so every focused atom becomes `Atom<unknown>`.
3. Every component reading one of those atoms gets `unknown`.
4. Every property access on `unknown` is an error. 305 of them.

It was never jotai. It was one transitive dependency two levels down with a gap in its export map, invisible for as long as the resolver didn't read export maps.

## The fix

The `optics-ts` 2.4.1 changelog: added `"types"` to exports. One line in `resolutions`:

```json
"resolutions": {
  "optics-ts": "2.4.1"
}
```

305 to 4.

The 4 leftovers were the same disease in cheaper clothes: deep imports into package internals that bundler resolution blocks because they're not in the exports map.

```ts
// blocked: not exported
import type { UseFormReturn } from "react-hook-form/dist/types/form";
// fine: the package root re-exports it
import type { UseFormReturn } from "react-hook-form";
```

One `react-hook-form` import and three `react-select/dist/declarations/*` imports. Every one of those types was already re-exported from the package root. Point at the front door instead of climbing in through `dist`. Clean.

## What I'd run first next time

The error count told me nothing about the number of problems. If anything it pointed the wrong way, because the files with the most errors were the ones furthest downstream from the cause.

What would have found it in a minute:

- `tsc --traceResolution` on one failing import, grepping for the package. It shows exactly which `exports` condition matched and which declaration file it went looking for.
- `npx @arethetypeswrong/cli --from-npm optics-ts@2.3.0`, or any other suspect. Flagging export maps that resolve to no types is exactly what it's for.
- Before flipping `moduleResolution` at all, a quick scan of `node_modules` for packages that have an `exports` field but no `types` key anywhere inside it. Most hits will be fine, because a `.d.ts` sits next to the JS target. The ones that aren't are your 305.

A short script for the last one:

```js
// find-untyped-exports.mjs
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = "node_modules";
const dirs = readdirSync(root).flatMap((d) =>
  d.startsWith("@") ? readdirSync(join(root, d)).map((s) => join(d, s)) : [d],
);

for (const dir of dirs) {
  const file = join(root, dir, "package.json");
  if (!existsSync(file)) continue;
  const pkg = JSON.parse(readFileSync(file, "utf8"));
  if (pkg.exports && !JSON.stringify(pkg.exports).includes('"types"')) {
    console.log(dir);
  }
}
```

It only looks at top-level packages, and it will flag packages that rely on sibling `.d.ts` files, which work fine. It is a list of suspects, not a verdict.

## The general rule

`node` resolution walks the filesystem and forgives everything. `bundler` resolution obeys export maps and forgives nothing. Every package that "worked" because TypeScript was ignoring its export map is a latent error, and the switch sends all of them off at once, multiplied by however many files infer types through them.

There's a small coda. A couple of months before this, I had tried bumping jotai to a newer 1.x minor and got 221 type errors that came in through its optics integration, and I backed off because the library was being phased out anyway. I never confirmed it, but I'd bet that was the same hole showing through a different door.

Count the files, then ignore the count and go find the root. It's almost never 48 problems. It's one problem wearing 48 coats.

Next I want to add the export-map scan to CI, so the next dependency that ships without a `types` entry fails a check instead of a migration.
