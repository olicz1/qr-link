"use client";

import { useEffect, useState } from "react";
import { Signal, Wifi } from "lucide-react";

export function StatusBar() {
  const [now, setNow] = useState(() => formatTime(new Date()));

  useEffect(() => {
    const id = window.setInterval(() => setNow(formatTime(new Date())), 10_000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="relative z-20 flex h-[52px] items-end px-7 pb-1.5 text-[13px] font-semibold text-black">
      <span className="w-16">{now}</span>
      <div className="pointer-events-none absolute top-2.5 left-1/2 h-[26px] w-[118px] -translate-x-1/2 rounded-full bg-black" />
      <div className="ml-auto flex items-center gap-1">
        <Signal className="size-3.5" strokeWidth={2.4} />
        <Wifi className="size-3.5" strokeWidth={2.4} />
        <span className="ml-0.5 inline-flex h-[11px] w-[25px] items-center rounded-[3px] border border-black/80 p-px">
          <span className="h-full w-[70%] rounded-[1px] bg-black" />
        </span>
      </div>
    </div>
  );
}

function formatTime(date: Date) {
  return date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}
