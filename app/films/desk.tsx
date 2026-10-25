"use client";

import { useEffect, useRef } from "react";

const STRIP = Array.from({ length: 12 }, (_, i) => `/films/strip/${i + 1}.jpg`);

/**
 * What lies on the desk around the script, at night: streetlight through the blinds, now and then
 * a car's headlights sweeping across it, dust hanging in the lamp light, and two strips of film.
 * All of it sits behind the paper and goes still for readers who ask for reduced motion.
 */
export function Desk() {
  const dust = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = dust.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let w = 0, h = 0, frame = 0;
    const dpr = Math.min(devicePixelRatio, 2);
    const resize = () => {
      w = canvas.width = innerWidth * dpr;
      h = canvas.height = innerHeight * dpr;
    };
    resize();
    addEventListener("resize", resize);

    // each mote has a depth: near ones are larger, softer and faster, far ones small and slow
    const motes = Array.from({ length: 70 }, () => ({
      x: Math.random(),
      y: Math.random(),
      z: Math.random(),
      drift: Math.random() * Math.PI * 2,
    }));

    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h);
      for (const m of motes) {
        const speed = 0.000006 + m.z * 0.000018;
        m.y -= speed * 16;
        m.x += Math.sin(t * 0.0003 + m.drift) * 0.00006;
        if (m.y < -0.02) {
          m.y = 1.02;
          m.x = Math.random();
        }
        const r = (0.6 + m.z * 2.4) * dpr;
        // brighter inside the lamp's pool of light, towards the top left
        const lit = Math.max(0.15, 1 - Math.hypot(m.x - 0.3, m.y - 0.25) * 1.1);
        const flicker = 0.75 + 0.25 * Math.sin(t * 0.002 + m.drift * 5);
        ctx.globalAlpha = (0.12 + m.z * 0.4) * lit * flicker;
        ctx.fillStyle = "#ffe2b0";
        ctx.beginPath();
        ctx.arc(m.x * w, m.y * h, r, 0, Math.PI * 2);
        ctx.fill();
      }
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);

    // nothing to animate while the tab is hidden
    const onVisibility = () => {
      cancelAnimationFrame(frame);
      if (!document.hidden) frame = requestAnimationFrame(draw);
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelAnimationFrame(frame);
      removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <div className="sd-desk" aria-hidden>
      <div className="sd-lamp" />
      <div className="sd-blinds" />
      <div className="sd-headlights" />
      {["left", "right"].map((side, s) => (
        <div key={side} className={`sd-strip ${side}`}>
          <div className="sd-reel">
            {/* the frames four times over: the loop moves half the reel, which must outrun the strip's height */}
            {Array.from({ length: 4 }, () => [...STRIP.slice(s * 6), ...STRIP.slice(0, s * 6)]).flat().map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element -- static export, no optimizer
              <img key={i} src={src} alt="" loading="lazy" />
            ))}
          </div>
        </div>
      ))}
      <canvas ref={dust} className="sd-dust" />
    </div>
  );
}
