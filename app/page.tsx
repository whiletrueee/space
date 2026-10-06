import Image from "next/image";
import Link from "next/link";
import mountain from "@/app/assets/mountain.jpg";

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
      {/* darken the base so the footer reads */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/50 via-transparent via-30% to-transparent" />

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

      <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center px-5 pt-[5vh] text-center sm:pt-[9vh] sm:px-8">
        <p className="rise text-xs font-medium tracking-[0.25em] text-ink/60 uppercase [animation-delay:150ms]">
          Harshit Singh · Bangalore
        </p>
        <h1 className="rise mt-5 max-w-5xl font-serif text-[clamp(2.75rem,6.2vw,5.75rem)] leading-[0.92] tracking-[-0.02em] text-balance [animation-delay:250ms]">
          A quiet corner of the internet for things I{" "}
          <em className="text-[#8a4a2b]">keep building.</em>
        </h1>
        <p className="rise mt-4 font-mono sm:mt-7 text-[13px] text-ink/55 [animation-delay:400ms]">
          while (true) {"{"} build(); {"}"}
        </p>
      </section>

      <footer className="rise mx-auto flex w-full max-w-6xl items-center justify-between px-5 pb-6 text-xs text-white/55 sm:px-8 [animation-delay:550ms]">
        <span>© {new Date().getFullYear()} Harshit Singh</span>
        <span>more soon</span>
      </footer>
    </main>
  );
}
