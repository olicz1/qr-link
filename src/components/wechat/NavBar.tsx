"use client";

import { ChevronLeft } from "lucide-react";
import { Capsule } from "./Capsule";

type NavBarProps = {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
};

export function NavBar({ title, subtitle, showBack, onBack }: NavBarProps) {
  return (
    <div className="relative z-10 flex h-11 items-center px-3">
      <div className="flex w-11 items-center">
        {showBack ? (
          <button
            type="button"
            onClick={onBack}
            className="flex size-9 items-center justify-center rounded-full active:bg-black/5"
            aria-label="Back"
          >
            <ChevronLeft className="size-6" strokeWidth={1.75} />
          </button>
        ) : null}
      </div>
      <div className="min-w-0 flex-1 text-center">
        <div className="truncate text-[17px] font-medium leading-tight text-[#191919]">
          {title}
        </div>
        {subtitle ? (
          <div className="truncate text-[10px] leading-tight text-[#888]">
            {subtitle}
          </div>
        ) : null}
      </div>
      <div className="flex w-[96px] justify-end">
        <Capsule />
      </div>
    </div>
  );
}
