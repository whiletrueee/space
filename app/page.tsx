import { projects, statusLabel, type Status } from "@/lib/projects";

const links = {
  github: "https://github.com/whiletrueee",
  x: "https://x.com/singharshit07",
  blog: "https://blogs.singhharshit.me",
};

const statusDot: Record<Status, string> = {
  shipping: "bg-ok",
  tinkering: "bg-accent",
  paused: "bg-warm",
  archived: "bg-muted",
};

const marqueeWords = ["tinker", "break", "ship", "learn", "repeat"];

export default function Home() {
  const counts = projects.reduce(
    (acc, p) => ({ ...acc, [p.status]: (acc[p.status] ?? 0) + 1 }),
    {} as Partial<Record<Status, number>>,
  );

  return (
    <div className="relative mx-auto w-full max-w-6xl px-5 sm:px-8">
      <Nav />

      {/* hero */}
      <section className="relative pt-16 pb-20 sm:pt-28 sm:pb-28">
        <p className="rise font-mono text-xs tracking-wide text-muted">
          ~/whiletrueee <span className="text-accent">●</span> Bangalore, IN
        </p>

        <h1 className="rise mt-8 max-w-4xl font-serif text-[clamp(2.75rem,8vw,6.75rem)] leading-[0.95] tracking-tight [animation-delay:80ms]">
          A small corner of the internet where I keep{" "}
          <em className="text-accent">starting things.</em>
        </h1>

        <div className="rise mt-10 flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between [animation-delay:160ms]">
          <p className="max-w-md text-base leading-relaxed text-muted sm:text-lg">
            I&apos;m Harshit, a software engineer. This is where the side
            projects live: the shipped ones, the half-built ones, and the ones I
            swore I&apos;d come back to.
          </p>

          <pre className="w-fit rounded-xl border border-line bg-paper-2 px-5 py-4 font-mono text-sm leading-6">
            <span className="text-accent">while</span> (
            <span className="text-ok">true</span>) {"{"}
            {"\n"}
            {"  "}tinker();{"\n"}
            {"  "}ship();{"\n"}
            {"  "}learn();
            <span className="caret ml-0.5 inline-block h-4 w-2 translate-y-0.5 bg-ink" />
            {"\n"}
            {"}"}
          </pre>
        </div>

        <LoopBadge />
      </section>

      <Marquee />

      {/* projects */}
      <section id="work" className="scroll-mt-8 py-20 sm:py-28">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-xs text-muted">
              01 — the loop
            </p>
            <h2 className="mt-3 font-serif text-5xl sm:text-6xl">
              Things I&apos;m making
            </h2>
          </div>
          <ul className="flex flex-wrap gap-x-5 gap-y-2 font-mono text-xs text-muted">
            {(Object.keys(statusLabel) as Status[]).map((s) => (
              <li key={s} className="flex items-center gap-2">
                <span className={`size-2 rounded-full ${statusDot[s]}`} />
                {statusLabel[s]}
                <span className="text-ink">{counts[s] ?? 0}</span>
              </li>
            ))}
          </ul>
        </div>

        <ol className="mt-12 border-t border-line">
          {projects.map((p, i) => {
            const Row = p.href ? "a" : "div";
            return (
              <li key={p.name} className="border-b border-line">
                <Row
                  {...(p.href
                    ? { href: p.href, target: "_blank", rel: "noreferrer" }
                    : {})}
                  className="group grid grid-cols-[2.5rem_1fr] gap-x-4 gap-y-3 py-7 transition-colors sm:grid-cols-[3rem_minmax(0,1.1fr)_minmax(0,1.4fr)_8rem] sm:items-baseline sm:gap-x-8 sm:px-3 hover:bg-paper-2"
                >
                  <span className="font-mono text-xs text-muted">
                    {String(i + 1).padStart(2, "0")}
                  </span>

                  <h3 className="font-serif text-3xl leading-none sm:text-4xl">
                    <span className="bg-[linear-gradient(currentColor,currentColor)] bg-[length:0%_1px] bg-left-bottom bg-no-repeat transition-[background-size] duration-500 group-hover:bg-[length:100%_1px]">
                      {p.name}
                    </span>
                    {p.href && (
                      <span className="ml-2 inline-block text-xl text-accent opacity-0 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100">
                        ↗
                      </span>
                    )}
                  </h3>

                  <div className="col-start-2 sm:col-start-auto">
                    <p className="leading-relaxed text-muted">{p.blurb}</p>
                    <ul className="mt-3 flex flex-wrap gap-1.5">
                      {p.stack.map((t) => (
                        <li
                          key={t}
                          className="rounded-full border border-line px-2.5 py-0.5 font-mono text-[11px] text-muted"
                        >
                          {t}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="col-start-2 flex items-center gap-3 font-mono text-xs text-muted sm:col-start-auto sm:flex-col sm:items-end sm:gap-1">
                    <span className="flex items-center gap-2">
                      <span
                        className={`size-2 rounded-full ${statusDot[p.status]}`}
                      />
                      {statusLabel[p.status]}
                    </span>
                    <span>{p.year}</span>
                  </div>
                </Row>
              </li>
            );
          })}
        </ol>
      </section>

      {/* now */}
      <section className="grid gap-10 pb-20 pt-4 sm:grid-cols-[1fr_2fr] sm:py-28">
        <div>
          <p className="font-mono text-xs text-muted">02 — now</p>
          <h2 className="mt-3 font-serif text-5xl sm:text-6xl">
            Current <em>iteration</em>
          </h2>
        </div>
        <div className="space-y-5 text-lg leading-relaxed sm:text-xl">
          <p>
            Building small tools that sit close to how I work: notch apps,
            editor extensions, and the occasional game when I need a break from
            being useful.
          </p>
          <p className="text-muted">
            Most of it starts as a weekend itch. Some of it ships. All of it
            ends up here.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function Nav() {
  return (
    <header className="flex items-center justify-between py-6 font-mono text-sm">
      <a href="#" className="flex items-center gap-2">
        <span className="grid size-7 place-items-center rounded-md bg-ink text-paper">
          ∞
        </span>
        whiletrueee
      </a>
      <nav className="flex items-center gap-5 text-muted">
        <a href="#work" className="transition-colors hover:text-ink">
          work
        </a>
        <a
          href={links.blog}
          target="_blank"
          rel="noreferrer"
          className="transition-colors hover:text-ink"
        >
          writing
        </a>
        <a
          href={links.github}
          target="_blank"
          rel="noreferrer"
          className="transition-colors hover:text-ink"
        >
          github
        </a>
      </nav>
    </header>
  );
}

function LoopBadge() {
  return (
    <div className="pointer-events-none absolute top-20 right-0 hidden lg:block">
      <svg viewBox="0 0 200 200" className="spin-slow size-40 text-muted">
        <defs>
          <path
            id="circle"
            d="M100,100 m-78,0 a78,78 0 1,1 156,0 a78,78 0 1,1 -156,0"
          />
        </defs>
        <text className="fill-current font-mono text-[13px] tracking-[0.3em] uppercase">
          <textPath href="#circle">
            while true · keep building · while true · keep building ·
          </textPath>
        </text>
      </svg>
      <span className="absolute inset-0 grid place-items-center font-serif text-5xl text-accent italic">
        ∞
      </span>
    </div>
  );
}

function Marquee() {
  const row = Array.from({ length: 4 }, () => marqueeWords).flat();
  return (
    <div className="relative -mx-5 overflow-hidden border-y border-line py-5 sm:-mx-8">
      <div className="marquee flex w-max gap-10 font-serif text-4xl whitespace-nowrap italic sm:text-5xl">
        {[...row, ...row].map((w, i) => (
          <span key={i} className="flex items-center gap-10">
            {w}
            <span className="font-sans text-2xl not-italic text-accent">✶</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="border-t border-line pt-20 pb-10">
      <p className="font-serif text-[clamp(3rem,11vw,9rem)] leading-[0.9] tracking-tight">
        keep <em className="text-accent">looping.</em>
      </p>
      <div className="mt-14 flex flex-col gap-6 font-mono text-sm sm:flex-row sm:items-center sm:justify-between">
        <ul className="flex flex-wrap gap-6">
          {Object.entries(links).map(([k, href]) => (
            <li key={k}>
              <a
                href={href}
                target="_blank"
                rel="noreferrer"
                className="text-muted transition-colors hover:text-accent"
              >
                {k} ↗
              </a>
            </li>
          ))}
        </ul>
        <p className="text-xs text-muted">
          © {new Date().getFullYear()} Harshit Singh · built in the loop
        </p>
      </div>
    </footer>
  );
}
