---
title: 131 modals become 5 variants × 3 sizes
date: 2026-10-16T14:45:00+05:30
summary: I inventoried every dialog in a large dashboard before designing a modal primitive. The variants came from what the user has to do, the sizes came from widths people had already hard-coded, and the inventory found 20 bugs along the way.
---

The dashboard I work on has 131 modal and sheet instances across 129 files, built on nine different engines, plus 19 wrappers around them. One engine is another one with a button removed. One is a different library entirely, not even on Radix. A third of the consumers of the main confirmation modal override its width because 400px is too narrow.

Nobody designed it that way. It's what happens when every team needs a dialog this sprint and the shared one is almost right.

I wanted one modal primitive with a small, closed set of options, so that a person or an agent picks a modal by its job instead of assembling one. Before writing the API, I counted.

## Variants come from the user's job

We had a storybook catalogue of 19 modal "shapes" people had built. The tempting move is to make a variant per shape. That gives you 19 options and the same problem you started with.

So I split them by what the user has to do, not by how they look:

| Variant | User's job | Chrome |
|---|---|---|
| `action` | Make a yes/no decision from the copy alone | No header. Tone icon, title, description, two buttons. |
| `confirmation` | Make a decision that depends on the body: a form, a list of consequences, a picker | Title, close button, scrolling body, footer |
| `acknowledgment` | Read the outcome and dismiss | Optional icon or illustration, one button |
| `read-only` | Read structured content | Title, close button, scrolling body, optional footer |
| `no-action` | Wait | Nothing to click. The system closes it. |

Mapped against the 19 shapes, 13 fit cleanly and 2 fit in part. The other 4 are honest outliers: a file uploader with tabs in its title bar, a multi-step wizard with its own step state, a 1200px data workspace with a paginated table, and a mobile bottom sheet. The workspace is a page living in a dialog, so it should become a side sheet or a route. The bottom sheet already has a primitive. The uploader and wizard become composites on the base dialog. None of them gets a variant, because one variant per outlier is how the original 19 happened.

The types do real work here. `action` and `acknowledgment` take `children?: never`. If you need a body, the compiler pushes you to `confirmation` or `read-only`, which have a scrolling body. The "400px box with a form crammed in" problem can't come back without a type error.

## Sizes come from the widths people already chose

I didn't pick the sizes. I collected every width consumers had hard-coded:

```
400 ×3, 440, 480, 500, 548, 560 ×3, 652, 800, 860, 920, 1200
```

They cluster into three groups, around 400, 560 and 860, plus one 1200 outlier, which is the workspace that shouldn't be a modal. That gives `sm` 400px, `md` 560px and `lg` 860px. All three are capped at the viewport minus a gutter and 90% of the dynamic viewport height. The body is the only scroller, so the header and footer stay pinned.

Prop usage across the 46 files using the old confirmation modal set the defaults:

| Prop | Files | So the default is |
|---|---|---|
| `icon` | 24 | An icon per tone, so callers don't pass one |
| `isLoading` on a button | 22 | Async primary is the normal case |
| `align="left"` | 18 | Left-aligned, not centred |
| `className`, mostly for width | 14 | Sizes, not overrides |

Eight files used a black button as a stand-in for "destructive", because the button component had no destructive style. That's a design-system gap, not a modal problem, but the modal can't ship a `delete` tone until it's fixed.

> Five variants and three sizes is fifteen combinations. Every shape I found fits one, needs a small extension, or shouldn't be a modal.

## The inventory is the contract

The taxonomy is the easy half. The hard half is moving 131 instances without breaking any of them. So the inventory became a JSON file with one entry per instance: exact title, description, button text, fields, QA markers, analytics events, toasts, close behaviour and tests. Before you migrate an instance, read its entry. After, everything in the entry must still be true.

That level of detail turned up things a quick grep wouldn't:

- 23 instances can't be dismissed today: no Escape, no click outside. Some are deliberate. Some just never got an `onOpenChange`. The migration keeps all 23 as they are, with an explicit `dismissible: false`, because the preset default would quietly change behaviour.
- 59 instances have no QA marker and 59 have no test. The test suites for some modules don't run at all, so those need a manual pass.
- 20 bugs. Escape fires two analytics events. A delete modal with no loading state sends duplicate DELETE calls on a double click. A modal closes when its API call fails. A toggle's analytics always reports "enable", even when the user disables it.

The rule is that the migration fixes none of them. Each bug gets its own ticket. A migration that also changes behaviour can't be reviewed, because you can't tell an intended change from a regression. The JSON entry exists so the diff can be checked against something.

There was also dead code. Two form components had no callers and got deleted instead of migrated. The same success modal had been copy-pasted into three files and becomes one.

A few accessibility defects come along for free once the primitive owns the structure. Headings were nested inside the dialog title. Dialogs with no header had no accessible name. A close button announced itself as "close-modal". The new header renders one `h2` and a close button labelled "Close", and the title is always required, even when it's visually hidden. A destructive button is never the initial focus, so a stray Enter can't delete anything. Every close path calls `onOpenChange(false)` exactly once, and nothing can close while a button is loading.

Next: building the base dialog and the five presets, then moving the 131 instances over in batches, checking each one against its entry.
