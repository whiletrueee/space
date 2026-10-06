import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

// Geist from the official `geist` package; its GeistSans export skips the
// italic axis, so load both variable files here.
const geistSans = localFont({
  src: [
    {
      path: "../node_modules/geist/dist/fonts/geist-sans/Geist-Variable.woff2",
      weight: "100 900",
      style: "normal",
    },
    {
      path: "../node_modules/geist/dist/fonts/geist-sans/Geist-Italic[wght].woff2",
      weight: "100 900",
      style: "italic",
    },
  ],
  variable: "--font-geist-sans",
});

export const metadata: Metadata = {
  title: "whiletrueee — Harshit Singh",
  description:
    "I make things I want to exist. Software engineer, filmmaker, photographer, collector of unfinished ideas.",
};

export const viewport: Viewport = {
  themeColor: "#000000",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${GeistMono.variable} antialiased`}
    >
      <body>{children}</body>
    </html>
  );
}
