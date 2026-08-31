"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Download, ExternalLink, Loader2 } from "lucide-react";
import { CHANNEL_META, type QrItem } from "@/lib/types";
import { usePayCase } from "@/lib/store";
import { requestPayment, saveImage, setClipboard } from "@/lib/wechat-bridge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ActionSheet() {
  const { activeItem, profile, closeItem, showToast } = usePayCase();
  if (!activeItem) return null;
  return (
    <ActionSheetBody
      key={activeItem.id}
      item={activeItem}
      shopName={profile.shopName}
      shopNameEn={profile.shopNameEn}
      closeItem={closeItem}
      showToast={showToast}
    />
  );
}

function ActionSheetBody({
  item,
  shopName,
  shopNameEn,
  closeItem,
  showToast,
}: {
  item: QrItem;
  shopName: string;
  shopNameEn: string;
  closeItem: () => void;
  showToast: (message: string, variant?: "success" | "error" | "loading" | "none") => void;
}) {
  const router = useRouter();
  const [amount, setAmount] = useState(item.amount);
  const [phase, setPhase] = useState<"idle" | "paying" | "success">("idle");
  const [txId, setTxId] = useState("");
  const meta = CHANNEL_META[item.channel];
  const isInternalPromo = useMemo(
    () => item.payload.includes("paycase.demo/promo"),
    [item.payload],
  );

  async function handlePay() {
    if (phase !== "idle") return;
    setPhase("paying");
    const result = await requestPayment({
      channel:
        item.channel === "alipay" ||
        item.channel === "unionpay" ||
        item.channel === "wechat"
          ? item.channel
          : "custom",
      amount,
      title: item.title,
    });
    if (!result.ok) {
      setPhase("idle");
      showToast(result.message, "error");
      return;
    }
    setTxId(result.transactionId);
    setPhase("success");
  }

  async function handleCopy() {
    try {
      await setClipboard(item.payload);
      showToast("Copied", "success");
    } catch {
      showToast("Could not copy", "error");
    }
  }

  async function handleSave() {
    await saveImage(
      item.imageDataUrl,
      `${item.title.replace(/\s+/g, "-")}.png`,
    );
    showToast("Saved", "success");
  }

  function handleOpenLink() {
    if (isInternalPromo) {
      closeItem();
      router.push("/promo");
      return;
    }
    window.open(item.payload, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="absolute inset-0 z-40 flex flex-col justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-black/45"
        aria-label="Dismiss"
        onClick={() => (phase === "paying" ? null : closeItem())}
      />
      <div className="relative z-10 max-h-[86%] overflow-y-auto rounded-t-[20px] bg-[#F7F7F7] pb-[calc(12px+env(safe-area-inset-bottom))] shadow-2xl">
        <div className="flex justify-center pt-2">
          <span className="h-1 w-10 rounded-full bg-black/15" />
        </div>

        {phase === "success" ? (
          <SuccessPanel
            shop={shopName}
            amount={amount}
            txId={txId}
            onDone={closeItem}
          />
        ) : item.action === "payment" ? (
          <PaymentPanel
            title={item.title}
            shop={shopName}
            shopEn={shopNameEn}
            image={item.imageDataUrl}
            payload={item.payload}
            note={item.note}
            metaColor={meta.color}
            metaLabel={meta.labelZh}
            amount={amount}
            paying={phase === "paying"}
            onAmount={setAmount}
            onPay={handlePay}
            onCopy={handleCopy}
            onSave={handleSave}
          />
        ) : item.action === "open_link" ? (
          <LinkPanel
            title={item.title}
            subtitle={item.subtitle}
            image={item.imageDataUrl}
            payload={item.payload}
            note={item.note}
            isInternal={isInternalPromo}
            onOpen={handleOpenLink}
            onCopy={handleCopy}
          />
        ) : (
          <ContentPanel
            title={item.title}
            image={item.imageDataUrl}
            payload={item.payload}
            onCopy={handleCopy}
          />
        )}
      </div>
    </div>
  );
}

function PaymentPanel({
  title,
  shop,
  shopEn,
  image,
  payload,
  note,
  metaColor,
  metaLabel,
  amount,
  paying,
  onAmount,
  onPay,
  onCopy,
  onSave,
}: {
  title: string;
  shop: string;
  shopEn: string;
  image: string;
  payload: string;
  note: string;
  metaColor: string;
  metaLabel: string;
  amount: string;
  paying: boolean;
  onAmount: (value: string) => void;
  onPay: () => void;
  onCopy: () => void;
  onSave: () => void;
}) {
  return (
    <div className="px-5 pt-3">
      <div className="text-center">
        <p className="text-[12px] text-[#888]">{shopEn}</p>
        <h2 className="mt-0.5 text-[18px] font-medium text-[#191919]">{shop}</h2>
        <p className="mt-1 text-[13px] text-[#888]">{title}</p>
      </div>

      <div className="mt-4 flex items-baseline justify-center gap-1 text-[#191919]">
        <span className="text-[22px] font-medium">¥</span>
        <Input
          inputMode="decimal"
          value={amount}
          onChange={(e) => onAmount(e.target.value.replace(/[^\d.]/g, ""))}
          className="h-auto w-[160px] border-0 bg-transparent p-0 text-center text-[40px] font-medium tracking-tight shadow-none focus-visible:ring-0 md:text-[40px]"
          placeholder="0.00"
        />
      </div>
      <p className="mt-1 text-center text-[12px] text-[#B2B2B2]">Tap the amount to edit</p>

      <div className="mx-auto mt-4 w-[210px] rounded-2xl bg-white p-3 shadow-sm ring-1 ring-black/5">
        <div
          className="mb-2 h-1 rounded-full"
          style={{ backgroundColor: metaColor }}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image} alt={title} className="aspect-square w-full bg-white" />
        <p className="mt-1 text-center text-[11px] font-medium" style={{ color: metaColor }}>
          {metaLabel}
        </p>
      </div>

      {note ? (
        <p className="mt-3 text-center text-[12px] text-[#888]">{note}</p>
      ) : null}

      <p className="mt-2 truncate text-center font-mono text-[10px] text-[#C0C0C0]">
        {payload}
      </p>

      <Button
        type="button"
        onClick={onPay}
        disabled={paying}
        className="mt-4 h-12 w-full rounded-[8px] bg-[#07C160] text-[17px] font-medium text-white hover:bg-[#06AD56]"
      >
        {paying ? (
          <span className="flex items-center gap-2">
            <Loader2 className="size-5 animate-spin" />
            支付中…
          </span>
        ) : (
          "立即支付  Pay now"
        )}
      </Button>

      <div className="mt-3 mb-1 grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onSave}
          className="h-10 rounded-[8px] bg-white text-[#191919]"
        >
          <Download className="size-4" />
          Save image
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCopy}
          className="h-10 rounded-[8px] bg-white text-[#191919]"
        >
          <Copy className="size-4" />
          Copy payload
        </Button>
      </div>
    </div>
  );
}

function LinkPanel({
  title,
  subtitle,
  image,
  payload,
  note,
  isInternal,
  onOpen,
  onCopy,
}: {
  title: string;
  subtitle: string;
  image: string;
  payload: string;
  note: string;
  isInternal: boolean;
  onOpen: () => void;
  onCopy: () => void;
}) {
  return (
    <div className="px-5 pt-3">
      <h2 className="text-center text-[18px] font-medium">{title}</h2>
      <p className="mt-1 text-center text-[13px] text-[#888]">{subtitle}</p>
      <div className="mx-auto mt-4 w-[180px] rounded-2xl bg-white p-3 shadow-sm ring-1 ring-black/5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image} alt={title} className="aspect-square w-full" />
      </div>
      <p className="mt-3 break-all rounded-lg bg-white px-3 py-2 text-center text-[12px] text-[#576B95] ring-1 ring-black/5">
        {payload}
      </p>
      {note ? <p className="mt-2 text-center text-[12px] text-[#888]">{note}</p> : null}
      <Button
        type="button"
        onClick={onOpen}
        className="mt-4 h-12 w-full rounded-[8px] bg-[#07C160] text-[17px] text-white hover:bg-[#06AD56]"
      >
        <ExternalLink className="size-4" />
        {isInternal ? "Open weekend menu" : "Open link"}
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={onCopy}
        className="mt-2 mb-1 h-10 w-full rounded-[8px] bg-white"
      >
        <Copy className="size-4" />
        Copy URL
      </Button>
    </div>
  );
}

function ContentPanel({
  title,
  image,
  payload,
  onCopy,
}: {
  title: string;
  image: string;
  payload: string;
  onCopy: () => void;
}) {
  return (
    <div className="px-5 pt-3">
      <h2 className="text-center text-[18px] font-medium">{title}</h2>
      <div className="mx-auto mt-4 w-[160px] rounded-2xl bg-white p-3 shadow-sm ring-1 ring-black/5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image} alt={title} className="aspect-square w-full" />
      </div>
      <pre className="mt-4 whitespace-pre-wrap rounded-xl bg-white px-4 py-3 text-[14px] leading-relaxed text-[#191919] ring-1 ring-black/5">
        {payload}
      </pre>
      <Button
        type="button"
        onClick={onCopy}
        className="mt-4 mb-1 h-12 w-full rounded-[8px] bg-[#07C160] text-[17px] text-white hover:bg-[#06AD56]"
      >
        <Copy className="size-4" />
        Copy text
      </Button>
    </div>
  );
}

function SuccessPanel({
  shop,
  amount,
  txId,
  onDone,
}: {
  shop: string;
  amount: string;
  txId: string;
  onDone: () => void;
}) {
  return (
    <div className="px-5 pt-8 pb-4 text-center">
      <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-[#07C160]">
        <Check className="size-9 text-white" strokeWidth={2.6} />
      </div>
      <h2 className="mt-4 text-[20px] font-medium">支付成功</h2>
      <p className="mt-1 text-[13px] text-[#888]">Payment complete</p>
      <p className="mt-5 text-[36px] font-medium tracking-tight">¥{Number(amount).toFixed(2)}</p>
      <p className="mt-1 text-[13px] text-[#888]">{shop}</p>
      <p className="mt-4 font-mono text-[11px] text-[#B2B2B2]">{txId}</p>
      <Button
        type="button"
        onClick={onDone}
        className="mt-8 h-12 w-full rounded-[8px] bg-[#07C160] text-[17px] text-white hover:bg-[#06AD56]"
      >
        Done
      </Button>
    </div>
  );
}
