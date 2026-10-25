---
title: Prove a feature is dead before deleting it
date: 2026-07-29T14:15:00+05:30
summary: A framework upgrade killed our PWA tooling. Before I deleted the PWA, I checked who used it. Three of the 25 accounts that had it turned on did anything at all, and none of them needed the PWA part.
frame: 062
tone: "#72939f"
focus: 62%
---

Three of 25. That is how many of the accounts with the feature turned on did anything with it in two months. And none of those three needed the part I was about to delete.

The part was PWA support in the dashboard I work on: a manifest, icons, a service worker and an iOS splash screen. It came from `next-pwa`, and the Next 16 upgrade made it unworkable.

## Why it had to go, technically

`next-pwa` is a webpack plugin. It wraps the Next config and injects Workbox, which builds the service worker during the webpack compile. Next 16 makes Turbopack the default bundler, and Turbopack doesn't run webpack plugins. Webpack is still available behind `--webpack`, but `next-pwa@5.6.0` is archived and breaks on Next 16 anyway. Doubly dead.

We chose Turbopack for its own reasons. Our custom webpack config only did two things. A `DefinePlugin` for the release version moved to Next's `env`. An alias turned out to be redundant, because a package resolution already pinned a single copy. We lost nothing.

> A dead tool is not a reason to drop a shipped feature.

If people relied on it, the right move was to port it, not delete it. So: who relied on it?

## What the PWA actually did

First I listed what it provided, because "PWA" sounds like offline support, and offline support would change the stakes.

| Provided | Did not provide |
|---|---|
| Home-screen icon | Offline scanning |
| Fullscreen, no browser chrome | Any offline data (no IndexedDB or localStorage use at all) |
| iOS splash screen | Push notifications |
| Service-worker caching (speed only) | Background sync |
| | An install prompt (`beforeinstallprompt` was never implemented) |

The feature behind it was a mobile scanner page. It uses the camera through `getUserMedia`, a POST to redeem a ticket and a GET for time slots. Each of those needs a network connection, and each is a standard browser API. No component referenced a PWA API. The "is this the app" check was a user-agent sniff.

So the PWA was packaging. The real question was whether anyone depended on the packaging.

## The usage check

A backend feature flag gates the scanner. It was on for 25 accounts out of hundreds. I looked at the two months before the decision from three sides:

| Source | What it showed |
|---|---|
| Frontend RUM | 0 mobile sessions across all 25. Only 2 accounts produced any RUM at all, and both were desktop. |
| Backend logs | 0 logs tagged with any of the 25. |
| Redemption alerts | Every redemption came from 3 of the 25. The other 22 had none. |

The sources don't fully agree. RUM saw no mobile sessions even for the three accounts that were redeeming. So I took the strictest signal as the ceiling: you can't redeem without hitting the API. Three accounts, all scanning in a mobile browser.

After the removal, they scan the same way in a regular browser tab. The only difference for them is that there's no home-screen icon and no fullscreen mode.

## What the delete looked like

- `next.config.js`: the `next-pwa` wrapper is gone, and the build is on Turbopack.
- `package.json`: the dependency is gone.
- `_document.tsx`: the manifest link, the `pwacompat` script and the apple-touch icons are gone.
- `public/manifest.json`, the 16 icon files and the service-worker caching strategy file are deleted.
- The Workbox entries in `.gitignore` are gone.

The way back is written down. Serwist (`@serwist/next`) is the maintained successor. It's built on the same Workbox, and it works with Turbopack in production builds. If someone ever needs offline scanning, that's a real feature to design, not a plugin to restore.

Proving it was dead took three data sources. Skipping them would have meant guessing about the three accounts that were actually using the page.

Next: the rest of the climb to Next 16 and React 19.
