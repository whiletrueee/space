export type Project = {
  name: string;
  blurb: string;
  tag: string;
  href: string;
};

export const projects: Project[] = [
  {
    name: "Notchingale",
    blurb:
      "Tasks, focus timer, scratchpad and calendar, living in your MacBook's notch.",
    tag: "macOS · Swift",
    href: "https://github.com/akshatsonic/notchingale",
  },
  {
    name: "Code Storyline",
    blurb:
      "A VS Code extension that explains any file in plain, simplified English.",
    tag: "VS Code extension",
    href: "https://github.com/whiletrueee/vscode-code-storyline",
  },
  {
    name: "LinkHive",
    blurb: "The most convenient way to share a URL, right from your browser.",
    tag: "Chrome extension",
    href: "https://chrome.google.com/webstore/detail/link-hive/djdnghagfkekimgckhcmphkgmhlnhcdo",
  },
];
