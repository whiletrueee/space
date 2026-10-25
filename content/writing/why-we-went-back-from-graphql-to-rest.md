---
title: Why we went back from GraphQL to REST
date: 2026-09-03T11:26:00+05:30
summary: Our GraphQL layer answered HTTP 200 to every failure, and most of the odd code around it traced back to that. Removing it took ten days, deleted about 4,700 lines, and the last step was rm, not a rewrite.
---

Our GraphQL endpoint returned HTTP 200 when it failed. Every time. The failure lived in an `errors[]` array in the body, and nearly everything strange about the code around it traced back to that one fact.

So we removed it. The frontend I work on had two ways to talk to the backend: a GraphQL client and a plain HTTP client. Now it has one. The branch touched 220 files, +4,146 / −8,814, in 14 commits over 10 days. What I care about more than the line count is that the app compiled and could ship at every one of those commits, and that the final commit was mostly `rm`.

## What GraphQL actually was here

Not a graph, and not federated anything. Four parts:

| Part | Size |
|---|---|
| Hand-written `.graphql` documents | 488 lines, 28 operations |
| A committed copy of the backend schema | 1,437 lines |
| Generated TypeScript client | 2,392 lines |
| The transport | 133 lines |

You wrote a query, ran codegen, got a typed function, and every call went to `POST /api/graphql`. It was RPC with extra steps. The HTTP client already had the header builders the REST endpoints needed. Most of this migration was deleting a parallel transport, not building a new one.

The cost of all those 200s showed up in error handling. Permission denied was a string match on `"does not have permission"`. An expected conflict was a regex. Mutations returned `success: boolean` because the status code couldn't say it. The error helper had a branch for `status === 200`, which existed only because the GraphQL client created its unknown errors with status 200.

## The order is the whole trick

Strangler fig, six phases, each one safe on its own.

1. **Harden the pipe.** Four small changes to the HTTP client, zero call sites touched. It couldn't send a bare JSON array as a body, because `Record<string, any>` rejects one at compile time. It showed the user `undefined` when the framework rejected a request before app code ran, because those bodies carry `error: "Bad Request"` and no `message`. And I wrote a characterization test for one request header before anything moved. It caught a subtle change in how that header got overridden.
2. **Hand-write the types while the generated client still exists.** About 170 files imported generated types. 4,317 lines of generated output became 1,314 hand-written lines in 8 files. Both transports type-checked side by side, so removing GraphQL later was a delete, not a second migration.
3. **Evict type-only imports.** Some files imported the generated client just for an enum.
4. **Prune, don't delete.** Remove the dead operations from the `.graphql` files and regenerate. The client shrank from 2,393 to 1,685 lines on its own.
5. **Tidy.** Collapse 13 duplicated input types.
6. **Move the last four, then `rm`.**

Phase 2 worked because of one small choice: const objects plus a union type instead of TypeScript `enum`. The shape:

```ts
export const Status = { Draft: "DRAFT", Live: "LIVE" } as const;
export type Status = (typeof Status)[keyof typeof Status];
```

A TS `enum` is nominal, so a generated enum member is not assignable to a hand-written one. A union of string literals is structural. It accepts the generated member and a raw string off the wire. With two transports alive for a week, data crossed between them all the time, and real enums would not have compiled. The keys matched the names codegen had produced, so call sites didn't change either.

## Waiting is a valid state

Four operations had no safe REST version yet. The commit that moved the first 24 listed each holdout with a reason. One reason was ugly. The REST endpoint hardcoded one value of a source field, and both call sites passed other values. Migrating it would have validated records against the wrong rules. That is a correctness bug, not a compile error, and nothing would have caught it.

So we waited nine days for the backend to accept the parameter. Picking the work back up was trivial, because the commit message already said what was left and why.

> A migration where both transports run side by side for a week is normal. Design for it instead of fighting it.

## What REST changed, and what it dug up

Most of the 220 files were mechanical. Drop the operation-name envelope (`data.getOptionSchedules` becomes `data`), re-indent the fixtures, swap mock handlers from `graphql.query(name)` to `rest.get(route)`. The parts that needed thought fit in maybe 15 files.

- `success: boolean` became dead weight. Over REST, reaching the next line means it worked.
- The error helper lost three of its four branches. HTTP status is the discriminator, and `errorCode` is optional metadata that may not be there. A 5xx still falls back to generic copy, because an unhandled server fault puts a Java stack trace in `message`.
- The GraphQL client had shown permission toasts centrally. The HTTP client has no equivalent, so that moved to the call sites that need it.
- One endpoint answers with `updated + inserted`, so the response order doesn't match the request order. The UI kept those rows keyed by array index. Reading the response by position would move a note onto a different row and save it there on the next submit. The old code was already wrong. REST just made it visible. We match by id now.

Running codegen for the first time in a while found two more problems. The codegen command had been broken for everyone, from a ts-node versus `moduleResolution: "bundler"` clash. And the committed client was stale: a field had become nullable on the backend, and leaving it out used to silently deactivate the record. A generated file in the repo is a cache. If the command that regenerates it is broken, nobody finds out.

One habit from this is worth stealing. A test folder had been in Jest's ignore list for a month, which meant my new header test was never discovered. I un-ignored it: 22 suites and 130 tests went red. I measured the same thing on the commit before any migration work and got identical failures. Then I re-ignored it so CI stayed green. The un-ignore was a measuring instrument, not a change. Flip the flag, take the reading, flip it back, and put the number in the commit message.

The final delete took the GraphQL folder, the transport, the codegen config, a path alias and seven packages. `yarn.lock` lost 1,762 lines, about 192 packages net, including a whole Babel and Relay tree that only codegen needed.

Don't count the diff. 220 files sounds terrifying. Most of it was re-indentation.

Next: the error-state matrix we tested against, one row for each status code.
