const store = require("../../utils/store");

Page({
  data: {
    profile: {},
    count: 0,
  },

  onShow() {
    this.refresh();
  },

  refresh() {
    this.setData({
      profile: store.profile(),
      count: store.list().length,
    });
  },

  onShop(e) {
    const profile = { ...this.data.profile, shopName: e.detail.value };
    store.setProfile(profile);
    this.setData({ profile });
  },

  restore() {
    wx.showModal({
      title: "Restore demo codes?",
      content: "This replaces the gallery with the East Wind Noodles sample set.",
      success: (res) => {
        if (res.confirm) {
          store.restore();
          this.refresh();
          wx.showToast({ title: "Restored", icon: "success" });
        }
      },
    });
  },

  clear() {
    wx.showModal({
      title: "Clear the gallery?",
      content: "All codes on this device will be removed.",
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
