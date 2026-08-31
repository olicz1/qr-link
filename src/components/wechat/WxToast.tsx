"use client";

import { Check, Loader2, X } from "lucide-react";
import { usePayCase } from "@/lib/store";
import { cn } from "@/lib/utils";

export function WxToast() {
  const { toast } = usePayCase();
  if (!toast) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center">
      <div className="flex min-w-[120px] max-w-[220px] flex-col items-center gap-2 rounded-xl bg-black/78 px-6 py-5 text-white shadow-lg">
        {toast.variant === "success" ? <Check className="size-8" strokeWidth={2.4} /> : null}
        {toast.variant === "error" ? <X className="size-8" strokeWidth={2.4} /> : null}
        {toast.variant === "loading" ? (
          <Loader2 className="size-8 animate-spin" strokeWidth={2.2} />
        ) : null}
        <p className={cn("text-center text-[14px] leading-snug", toast.variant === "none" && "py-1")}>
          {toast.message}
        </p>
      </div>
    </div>
  );
}
