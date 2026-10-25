import { Instrument_Serif, Newsreader } from "next/font/google";
import Link from "next/link";
import { bar, nav } from "../site";
import "./writing.css";

// Display: a condensed, high-contrast serif for titles. Text: a serif cut for reading on screens,
// with an optical-size axis so it tightens at display sizes and opens up in the body.
const display = Instrument_Serif({ weight: "400", style: ["normal", "italic"], subsets: ["latin"], variable: "--font-display" });
const text = Newsreader({ style: ["normal", "italic"], axes: ["opsz"], subsets: ["latin"], variable: "--font-text" });

export default function WritingLayout({ children }: LayoutProps<"/writing">) {
  return (
    <div className={`w-page ${display.variable} ${text.variable}`}>
      <header className={`${bar} sticky top-0 z-10 flex h-14 items-center justify-between`}>
        <Link href="/" className="text-white/85">
          whiletrueee
        </Link>
        <nav className="flex gap-3.5 sm:gap-8">
          {nav.map((n) => (
            <Link
              key={n.label}
              href={n.href}
              className={`transition-colors hover:text-white ${n.label === "Writing" ? "text-white" : ""}`}
            >
              {n.label}
            </Link>
          ))}
        </nav>
      </header>

      {children}

      <footer className={`${bar} flex flex-col gap-1.5 py-4 sm:h-14 sm:flex-row sm:items-center sm:justify-between sm:py-0`}>
        <p>Bangalore, India</p>
      </footer>
    </div>
  );
}
