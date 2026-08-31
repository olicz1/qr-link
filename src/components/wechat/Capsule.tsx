"use client";

import { MoreHorizontal } from "lucide-react";

export function Capsule() {
  return (
    <div className="flex h-[26px] items-center overflow-hidden rounded-full border border-black/15 bg-black/5">
      <button
        type="button"
        className="flex h-full w-[42px] items-center justify-center text-black/70"
        aria-label="More"
      >
        <MoreHorizontal className="size-4" />
      </button>
      <span className="h-3.5 w-px bg-black/15" />
      <button
        type="button"
        className="flex h-full w-[42px] items-center justify-center text-black/70"
        aria-label="Close mini program"
      >
        <span className="flex size-[15px] items-center justify-center rounded-full border-[1.5px] border-black/55">
          <span className="block size-[7px] rounded-full border-[1.5px] border-black/55" />
        </span>
      </button>
    </div>
  );
}
