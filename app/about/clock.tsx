"use client";

import { useSyncExternalStore } from "react";

const ist = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Kolkata",
  hour: "2-digit",
  minute: "2-digit",
});
const subscribe = (tick: () => void) => {
  const id = setInterval(tick, 10_000);
  return () => clearInterval(id);
};

/** The time in Bangalore, to the minute. Empty on the server so the first paint never disagrees. */
export function Clock() {
  const time = useSyncExternalStore(
    subscribe,
    () => ist.format(new Date()),
    () => "",
  );
  return <time className="ab-clock">{time && <>{time} IST</>}</time>;
}
