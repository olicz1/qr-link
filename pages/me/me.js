const store = require("../../utils/store");
const { pageMetrics, syncTabBar } = require("../../utils/layout");

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
    const profile = store.profile();
    this.setData({
      pagePad: pageMetrics().pagePad,
      profile,
      initial: initialOf(profile.shopName),
    });
    syncTabBar("me");
    if (this._profileTimer) {
      clearTimeout(this._profileTimer);
      this._profileTimer = null;
      if (this._pendingProfile) store.setProfile(this._pendingProfile);
    }
  },

  onHide() {
    if (this._profileTimer) {
      clearTimeout(this._profileTimer);
      this._profileTimer = null;
    }
    if (this._pendingProfile) {
      store.setProfile(this._pendingProfile);
      this._pendingProfile = null;
    }
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

  scheduleProfile(profile) {
    this._pendingProfile = profile;
    if (this._profileTimer) clearTimeout(this._profileTimer);
    this._profileTimer = setTimeout(() => {
      this._profileTimer = null;
      store.setProfile(profile);
      this._pendingProfile = null;
    }, 280);
  },

  onShop(e) {
    const profile = Object.assign({}, this.data.profile, { shopName: e.detail.value });
    this.setData({ profile, initial: initialOf(profile.shopName) });
    this.scheduleProfile(profile);
  },

  onShopEn(e) {
    const profile = Object.assign({}, this.data.profile, { shopNameEn: e.detail.value });
    this.setData({ profile });
    this.scheduleProfile(profile);
  },

  restore() {
    wx.showModal({
      title: "恢复演示数据？",
      content: "码柜会换成两个示例二维码。",
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
      content: "这台设备上保存的码都会被删掉。",
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
