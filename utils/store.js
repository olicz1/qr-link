const SEED = [
  {
    id: "seed-aosen-parking",
    title: "奥森停车场",
    subtitle: "扫码缴费 · 自动抬杆",
    channel: "parking",
    action: "open_miniapp",
    image: "/images/aosen-parking.jpg",
    payload: "https://ipp.chinaums.com/ipp-avs/parking/rate/index?merInstId=040000008677",
    amount: "",
    note: "",
    pinned: true,
  },
  {
    id: "seed-garage-prepay",
    title: "车库预缴",
    subtitle: "预先缴费 · 20分钟离场",
    channel: "parking",
    action: "open_miniapp",
    image: "/images/garage-prepay.jpg",
    payload: "http://s.keytop.cn/leb3s1",
    amount: "",
    note: "",
    pinned: false,
  },
];

const REMOVED_SEEDS = [
  "seed-wechat",
  "seed-alipay",
  "seed-unionpay",
  "seed-menu",
  "seed-hours",
];

const ITEMS_KEY = "paycase.codes.v1";
const PROFILE_KEY = "paycase.profile.v1";

const DEFAULT_PROFILE = {
  shopName: "东风面馆",
  shopNameEn: "East Wind Noodles",
};

const TAG_META = {
  parking: { label: "停车", color: "#0D3B66" },
  dining: { label: "吃饭", color: "#C2410C" },
  hotel: { label: "酒店", color: "#6D28D9" },
  shopping: { label: "购物", color: "#0F766E" },
  transit: { label: "出行", color: "#0369A1" },
  other: { label: "其他", color: "#57534E" },
};

const LEGACY_TAGS = {
  wechat: "dining",
  alipay: "dining",
  unionpay: "parking",
  link: "dining",
  text: "other",
  custom: "other",
};

const TAGS = Object.keys(TAG_META).map((id) => ({
  id,
  label: TAG_META[id].label,
}));

function tagId(id) {
  if (TAG_META[id]) return id;
  return LEGACY_TAGS[id] || "other";
}

function decorate(item) {
  const id = tagId(item.channel);
  const meta = TAG_META[id];
  return Object.assign({}, item, {
    channel: id,
    channelLabel: meta.label,
    channelColor: meta.color,
  });
}

function migrateItems(items) {
  let changed = false;
  const next = items.map((item) => {
    const channel = tagId(item.channel);
    if (channel === item.channel) return item;
    changed = true;
    return Object.assign({}, item, { channel });
  });
  return changed ? next : items;
}

let itemsCache = null;
let profileCache = null;
let seeded = false;

function stripRemoved(items) {
  const next = items.filter((item) => REMOVED_SEEDS.indexOf(item.id) === -1);
  return next.length === items.length ? items : next;
}

function readItems() {
  if (itemsCache) return itemsCache;
  itemsCache = wx.getStorageSync(ITEMS_KEY) || [];
  return itemsCache;
}

function writeItems(items) {
  itemsCache = items;
  wx.setStorageSync(ITEMS_KEY, items);
}

function writeProfile(next) {
  profileCache = next;
  wx.setStorageSync(PROFILE_KEY, next);
}

function ensureSeed() {
  if (seeded) return;
  seeded = true;
  const existing = wx.getStorageSync(ITEMS_KEY);
  if (!existing || !existing.length) {
    writeItems(SEED.map((item, i) => ({ ...item, createdAt: Date.now() - i * 60000 })));
  } else {
    let next = stripRemoved(migrateItems(existing));
    let changed = next !== existing;
    SEED.forEach((seed) => {
      if (!next.some((item) => item.id === seed.id)) {
        next = [Object.assign({}, seed, { createdAt: Date.now() })].concat(next);
        changed = true;
      }
    });
    if (changed) writeItems(next);
    else itemsCache = next;
  }
  if (!wx.getStorageSync(PROFILE_KEY)) {
    writeProfile(DEFAULT_PROFILE);
  }
}

function list() {
  ensureSeed();
  return readItems()
    .slice()
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return (b.createdAt || 0) - (a.createdAt || 0);
    })
    .map(decorate);
}

function profile() {
  if (profileCache) return profileCache;
  profileCache = wx.getStorageSync(PROFILE_KEY) || DEFAULT_PROFILE;
  return profileCache;
}

function setProfile(next) {
  writeProfile(next);
}

function add(item) {
  writeItems([item].concat(readItems()));
}

function patch(id, fields) {
  writeItems(
    readItems().map((item) => (item.id === id ? Object.assign({}, item, fields) : item)),
  );
}

function remove(id) {
  writeItems(readItems().filter((item) => item.id !== id));
}

function togglePin(id) {
  writeItems(readItems().map((item) => (item.id === id ? { ...item, pinned: !item.pinned } : item)));
}

function restore() {
  writeItems(SEED.map((item, i) => ({ ...item, createdAt: Date.now() - i * 60000 })));
  writeProfile(DEFAULT_PROFILE);
  seeded = true;
}

function clear() {
  writeItems([]);
}

module.exports = {
  TAGS,
  TAG_META,
  CHANNEL_META: TAG_META,
  ensureSeed,
  list,
  profile,
  setProfile,
  add,
  patch,
  remove,
  togglePin,
  restore,
  clear,
};
