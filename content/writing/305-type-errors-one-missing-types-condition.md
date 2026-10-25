---
title: 305 type errors from one missing line in a dependency
date: 2026-08-02T20:17:00+05:30
summary: Switching TypeScript to bundler module resolution turned a clean type-check into 305 errors across 52 files. All of them came from one transitive dependency with no types entry in its exports map. Here is how to find yours in a minute.
frame: 024
tone: "#9e9d9d"
focus: 72%
---

Every package that has been type-checking fine only because TypeScript ignored its exports map is a latent error in your project. Switch `moduleResolution` to `bundler`, and they all go off at once, multiplied by every file that infers a type through them. Next.js 16 makes that switch for you on the next build, with no opt-out, because Turbopack resolves modules the way a bundler does and `tsc` has to agree with it.

On a large Next.js app with a clean type-check, that switch produced 305 errors across 52 files. One line in one dependency, two levels down, caused every one of them.

## Two resolvers, two rules

Under `moduleResolution: "node"`, TypeScript ignores `exports` entirely. It walks the package directory the old way, finds an `index.d.ts` at the root, and types everything. The exports map might as well not be there.

Under `bundler`, and under `node16` and `nodenext`, TypeScript obeys `exports`. If a package has an exports map, the map is the only way in. TypeScript looks for a `types` condition, and if there isn't one, it looks for a declaration file next to whichever JS file the map points at. If that file doesn't exist either, the package has no types at all, even when its declarations are sitting at the root, because nothing in the map leads to them.

Here is the map that did it, from `optics-ts@2.3.0`:

```jsonc
"exports": {
  ".": {
    "import": "./dist/mjs/index.js",
    "require": "./dist/cjs/index.js"
  }
}
```

No `types` condition, and no `.d.ts` beside `./dist/mjs/index.js`.

## Why the count points the wrong way

The errors didn't mention `optics-ts`. 93 said "property does not exist" and 83 said "is of type `unknown`". 48 of the 52 files imported the state library that used `optics-ts` internally, which pointed straight at a 48-file migration to its next major version. That would have been a breaking change across most of the app, and it would not have fixed anything.

A wall of `unknown` means inference collapsed somewhere upstream and everything downstream inherited the hole. The chain here was four steps long:

1. `optics-ts` resolves to no types, so it becomes `any`.
2. The library's `focusAtom` can't infer its optic, so every focused atom is `Atom<unknown>`.
3. Every component reading one of those atoms gets `unknown`.
4. Every property access on `unknown` is an error.

The files with the most errors are the ones furthest from the cause. The error count measures how far the hole spread, not how many problems you have.

> It's almost never 48 problems. It's one problem wearing 48 coats.

The fix was a patch release. `optics-ts` 2.4.1 added `"types"` to its exports, one line in `resolutions` pinned it, and 305 errors became 4. Those 4 were the same rule in a smaller form: deep imports into package internals, like `react-hook-form/dist/types/form`, that bundler resolution blocks because they aren't in the exports map. Every one of those types was already re-exported from the package root.

## Find yours before the switch

Three checks, in the order I would run them now.

**Scan for exports maps with no types condition.** Before changing `moduleResolution`, list every installed package that has an `exports` field and no `types` key anywhere in it:

```js
// find-untyped-exports.mjs
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = "node_modules";
const dirs = readdirSync(root).flatMap((d) =>
  d.startsWith("@") ? readdirSync(join(root, d)).map((s) => join(d, s)) : [d],
);

for (const dir of dirs) {
  const file = join(root, dir, "package.json");
  if (!existsSync(file)) continue;
  const pkg = JSON.parse(readFileSync(file, "utf8"));
  if (pkg.exports && !JSON.stringify(pkg.exports).includes('"types"')) console.log(dir);
}
```

It is a list of suspects, not a verdict. Most hits are fine, because a `.d.ts` sits next to the JS file the map points at. It also only sees top-level packages, so nested copies need a deeper walk. The suspects worth chasing are the ones your own types flow through.

**Check a suspect properly.** `npx @arethetypeswrong/cli --pack` inside a package directory, or the web version at arethetypeswrong.github.io for a published version, reports exactly which resolution modes find no types. It exists for this problem.

**Trace one failing import.** If you have already switched and are staring at a wall of `unknown`, pick one error and run `tsc --traceResolution` filtered to the package you suspect. It prints which exports condition matched and which declaration file TypeScript went looking for. Following one value back to its source took minutes. Reading the error list would have taken a week.

Run the scan in CI as well. The next dependency that ships an exports map without types should fail a check, not turn into a migration.
