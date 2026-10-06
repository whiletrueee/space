import Image from "next/image";
import Link from "next/link";
import mountain from "@/app/assets/mountain.jpg";
import { projects } from "@/lib/projects";

const links = [
  { label: "GitHub", href: "https://github.com/whiletrueee" },
  { label: "X", href: "https://x.com/singharshit07" },
  { label: "Writing", href: "https://blogs.singhharshit.me" },
];

export default function Home() {
  return (
    <main className="grain relative isolate flex min-h-svh flex-col overflow-hidden">
      <Image
        src={mountain}
        alt=""
        fill
        priority
        placeholder="blur"
        sizes="100vw"
        className="settle -z-20 object-cover object-[50%_0%]"
      />
      {/* darken the ridge so the cards read */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/70 via-black/10 via-55% to-transparent" />

      <header className="rise mx-auto flex w-full max-w-6xl items-center justify-between px-5 pt-6 sm:px-8">
        <Link href="/" className="text-[15px] font-medium tracking-tight">
          whiletrueee
        </Link>
        <nav className="flex items-center gap-1 rounded-full border border-white/40 bg-white/25 p-1 text-sm backdrop-blur-md">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              target="_blank"
              rel="noreferrer"
              className="rounded-full px-3.5 py-1.5 text-ink/75 transition hover:bg-white/50 hover:text-ink"
            >
              {l.label}
            </a>
          ))}
        </nav>
      </header>

      <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center px-5 pt-[9vh] text-center sm:px-8">
        <p className="rise text-xs font-medium tracking-[0.25em] text-ink/60 uppercase [animation-delay:150ms]">
          Harshit Singh · Bangalore
        </p>
        <h1 className="rise mt-5 max-w-5xl font-serif text-[clamp(2.75rem,6.2vw,5.75rem)] leading-[0.92] tracking-[-0.02em] text-balance [animation-delay:250ms]">
          A quiet corner of the internet for things I{" "}
          <em className="text-[#8a4a2b]">keep building.</em>
        </h1>
        <p className="rise mt-7 font-mono text-[13px] text-ink/55 [animation-delay:400ms]">
          while (true) {"{"} build(); {"}"}
        </p>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 pt-24 pb-6 sm:px-8">
        <ul className="grid gap-3 sm:grid-cols-3">
          {projects.map((p, i) => (
            <li
              key={p.name}
              className="rise"
              style={{ animationDelay: `${550 + i * 120}ms` }}
            >
              <a
                href={p.href}
                target="_blank"
                rel="noreferrer"
                className="group flex h-full flex-col rounded-2xl border border-white/15 bg-white/[0.07] p-5 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] backdrop-blur-xl transition duration-500 hover:-translate-y-1 hover:border-white/30 hover:bg-white/[0.13]"
              >
                <div className="flex items-center justify-between text-[11px] font-medium tracking-[0.18em] text-white/55 uppercase">
                  {p.tag}
                  <span className="text-base tracking-normal transition duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-white">
                    ↗
                  </span>
                </div>
                <h2 className="mt-8 font-serif text-3xl tracking-tight">
                  {p.name}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-white/65">
                  {p.blurb}
                </p>
              </a>
            </li>
          ))}
        </ul>

        <footer className="mt-6 flex items-center justify-between text-xs text-white/45">
          <span>© {new Date().getFullYear()} Harshit Singh</span>
          <span>more soon</span>
        </footer>
      </section>
    </main>
  );
}
