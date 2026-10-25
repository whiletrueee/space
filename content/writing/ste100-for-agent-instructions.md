---
title: Writing agent instructions in an aerospace maintenance standard
date: 2026-09-25T16:40:00+05:30
summary: ASD-STE100 was built so aircraft technicians can't misread a procedure. An agent reading my instructions has the same problem and no way to ask what I meant.
frame: 037
tone: "#041f44"
focus: 55%
---

The most useful change I made to my agent prompts this year was borrowing a writing standard from aircraft maintenance manuals.

ASD-STE100, Simplified Technical English, exists because a misread instruction on an aircraft can kill someone, and the people reading it were often not native English speakers and had nobody to call. So the standard strips out the two things that cause most misreadings: words with more than one meaning, and sentences with more than one possible structure. The current issue, from January 2025, has 53 writing rules in 9 sections and a dictionary of about 900 approved words, one meaning and one part of speech each.

An agent reading my instructions is in the same position as that technician. It can't lean over and ask "did you mean report it or change it?" It picks a reading and acts on it.

## The rules that matter

I use an open-source skill that encodes the rule categories without the dictionary. ASD lets you obtain the standard for free but not redistribute it, so the word list stays out. That splits the rules in two.

The structural rules you can apply from the description alone, and they do most of the work:

- Active voice. "Discard each duplicate", not "duplicates should be discarded."
- One instruction per sentence.
- 20 words or fewer for an instruction, 25 for a description.
- No phrasal verbs. "Start the job", not "spin up the job." A two-word verb means things its parts don't predict.
- No semicolons. The standard bans the mark outright.
- No ellipsis. Keep the subject, the verb and the article, even when it reads longer.
- A numbered list for any sequence of three or more steps.

The lexical rules, one word for one meaning, approved words only, really need the dictionary. Without it, they turn into a direction of travel: pick the plainest word, then use the same word for the same thing every time. That second half is checkable even without the list, and it's the one that catches me most.

There's also a linter script that checks the structural rules mechanically: semicolons, sentence length, phrasal verbs, nominalizations, marketing adjectives, passive voice, synonym rotation within a file. By design it never flags hedges.

## A real rewrite

Here's an instruction I typed into an agent session, more or less verbatim:

```
Check all the tickets assigned to me that are on low risk. Verify each
ticket and give me a doc on what actions should be taken on those
particular tickets. If they are duplicates, they should be discarded.
Look for the previous occurrences, look for the thread, and give me
exact action items for each ticket.
```

It reads fine to a human. Run it through the rules and it has nine violations. The worst ones:

- "On low risk" names no field. The tracker has a priority field and nothing called risk. An agent will either guess or invent a filter.
- "Check", "verify" and "look for" are three verbs for overlapping actions. Are they three steps or one?
- "The thread" and "the previous occurrences" have no referent. Which thread? Occurrences of what?
- "If they are duplicates" never says what makes something a duplicate.
- A sequence of four or five steps is buried in one paragraph.

The rewrite:

```
1. Find all tickets with these two properties: the assignee is me, and
   the priority is Low.
2. Examine each ticket.
3. Find the Slack thread for each ticket. Read the thread.
4. Find the tickets from before this date that report the same error.
5. A ticket is a duplicate if a different ticket reports the same error.
   Discard each duplicate ticket.
6. Write one exact action item for each ticket that is not a duplicate.
7. Write the results to a note in the Obsidian vault.
```

It's longer and flatter, and it's harder to get wrong. "Find" always means retrieve. "Examine" always means inspect. Step 5 is a definition the agent can test against instead of a vibe. Each step can be checked on its own.

The second instruction from the same session was shorter and had a nastier problem: "arrange if some ticket assignment is incorrect." "Arrange" can mean "tell me" or "fix it," and reassigning a ticket is not something you can quietly undo. The rewrite picks the safe reading and says so: find each ticket with the wrong assignee, name the correct assignee, and leave the change to me. When a verb can mean either a report or an irreversible action, the rewrite should choose the report.

> A shorter sentence that upgrades a hedge to a fact isn't a simplification. It's a different claim.

## Where it goes wrong

The failure mode isn't verbosity. It's cutting meaning to hit the length cap.

The rule I trust most in the skill is about modality. "The request may have failed" stays "may have failed." Turning it into "the request failed" makes it shorter and cleaner and false. Hedges carry the writer's confidence, and confidence is content. Length caps tempt you to cut exactly those words, which is why the linter is built to leave them alone.

The same goes for tense. STE excludes the present perfect, and aircraft manuals never miss it. Status text does. "The job has completed" means the output is there now. "The job completed" means it finished at some point. When the compound form carries information, I keep it and note the exception.

And it's the wrong tool for prose. Strict mode applied to a blog post reads like a personality transplant, and this post isn't written in it. The skill has a looser mode for READMEs and PR descriptions that keeps the sentence rules but drops the one-word-one-meaning lockdown. I use strict mode for anything a machine acts on: agent instructions, tool descriptions, error messages, status lines.

## Where I use it now

Mostly in places where the reader is a model and the cost of misreading is real.

My PR review bot runs three models in parallel lanes and then an aggregator pass. The last step of that pass rewrites the summary in the looser mode, so the comment that lands on a PR reads as plain English instead of three models' worth of hedged bullet points. The verdict itself is computed in code from the comment severities. I don't ask a model for that, and I don't ask STE to fix it either.

The triage instructions above now live as a reference note I reuse, with the original text and a table of what changed next to the rewrite. Keeping the original matters. When an agent does something odd later, I can see whether the instruction was ambiguous or the agent was.

The side effect I didn't expect is that it makes thin thinking obvious. STE fixes the form of a text, not its substance. A hollow paragraph rewritten under these rules becomes a short, clean, hollow paragraph, and it's much harder to hide that it says nothing.

Next I want the linter running as a pre-commit check on agent instruction files, so I find the nine violations before the agent does.
