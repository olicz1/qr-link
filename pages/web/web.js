const { takePendingUrl } = require("../../utils/open");

Page({
  data: {
    url: "",
    failed: false,
  },

  onLoad() {
    const url = takePendingUrl();
    this.setData({ url: url || "", failed: !url });
  },

  onError() {
    this.setData({ failed: true });
  },

  retry() {
    const url = this.data.url;
    if (!url) return;
    this.setData({ failed: false, url: "" });
    setTimeout(() => this.setData({ url }), 50);
  },

  copy() {
    const url = this.data.url;
    if (!url) {
      wx.showToast({ title: "没有可复制的链接", icon: "none" });
      return;
    }
    wx.setClipboardData({ data: url });
  },
});
