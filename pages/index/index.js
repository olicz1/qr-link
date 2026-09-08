const store = require("../../utils/store");
const { pageMetrics, syncTabBar } = require("../../utils/layout");
const { openInsideApp } = require("../../utils/open");

const FILTERS = [{ id: "all", label: "全部" }].concat(store.TAGS);

function hideLoading() {
  try {
    wx.hideLoading();
  } catch (e) {}
}

Page({
  data: {
    items: [],
    total: 0,
    profile: {},
    filters: FILTERS,
    filter: "all",
    menuId: "",
    active: null,
    amount: "",
    paying: false,
    success: false,
    txId: "",
    pagePad: 120,
    sheetPad: 24,
  },

  onShow() {
    const m = pageMetrics();
    const all = store.list();
    const filter = this.data.filter;
    this.setData({
      pagePad: m.pagePad,
      sheetPad: m.sheetPad,
      items: filter === "all" ? all : all.filter((row) => row.channel === filter),
      total: all.length,
      profile: store.profile(),
      menuId: "",
    });
    syncTabBar("index");
  },

  noop() {},

  closeMenu() {
    if (this.data.menuId) this.setData({ menuId: "" });
  },

  refresh() {
    const all = store.list();
    const filter = this.data.filter;
    this.setData({
      items: filter === "all" ? all : all.filter((row) => row.channel === filter),
      total: all.length,
      profile: store.profile(),
      menuId: "",
    });
  },

  setFilter(e) {
    this.setData({ filter: e.currentTarget.dataset.id }, () => this.refresh());
  },

  toggleMenu(e) {
    const id = e.currentTarget.dataset.id;
    this.setData({ menuId: this.data.menuId === id ? "" : id });
  },

  open(e) {
    const id = e.currentTarget.dataset.id;
    const item = (this.data.items || []).find((row) => row.id === id) ||
      (store.list() || []).find((row) => row.id === id);
    if (!item) return;
    this.setData({ menuId: "" });
    if (item.action === "open_miniapp") {
      this.openMiniapp(item);
      return;
    }
    this.setData({
      active: item,
      amount: item.amount || "",
      paying: false,
      success: false,
      txId: "",
    });
  },

  openMiniapp(item) {
    const finish = (ok) => {
      hideLoading();
      if (!ok) wx.showToast({ title: "无法打开", icon: "none" });
    };
    const go = (text) => {
      if (text && item.id && text !== item.payload) {
        store.patch(item.id, { payload: text });
      }
      return openInsideApp(text || "");
    };

    if (this._opening) return;
    this._opening = true;
    const loadingTimer = setTimeout(hideLoading, 8000);
    const done = (ok) => {
      clearTimeout(loadingTimer);
      this._opening = false;
      finish(ok);
    };

    if (item.payload) {
      wx.showLoading({ title: "打开中" });
      go(item.payload).then(done, () => done(false));
      return;
    }
    if (!item.image) {
      clearTimeout(loadingTimer);
      this._opening = false;
      wx.showToast({ title: "没有二维码", icon: "none" });
      return;
    }
    wx.showLoading({ title: "识别中" });
    const decodeQr = require("../../utils/qr").decodeQr;
    decodeQr(item.image, { thorough: true })
      .then((text) => go(text))
      .catch(() => go(""))
      .then(done, () => done(false));
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
      wx.showToast({ title: "请输入金额", icon: "none" });
      return;
    }
    this.setData({ paying: true });
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
    const text = (this.data.active && this.data.active.payload) || "";
    if (!text) {
      wx.showToast({ title: "没有可复制的内容", icon: "none" });
      return;
    }
    wx.setClipboardData({ data: text });
  },

  saveImage() {
    const src = this.data.active && this.data.active.image;
    if (!src) return;
    const save = (filePath) => {
      wx.saveImageToPhotosAlbum({
        filePath,
        success: () => wx.showToast({ title: "已保存", icon: "success" }),
        fail: () => wx.showToast({ title: "无法保存", icon: "none" }),
      });
    };
    if (src.indexOf("http") === 0 || src.indexOf("wxfile") === 0 || src.indexOf("tmp") !== -1) {
      save(src);
      return;
    }
    wx.getImageInfo({
      src,
      success: (res) => save(res.path),
      fail: () => wx.showToast({ title: "无法保存", icon: "none" }),
    });
  },

  pin(e) {
    store.togglePin(e.currentTarget.dataset.id);
    this.refresh();
  },

  remove(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: "删除这个码？",
      content: "会从这台设备上移除，之后可以重新上传。",
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
