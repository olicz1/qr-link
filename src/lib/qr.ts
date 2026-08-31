import jsQR from "jsqr";
import QRCode from "qrcode";
import type { QrAction, QrChannel } from "./types";

export async function generateQrDataUrl(
  payload: string,
  darkColor = "#111111",
): Promise<string> {
  return QRCode.toDataURL(payload, {
    width: 560,
    margin: 2,
    errorCorrectionLevel: "M",
    color: { dark: darkColor, light: "#FFFFFF" },
  });
}

export async function compactImage(
  dataUrl: string,
  maxSize = 720,
  quality = 0.86,
): Promise<string> {
  const img = await loadImage(dataUrl);
  const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
  const width = Math.max(1, Math.round(img.width * scale));
  const height = Math.max(1, Math.round(img.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", quality);
}

export async function decodeQrFromDataUrl(
  dataUrl: string,
): Promise<string | null> {
  const img = await loadImage(dataUrl);
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const result = jsQR(imageData.data, canvas.width, canvas.height, {
    inversionAttempts: "attemptBoth",
  });
  return result?.data ?? null;
}

export function inferChannelAndAction(payload: string): {
  channel: QrChannel;
  action: QrAction;
} {
  const p = payload.trim().toLowerCase();
  if (
    p.startsWith("weixin://") ||
    p.startsWith("wxp://") ||
    p.includes("wxpay") ||
    p.includes("weixin")
  ) {
    return { channel: "wechat", action: "payment" };
  }
  if (p.startsWith("alipays://") || p.includes("alipay.com") || p.includes("alipay")) {
    return { channel: "alipay", action: "payment" };
  }
  if (p.includes("unionpay") || p.includes("upwrp") || p.includes("95516")) {
    return { channel: "unionpay", action: "payment" };
  }
  if (p.startsWith("http://") || p.startsWith("https://") || p.startsWith("/")) {
    return { channel: "link", action: "open_link" };
  }
  return { channel: "text", action: "show_content" };
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not read that image."));
    img.src = src;
  });
}
