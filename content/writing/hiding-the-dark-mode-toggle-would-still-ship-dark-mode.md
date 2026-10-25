---
title: Hiding the dark-mode toggle would still ship dark mode
date: 2026-08-20T09:00:00+05:30
summary: The toggle never turned dark mode on. A default did. So instead of hiding a button, we gated the feature by deleting 247 lines of OS detection.
---

Dark mode was never turned on by the toggle. It was turned on by a default.

The goal was simple. Merge a long run of design-token work into main, but don't let anyone see dark mode yet. The dark palette wasn't ready. In the first cut, a selected row sat at 1.01:1 contrast against the page, so it was invisible. The obvious move was to stop rendering the toggle and merge. That would have shipped dark mode to everyone whose laptop was set to dark.

## Two things turned it on, and nobody had to click

1. The document head ran a small script before first paint. It asked the OS whether it was in dark mode and, if it was, set the page dark. That is the standard trick to avoid a flash of the wrong theme.
2. The theme context started with the preference `"system"`, which also means "follow the OS".

Neither one involves the button. Hide the toggle, and dark-OS users still get a dark app on first paint. They also have no way to switch back, because you just hid the switch.

## Why deleting detection is enough

Dark styles only apply when the page has `data-theme="dark"`. The condition in the CSS config is a plain attribute selector, not a `prefers-color-scheme` media query:

```ts
dark: "[data-theme=dark] &"
```

So if nothing can set that attribute, every dark rule on the branch is dead CSS that does no harm on main. I also checked that the light condition was used nowhere, so nothing needed `data-theme="light"` either. That meant the pre-paint script could go completely instead of being trimmed.

So we gated by deletion. No env flag, no commented-out code:

| Change | Effect |
|---|---|
| OS detection removed: the media query, `getSystemTheme`, the `matchMedia` listener, the `"system"` preference | nothing follows the OS |
| Default is light, and it resolves only to a stored `light` or `dark` | nobody has a stored `dark`, because it never shipped |
| Toggle not rendered, component kept | the seam for release |
| Pre-paint script and its file deleted | document head identical to main |
| Split `theme-color` metas reverted to main's single `#ffffff` | browser chrome unchanged |

That came to −247 lines. Adding it back at release is about 25: detection, the `System` option in the toggle, the pre-paint script, and the one line that renders the toggle. The PR reads as a removal, not a hack, and there's no flag left for someone to forget.

I did think about changing the storage key, in case someone had a stored `"dark"` that would survive the gate. It wasn't needed. The feature had never been released, so nobody had ever clicked Dark.

Two things stayed on purpose. The theme provider is still wired into the app root, but it now only writes `data-theme="light"`, which nothing reads. It's where the feature plugs back in. And the test render helper still wraps everything in that provider. It's inert, and removing it would touch every test file for no gain.

> The dark styles were inert. The light ones were not.

## The real risk was light mode

The token migration rewrote light-mode colours across roughly 630 files, and those went live the moment we merged. Before merging I found three bugs by eye, and no test caught any of them:

- A select showed a near-black selected value on a dark surface. The select library resolves any slot you don't style against its own hardcoded light palette.
- Browser autofill painted inputs pale blue. Chrome's internal autofill background beats `background-color`. You need an inset `box-shadow` plus `-webkit-text-fill-color`.
- The phone number field was a white box, because its library ships its own light stylesheet.

All three are third-party components that keep their own idea of colour, and token work never touches them. So the gate before merging wasn't a dark-mode review. It was a light-mode visual pass on the four main screens, because light mode is what every user would see the next morning.

Next: the re-cut dark palette, built from a near-black base and white alpha layers instead of a mirrored light ramp.
