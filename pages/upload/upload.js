const store = require("../../utils/store");
const { pageMetrics } = require("../../utils/layout");

Page({
  data: {
    image: "",
    title: "",
    subtitle: "",
    channel: "wechat",
    action: "payment",
    amount: "",
    note: "",
    pagePad: 120,
    channels: [
      { id: "wechat", label: "微信支付" },
      { id: "alipay", label: "支付宝" },
      { id: "unionpay", label: "云闪付" },
      { id: "link", label: "链接" },
      { id: "text", label: "文本" },
      { id: "custom", label: "自定义" },
    ],
    actions: [
      { id: "payment", label: "收款弹层", hint: "打开微信风格的金额 + 支付页。" },
      { id: "open_link", label: "打开链接", hint: "跳到小程序页或网址。" },
      { id: "show_content", label: "显示内容", hint: "弹出解码后的文本。" },
    ],
  },

  onLoad() {
    this.applyMetrics();
  },

  onShow() {
    this.applyMetrics();
  },

  applyMetrics() {
    this.setData({ pagePad: pageMetrics().pagePad });
  },

  choose(e) {
    const source = e.currentTarget.dataset.source;
    wx.chooseMedia({
      count: 1,
      mediaType: ["image"],
      sourceType: source ? [source] : ["album", "camera"],
      success: (res) => {
        const file = res.tempFiles[0];
        this.setData({ image: file.tempFilePath });
      },
      fail: () => {
        wx.showToast({ title: "未选择图片", icon: "none" });
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
      wx.showToast({ title: "先选一张二维码", icon: "none" });
      return;
    }
    if (!this.data.title) {
      wx.showToast({ title: "给这个码起个名字", icon: "none" });
      return;
    }
    store.add({
      id: "qr-" + Date.now(),
      title: this.data.title,
      subtitle: this.data.subtitle || "已上传",
      channel: this.data.channel,
      action: this.data.action,
      image: this.data.image,
      payload: "",
      amount: this.data.amount,
      note: this.data.note,
      pinned: false,
      createdAt: Date.now(),
    });
    wx.showToast({ title: "已保存", icon: "success" });
    setTimeout(() => {
      wx.reLaunch({ url: "/pages/index/index" });
    }, 400);
  },
});
