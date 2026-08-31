"use client";

import { useState } from "react";
import {
  ChevronRight,
  RotateCcw,
  Store,
  Trash2,
  Wallet,
} from "lucide-react";
import { usePayCase } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { WxDialog } from "@/components/wechat/WxDialog";

export function MeView() {
  const { profile, setProfile, items, restoreDemo, clearAll } = usePayCase();
  const [confirm, setConfirm] = useState<"restore" | "clear" | null>(null);

  return (
    <div className="px-3 pb-8">
      <section className="mt-3 flex items-center gap-3 rounded-xl bg-white px-4 py-4 ring-1 ring-black/5">
        <div className="flex size-14 items-center justify-center rounded-xl bg-[#07C160] text-[22px] font-medium text-white">
          东
        </div>
        <div className="min-w-0 flex-1">
          <Input
            value={profile.shopName}
            onChange={(e) => setProfile({ ...profile, shopName: e.target.value })}
            className="h-7 border-0 bg-transparent px-0 text-[17px] font-medium shadow-none focus-visible:ring-0 md:text-[17px]"
          />
          <Input
            value={profile.shopNameEn}
            onChange={(e) => setProfile({ ...profile, shopNameEn: e.target.value })}
            className="h-6 border-0 bg-transparent px-0 text-[12px] text-[#888] shadow-none focus-visible:ring-0 md:text-[12px]"
          />
        </div>
      </section>

      <p className="px-1 pt-2 text-[12px] text-[#888]">
        Shop name is shown on the payment sheet. It stays on this device.
      </p>

      <section className="mt-3 overflow-hidden rounded-xl bg-white ring-1 ring-black/5">
        <StatRow icon={Wallet} label="Codes in 码柜" value={String(items.length)} />
        <StatRow
          icon={Store}
          label="Demo merchant"
          value="East Wind Noodles"
        />
      </section>

      <section className="mt-3 overflow-hidden rounded-xl bg-white ring-1 ring-black/5">
        <button
          type="button"
          onClick={() => setConfirm("restore")}
          className="flex w-full items-center gap-3 px-4 py-3 text-left active:bg-black/3"
        >
          <RotateCcw className="size-5 text-[#07C160]" />
          <span className="flex-1 text-[15px]">Restore demo codes</span>
          <ChevronRight className="size-4 text-[#C8C8C8]" />
        </button>
        <button
          type="button"
          onClick={() => setConfirm("clear")}
          className="flex w-full items-center gap-3 border-t border-black/5 px-4 py-3 text-left active:bg-black/3"
        >
          <Trash2 className="size-5 text-[#FA5151]" />
          <span className="flex-1 text-[15px]">Clear gallery</span>
          <ChevronRight className="size-4 text-[#C8C8C8]" />
        </button>
      </section>

      <section className="mt-3 rounded-xl bg-white px-4 py-4 ring-1 ring-black/5">
        <h2 className="text-[15px] font-medium">From this demo to a WeChat mini program</h2>
        <ol className="mt-3 space-y-3 text-[13px] leading-relaxed text-[#555]">
          <li>
            <span className="font-medium text-[#191919]">1. WeChat DevTools — </span>
            Open the <code className="rounded bg-[#F7F7F7] px-1">weapp/</code> folder
            with a test AppID. Pages already map to 码柜 / 上传 / 我的.
          </li>
          <li>
            <span className="font-medium text-[#191919]">2. Swap the bridge — </span>
            <code className="rounded bg-[#F7F7F7] px-1">src/lib/wechat-bridge.ts</code>{" "}
            is the seam for <code>wx.chooseMedia</code>,{" "}
            <code>wx.saveImageToPhotosAlbum</code>, and{" "}
            <code>wx.requestPayment</code>.
          </li>
          <li>
            <span className="font-medium text-[#191919]">3. Persist for real — </span>
            Replace localStorage with WeChat Cloud or your own API. Keep the
            same <code>QrItem</code> shape.
          </li>
          <li>
            <span className="font-medium text-[#191919]">4. Collect money — </span>
            Register as a WeChat Pay merchant, create a unified order on a
            backend, then call <code>wx.requestPayment</code> from the sheet.
          </li>
        </ol>
      </section>

      <p className="mt-4 px-1 text-center text-[11px] text-[#B2B2B2]">
        PayCase demo · no real charges · codes stay on this browser
      </p>

      <WxDialog
        open={confirm === "restore"}
        title="Restore demo codes?"
        message="This replaces the gallery with the East Wind Noodles sample set."
        confirmText="Restore"
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          setConfirm(null);
          void restoreDemo();
        }}
      />
      <WxDialog
        open={confirm === "clear"}
        title="Clear the gallery?"
        message="All codes on this device will be removed."
        confirmText="Clear"
        destructive
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          setConfirm(null);
          clearAll();
        }}
      />
    </div>
  );
}

function StatRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Wallet;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-black/5 px-4 py-3 last:border-b-0">
      <Icon className="size-5 text-[#07C160]" />
      <span className="flex-1 text-[15px]">{label}</span>
      <span className="text-[13px] text-[#888]">{value}</span>
    </div>
  );
}
