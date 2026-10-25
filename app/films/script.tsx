import type { ReactNode } from "react";
import type { Element } from "@/lib/fountain";

/** A sheet of script paper: US letter proportions, Courier, a page number top right. */
export function Page({ no, className, children }: { no?: number; className?: string; children: ReactNode }) {
  return (
    <article className={`sp-page ${className ?? ""}`}>
      {no !== undefined && <span className="sp-no">{no}.</span>}
      {children}
    </article>
  );
}

/** A title page, with the two brass brads that hold a real script together. */
export function TitlePage({ title, by, left, right, clip }: { title: string; by: string; left: ReactNode; right: ReactNode; clip?: ReactNode }) {
  return (
    <Page className="sp-cover">
      <span className="sp-brad" aria-hidden />
      <span className="sp-brad" aria-hidden />
      {clip}
      <div className="sp-cover-title">
        <h1>{title}</h1>
        <p>written by</p>
        <p>{by}</p>
      </div>
      <div className="sp-cover-foot">
        <div>{left}</div>
        <div>{right}</div>
      </div>
    </Page>
  );
}

/** A photograph paper-clipped to the page. */
export function Clip({ src, small }: { src: string; small: string }) {
  return (
    <figure className="sp-clip" aria-hidden>
      {/* eslint-disable-next-line @next/next/no-img-element -- static export, no optimizer */}
      <img src={src} srcSet={`${small} 960w, ${src} 1920w`} sizes="22rem" alt="" loading="lazy" />
    </figure>
  );
}

/** Screenplay elements in industry layout: indents in characters, scene numbers in both margins. */
export function Script({ elements }: { elements: Element[] }) {
  return (
    <div className="sp-script">
      {elements.map((e, i) => {
        switch (e.type) {
          case "scene":
            return (
              <h2 key={i} className="sp-scene" data-no={e.no}>
                {e.text}
              </h2>
            );
          case "shot":
            return (
              <p key={i} className="sp-shot">
                {e.text}
              </p>
            );
          case "transition":
            // FADE IN: opens a script flush left; every other transition sits on the right
            return (
              <p key={i} className={`sp-transition${/^FADE IN/.test(e.text) ? " sp-left" : ""}`}>
                {e.text}
              </p>
            );
          case "centered":
            return (
              <p key={i} className="sp-centered">
                {e.text}
              </p>
            );
          case "dialogue":
            return (
              <div key={i} className="sp-dialogue">
                <p className="sp-character">{e.character}</p>
                {e.lines.map((l, j) => (
                  <p key={j} className={l.paren ? "sp-paren" : "sp-line"}>
                    {l.text}
                  </p>
                ))}
              </div>
            );
          default:
            return (
              <p key={i} className="sp-action">
                {e.text}
              </p>
            );
        }
      })}
    </div>
  );
}
