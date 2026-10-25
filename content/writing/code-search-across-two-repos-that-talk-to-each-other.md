---
title: Your code graph can't see across the API
date: 2026-10-06T04:02:00+05:30
summary: A frontend and the backend it calls share no imports, so every code graph sees two islands and every cross-repo question gets half an answer. The fix is to make the contract itself a node.
frame: 019
tone: "#2c614b"
focus: 50%
---

Ask a code-search tool "what breaks if I change this endpoint?" and it will find the handler, its callers inside the backend, and nothing in the frontend that actually uses it. That is not a retrieval bug. A TypeScript frontend and the Kotlin backend it calls share no imports, so to any graph built from imports and calls they are two separate islands. What connects them is a string: a URL in an HTTP call on one side, and the same path in a `@GetMapping` annotation on the other.

When a question crosses that boundary, which the useful ones do, retrieval returns half the answer and the model fills in the other half with confidence. The fix is to stop treating the contract as an absence and give it a node.

## Make the contract a node

There are three kinds of bridge between a frontend and a backend, and they differ in how much you can trust them:

| Bridge | Frontend side | Backend side | Edges found |
|---|---|---|---:|
| REST route | an HTTP call with a resolved URL | a route handler annotation | 258 |
| GraphQL field | a field in a `.graphql` operation | a Query or Mutation resolver | 27 |
| Shared model | a type named X | a class with the same name | 148 |

For routes and GraphQL fields, both sides connect to the bridge node rather than directly to each other. That keeps the edge honest, because this is a contract and not a call, and it gives a graph walk somewhere to ask who else depends on the same route.

Across two real repos this produced 208 backend routes and 30 GraphQL fields as bridge nodes. 125 routes had at least one frontend caller, and every GraphQL field the frontend used matched. Most frontend URLs that matched nothing went to other services entirely, which is itself useful to know.

Shared models are the weak bridge, since they match on type name alone. That works when both sides follow one naming convention for API shapes, and would be noisy where they don't.

## Resolving the URL is the real work

Backend routes are easy, because annotations hold literals. Frontend URLs are built, and callers come in three shapes:

```ts
httpClient.get("/api/v1/x");                          // inline literal
httpClient.get(`${SCHEDULES_ENDPOINT}/${id}/draft`);  // template on a constant
httpClient.post(CLOSURES_ENDPOINT, closure);          // constant passed directly
```

The second and third need import resolution: follow the constant to the file that defines it, take its value, and keep going through nested templates and object members. Two details matter. A bare `const X = "/api/…"` is a definition, not a caller, or every constants file will look like it calls every endpoint. And path parameters have to be normalised on both sides, so that `${id}` in a template and `{id}` in an annotation meet at the same node.

The verb is where this stays imperfect. When a URL is built in one place and fetched in another, the method isn't visible from the URL. Defaulting to GET when a GET route exists is right most of the time and wrong sometimes, and a tool built this way should say so rather than hide it.

The rest is ordinary and fast. tree-sitter parses TypeScript and Kotlin into symbols, SQLite holds the graph and a full-text index, and a local embedding model handles vectors. A full build over both repos, 4.2k files, 31k symbols and 98k edges, takes about 11 seconds, and an incremental update from `git diff` produces the same edge set as a full rebuild.

## Walk the graph by what was asked

Bridges only help if retrieval uses them, and different questions need different walks:

| Question | Walk |
|---|---|
| Where is X? | both directions, depth 1 |
| What breaks if I change X? | incoming edges only, depth 3 |
| Trace X end to end | calls, renders, HTTP and GraphQL edges, depth 3 |
| How do these two parts interact? | depth 2, plus bridges whose topic matches the question |

Impact walks only incoming edges, because the question is what depends on this. Every walk gives cross-repo edges a bonus, because those are exactly the edges a person forgets to check. Seeds come from exact names, literal grep, keyword search and vectors, merged with reciprocal rank fusion.

> One round of retrieval fixes moved MRR from 0.38 to 0.61 without touching the model.

That came from a 14-question eval with ground truth checked by hand against `rg`. Stemming, dropping repository names from keywords, and seeding interaction questions with matching bridges took recall in context from 0.74 to 0.83, and literal grep for header-like strings took it to 0.89. Every impact and trace question reached full recall. The remaining misses were "where is" questions that named a concept but no identifier, which is a vocabulary problem, not a graph one.

## Where to put it

Retrieval takes about 110 ms. A local 7B model answering on top of it took around 35 seconds, more than 99% of the total. So the chat window was the wrong product. The useful form is a small server that any coding-agent session can query, so the agent you already use gets the cross-repo graph and keeps its own model.

The weak spot left is call resolution by name rather than by type. Calls through dependency-injected receivers and local variables fall back to unique-name matching, which is fine for most questions and not good enough for "show me every caller". Type-checked indexers close that gap. The bridge idea doesn't depend on them: any two systems that talk through strings, whether routes, queue topics or event names, can be joined the same way.
