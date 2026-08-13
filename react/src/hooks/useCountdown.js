import { useEffect, useState } from "react";

const RESIDENCY_START = new Date("2026-10-28T00:00:00+05:30").getTime();

export function useCountdown() {
  const [text, setText] = useState("--d --h --m --s");

  useEffect(() => {
    const tick = () => {
      const diff = RESIDENCY_START - Date.now();
      if (diff <= 0) {
        setText("we're in Goa 🌴");
        return;
      }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setText(`${d}d ${h}h ${m}m ${s}s`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return text;
}
