"use client";

import { useState } from "react";

const VIDEO = "k4ZMv9w-8RI"; // Tango for Taj, Rockstar (2011), A.R. Rahman
const SRC = `https://www.youtube-nocookie.com/embed/${VIDEO}?autoplay=1&loop=1&playlist=${VIDEO}&rel=0&playsinline=1`;

/**
 * An old CRT on the desk that plays Tango for Taj. The YouTube player is the screen itself: it is
 * never smaller than YouTube's 200 by 200 minimum and nothing is ever drawn over it. The glow, the
 * curved glass and the bezel all sit around it. Until the power button is pressed there is no
 * player at all, only dark glass, so nothing loads or plays for visitors who never turn it on.
 */
export function Crt() {
  const [on, setOn] = useState(false);
  const [warm, setWarm] = useState(false);

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
    <aside className={`crt${on ? " is-on" : ""}`} aria-label="Tango for Taj, on a television">
      <div className="crt-body">
        <div className="crt-vents" aria-hidden />
        <div className="crt-bezel">
          <div className="crt-screen">
            {on && warm ? (
              <iframe
                src={SRC}
                title="Tango for Taj, from Rockstar, by A.R. Rahman"
                allow="autoplay; encrypted-media; picture-in-picture"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            ) : (
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
            Tango for Taj
            <span>A.R. Rahman · Rockstar, 2011</span>
          </p>
          <span className="crt-knob" aria-hidden />
          <span className="crt-knob" aria-hidden />
          <button type="button" className="crt-power" onClick={power} aria-pressed={on} aria-label={on ? "Turn the television off" : "Turn the television on"}>
            <span className="crt-led" />
          </button>
        </div>
      </div>
      <div className="crt-foot" aria-hidden />
    </aside>
  );
}
