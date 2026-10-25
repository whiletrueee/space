---
title: Code search across two repos that talk to each other
date: 2026-10-06T04:02:00+05:30
summary: A frontend and its backend share no imports, so a code graph sees two islands. I linked them through REST routes, GraphQL fields and shared type names, and that link is what made cross-repo questions answerable.
frame: 019
tone: "#2c614b"
focus: 50%
---

A TypeScript frontend and the Kotlin backend it calls share no imports. To a code graph they are two islands. What connects them is a string: a URL in an HTTP call on one side, and the same path in a `@GetMapping` annotation on the other.

I built a small local index over both repos to answer the questions I actually ask. What breaks if I change this? How does this page talk to the backend? Trace this feature end to end. Each of those questions crosses the boundary. Without a link across it, retrieval finds half the answer, and the model confidently makes up the other half.

## Make the string a node

The fix is to turn the contract into a node of its own. There are three kinds of bridge:

| Bridge | Frontend side | Backend side | Edges |
|---|---|---|---:|
| REST route | an HTTP call with a resolved URL | a Spring `@*Mapping` handler | 258 |
| GraphQL field | a field in a `.graphql` operation | a graphql-kotlin Query or Mutation function | 27 |
| Shared model | a type named X | a class with the same name | 148 |

For routes and GraphQL fields, both sides connect to the bridge node, not directly to each other. That keeps the edge meaning honest: this is a contract, not a call. It also gives the graph walk a place to ask who else is on this route.

On the main branch, that gave 208 backend routes and 30 GraphQL fields as bridge nodes. 125 routes have at least one frontend caller, and all 27 GraphQL operation fields in the frontend matched. Most frontend URLs that didn't match go to other services entirely: a maps API, a separate account service and a language tool.

Shared models are the crude bridge. They match on the type name alone. That works here because both sides use the same naming convention for API shapes. In a less disciplined pair of repos, I'd expect it to be noisy.

## Resolving the URL is the hard part

Backend routes are easy, because annotations hold literals. The frontend is where URLs get built. Callers show up in three forms:

```ts
httpClient.get("/api/v1/x");                          // inline literal
httpClient.get(`${SCHEDULES_ENDPOINT}/${id}/draft`);  // template on a constant
httpClient.post(CLOSURES_ENDPOINT, closure);          // constant passed directly
```

The template form needs import resolution. Follow `SCHEDULES_ENDPOINT` to the file that defines it and take its value, including nested `${BASE}` and `OBJ.KEY` members. A bare `const X = "/api/…"` counts as a definition, not a caller. Otherwise every constants file would look like it calls every endpoint.

The verb is the weak spot. When a URL is built in one place and fetched in another, I can't see the method, so the resolver defaults to GET if a GET route exists. That's wrong sometimes, and I know it.

The rest is ordinary. tree-sitter parses TS, TSX and Kotlin into symbols, and a regex handles the GraphQL operations. SQLite holds the graph and an FTS5 index. LanceDB holds embeddings from a local code embedding model. A full parse and graph build over both repos (4.2k files, 31k symbols, 98k edges) takes about 11 seconds. An incremental update from `git diff` produced an edge set identical to a full rebuild.

## Walk the graph by intent

Links don't help if retrieval never uses them. Each question is classified into an intent, and each intent has its own walk:

| Intent | Triggered by | Walk |
|---|---|---|
| locate | where, which | both directions, depth 1, cross-repo ×1.6 |
| impact | break, affect, who uses | incoming edges only, depth 3, cross-repo ×1.5 |
| trace | trace, end-to-end, flow | calls, renders, http, gql; depth 3, cross-repo ×1.6 |
| interaction | interact, between, contract | depth 2, cross-repo ×2.0, plus bridge seeds |

Impact walks only incoming edges, because the question is what depends on this. Every intent gives cross-repo edges a bonus, because those are the edges a person forgets to check. Retrieval seeds come from exact names, literal grep, BM25 and vectors, fused with reciprocal rank fusion. Interaction questions also get "bridge seeds": contracts whose topic matches the question.

> One round of retrieval fixes, bridge seeds included, moved MRR from 0.38 to 0.61 without touching the model.

That's from a 14-question eval with ground truth checked against `rg`:

| Change | Recall in context | MRR |
|---|---:|---:|
| Baseline: exact + BM25 + vector + graph | 0.74 | 0.38 |
| + stemming, repo names dropped from keywords, bridge seeds | 0.83 | 0.61 |
| + literal grep for header-like strings, locate tuning | 0.89 | 0.61 |

Every impact, trace and explain question reached recall 1.00. The misses were locate questions that named a concept but no identifier.

Retrieval p50 is 109 ms. The local 7B model takes about 35 seconds, more than 99% of the total, with about 4.7k tokens of context. So the useful form turned out not to be the chat. It's an MCP server, so any coding-agent session can ask the graph about both repos with whatever model it already has.

What it still gets wrong: call resolution is name-based, not type-checked. Kotlin calls resolve through dependency-injected receivers, and calls on local variables fall back to unique-name matching. That's fine for most questions and not good enough for "show me every caller".

Next: SCIP indexers for exact references, and a Kafka-topic bridge for the edges that aren't HTTP.
