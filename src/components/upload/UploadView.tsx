"use client";

import { useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Camera, ImagePlus, Loader2, ScanLine } from "lucide-react";
import { compactImage, decodeQrFromDataUrl, inferChannelAndAction } from "@/lib/qr";
import { CHANNEL_META, ACTION_META, type QrAction, type QrChannel } from "@/lib/types";
import { usePayCase } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

const CHANNELS: QrChannel[] = [
  "wechat",
  "alipay",
  "unionpay",
  "link",
  "text",
  "custom",
];

const ACTIONS: QrAction[] = ["payment", "open_link", "show_content"];

export function UploadView() {
  const router = useRouter();
  const { addItem, showToast } = usePayCase();
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const [image, setImage] = useState<string | null>(null);
  const [payload, setPayload] = useState("");
  const [decoded, setDecoded] = useState<"idle" | "scanning" | "ok" | "fail">("idle");
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [channel, setChannel] = useState<QrChannel>("wechat");
  const [action, setAction] = useState<QrAction>("payment");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [pinned, setPinned] = useState(false);
  const [saving, setSaving] = useState(false);

  async function onFile(file: File | undefined) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const compact = await compactImage(String(reader.result ?? ""));
        setImage(compact);
        setDecoded("scanning");
        const text = await decodeQrFromDataUrl(compact);
        if (text) {
          const inferred = inferChannelAndAction(text);
          setPayload(text);
          setChannel(inferred.channel);
          setAction(inferred.action);
          setDecoded("ok");
          if (!title) {
            setTitle(CHANNEL_META[inferred.channel].labelZh);
          }
          if (!subtitle) {
            setSubtitle(ACTION_META[inferred.action].label);
          }
          showToast("QR detected", "success");
        } else {
          setDecoded("fail");
          showToast("No QR found — you can still save it", "error");
        }
      } catch {
        setDecoded("fail");
        showToast("Could not read that image", "error");
      }
    };
    reader.readAsDataURL(file);
  }

  async function handleSave() {
    if (!image) {
      showToast("Choose a QR image first", "error");
      return;
    }
    if (!title.trim()) {
      showToast("Give this code a name", "error");
      return;
    }
    setSaving(true);
    addItem({
      id:
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `qr-${Date.now()}`,
      title: title.trim(),
      subtitle: subtitle.trim() || ACTION_META[action].label,
      channel,
      action,
      imageDataUrl: image,
      payload: payload.trim(),
      amount: amount.trim(),
      note: note.trim(),
      pinned,
      createdAt: Date.now(),
    });
    showToast("Saved to 码柜", "success");
    setSaving(false);
    router.push("/");
  }

  return (
    <div className="px-3 pb-6">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => onFile(e.target.files?.[0])}
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => onFile(e.target.files?.[0])}
      />

      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="mt-3 flex w-full flex-col items-center justify-center rounded-xl bg-white px-4 py-6 ring-1 ring-black/5"
      >
        {image ? (
          <div className="w-[200px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image} alt="Selected QR" className="aspect-square w-full rounded-lg" />
            <p className="mt-2 text-[12px] text-[#888]">Tap to replace image</p>
          </div>
        ) : (
          <>
            <div className="flex size-14 items-center justify-center rounded-full bg-[#E8F8EE] text-[#07C160]">
              <ImagePlus className="size-7" />
            </div>
            <p className="mt-3 text-[15px] font-medium">Choose a QR image</p>
            <p className="mt-1 text-[12px] text-[#888]">
              Album photo of a WeChat Pay, Alipay, or any other QR
            </p>
          </>
        )}
      </button>

      <div className="mt-2 grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant="outline"
          className="h-10 rounded-lg bg-white"
          onClick={() => fileRef.current?.click()}
        >
          <ImagePlus className="size-4" />
          Album
        </Button>
        <Button
          type="button"
          variant="outline"
          className="h-10 rounded-lg bg-white"
          onClick={() => cameraRef.current?.click()}
        >
          <Camera className="size-4" />
          Camera
        </Button>
      </div>

      <DecodeStatus status={decoded} />

      <section className="mt-3 overflow-hidden rounded-xl bg-white ring-1 ring-black/5">
        <Field label="Name">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="微信收款"
            className="h-9 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 md:text-[15px]"
          />
        </Field>
        <Field label="Subtitle">
          <Input
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            placeholder="Counter · WeChat Pay"
            className="h-9 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 md:text-[15px]"
          />
        </Field>
        <div className="px-4 py-3">
          <Label className="text-[13px] text-[#888]">Channel</Label>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {CHANNELS.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => setChannel(id)}
                className={cn(
                  "h-7 rounded-full px-2.5 text-[12px]",
                  channel === id ? "text-white" : "bg-[#F7F7F7] text-[#191919]",
                )}
                style={channel === id ? { backgroundColor: CHANNEL_META[id].color } : undefined}
              >
                {CHANNEL_META[id].labelZh}
              </button>
            ))}
          </div>
        </div>
        <div className="px-4 py-3">
          <Label className="text-[13px] text-[#888]">Tap action</Label>
          <div className="mt-2 grid gap-1.5">
            {ACTIONS.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => setAction(id)}
                className={cn(
                  "rounded-lg px-3 py-2 text-left ring-1",
                  action === id
                    ? "bg-[#E8F8EE] ring-[#07C160]/40"
                    : "bg-[#FAFAFA] ring-transparent",
                )}
              >
                <div className="text-[13px] font-medium">{ACTION_META[id].label}</div>
                <div className="text-[11px] text-[#888]">{ACTION_META[id].hint}</div>
              </button>
            ))}
          </div>
        </div>
        {action === "payment" ? (
          <Field label="Default ¥">
            <Input
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
              placeholder="18.00"
              className="h-9 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 md:text-[15px]"
            />
          </Field>
        ) : null}
        <div className="px-4 py-3">
          <Label className="text-[13px] text-[#888]">Decoded payload</Label>
          <Textarea
            value={payload}
            onChange={(e) => setPayload(e.target.value)}
            placeholder="Optional — paste if the scan missed it"
            className="mt-1 min-h-16 border-0 bg-[#F7F7F7] text-[12px] shadow-none focus-visible:ring-0"
          />
        </div>
        <div className="px-4 py-3">
          <Label className="text-[13px] text-[#888]">Note</Label>
          <Input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Shown on the popup"
            className="mt-1 h-9 border-0 bg-[#F7F7F7] shadow-none focus-visible:ring-0"
          />
        </div>
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <div className="text-[15px]">Pin to top</div>
            <div className="text-[12px] text-[#888]">Keep this code first in the gallery</div>
          </div>
          <Switch checked={pinned} onCheckedChange={setPinned} />
        </div>
      </section>

      <Button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="mt-4 h-12 w-full rounded-[8px] bg-[#07C160] text-[17px] font-medium text-white hover:bg-[#06AD56]"
      >
        {saving ? <Loader2 className="size-5 animate-spin" /> : "Save to gallery"}
      </Button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-3 border-b border-black/5 px-4 py-1.5">
      <span className="w-[72px] shrink-0 text-[15px] text-[#191919]">{label}</span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

function DecodeStatus({ status }: { status: "idle" | "scanning" | "ok" | "fail" }) {
  if (status === "idle") return null;
  return (
    <div
      className={cn(
        "mt-2 flex items-center gap-2 rounded-lg px-3 py-2 text-[12px]",
        status === "ok" && "bg-[#E8F8EE] text-[#07C160]",
        status === "fail" && "bg-[#FDECEC] text-[#FA5151]",
        status === "scanning" && "bg-white text-[#888]",
      )}
    >
      <ScanLine className="size-4" />
      {status === "scanning" && "Scanning image for a QR code…"}
      {status === "ok" && "QR detected. Channel and action were filled in."}
      {status === "fail" && "No QR in this photo. Save it anyway, or paste the payload."}
    </div>
  );
}
