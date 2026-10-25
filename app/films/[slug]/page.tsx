import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getFilm, getFilms } from "@/lib/films";
import { formatDate } from "@/lib/posts";
import { Clip, Page, Script, TitlePage } from "../script";

export const dynamicParams = false;

// A static export needs at least one param, so an empty slate exports a single 404 page
export function generateStaticParams() {
  const films = getFilms();
  return films.length ? films.map((f) => ({ slug: f.slug })) : [{ slug: "_" }];
}

export async function generateMetadata({ params }: PageProps<"/films/[slug]">): Promise<Metadata> {
  const film = getFilm((await params).slug);
  if (!film) return {};
  return { title: `${film.title} — whiletrueee`, description: film.logline };
}

export default async function ConceptPage({ params }: PageProps<"/films/[slug]">) {
  const film = getFilm((await params).slug);
  if (!film) notFound();

  return (
    <main className="sp-desk">
      <TitlePage
        title={film.title}
        by="Harshit Singh"
        clip={film.still && <Clip src={film.still.large} small={film.still.small} />}
        left={
          <>
            <p>{film.status[0].toUpperCase() + film.status.slice(1)}</p>
            {film.place && <p>{film.place}</p>}
          </>
        }
        right={<p>Draft of {formatDate(film.date)}</p>}
      />

      <Page no={1}>
        <Script elements={film.script} />
      </Page>

      {film.notes && (
        <Page no={2} className="sp-notes">
          <h2 className="sp-notes-head">Notes</h2>
          <div className="sp-notes-body" dangerouslySetInnerHTML={{ __html: film.notes }} />
        </Page>
      )}

      <p className="sp-back">
        <Link href="/films/">← Back to the slate</Link>
      </p>
    </main>
  );
}
