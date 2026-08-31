/**
 * Platform adapters for the PayCase mini program.
 *
 * Web demo uses the DOM. When this product moves into WeChat DevTools,
 * replace each function body with the matching `wx.*` API:
 *
 *   chooseImage      → wx.chooseMedia / wx.chooseImage
 *   saveImage        → wx.saveImageToPhotosAlbum
 *   setClipboard     → wx.setClipboardData
 *   requestPayment   → wx.requestPayment (after a unified-order call)
 *   showNativeToast  → wx.showToast
 */

export async function chooseImageFromDevice(
  source: "album" | "camera" = "album",
): Promise<string | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    if (source === "camera") {
      input.setAttribute("capture", "environment");
    }
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) {
        resolve(null);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ""));
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    };
    input.oncancel = () => resolve(null);
    input.click();
  });
}

export async function saveImage(dataUrl: string, filename: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  a.click();
}

export async function setClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    throw new Error("Clipboard is not available in this browser.");
  }
}

export type PaymentRequest = {
  channel: "wechat" | "alipay" | "unionpay" | "custom";
  amount: string;
  title: string;
};

export type PaymentResult =
  | { ok: true; transactionId: string }
  | { ok: false; message: string };

export async function requestPayment(
  req: PaymentRequest,
): Promise<PaymentResult> {
  await wait(1100);
  if (!req.amount || Number(req.amount) <= 0) {
    return { ok: false, message: "Enter an amount to collect." };
  }
  const stamp = Date.now().toString(36).toUpperCase();
  return { ok: true, transactionId: `PC${stamp}` };
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
