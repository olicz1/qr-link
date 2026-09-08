Component({
  data: {
    active: "index",
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
      wx.switchTab({ url: map[page] });
    },
  },
});
