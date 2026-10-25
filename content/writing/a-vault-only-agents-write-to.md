---
title: A vault only agents write to
date: 2026-08-12T14:55:00+05:30
summary: I stopped organising my notes for myself. The vault now has one writer, a coding agent, and a sixty-line script that keeps an index it reads before anything else.
frame: 027
tone: "#303840"
focus: 40%
---

I don't write notes in my work vault anymore. A coding agent does. The file that tells it how opens with: "This vault is an agent write-target. Claude Code is the only thing that writes here."

That sentence took me two attempts to arrive at, and the first attempt was built for the wrong reader.

## The version built for me

In June I set the vault up the way you're supposed to. Three numbered pillars for reviewing, researching and planning, with supporting folders around them. A home page full of live Dataview queries: recently touched notes, latest PR reviews, open bugs, active plans, every unchecked task in the vault. Two CSS snippets for nicer code blocks and custom callouts. A hotkey table. Four templates. A list of plugins to install next.

All of it was for a person browsing in Obsidian. None of it helped the thing that was actually producing the notes.

By then most of what went into the vault came out of agent sessions: PR reviews, investigation write-ups, plans, handovers. The agent would finish a task, pick a folder, write a note. When it needed context later, it would search. Search across 300-odd notes means opening a lot of files to find out what's in them, and a lot of tokens spent on notes that turn out to be irrelevant. The filing rules were a decision tree in prose, and an agent working through a decision tree in prose files things roughly where a tired person would.

The dashboards didn't help it at all. An agent doesn't render Dataview.

So today I took a backup, moved the old structure to an archive vault, and rebuilt it for the reader that's actually there.

## The contract

The vault has one instruction file at the root. It's short, and most of it is about two moments: before you search and before you write.

Before you search, read `_meta/MAP.md`. That's the index. One read replaces crawling the vault. Only open individual notes after the map tells you which ones.

Before you write:

1. Pick a folder from the list. Never create a new top-level folder. If nothing fits, use `Inbox/`.
2. Never nest. Every note sits directly in its folder.
3. Write the frontmatter block.
4. Name it `kebab-case.md`, or `YYYY-MM-DD-slug.md` in `Daily/`.
5. Run the reindex script.

There are 16 folders. One per area of work, plus general ones: `Inbox`, `PR-Reviews`, `Incidents`, `Daily`, `Reference`, and `_meta` for the contract, the map, templates and the script. The folder table gives each one a single line saying what it takes, which is the only filing logic there is. No pillars, no decision tree.

Flat is deliberate. The contract says it outright: if a folder feels crowded, that's fine, because the map is the navigation, not the file tree. Nesting is where agents and people both start inventing structure, and invented structure is how the same topic ends up in three places.

A few more rules target the mistakes agents make most with notes:

- **Status over duplicates.** When a note is superseded, mark the old one `superseded` and link forward. Never leave two notes claiming to be current.
- **Update, don't append.** If a note on the topic exists, edit it. Only create a new note for a new question.
- **Don't delete.** Stale notes go to the archive vault.

Frontmatter is required on every note: `type`, `domain`, `status`, `created`, `updated`, `summary`, `tags`. Of those, `summary` matters far more than the rest.

> Write the summary as the answer, not the label.

The contract's own example: "Why fulfilmentType is null on publish" beats "Notes on fulfilmentType." The label tells you the note exists. The answer tells you whether you need to open it, and in an index read by an agent, not opening a note is the whole point. Summaries are capped at 140 characters.

## The index

The script that builds the map is under sixty lines of Python with no dependencies. It walks the vault, skips the dot-folders, `_meta`, a couple of asset folders and the root-level files, and reads the first 6,000 bytes of each note. It parses the frontmatter with a regex rather than a YAML library, because the frontmatter is flat key-value pairs and I didn't want an install step for something an agent runs after every write.

For each note it emits one table row under its folder heading:

```
| Note | Type | Status | Updated | Summary |
```

Summaries get truncated to 130 characters and their pipes escaped, so one long line can't break the table. The header records the generation date, the note count, and how many notes have frontmatter. Notes without it fall back to their first line of prose, then to their first heading. That's a crutch for older notes, and the header line exists to keep the crutch visible.

Folders appear in a fixed order. Any folder the script doesn't know about still gets indexed, sorted after the known ones. A new folder means someone broke rule one, but it shouldn't also mean its notes go missing from the map.

One gap is deliberate. Notes sitting at the vault root aren't indexed at all. The root is meant to hold only the contract and the home page, so a note there is already misfiled, and I'd rather it be invisible to the map than make the root look like a legitimate place to file things. That tradeoff has a cost I haven't paid yet: a note an agent drops at the root is a note no agent will ever find again.

The setup costs almost nothing to run. The agent reads one file to orient, opens two or three notes instead of twenty. The home page still has Dataview tables for when I'm the one browsing, but they're a convenience, not the structure.

The weak point is that the contract is prose an agent has to choose to follow, and it lives in two files, one per agent tool, that will drift the first time I edit one and forget the other. Next is a check in the reindex script that fails loudly on unknown folders, root-level notes and a missing summary, instead of quietly indexing around them.
