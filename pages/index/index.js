const store = require("../../utils/store");

Page({
  data: {
    items: [],
    profile: {},
    active: null,
    amount: "",
    paying: false,
    success: false,
    txId: "",
  },

  onShow() {
    this.refresh();
  },

  noop() {},

  refresh() {
    this.setData({
      items: store.list(),
      profile: store.profile(),
    });
  },

  open(e) {
    const id = e.currentTarget.dataset.id;
    const item = (store.list() || []).find((row) => row.id === id);
    if (!item) return;
    this.setData({
      active: item,
      amount: item.amount || "",
      paying: false,
      success: false,
      txId: "",
    });
  },

  close() {
    if (this.data.paying) return;
    this.setData({ active: null, success: false });
  },

  onAmount(e) {
    this.setData({ amount: e.detail.value });
  },

  pay() {
    const amount = Number(this.data.amount);
    if (!amount) {
      wx.showToast({ title: "Enter an amount", icon: "none" });
      return;
    }
    this.setData({ paying: true });
    // In production: call your unified-order API, then wx.requestPayment.
    setTimeout(() => {
      this.setData({
        paying: false,
        success: true,
        txId: "PC" + Date.now().toString(36).toUpperCase(),
      });
    }, 1100);
  },

  openLink() {
    const item = this.data.active;
    this.setData({ active: null });
    if (item && item.payload && item.payload.startsWith("/pages/")) {
      wx.navigateTo({ url: item.payload });
    }
  },

  copyPayload() {
    wx.setClipboardData({ data: this.data.active.payload || "" });
  },

  pin(e) {
    store.togglePin(e.currentTarget.dataset.id);
    this.refresh();
  },

  remove(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: "Delete this code?",
      content: "It will be removed from this device.",
      confirmColor: "#FA5151",
      success: (res) => {
        if (res.confirm) {
          store.remove(id);
          this.refresh();
        }
      },
    });
  },
});
