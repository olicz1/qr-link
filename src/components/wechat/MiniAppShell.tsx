"use client";

import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { StatusBar } from "./StatusBar";
import { NavBar } from "./NavBar";
import { TabBar } from "./TabBar";
import { WxToast } from "./WxToast";
import { ActionSheet } from "@/components/pay/ActionSheet";

const PAGE_META: Record<string, { title: string; subtitle?: string; back?: boolean }> = {
  "/": { title: "码柜", subtitle: "PayCase" },
  "/upload": { title: "上传收款码", subtitle: "Add a QR" },
  "/me": { title: "我的", subtitle: "Merchant" },
  "/promo": { title: "周末套餐", subtitle: "Weekend set", back: true },
};

export function MiniAppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const meta = PAGE_META[pathname] ?? { title: "码柜", back: pathname !== "/" };
  const showTab = pathname === "/" || pathname === "/upload" || pathname === "/me";

  return (
    <div className="flex min-h-dvh items-stretch justify-center bg-[#EDEDED] sm:items-center sm:bg-[#121a16] sm:px-3 sm:py-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-[1080px] items-center justify-center gap-16">
        <aside className="hidden max-w-[340px] text-white lg:block">
          <p className="text-[13px] tracking-[0.18em] text-[#7dba94] uppercase">
            WeChat mini program demo
          </p>
          <h1 className="mt-3 text-5xl font-medium tracking-tight">码柜</h1>
          <p className="mt-1 text-xl text-white/70">PayCase</p>
          <p className="mt-5 text-[15px] leading-relaxed text-white/65">
            A counter-side mini program for East Wind Noodles. Upload payment
            QR images, keep them in a gallery, and tap a card to pop a pay
            sheet — or open a page, or show the decoded text.
          </p>
          <ul className="mt-6 space-y-2 text-[14px] text-white/60">
            <li className="flex gap-2">
              <span className="text-[#07C160]">01</span>
              Upload WeChat / Alipay / any QR
            </li>
            <li className="flex gap-2">
              <span className="text-[#07C160]">02</span>
              Tap a card for the payment popup
            </li>
            <li className="flex gap-2">
              <span className="text-[#07C160]">03</span>
              Bridge file ready for real <span className="font-mono">wx.*</span> APIs
            </li>
          </ul>
        </aside>

        <div className="relative w-full sm:max-w-[390px]">
          <div className="pointer-events-none absolute -inset-8 hidden rounded-[56px] bg-[#07C160]/10 blur-2xl sm:block" />
          <div className="relative h-dvh overflow-hidden bg-[#EDEDED] sm:h-[min(844px,100dvh-2rem)] sm:rounded-[42px] sm:border-[8px] sm:border-[#1a1d1b] sm:bg-black sm:shadow-[0_40px_80px_rgba(0,0,0,0.45)]">
            <div className="relative flex h-full min-h-0 flex-col bg-[#EDEDED]">
              <StatusBar />
              <NavBar
                title={meta.title}
                subtitle={meta.subtitle}
                showBack={meta.back}
                onBack={() => router.push("/")}
              />
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                {children}
              </div>
              {showTab ? <TabBar /> : null}
              <div id="paycase-overlay" className="pointer-events-none absolute inset-0 z-40 [&>*]:pointer-events-auto" />
              <ActionSheet />
              <WxToast />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
