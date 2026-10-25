"use client";

import { useEffect, useRef } from "react";
import { fitTitle } from "@/lib/fit";

/** A title set line by line to the full width. Prerendered as plain balanced text. */
export function FitTitle({
  text,
  as: Tag = "span",
  className,
  target = 0.07,
  min = 26,
  maxRatio = 0.12,
}: {
  text: string;
  as?: "span" | "h1";
  className?: string;
  target?: number;
  min?: number;
  maxRatio?: number;
}) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (ref.current) return fitTitle(ref.current, { target, min, maxRatio });
  }, [text, target, min, maxRatio]);

  return (
    <Tag ref={ref as never} className={`fit ${className ?? ""}`}>
      {text}
    </Tag>
  );
}
