const store = require("../../utils/store");
const { pageMetrics } = require("../../utils/layout");

function initialOf(name) {
  const text = (name || "").trim();
  return text ? text.slice(0, 1) : "店";
}

Page({
  data: {
    profile: {},
    initial: "店",
    pagePad: 120,
  },

  onLoad() {
    this.applyMetrics();
  },

  onShow() {
    this.applyMetrics();
    this.refresh();
  },

  applyMetrics() {
    this.setData({ pagePad: pageMetrics().pagePad });
  },

  refresh() {
    const profile = store.profile();
    this.setData({
      profile,
      initial: initialOf(profile.shopName),
    });
  },

  onShop(e) {
    const profile = Object.assign({}, this.data.profile, { shopName: e.detail.value });
    store.setProfile(profile);
    this.setData({ profile, initial: initialOf(profile.shopName) });
  },

  onShopEn(e) {
    const profile = Object.assign({}, this.data.profile, { shopNameEn: e.detail.value });
    store.setProfile(profile);
    this.setData({ profile });
  },

  restore() {
    wx.showModal({
      title: "恢复演示数据？",
      content: "码柜会换成东风面馆的示例收款码。",
      success: (res) => {
        if (res.confirm) {
          store.restore();
          this.refresh();
          wx.showToast({ title: "已恢复", icon: "success" });
        }
      },
    });
  },

  clear() {
    wx.showModal({
      title: "清空码柜？",
      content: "这台设备上的收款码都会被删掉。",
      confirmColor: "#FA5151",
      success: (res) => {
        if (res.confirm) {
          store.clear();
          this.refresh();
        }
      },
    });
  },
});
