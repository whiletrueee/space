---
title: Three ways to get React error #185
date: 2026-08-06T15:59:00+05:30
summary: Maximum update depth exceeded, three times, from three different directions. A merged ref that was never memoised, a Radix component that broke under React 19, and an async effect that claimed its guard too late.
---

React error #185 is "Maximum update depth exceeded." React throws it when updates keep scheduling more updates past a fixed limit of 50 nested updates, on the theory that you're in a loop and would rather crash than hang. I've hit it three times this year in the same large Next.js dashboard. None of the three looked like the textbook `setState` in render. Two of them only showed up because something else changed underneath code that had always been wrong.

In production all you get is `Minified React error #185` and a stack of two-letter function names. That's most of why these took as long as they did.

## 1. A merged ref that was never memoised

The first one crashed our `Select` component. Safari crashed instantly. Firefox crashed after a few interactions. Chrome only crashed at automation speed, which is why our automated tests kept tripping on it while nobody could reproduce it by hand. The bug had been in the code for several releases.

The trigger button needed one DOM node shared by three consumers: floating-ui for positioning, downshift for keyboard handling, and the form library for focus. So a small hook merged three refs into one callback:

```ts
function useMergedRefs(...refs) {
  return useCallback(
    (node) => {
      refs.forEach((ref) => {
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      });
    },
    [refs], // a rest parameter: a new array on every call
  );
}
```

`...refs` is a new array every call, so `[refs]` is never equal to last render's deps, and `useCallback` returns a new function every render. Spreading the deps (`[...refs]`) didn't help either, because downshift's toggle-button ref is itself a new function every render.

A new ref callback is not free. When the identity changes, React calls the old one with `null` and the new one with the node. Here that meant calling floating-ui's `setReference`, which is a state setter. The loop:

1. Something re-renders the select, say picking an option.
2. Downshift hands back a new ref, so the merged ref is new.
3. React calls `old(null)`, then `new(node)`.
4. `setReference` updates state, which re-renders.
5. Back to 2, until update 50.

The shape of it, small enough to paste into a sandbox:

```tsx
function Loop() {
  const [, setBox] = useState({});
  // a new callback every render, and a setter that always stores a new object
  const ref = (node) => setBox({ node });
  return <button ref={ref}>boom</button>;
}
```

The fix was to make the merged callback permanent and read the latest refs at call time:

```ts
function useMergedRefs(...refs) {
  const refsRef = useRef(refs);
  refsRef.current = refs; // updated every render, triggers nothing

  return useCallback((node) => {
    refsRef.current.forEach((ref) => {
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    });
  }, []);
}
```

React sees the same function every render, so it never swaps refs, so `setReference` runs once per real mount. Four libraries, each behaving correctly on its own, made a loop together. I have notes from two investigations that disagree on why each browser crashed when it did, so I'm not going to pretend I know.

## 2. Radix, after React 19

The second arrived four hours after we shipped Next 16 and React 19. An alert fired on one step of a multi-step form, and it traced to a toggle built on `@radix-ui/react-switch` 1.2.6. Inside, the Switch composes the forwarded ref with an inline setter:

```ts
const composedRefs = useComposedRefs(forwardedRef, (node) => setButton(node));
```

Same disease as case 1: a fresh inline function means a fresh composed ref every render. Under React 18 this was harmless in practice. As best I can tell, React 19's changed handling of ref attachment and cleanup means the detach (`setButton(null)`) and reattach (`setButton(node)`) now each schedule real work every commit, and the loop never settles. Newer Radix versions pass the state setter directly, which is stable:

```diff
- useComposedRefs(forwardedRef, (node) => setButton(node))
+ useComposedRefs(forwardedRef, setButton)
```

Why that one step and not everywhere: the toggle is a form-library controlled input, so it re-renders on every keystroke and validation. Overlays with the same latent pattern re-render rarely and only failed now and then.

The fix was a dependency bump across every Radix package carrying the pattern, Switch, Checkbox, Radio Group, Dismissable Layer, Dropdown Menu, Dialog, Popover, plus one embarrassing find. Our own `resolutions` force-pinned `@radix-ui/react-slot` tree-wide to 1.2.3, below the version with its fix. We had been actively spreading the broken copy to everything that used `asChild`.

One dead end worth recording. Our internal UI package shipped its own nested, older copies of Radix. They looked guilty. But the app only imported icons and a few basic primitives from that package, none of the components that use the bad code. Loaded is not the same as rendered.

## 3. A guard claimed after an await

The Radix bump cut the crash rate from 18.6 an hour to 0.54. That is about 35 times better and not zero, and the leftover was a different bug.

Our multi-step form hook validates earlier steps when you land on a later step through the URL hash. It used a ref as a "run once" guard:

```ts
useEffect(() => {
  if (!syncWithHash || currentStepIndex === 0 || hasValidatedRef.current) return;

  const validatePriorSteps = async () => {
    const result = await validatePreviousSteps(steps, currentStepIndex, trigger);
    setCompletedSteps(/* … */);
    hasValidatedRef.current = true; // too late
  };

  validatePriorSteps(); // not awaited
}, [syncWithHash, currentStepIndex, steps, trigger, updateStepIndex]);
```

Two faults compound. The guard is only set after the `await`, so anything that re-enters the effect during validation walks straight past it. And the effect re-runs every render, because `steps` arrives as a fresh array from the caller, which makes `updateStepIndex` a new function, which changes the deps.

`trigger()` is the form library's validator, and it pushes `isValidating: true` into form state. So: the effect calls `trigger()`, which re-renders, which re-fires the effect, which finds the guard still unset and calls `trigger()` again. It surfaced as an uncaught promise rejection thrown from the `trigger()` call.

Under React 18 the timing usually let the first `await` resolve before the effect ran again, so the guard got set in time. React 19 flushes that state update differently. The code was always wrong; React 18 was forgiving.

That also explained the blast pattern exactly: only hash-synced wizards, only when entering a step after the first, never step one.

The fix is one line moved:

```ts
if (!syncWithHash || currentStepIndex === 0 || hasValidatedRef.current) return;
hasValidatedRef.current = true; // claim it before any async work
```

Memoising `steps` is the deeper fix, since the effect still churns without it. But the guard stops the loop.

The fastest step in that whole investigation was running it in development mode. The dev build of React prints the full message and the component stack, and it named the file. Production had given us `#185` and a lot of minified-stack archaeology.

## What the three have in common

> An identity that changes every render is a loop waiting for something to call a setter.

Cases 1 and 2 are the same bug in different code: a ref callback with an unstable identity, attached to something that sets state. Case 3 is its effect-shaped cousin: unstable deps plus a guard that isn't claimed synchronously. All three were latent, and all three needed something else to tip them over, whether a browser's scheduling, React 19's ref handling, or a burst of network responses landing within a few milliseconds of each other.

Things I check now when I see #185:

- Ref callbacks, merged or composed, built from inline functions or rest params.
- `useCallback` or `useEffect` deps that include arrays or objects created by the caller.
- Any "run once" ref that's set after an `await`.
- Every `resolutions` pin, and whether it's now below a fix.
- Dev mode first. Always.

Next up: turning on production browser source maps, so the next one doesn't start with a stack trace full of `n6` and `a4`.
