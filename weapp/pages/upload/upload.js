const store = require("../../utils/store");

Page({
  data: {
    image: "",
    title: "",
    subtitle: "",
    channel: "wechat",
    action: "payment",
    amount: "",
    note: "",
    channels: [
      { id: "wechat", label: "微信支付" },
      { id: "alipay", label: "支付宝" },
      { id: "unionpay", label: "云闪付" },
      { id: "link", label: "链接" },
      { id: "text", label: "文本" },
      { id: "custom", label: "自定义" },
    ],
    actions: [
      { id: "payment", label: "Payment sheet", hint: "Opens the WeChat-style pay popup." },
      { id: "open_link", label: "Open link", hint: "Navigate to a page or URL." },
      { id: "show_content", label: "Show content", hint: "Pop the decoded text." },
    ],
  },

  choose() {
    wx.chooseMedia({
      count: 1,
      mediaType: ["image"],
      sourceType: ["album", "camera"],
      success: (res) => {
        const file = res.tempFiles[0];
        this.setData({ image: file.tempFilePath });
        // Production: decode the QR (plugin / cloud) and infer channel.
      },
      fail: () => {
        wx.showToast({ title: "No image selected", icon: "none" });
      },
    });
  },

  onTitle(e) {
    this.setData({ title: e.detail.value });
  },
  onSubtitle(e) {
    this.setData({ subtitle: e.detail.value });
  },
  onAmount(e) {
    this.setData({ amount: e.detail.value });
  },
  onNote(e) {
    this.setData({ note: e.detail.value });
  },
  setChannel(e) {
    this.setData({ channel: e.currentTarget.dataset.id });
  },
  setAction(e) {
    this.setData({ action: e.currentTarget.dataset.id });
  },

  save() {
    if (!this.data.image) {
      wx.showToast({ title: "Choose a QR image first", icon: "none" });
      return;
    }
    if (!this.data.title) {
      wx.showToast({ title: "Give this code a name", icon: "none" });
      return;
    }
    store.add({
      id: "qr-" + Date.now(),
      title: this.data.title,
      subtitle: this.data.subtitle || "Uploaded",
      channel: this.data.channel,
      action: this.data.action,
      image: this.data.image,
      payload: "",
      amount: this.data.amount,
      note: this.data.note,
      pinned: false,
      createdAt: Date.now(),
    });
    wx.showToast({ title: "Saved", icon: "success" });
    setTimeout(() => {
      wx.reLaunch({ url: "/pages/index/index" });
    }, 400);
  },
});
