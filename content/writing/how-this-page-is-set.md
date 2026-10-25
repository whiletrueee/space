---
title: This page is set with an algorithm browsers never shipped
date: 2026-10-25T08:50:00+05:30
summary: Browsers break lines one at a time and never look back. This page measures every word first, then sets titles like a poster, paragraphs like a book, and endings like the old ones did.
frame: 061
tone: "#b2a392"
focus: 55%
---

The paragraphs on this page are broken by an algorithm from 1981 that no browser has ever shipped. Every browser sets a paragraph the same way: fill a line until the next word does not fit, break, move on, and never look back. A bad break early on cannot be repaired by a better one later, because the early line is already set. Justify that text and the damage shows, one line tight and the next full of gaps, and the eye trips on both.

In 1981 Donald Knuth and Michael Plass described a better way. Treat the paragraph as one problem. Consider every place a line could break, score each possible line by how far its spaces must stretch or shrink, and pick the set of breaks with the lowest total score for the whole paragraph. TeX has set text this way for forty years. The web never adopted it, because the browser would have to know the width of every word before it painted any of them.

## Measuring without the DOM

That is the part [Pretext](https://chenglou.me/pretext/) solves. It measures text with the browser's own font engine, through canvas, and hands back the width of every segment without a layout pass. Once the widths are known, the rest is arithmetic, and arithmetic can do things CSS has no property for.

```ts
const prep = prepareWithSegments(word, "400 18px Geist");
prep.segments; // where a line may break inside the word
prep.widths; //   and how wide each piece is
```

The breaking itself is a small dynamic program. Each candidate line gets a ratio: how much its spaces must stretch to fill the measure, divided by how much they are allowed to. Lines that would need to shrink past their limit are dropped. The badness of a line grows with the cube of its ratio, so the algorithm will happily accept two slightly loose lines to avoid one very loose one.

> The trick is not finding good lines. It is refusing to commit to one before you have seen the rest.

## Three things CSS cannot do

The titles on the index are set the way a letterpress poster was. Each title is cut into lines, and every line gets its own size so that it runs exactly the full width. Pretext measures each candidate line once at a reference size; widths scale with size, so trying every way to cut a title costs a few hundred additions. The split that wins keeps the sizes close to each other and close to a target, so no line shouts.

Paragraphs are justified as wholes, with a drop cap three lines deep. The three lines beside the cap are set to a narrower measure, which CSS cannot do while justifying, because it does not know the cap is there.

The last long paragraph of every piece is a cul-de-lampe, the tapering block that closed chapters in old books. Each line is a little narrower than the one above it. The typesetter tries taper rates until the final line comes out nearly full, so the shape closes on a point instead of trailing off, and the last short line hangs centred underneath.

## What it costs

| Setting | Breaks chosen | Looks back |
| --- | --- | --- |
| CSS `text-align: justify` | one line at a time | never |
| Knuth-Plass | whole paragraph | always |

The HTML you receive is plain text with ordinary wrapping. Without JavaScript, that is what you read, and nothing is lost. Below 480 pixels the lines stay ragged, because narrow columns without hyphenation justify badly whichever algorithm picks the breaks. Every line is still real text, so selecting, copying and searching work as they always did. None of this makes the writing better. It only removes a few small reasons to stop reading, and a page about the work should look like someone cared about how it reads.

The next change is hyphenation, the one thing this setting still lacks.
