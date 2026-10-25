import type { Metadata } from "next";
import Link from "next/link";
import { getFilms, STAGES } from "@/lib/films";
import { formatDate } from "@/lib/posts";
import { Clip, Page, TitlePage } from "./script";

export const metadata: Metadata = {
  title: "Films — whiletrueee",
  description: "Films I haven't made yet: concepts, waiting for a camera.",
};

// The section is a screenplay: a title page, then a first page that opens on the concepts.
export default function FilmsIndex() {
  const films = getFilms();
  const latest = films[0]?.date ?? new Date();

  return (
    <main className="sp-desk">
      <TitlePage
        title="Films I haven't made yet"
        by="Harshit Singh"
        left={<p>Bangalore, India</p>}
        right={
          <>
            <p>In development</p>
            <p>Draft of {formatDate(latest)}</p>
          </>
        }
      />

      <Page no={1}>
        <div className="sp-script">
          <p className="sp-transition sp-left">FADE IN:</p>
          <h2 className="sp-scene">INT. A HEAD FULL OF FILMS - NIGHT</h2>
          <p className="sp-action">
            Every one of these exists, so far, only as a frame. Named, written down, and kept here until there is a camera and
            a reason to shoot it.
          </p>
          <p className="sp-action">
            {films.length === 0
              ? "The pages are blank. Nothing has been written down yet."
              : `${films.length === 1 ? "One film waits" : `${films.length} films wait`} in the dark, in the order they arrived.`}
          </p>

          {films.map((f, i) => (
            <section key={f.slug} className="sp-entry">
              {f.still && <Clip src={f.still.large} small={f.still.small} />}
              <h2 className="sp-scene" data-no={films.length - i}>
                {f.title.toUpperCase()} - {f.status.toUpperCase()}
              </h2>
              <p className="sp-action">{f.logline}</p>
              {f.tone && <p className="sp-paren sp-tone">({f.tone})</p>}
              <p className="sp-transition">
                <Link href={`/films/${f.slug}/`}>CUT TO: {f.title.toUpperCase()}</Link>
              </p>
            </section>
          ))}

          <h2 className="sp-scene sp-legend-head">INSERT - HOW A CONCEPT BECOMES A FILM</h2>
          <dl className="sp-legend">
            {Object.entries(STAGES).map(([k, v]) => (
              <div key={k}>
                <dt>{k.toUpperCase()}</dt>
                <dd>{v}.</dd>
              </div>
            ))}
          </dl>

          <p className="sp-centered">(MORE)</p>
        </div>
      </Page>
    </main>
  );
}
