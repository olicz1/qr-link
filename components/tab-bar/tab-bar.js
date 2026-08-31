Component({
  properties: {
    active: {
      type: String,
      value: "index",
    },
  },
  methods: {
    go(e) {
      const page = e.currentTarget.dataset.page;
      if (page === this.data.active) return;
      const map = {
        index: "/pages/index/index",
        upload: "/pages/upload/upload",
        me: "/pages/me/me",
      };
      wx.reLaunch({ url: map[page] });
    },
  },
});
