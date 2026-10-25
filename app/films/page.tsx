import type { Metadata } from "next";
import { getFilms, STAGES } from "@/lib/films";
import { FilmHouse } from "./house";

export const metadata: Metadata = {
  title: "Films — whiletrueee",
  description: "Films I haven't made yet: concepts, waiting for a camera.",
};

export default function FilmsIndex() {
  const concepts = getFilms().map(({ slug, title, logline, status, tone, still }) => ({ slug, title, logline, status, tone, still }));
  const stages = Object.entries(STAGES).map(([k, v]) => [k[0].toUpperCase() + k.slice(1), v] as [string, string]);
  return <FilmHouse concepts={concepts} stages={stages} />;
}
