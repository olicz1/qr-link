"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PlusCircle, QrCode, User } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/", label: "码柜", en: "Codes", icon: QrCode },
  { href: "/upload", label: "上传", en: "Upload", icon: PlusCircle },
  { href: "/me", label: "我的", en: "Me", icon: User },
] as const;

export function TabBar() {
  const pathname = usePathname();

  return (
    <nav className="grid h-[58px] grid-cols-3 border-t border-black/8 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md">
      {TABS.map((tab) => {
        const active =
          tab.href === "/"
            ? pathname === "/"
            : pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        const Icon = tab.icon;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 text-[10px] leading-none",
              active ? "text-[#07C160]" : "text-[#7A7A7A]",
            )}
          >
            <Icon
              className="size-[22px]"
              strokeWidth={active ? 2.2 : 1.8}
            />
            <span className="font-medium">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
