---
title: Measure before you build primitives
date: 2026-10-22T08:47:00+05:30
summary: I parsed every flex and grid block in a large dashboard before designing layout components. The data picked five primitives, then a closer look cut it to three and a prop.
frame: 026
tone: "#3f4621"
focus: 50%
---

Our dashboard has 1,515 places that set `display: "flex"`, spread over 605 files. It has zero layout primitives. Every one of those blocks was designed by hand, and an agent asked to build a new screen designs the 1,516th by hand too, with a slightly different gap.

The obvious fix is to ship `Stack` and `Inline` like every design system does. I wanted to know which primitives first, and how many, before adding names people would have to choose between. So before writing a component I parsed the layout code.

## What the code actually does

I pulled out 1,589 flex and grid blocks and grouped them by what they do: direction, alignment, justification, gap, wrap, grow. The long tail turned out to be much shorter than it looks when you scroll through the repo.

| You'd write | Count |
|---|---|
| column + gap / column only | 444 / 110 |
| row + center (+ gap) | 144 / 182 |
| row + gap, top-aligned | 128 |
| row + space-between | 124 |
| row + center + justify center | 91 |
| row + wrap | 26 |
| `flex: 1` / `ml: auto` / `auto 1fr` | 248 |
| grid (+ gap) | 49 |

About 1,400 of the 1,589 blocks, roughly 88%, fit five shapes: a vertical stack, a horizontal row, a column split, an equal grid, and a centred box. The first plan was those five: `Stack`, `Inline`, `Columns`, `Grid`, `Center`.

Two other numbers changed the API more than the shapes did.

**1,147 of the flex blocks live in `css()` style objects, and 442 are on a `<Box>`.** A JSX-only API would miss about 72% of the real code. So each primitive is a `cva` recipe exposed two ways: as a component, and as a class function you can compose into an existing styles object.

```ts
cx(inlineLayout({ gap: "related" }), styles.header)
```

**Gap values were a mess.** Four raw spacing steps did most of the work, about 70 gaps were raw px or bare numbers, and our job-named gap tokens (`related`, `grouped` and so on) were used zero times in feature code. So `gap` is required on every primitive, with `"none"` allowed. You have to pick a job. You can't forget the gap.

## Then the data cut it to three

The five-primitive plan lasted a day. Looking more closely at the same numbers removed two of them.

`Center` went first. The 91 "centre this" rows are just `Inline justify="center"`, and 44 more are vertical, so they're a `Stack`. A whole component for something a prop already does is one more name to choose wrongly.

`Columns` went next. I'd built it for the 213 `flex: 1` sites, assuming they were sidebar-and-content rows. About half of them actually fill vertically: a panel that takes the remaining height. A row-only `Columns` doesn't fit those at all. There were only about 10 real `auto 1fr` templates. So `Columns` became a `grow` prop on every primitive, plus a `growLayout()` recipe for children that aren't layout components.

The final set is `Stack`, `Inline`, `Grid` and `grow`. `Flex` stays as an internal escape hatch, and every use needs a `// layout:` comment saying why.

> The research said five. The same research, read more carefully, said three.

Responsive behaviour got the same treatment. I didn't want `{ base, md, lg }` objects everywhere, because they multiply classes and invite one-off values. Real-user monitoring showed about 9% of our users outside the office are on phones, and internal users effectively never are. That justifies one switch, `collapseBelow: "md" | "lg"`, and nothing more.

## Borrowing other people's mistakes

I read the major public design systems before deciding. The useful lessons were mostly about what they removed.

- Atlassian has a `use-primitives` lint rule that pushed everything toward their layout components. They cut it back to `Box`-only, then deleted it. Their token lint survived. So I'm not shipping a broad "use primitives" rule, only a narrow one: in migrated folders, flag gaps that aren't job tokens and hand-rolled `display: flex`.
- Braid makes `Stack` space required, removed its `dividers` prop in favour of putting a divider in as a child, and handles responsiveness with a single `collapseBelow`. I took all three ideas.
- Primer uses named gap values instead of numbers, and Polaris's newer components moved from numeric to named.

The CSS tooling needed a spike of its own. Panda's built-in patterns had 23 generated and 0 used, and custom patterns had several problems. Imports from the wrong path produced no CSS. Patterns match JSX by tag name, so our own `<Flex wrap>` was already emitting a nonsense `flex-wrap: true` rule. A plain `cva` recipe emitted every variant with no config changes. That settled it.

## Is it worth it?

I measured what I could:

- **Types.** The recipe rejects `gap: "8px"`, raw spacing tokens and unknown props. The current code accepts `gap: "13px"`, `"space-betwen"` and `"centre"` without a complaint.
- **Less code.** On 6 real sites, 460 characters became 210, 55% less. I wrote the "after" versions by hand, so treat it as an estimate.
- **Fewer bugs.** Weak evidence. About 10 of 561 fix commits on `main` are layout fixes. The gain is speed and consistency, not bug prevention.

Type-check time, runtime cost and developer time aren't measured yet. So the plan has a gate before the big migration: migrate one pilot module and compare layout review comments across its next three PRs. Then give an agent five screen-to-JSX tasks before and after the docs land, and count the hand-rolled flex blocks and off-token gaps. If that shows nothing, the migration stops.

The target is 1,515 flex blocks outside the primitives down to 150 or fewer, each with a comment saying why.

Next: the pilot module, and the agent eval that decides whether the rest of those 605 files are worth touching.
