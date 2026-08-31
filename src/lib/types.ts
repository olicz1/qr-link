export type QrChannel =
  | "wechat"
  | "alipay"
  | "unionpay"
  | "link"
  | "text"
  | "custom";

export type QrAction = "payment" | "open_link" | "show_content";

export type QrItem = {
  id: string;
  title: string;
  subtitle: string;
  channel: QrChannel;
  action: QrAction;
  imageDataUrl: string;
  payload: string;
  amount: string;
  note: string;
  pinned: boolean;
  createdAt: number;
};

export type MerchantProfile = {
  shopName: string;
  shopNameEn: string;
  bio: string;
};

export type ToastState = {
  id: number;
  message: string;
  variant: "success" | "error" | "loading" | "none";
} | null;

export const CHANNEL_META: Record<
  QrChannel,
  { label: string; labelZh: string; color: string; qrColor: string }
> = {
  wechat: {
    label: "WeChat Pay",
    labelZh: "微信支付",
    color: "#07C160",
    qrColor: "#07C160",
  },
  alipay: {
    label: "Alipay",
    labelZh: "支付宝",
    color: "#1677FF",
    qrColor: "#1677FF",
  },
  unionpay: {
    label: "UnionPay",
    labelZh: "云闪付",
    color: "#E21836",
    qrColor: "#E21836",
  },
  link: {
    label: "Link",
    labelZh: "链接",
    color: "#6366F1",
    qrColor: "#1F2937",
  },
  text: {
    label: "Text",
    labelZh: "文本",
    color: "#D97706",
    qrColor: "#1F2937",
  },
  custom: {
    label: "Custom",
    labelZh: "自定义",
    color: "#57534E",
    qrColor: "#1F2937",
  },
};

export const ACTION_META: Record<
  QrAction,
  { label: string; hint: string }
> = {
  payment: {
    label: "Payment sheet",
    hint: "Opens a WeChat-style pay sheet with amount and confirm.",
  },
  open_link: {
    label: "Open link",
    hint: "Shows the URL and opens a page or browser tab.",
  },
  show_content: {
    label: "Show content",
    hint: "Pops up the decoded text for the customer to read.",
  },
};

export const DEFAULT_PROFILE: MerchantProfile = {
  shopName: "东风面馆",
  shopNameEn: "East Wind Noodles",
  bio: "Counter tablet · lunch rush self-pay",
};
