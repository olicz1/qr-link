const SEED = [
  {
    id: "seed-wechat",
    title: "微信收款",
    subtitle: "WeChat Pay · counter",
    channel: "wechat",
    action: "payment",
    image: "/images/wechat.png",
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
    image: "/images/alipay.png",
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
    image: "/images/unionpay.png",
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
    image: "/images/menu.png",
    payload: "/pages/promo/promo",
    amount: "",
    note: "Opens the in-app weekend special.",
    pinned: false,
  },
  {
    id: "seed-hours",
    title: "营业时间",
    subtitle: "Hours & pickup",
    channel: "text",
    action: "show_content",
    image: "/images/hours.png",
    payload:
      "东风面馆 East Wind Noodles\nHours 11:00–21:00\nTake a number at the counter\nLast order 20:30",
    amount: "",
    note: "Text QR — tap to show content.",
    pinned: false,
  },
];

const ITEMS_KEY = "paycase.codes.v1";
const PROFILE_KEY = "paycase.profile.v1";

const DEFAULT_PROFILE = {
  shopName: "东风面馆",
  shopNameEn: "East Wind Noodles",
};

const CHANNEL_META = {
  wechat: { label: "WeChat", labelZh: "微信支付", color: "#07C160" },
  alipay: { label: "Alipay", labelZh: "支付宝", color: "#1677FF" },
  unionpay: { label: "UnionPay", labelZh: "云闪付", color: "#E21836" },
  link: { label: "Link", labelZh: "链接", color: "#6366F1" },
  text: { label: "Text", labelZh: "文本", color: "#D97706" },
  custom: { label: "Custom", labelZh: "自定义", color: "#57534E" },
};

function decorate(item) {
  const meta = CHANNEL_META[item.channel] || CHANNEL_META.custom;
  return Object.assign({}, item, {
    channelLabel: meta.labelZh,
    channelColor: meta.color,
  });
}

function ensureSeed() {
  const existing = wx.getStorageSync(ITEMS_KEY);
  if (!existing || !existing.length) {
    wx.setStorageSync(
      ITEMS_KEY,
      SEED.map((item, i) => ({ ...item, createdAt: Date.now() - i * 60000 })),
    );
  }
  if (!wx.getStorageSync(PROFILE_KEY)) {
    wx.setStorageSync(PROFILE_KEY, DEFAULT_PROFILE);
  }
}

function list() {
  ensureSeed();
  const items = wx.getStorageSync(ITEMS_KEY) || [];
  return items
    .slice()
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return (b.createdAt || 0) - (a.createdAt || 0);
    })
    .map(decorate);
}

function profile() {
  return wx.getStorageSync(PROFILE_KEY) || DEFAULT_PROFILE;
}

function setProfile(next) {
  wx.setStorageSync(PROFILE_KEY, next);
}

function add(item) {
  const items = wx.getStorageSync(ITEMS_KEY) || [];
  items.unshift(item);
  wx.setStorageSync(ITEMS_KEY, items);
}

function remove(id) {
  const items = (wx.getStorageSync(ITEMS_KEY) || []).filter((item) => item.id !== id);
  wx.setStorageSync(ITEMS_KEY, items);
}

function togglePin(id) {
  const items = (wx.getStorageSync(ITEMS_KEY) || []).map((item) =>
    item.id === id ? { ...item, pinned: !item.pinned } : item,
  );
  wx.setStorageSync(ITEMS_KEY, items);
}

function restore() {
  wx.setStorageSync(
    ITEMS_KEY,
    SEED.map((item, i) => ({ ...item, createdAt: Date.now() - i * 60000 })),
  );
  wx.setStorageSync(PROFILE_KEY, DEFAULT_PROFILE);
}

function clear() {
  wx.setStorageSync(ITEMS_KEY, []);
}

module.exports = {
  CHANNEL_META,
  ensureSeed,
  list,
  profile,
  setProfile,
  add,
  remove,
  togglePin,
  restore,
  clear,
};
