"use client";

import { useMemo, useState } from "react";
import { MoreHorizontal, Pin, QrCode, Trash2 } from "lucide-react";
import { CHANNEL_META, type QrChannel } from "@/lib/types";
import { usePayCase } from "@/lib/store";
import { WxDialog } from "@/components/wechat/WxDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import Link from "next/link";

const FILTERS: { id: "all" | QrChannel; label: string }[] = [
  { id: "all", label: "All" },
  { id: "wechat", label: "WeChat" },
  { id: "alipay", label: "Alipay" },
  { id: "unionpay", label: "UnionPay" },
  { id: "link", label: "Links" },
  { id: "text", label: "Text" },
  { id: "custom", label: "Custom" },
];

export function GalleryView() {
  const { ready, sortedItems, openItem, removeItem, togglePin, profile } = usePayCase();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
  const [menuId, setMenuId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const visible = useMemo(() => {
    if (filter === "all") return sortedItems;
    return sortedItems.filter((item) => item.channel === filter);
  }, [sortedItems, filter]);

  if (!ready) {
    return (
      <div className="p-3">
        <Skeleton className="mb-3 h-16 rounded-xl" />
        <div className="grid grid-cols-2 gap-2.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-52 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="px-3 pb-4">
      <section className="mt-3 rounded-xl bg-white px-4 py-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <p className="text-[12px] text-[#888]">{profile.shopNameEn}</p>
        <h1 className="text-[18px] font-medium text-[#191919]">{profile.shopName}</h1>
        <p className="mt-1 text-[12px] leading-relaxed text-[#888]">
          Tap a code to pop the pay sheet, a page, or the decoded content.
          Upload your own QR from the 上传 tab.
        </p>
      </section>

      <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {FILTERS.map((chip) => (
          <button
            key={chip.id}
            type="button"
            onClick={() => setFilter(chip.id)}
            className={cn(
              "h-7 shrink-0 rounded-full px-3 text-[12px]",
              filter === chip.id
                ? "bg-[#07C160] text-white"
                : "bg-white text-[#191919] ring-1 ring-black/6",
            )}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <EmptyState filtered={sortedItems.length > 0} />
      ) : (
        <div className="mt-3 grid grid-cols-2 gap-2.5">
          {visible.map((item) => {
            const meta = CHANNEL_META[item.channel];
            return (
              <article
                key={item.id}
                className="relative overflow-hidden rounded-xl bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] ring-1 ring-black/4"
              >
                <button
                  type="button"
                  onClick={() => openItem(item.id)}
                  className="block w-full text-left active:bg-black/2"
                >
                  <div className="relative bg-[#FAFAFA] p-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.imageDataUrl}
                      alt={item.title}
                      className="aspect-square w-full bg-white"
                    />
                    {item.pinned ? (
                      <span className="absolute top-2 left-2 flex size-5 items-center justify-center rounded-full bg-[#07C160] text-white">
                        <Pin className="size-3 fill-white" />
                      </span>
                    ) : null}
                  </div>
                  <div className="px-2.5 pt-2 pb-2.5">
                    <div className="flex items-start justify-between gap-1">
                      <h2 className="truncate text-[14px] font-medium text-[#191919]">
                        {item.title}
                      </h2>
                    </div>
                    <p className="truncate text-[11px] text-[#888]">{item.subtitle}</p>
                    <span
                      className="mt-1.5 inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-medium text-white"
                      style={{ backgroundColor: meta.color }}
                    >
                      {meta.labelZh}
                    </span>
                  </div>
                </button>
                <button
                  type="button"
                  className="absolute top-1.5 right-1.5 flex size-7 items-center justify-center rounded-full bg-white/90 text-[#888] shadow-sm ring-1 ring-black/6"
                  aria-label="Manage code"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuId((id) => (id === item.id ? null : item.id));
                  }}
                >
                  <MoreHorizontal className="size-4" />
                </button>
                {menuId === item.id ? (
                  <div className="absolute top-9 right-1.5 z-10 w-[132px] overflow-hidden rounded-lg bg-white py-1 text-[13px] shadow-lg ring-1 ring-black/8">
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 px-3 py-2 text-left active:bg-black/4"
                      onClick={() => {
                        togglePin(item.id);
                        setMenuId(null);
                      }}
                    >
                      <Pin className="size-3.5" />
                      {item.pinned ? "Unpin" : "Pin to top"}
                    </button>
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-[#FA5151] active:bg-black/4"
                      onClick={() => {
                        setMenuId(null);
                        setPendingDelete(item.id);
                      }}
                    >
                      <Trash2 className="size-3.5" />
                      Delete
                    </button>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      )}

      <WxDialog
        open={pendingDelete !== null}
        title="Delete this code?"
        message="It will be removed from this device. You can upload it again later."
        confirmText="Delete"
        cancelText="Cancel"
        destructive
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) removeItem(pendingDelete);
          setPendingDelete(null);
        }}
      />
    </div>
  );
}

function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <div className="mt-16 flex flex-col items-center px-8 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-white text-[#07C160] shadow-sm">
        <QrCode className="size-8" />
      </div>
      <h2 className="mt-4 text-[17px] font-medium">
        {filtered ? "Nothing in this filter" : "No codes yet"}
      </h2>
      <p className="mt-1 text-[13px] leading-relaxed text-[#888]">
        {filtered
          ? "Try All, or upload a QR that matches this channel."
          : "Upload a WeChat Pay, Alipay, or any other QR image to start the gallery."}
      </p>
      {!filtered ? (
        <Link
          href="/upload"
          className="mt-5 inline-flex h-10 items-center rounded-full bg-[#07C160] px-5 text-[14px] font-medium text-white"
        >
          Upload a QR code
        </Link>
      ) : null}
    </div>
  );
}
