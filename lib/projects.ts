export type Status = "shipping" | "tinkering" | "paused" | "archived";

export type Project = {
  name: string;
  blurb: string;
  stack: string[];
  status: Status;
  year: number;
  href?: string;
};

// The loop. Add a line, push, done.
export const projects: Project[] = [
  {
    name: "Notchingale",
    blurb:
      "A native macOS utility pinned to the hardware notch. Tasks, focus timer, scratchpad and calendar in one hover popover.",
    stack: ["Swift", "SwiftUI", "AppKit"],
    status: "shipping",
    year: 2026,
    href: "https://github.com/akshatsonic/notchingale",
  },
  {
    name: "Code Storyline",
    blurb:
      "A VS Code extension that explains the file you open in Simplified Technical English. For reading code in languages you don't write.",
    stack: ["VS Code", "TypeScript", "opencode"],
    status: "tinkering",
    year: 2026,
    href: "https://github.com/whiletrueee/vscode-code-storyline",
  },
  {
    name: "Odyssey",
    blurb:
      "A browser game with cinematic scenes, built scene by scene whenever the mood strikes.",
    stack: ["React", "TypeScript", "Vite"],
    status: "tinkering",
    year: 2026,
  },
  {
    name: "React 19 Labs",
    blurb:
      "Side-by-side playgrounds for Actions, useOptimistic and transitions: the old plumbing next to the new primitives.",
    stack: ["React 19", "Vite"],
    status: "paused",
    year: 2026,
  },
  {
    name: "LinkHive",
    blurb: "A Chrome extension for the most convenient way to share a URL.",
    stack: ["Chrome", "JavaScript"],
    status: "shipping",
    year: 2023,
    href: "https://chrome.google.com/webstore/detail/link-hive/djdnghagfkekimgckhcmphkgmhlnhcdo",
  },
  {
    name: "Gophercises",
    blurb: "Learning Go, one exercise at a time. Yes, I know it's late.",
    stack: ["Go"],
    status: "paused",
    year: 2023,
    href: "https://github.com/whiletrueee/gophercises",
  },
  {
    name: "The Zeal",
    blurb: "An early React build, kept around as a time capsule.",
    stack: ["React", "Tailwind"],
    status: "archived",
    year: 2023,
  },
  {
    name: "KhetConnecty",
    blurb: "The college major project. Where a lot of this started.",
    stack: ["Full-stack"],
    status: "archived",
    year: 2022,
  },
];

export const statusLabel: Record<Status, string> = {
  shipping: "shipping",
  tinkering: "tinkering",
  paused: "on pause",
  archived: "archived",
};
