import Link from "next/link";
import { bar, nav } from "../site";
import "./writing.css";

export default function WritingLayout({ children }: LayoutProps<"/writing">) {
  return (
    <div className="w-page">
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
