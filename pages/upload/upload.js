const store = require("../../utils/store");
const { pageMetrics, syncTabBar } = require("../../utils/layout");
const { decodeQr, warmWorker } = require("../../utils/qr");
const { persistImage } = require("../../utils/image");

function titleFrom(text) {
  const raw = (text || "").trim();
  if (!raw) return "";
  try {
    if (/^https?:\/\//i.test(raw)) {
      const host = raw.replace(/^https?:\/\//i, "").split("/")[0];
      return host.replace(/^www\./, "");
    }
  } catch (e) {}
  return raw.slice(0, 16);
}

Page({
  data: {
    image: "",
    title: "",
    subtitle: "",
    payload: "",
    recognizing: false,
    saving: false,
    channel: "parking",
    pagePad: 120,
    channels: store.TAGS,
  },

  onLoad() {
    this.decodeGen = 0;
    this.applyMetrics();
    warmWorker();
  },

  onShow() {
    this.applyMetrics();
    syncTabBar("upload");
  },

  onUnload() {
    this.decodeGen += 1;
  },

  applyMetrics() {
    this.setData({ pagePad: pageMetrics().pagePad });
  },

  cancelDecode() {
    this.decodeGen += 1;
  },

  applyPayload(text, fillTitle) {
    const payload = (text || "").trim();
    if (!payload) return;
    const next = { payload };
    if (fillTitle && !this.data.title) next.title = titleFrom(payload);
    this.setData(next);
  },

  scan() {
    wx.scanCode({
      onlyFromCamera: false,
      scanType: ["qrCode", "wxCode"],
      success: (res) => {
        this.applyPayload(res.result, true);
        wx.showToast({ title: "已识别", icon: "success" });
        if (!this.data.image) {
          wx.chooseMedia({
            count: 1,
            mediaType: ["image"],
            sourceType: ["album", "camera"],
            success: (media) => {
              this.setData({ image: media.tempFiles[0].tempFilePath });
            },
          });
        }
      },
      fail: (err) => {
        const msg = (err && err.errMsg) || "";
        if (msg.indexOf("cancel") !== -1) return;
        wx.showToast({ title: "未识别到码", icon: "none" });
      },
    });
  },

  choose(e) {
    const source = e.currentTarget.dataset.source;
    wx.chooseMedia({
      count: 1,
      mediaType: ["image"],
      sourceType: source ? [source] : ["album", "camera"],
      success: (res) => {
        const file = res.tempFiles[0];
        this.cancelDecode();
        const gen = this.decodeGen;
        this.setData({ image: file.tempFilePath, recognizing: true, payload: "" }, () => {
          decodeQr(file.tempFilePath, { alive: () => this.decodeGen === gen })
            .then((text) => {
              if (this.decodeGen !== gen) return;
              this.setData({ recognizing: false });
              if (text) {
                this.applyPayload(text, true);
                wx.showToast({ title: "已识别", icon: "success" });
              } else {
                wx.showToast({ title: "未识别到码，可改用扫一扫", icon: "none" });
              }
            })
            .catch(() => {
              if (this.decodeGen !== gen) return;
              this.setData({ recognizing: false });
              wx.showToast({ title: "未识别到码，可改用扫一扫", icon: "none" });
            });
        });
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
  setChannel(e) {
    this.setData({ channel: e.currentTarget.dataset.id });
  },

  resetForm() {
    this.cancelDecode();
    this.setData({
      image: "",
      title: "",
      subtitle: "",
      payload: "",
      recognizing: false,
      saving: false,
      channel: "parking",
    });
  },

  save() {
    if (this.data.saving) return;
    if (!this.data.image) {
      wx.showToast({ title: "先选一张二维码", icon: "none" });
      return;
    }
    if (!this.data.title) {
      wx.showToast({ title: "给这个码起个名字", icon: "none" });
      return;
    }

    this.cancelDecode();
    this.setData({ saving: true, recognizing: false });
    const draft = {
      id: "qr-" + Date.now(),
      title: this.data.title,
      subtitle: this.data.subtitle || "已上传",
      channel: this.data.channel,
      action: "open_miniapp",
      image: this.data.image,
      payload: this.data.payload || "",
      amount: "",
      note: "",
      pinned: false,
      createdAt: Date.now(),
    };

    persistImage(draft.image)
      .catch(() => draft.image)
      .then((image) => {
        store.add(Object.assign({}, draft, { image }));
        const toast = () => wx.showToast({ title: "已保存", icon: "success" });
        wx.switchTab({
          url: "/pages/index/index",
          success: () => {
            this.resetForm();
            toast();
          },
          fail: () => {
            this.resetForm();
            wx.reLaunch({ url: "/pages/index/index", complete: toast });
          },
        });
      })
      .catch(() => {
        this.setData({ saving: false });
        wx.showToast({ title: "保存失败", icon: "none" });
      });
  },
});
