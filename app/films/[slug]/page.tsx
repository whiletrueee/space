import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getFilm, getFilms } from "@/lib/films";
import { Concept } from "./concept";

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
  const { slug } = await params;
  const films = getFilms();
  const i = films.findIndex((f) => f.slug === slug);
  if (i === -1) notFound();
  const { title, logline, status, tone, place, still, sections } = films[i];
  return (
    <Concept
      no={films.length - i}
      title={title}
      logline={logline}
      status={status[0].toUpperCase() + status.slice(1)}
      tone={tone}
      place={place}
      still={still}
      sections={sections}
    />
  );
}
