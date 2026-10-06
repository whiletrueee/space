"use client";

import { useState } from "react";
import { mountainBlur } from "@/lib/blur";

const cover = "absolute inset-0 size-full object-cover object-[50%_0%]";

/**
 * Focus pull: a pre-blurred copy paints instantly, the sharp photo fades in
 * over it once loaded. Only opacity and transform animate, so the GPU does
 * all the work and nothing re-rasterises mid-animation.
 */
export function HeroImage() {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="kenburns absolute inset-0 -z-20">
      {/* eslint-disable @next/next/no-img-element */}
      <img src={mountainBlur} alt="" aria-hidden className={cover} />
      <img
        // catches an image that finished loading before hydration
        ref={(img) => {
          if (img?.complete && img.naturalWidth) setLoaded(true);
        }}
        src="/mountain-1920.jpg"
        srcSet="/mountain-1280.jpg 1280w, /mountain-1920.jpg 1920w, /mountain-2880.jpg 2880w, /mountain-3840.jpg 3840w"
        sizes="(max-aspect-ratio: 1/1) 145vh, 100vw"
        alt="Snow-capped peak at golden hour"
        fetchPriority="high"
        decoding="async"
        // fade in only once decoded, so a late load never hitches a frame
        onLoad={(e) =>
          e.currentTarget
            .decode()
            .catch(() => {})
            .then(() => setLoaded(true))
        }
        className={`focus-pull ${cover} ${loaded ? "is-loaded" : ""}`}
      />
      {/* frosted, grainy edges top and bottom */}
      <img src={mountainBlur} alt="" aria-hidden className={`edge-blur ${cover}`} />
      {/* eslint-enable @next/next/no-img-element */}
    </div>
  );
}
