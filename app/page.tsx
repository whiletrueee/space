import Image from "next/image";
import Link from "next/link";
import mountain from "@/app/assets/mountain.jpg";

const nav = [
  { label: "Work", href: "/work" },
  { label: "Films", href: "/films" },
  { label: "Places", href: "/places" },
  { label: "About", href: "/about" },
];

const lines = [
  <>Some are made with code.</>,
  <>Some with a camera.</>,
  <>
    Some require a <em className="font-light">plane ticket.</em>
  </>,
];

const projects = [
  {
    name: "Jev Router",
    blurb: "Sends each LLM request to the cheapest model that can answer it.",
    href: "https://github.com/whiletrueee/router",
  },
  {
    name: "Code Storyline",
    blurb: "A VS Code extension that explains any file in plain English.",
    href: "https://github.com/whiletrueee/vscode-code-storyline",
  },
  {
    name: "Headout",
    blurb: "Software engineer at Headout.",
    href: "https://www.headout.com",
  },
];

const bar =
  "shrink-0 bg-black px-5 font-mono text-[10px] tracking-[0.14em] text-white/55 uppercase sm:px-10 sm:text-[11px] sm:tracking-[0.18em] lg:px-14";

export default function Home() {
  return (
    <main className="relative isolate flex h-svh min-h-[580px] flex-col overflow-hidden bg-black">
      {/* letterbox: top */}
      <header className={`${bar} flex h-14 items-center justify-between`}>
        <Link href="/" className="text-white/85">
          whiletrueee
        </Link>
        <nav className="flex gap-3.5 sm:gap-8">
          {nav.map((n) => (
            <Link
              key={n.label}
              href={n.href}
              className="group transition-colors hover:text-white"
            >
              {n.label}
              <span className="ml-1 hidden transition-transform duration-300 sm:inline-block group-hover:translate-x-1">
                →
              </span>
            </Link>
          ))}
        </nav>
      </header>

      {/* the frame */}
      <section className="relative flex-1 overflow-hidden">
        <Image
          src={mountain}
          alt="Snow-capped peak at golden hour"
          fill
          priority
          placeholder="blur"
          sizes="100vw"
          className="kenburns -z-20 object-cover object-[50%_0%]"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/60 via-black/5 via-40% to-transparent" />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_100%_100%,rgba(0,0,0,0.6),transparent_55%)]" />
        <div className="grain" />

        <h1 className="fade-up absolute inset-x-0 top-[7%] px-5 text-center text-[clamp(2.75rem,8.2vw,8.75rem)] leading-[0.92] font-semibold tracking-[-0.055em] text-ink [animation-delay:1.3s] sm:top-[9%]">
          I make things <br />I want to{" "}
          <em className="font-light">exist.</em>
        </h1>

        <div className="absolute inset-x-5 bottom-[6%] flex flex-col gap-8 text-white sm:inset-x-10 sm:flex-row sm:items-end sm:justify-between lg:inset-x-14">
          <div className="text-[clamp(1.25rem,2.3vw,2.25rem)] leading-[1.2] font-medium tracking-[-0.035em]">
            {lines.map((l, i) => (
              <p
                key={i}
                className="fade-up"
                style={{ animationDelay: `${2.5 + i * 0.9}s` }}
              >
                {l}
              </p>
            ))}
          </div>

          <ul className="w-full space-y-3 [text-shadow:0_1px_12px_rgba(0,0,0,0.35)] sm:w-72">
            {projects.map((p, i) => (
              <li
                key={p.name}
                className="fade-up border-t border-white/20 pt-3"
                style={{ animationDelay: `${5.3 + i * 0.25}s` }}
              >
                <a
                  href={p.href}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-baseline gap-3"
                >
                  <span className="font-mono text-[10px] text-white/45">
                    0{i + 1}
                  </span>
                  <span className="flex-1">
                    <span className="block text-[15px] font-medium tracking-[-0.01em]">
                      {p.name}
                    </span>
                    <span className="hidden text-[13px] leading-snug text-white/70 sm:block">
                      {p.blurb}
                    </span>
                  </span>
                  <span className="text-white/50 transition duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white">
                    ↗
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* curtains that open on load */}
        <div className="curtain absolute inset-x-0 top-0 h-1/2 origin-top bg-black" />
        <div className="curtain absolute inset-x-0 bottom-0 h-1/2 origin-bottom bg-black" />
      </section>

      {/* letterbox: bottom */}
      <footer
        className={`${bar} flex flex-col gap-1.5 py-4 sm:h-14 sm:flex-row sm:items-center sm:justify-between sm:py-0`}
      >
        <p className="text-white/85">
          Software engineer / filmmaker / photographer / collector of
          unfinished ideas.
        </p>
        <p>Bangalore, India</p>
      </footer>
    </main>
  );
}
