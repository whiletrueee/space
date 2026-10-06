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
    Some require a <em>plane ticket.</em>
  </>,
];

const bar =
  "shrink-0 bg-black px-5 text-[10px] font-medium tracking-[0.18em] text-white/55 uppercase sm:px-10 sm:text-[11px] sm:tracking-[0.22em] lg:px-14";

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
        <div className="grain" />

        <h1 className="fade-up absolute inset-x-0 top-[7%] px-5 text-center font-serif text-[clamp(2.9rem,8.6vw,9rem)] leading-[0.9] tracking-[-0.03em] text-ink [animation-delay:1.3s] sm:top-[9%]">
          I make things <br />I want to{" "}
          <em>exist.</em>
        </h1>

        <div className="absolute bottom-[7%] left-5 font-serif text-[clamp(1.5rem,2.8vw,2.75rem)] leading-[1.15] text-white sm:left-10 lg:left-14">
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
