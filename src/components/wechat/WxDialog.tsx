"use client";

import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

type WxDialogProps = {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function WxDialog({
  open,
  title,
  message,
  confirmText = "确定",
  cancelText = "取消",
  destructive,
  onConfirm,
  onCancel,
}: WxDialogProps) {
  if (!open || typeof document === "undefined") return null;
  const host = document.getElementById("paycase-overlay");
  if (!host) return null;

  return createPortal(
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/45 px-10">
      <div className="w-full overflow-hidden rounded-[14px] bg-white shadow-xl">
        <div className="px-5 pt-6 pb-4 text-center">
          <h2 className="text-[17px] font-medium text-[#191919]">{title}</h2>
          <p className="mt-2 text-[14px] leading-relaxed text-[#888]">{message}</p>
        </div>
        <div className="grid grid-cols-2 border-t border-black/8">
          <button
            type="button"
            onClick={onCancel}
            className="h-12 text-[17px] text-[#191919] active:bg-black/4"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={cn(
              "h-12 border-l border-black/8 text-[17px] font-medium active:bg-black/4",
              destructive ? "text-[#FA5151]" : "text-[#07C160]",
            )}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>,
    host,
  );
}
