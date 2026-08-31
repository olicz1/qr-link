import { generateQrDataUrl } from "./qr";
import { CHANNEL_META, DEFAULT_PROFILE, type QrItem } from "./types";

type SeedSpec = Omit<QrItem, "imageDataUrl" | "createdAt">;

export const SEED_SPECS: SeedSpec[] = [
  {
    id: "seed-wechat",
    title: "微信收款",
    subtitle: "WeChat Pay · counter",
    channel: "wechat",
    action: "payment",
    payload: "weixin://wxpay/bizpayurl?pr=PAYCASE-EASTWIND-WX",
    amount: "18.00",
    note: "Lunch set · WeChat Pay",
    pinned: true,
  },
  {
    id: "seed-alipay",
    title: "支付宝收款",
    subtitle: "Alipay · counter",
    channel: "alipay",
    action: "payment",
    payload: "https://qr.alipay.com/fkxPAYCASEEASTWIND",
    amount: "18.00",
    note: "Lunch set · Alipay",
    pinned: false,
  },
  {
    id: "seed-unionpay",
    title: "云闪付",
    subtitle: "UnionPay Quick Pass",
    channel: "unionpay",
    action: "payment",
    payload: "https://qr.95516.com/pay/PAYCASE-EASTWIND",
    amount: "28.00",
    note: "Large bowl · UnionPay",
    pinned: false,
  },
  {
    id: "seed-menu",
    title: "周末套餐",
    subtitle: "Weekend set menu",
    channel: "link",
    action: "open_link",
    payload: "https://paycase.demo/promo",
    amount: "",
    note: "Opens the in-app weekend special instead of a pay sheet.",
    pinned: false,
  },
  {
    id: "seed-hours",
    title: "营业时间",
    subtitle: "Hours & pickup",
    channel: "text",
    action: "show_content",
    payload:
      "东风面馆 East Wind Noodles\nHours 11:00–21:00\nTake a number at the counter\nLast order 20:30",
    amount: "",
    note: "A text QR — tap it to pop the content, not a payment.",
    pinned: false,
  },
];

export async function buildSeedItems(): Promise<QrItem[]> {
  const now = Date.now();
  return Promise.all(
    SEED_SPECS.map(async (spec, index) => ({
      ...spec,
      imageDataUrl: await generateQrDataUrl(
        spec.payload,
        CHANNEL_META[spec.channel].qrColor,
      ),
      createdAt: now - index * 60_000,
    })),
  );
}

export { DEFAULT_PROFILE };
