"use client";

import { useEffect, useRef, useState } from "react";

const PLAYLIST = "OLAK5uy_m5Z94CWieuslYRGeVKhzO1jyW6hcZJ4x4"; // Rockstar (2011), the album
const FIRST = "k4ZMv9w-8RI"; // Tango for Taj: the album plays on from here
const VOLUME = 30; // where it starts; the player's own control changes it from there

type Player = {
  setVolume(v: number): void;
  getPlaylist(): string[] | null;
  playVideoAt(i: number): void;
  setLoop(loop: boolean): void;
  destroy(): void;
};
type YT = { Player: new (el: HTMLElement, opts: object) => Player };
declare global {
  interface Window {
    YT?: YT;
    onYouTubeIframeAPIReady?: () => void;
  }
}

// YouTube's iframe API, loaded once, the first time the television is switched on
let api: Promise<YT> | undefined;
function loadApi() {
  api ??= new Promise((resolve) => {
    if (window.YT?.Player) return resolve(window.YT);
    window.onYouTubeIframeAPIReady = () => resolve(window.YT!);
    const s = document.createElement("script");
    s.src = "https://www.youtube.com/iframe_api";
    document.head.append(s);
  });
  return api;
}

/**
 * An old CRT on the desk that plays the Rockstar album, starting on Tango for Taj. The YouTube
 * player is the screen itself: never smaller than YouTube's 200 by 200 minimum, and nothing is ever
 * drawn over it. The glow, the curved glass and the bezel all sit around it. Until the power button
 * is pressed there is no player at all, so nothing loads or plays for visitors who never turn it on.
 */
export function Crt() {
  const [on, setOn] = useState(false);
  const [warm, setWarm] = useState(false);
  const mount = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!warm || !mount.current) return;
    let player: Player | undefined;
    let cancelled = false;
    const el = document.createElement("div");
    mount.current.append(el);
    loadApi().then((YT) => {
      if (cancelled) return;
      player = new YT.Player(el, {
        host: "https://www.youtube-nocookie.com",
        width: "100%",
        height: "100%",
        playerVars: { listType: "playlist", list: PLAYLIST, autoplay: 1, rel: 0, playsinline: 1 },
        events: {
          onReady: (e: { target: Player }) => {
            const p = e.target;
            p.setVolume(VOLUME);
            p.setLoop(true);
            const at = p.getPlaylist()?.indexOf(FIRST) ?? -1;
            if (at > 0) p.playVideoAt(at);
          },
        },
      });
    });
    return () => {
      cancelled = true;
      player?.destroy();
      el.remove();
    };
  }, [warm]);

  const power = () => {
    if (on) {
      setOn(false);
      setWarm(false);
      return;
    }
    setOn(true);
    // the tube warms up: a bright line opens into a picture, then the player takes the screen
    setTimeout(() => setWarm(true), 650);
  };

  return (
    <aside className={`crt${on ? " is-on" : ""}`} aria-label="The Rockstar soundtrack, on a television">
      <div className="crt-body">
        <div className="crt-vents" aria-hidden />
        <div className="crt-bezel">
          <div className="crt-screen" ref={mount}>
            {!(on && warm) && (
              <div className={`crt-glass${on ? " is-warming" : ""}`}>
                {!on && (
                  <p>
                    Channel 01
                    <br />
                    Press power
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="crt-panel">
          <p className="crt-label">
            Rockstar
            <span>A.R. Rahman · 2011 · from Tango for Taj</span>
          </p>
          <span className="crt-knob" aria-hidden />
          <span className="crt-knob" aria-hidden />
          <button
            type="button"
            className="crt-power"
            onClick={power}
            aria-pressed={on}
            aria-label={on ? "Turn the television off" : "Turn the television on"}
          >
            <span className="crt-led" />
          </button>
        </div>
      </div>
      <div className="crt-foot" aria-hidden />
    </aside>
  );
}
