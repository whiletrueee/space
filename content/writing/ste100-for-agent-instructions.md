---
title: Aviation solved prompt ambiguity decades ago
date: 2026-09-25T16:40:00+05:30
summary: Aircraft maintenance manuals are written for a reader who can't ask a follow-up question. So are agent instructions. The standard aviation built for that reader, ASD-STE100, transfers almost rule for rule.
frame: 037
tone: "#041f44"
focus: 55%
---

Every instruction you give a coding agent is read by someone who cannot ask what you meant. A colleague would stop and say "check them how?" or "which thread?" The agent picks a reading and acts on it, and it acts with the same confidence whether it guessed right or wrong.

Aviation has had this reader for decades. A technician working from a maintenance manual is often not a native English speaker, is often alone, and gets no second chance if the procedure is ambiguous. The industry's answer is ASD-STE100, Simplified Technical English. It does not try to make writing pleasant. It removes the two things behind most misreadings: words that carry more than one meaning, and sentences that parse more than one way. The current issue has 53 rules and a dictionary of about 900 approved words, each with one meaning and one part of speech.

## Seven rules that do most of the work

The standard has two kinds of rule. The lexical rules, one word for one meaning and approved words only, depend on the dictionary, which you can obtain from ASD but not redistribute. The structural rules need nothing but the rule itself, and they catch most of the damage:

1. Use the active voice. "Discard each duplicate", not "duplicates should be discarded". The passive hides who acts.
2. Write one instruction per sentence.
3. Keep instructions to 20 words and descriptions to 25.
4. Do not use phrasal verbs. "Start the job", not "spin up the job". A two-word verb means things its parts don't predict.
5. Do not use semicolons. The standard bans the mark outright.
6. Do not drop words to save space. Keep the subject, the verb and the article.
7. Put any sequence of three or more steps in a numbered list.

Without the dictionary, the lexical rules shrink to one habit that is still worth most of their value: pick the plainest word for a thing, then use that same word every time. Synonym rotation, the thing school taught you to do, tells a model that "check", "verify" and "look for" are three different actions.

## What a rewrite finds

Here is an instruction I typed into an agent session, nearly verbatim:

```
Check all the tickets assigned to me that are on low risk. Verify each
ticket and give me a doc on what actions should be taken on those
particular tickets. If they are duplicates, they should be discarded.
Look for the previous occurrences, look for the thread, and give me
exact action items for each ticket.
```

A person reads that without trouble. Under the rules it has nine violations, and the worst ones are not style problems. They are places where the agent has to invent something:

- "On low risk" names no field. The tracker has a priority field and nothing called risk, so the agent will guess a filter or make one up.
- "Check", "verify" and "look for" may be one step or three.
- "The thread" and "the previous occurrences" have no referent.
- "If they are duplicates" never defines a duplicate.

The rewrite:

```
1. Find all tickets with these two properties: the assignee is me, and
   the priority is Low.
2. Examine each ticket.
3. Find the chat thread for each ticket. Read the thread.
4. Find the earlier tickets that report the same error.
5. A ticket is a duplicate if a different ticket reports the same error.
   Discard each duplicate ticket.
6. Write one exact action item for each ticket that is not a duplicate.
7. Write the results to one note.
```

It is longer and flatter, and much harder to get wrong. "Find" always means retrieve and "examine" always means inspect. Step 5 is a definition the agent can test a ticket against. Every step can be checked on its own, which also means that when the agent goes wrong you can see which step it went wrong at.

The same session had a shorter instruction with a worse problem: "arrange if some ticket assignment is incorrect". "Arrange" can mean "tell me" or "fix it", and reassigning a ticket is not quietly reversible. This gives the one rule I would add to the standard for agents:

> When a verb can mean either a report or an irreversible action, write the report.

The rewrite says: find each ticket with the wrong assignee, name the correct assignee, and do not change the ticket. If you want the action, ask for it in a separate, explicit step.

## Where the standard misleads you

The danger in a length limit is not verbosity. It is cutting meaning to fit. "The request may have failed" is longer than "the request failed", and the shorter sentence is cleaner, simpler and false. Hedges carry the writer's confidence, and for an agent that confidence decides whether to retry, escalate or stop. A rewrite that turns a hedge into a fact has not simplified the claim. It has made a different one. Keep the modal verbs, even where they cost you the word count.

Tense is the second trap. STE leaves out the present perfect, which aircraft manuals never need and status text does. "The job has completed" says the output exists now. "The job completed" says it finished at some point, which is a weaker claim. When the compound tense carries information, keep it.

The third is scope. Applied to prose, strict STE reads like a personality transplant, and this page is not written in it. It belongs wherever a machine acts on the text or a person acts on it under pressure: agent instructions, tool and function descriptions, error messages, status lines, runbooks. A looser mode, with the sentence rules and without the one-word lockdown, works well for READMEs and PR descriptions.

## Making it a habit, not a rewrite

Most of the structural rules can be checked by a script: semicolons, sentence length, phrasal verbs from a list, passive constructions, and the same noun appearing under different names in one file. A small linter run over instruction files catches the mechanical violations before an agent does. It should never flag hedges.

Keep the original next to the rewrite. When an agent does something strange a month later, the pair tells you whether the instruction was ambiguous or the agent was wrong, and those need different fixes.

The last effect is the one I did not expect. STE fixes the form of a text, not its substance. A hollow paragraph rewritten under these rules becomes a short, clean, hollow paragraph, and it gets much harder to hide that it says nothing. For instructions that is a feature, because an agent was never going to act well on the hollow version either.
