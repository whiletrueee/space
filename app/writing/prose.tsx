"use client";

import { useEffect, useRef } from "react";
import { typeset } from "@/lib/typeset";

/** Post body. Prerendered as plain HTML; once fonts load, paragraphs are reset by the typesetter. */
export function Prose({ html }: { html: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) return typeset(ref.current);
  }, [html]);

  return <div ref={ref} className="prose has-dropcap" dangerouslySetInnerHTML={{ __html: html }} />;
}
