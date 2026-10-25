---
title: My review bot ran 1,116 times and posted nothing
date: 2026-09-29T11:00:00+05:30
summary: A headless PR review agent stopped working on a Thursday and nobody noticed for five days. The fix wasn't better review logic. It was a status page.
frame: 018
tone: "#223644"
focus: 72%
---

On 24 September my PR review bot stopped posting reviews. It didn't stop running. Over the next five days it started 1,116 review runs, all for the same pull request, and not one of them reached GitHub.

Nothing alerted. Nothing looked wrong unless you went looking, and I had no reason to go looking, because a bot that's working and a bot that's dead look identical when the only interface is "a comment shows up eventually."

## What it was

The bot lived on a small VPS. A systemd timer polled GitHub every 3 minutes for pull requests that requested my review. For each one it checked out the branch and ran three review lanes in parallel, one model per lane: business logic, code quality, and security. A fourth pass merged the findings, computed the verdict in code from the comment severities, and rewrote the summary in plain English. Then it posted the review. As me, from my own account.

It ran in shadow mode, so every review went up as a plain comment no matter what verdict it computed. The plan was to read its output on a handful of real PRs before giving it real approve and request-changes authority.

Everything about it was headless. Reviews went to disk and to GitHub. To see what it was doing, I SSH'd in and attached to a terminal session where each lane ran in its own pane. That was fun to watch from a laptop. It was useless from a phone, and it told me nothing when I wasn't watching.

## Every failure was silent

Looking back at the build notes, the 1,116 runs weren't a one-off. They were the pattern. Almost every serious bug this thing had failed quietly.

The first real test run found three open PRs. It crashed on all three, because firing several pane commands at the terminal multiplexer at once returned empty output instead of JSON. That part was loud enough. The second bug was the quiet one: the poller marked a PR as processed before reviewing it and never unmarked it on failure. All three PRs were blackholed permanently. No retry, no error, just a PR the bot had decided it was done with.

Before that, I'd found that none of the lanes were getting their model API keys. Panes are children of the multiplexer's server process, not of whatever calls the CLI, so environment variables I thought I was passing never arrived. The lanes would have fallen back to a free default model and kept producing reviews. Plausible-looking ones, probably.

Then cost. The bot recorded none. The saved reports held a verdict, an event, a `posted` flag and the comments. No token counts, no price. The token extraction code guessed across four key paths, because the CLI's event shape changes between versions, and when every guess missed it returned 0. Zero tokens and a failed read looked the same. It also added input and output tokens into one integer, which makes the number useless for pricing when output costs five times what input does.

And then the 1,116 runs. The poll timer showed as disabled the whole time, and nothing surfaced even that. I never found the root cause. My first theory was that the model had been pulled from the gateway's catalog. It hadn't.

My guess, and it is only a guess: the fix for the blackholing bug was "unmark the PR on failure so the next cycle retries." With no limit on retries, a PR that fails for a stable reason gets retried every cycle, forever. I'd swapped a silent permanent skip for a silent infinite loop.

> A bot that's working and a bot that's dead look identical when the only interface is the output showing up eventually.

## What I'm building instead

I decommissioned it on 29 September and started writing specs for a replacement. Same job, different priorities. The note I left myself says to build the health signal before the review logic, and the specs follow that order.

It's a small web app on the same VPS, installable on my phone. Two lists: PRs requesting my review, and PRs I opened. Each PR shows the bot's review, the full diff, and what the review cost. But the parts I care about most are the ones that answer the five days of silence.

**Every run has a state.** `queued`, `running`, `posted`, `failed` or `stalled`. A review that never reached GitHub carries a "Not posted" label. That one requirement exists purely because of the 1,116.

**A heartbeat.** The worker writes a timestamp every 30 seconds during a run. At the start of each loop, any run still marked `running` with a heartbeat older than 5 minutes becomes `stalled` and releases its lock. A crashed worker can't hold a PR hostage.

**A lock the database enforces.** A review starts only if nothing is running for that PR, nothing has posted for that commit, and fewer than three runs have failed for that commit. A unique index rejects a second `running` row even if my code has a bug:

```sql
-- continue only when posted = 0 and failures < max_failures_per_sha
INSERT INTO review_run (pr_id, head_sha, state, ...)
VALUES (:pr, :sha, 'running', ...);
-- one_running_run rejects this insert when a run for this PR is running
```

The failure count is per commit, so pushing a new commit resets it. Three failures on one commit sends a single notification and then stops trying.

**A health line on the main screen.** Is the poller active, when did it last poll successfully, how many runs failed in the last 24 hours. If the poller stops, or three runs fail in a row, my phone gets a push notification. The spec's success criterion is blunt: a failed review shows as failed in the interface within one poll period.

**Two processes, not one.** The API that serves the app and the worker that runs reviews are separate. The old bot was one process, and a wedged run made the whole system go quiet. A stuck review should never stop the status page from loading.

**Cost, measured, or labelled as a guess.** One model now instead of three. Input and output tokens go in two columns, never summed. Cost is computed locally from a price table, because nothing upstream reports it. The CLI has no cost flag, the model endpoint returns no price, and the gateway has no usage API. If parsing finds no usage object, the run is flagged `estimated` instead of quietly writing 0. Failed runs show their cost too, since a run that times out after the model answered still spent the tokens.

The cost parser still guesses at field names, so it gets a contract test. The test runs the real CLI against one short prompt and asserts that the usage was read and both counts are above zero. It costs about $0.00002 per run, and it's the only way I'll find out the event shape moved before my numbers go wrong.

## The general version

Every unattended agent I've written has the same blind spot. I spend all the effort on the part that does the work and none on the part that tells me whether the work happened. A human doing a job leaves traces: a message, a status update, a "stuck on this." An agent with no interface leaves nothing when it fails, unless you build the trace in.

The minimum I'd now put on anything that runs without me watching: a state for every run that someone can see, a heartbeat that turns a hang into a visible state, a cap on retries so failure stops somewhere, and a cost number that admits when it's a guess.

Next time I'd build the status page first and the agent second, which is exactly the order the new spec is in.
