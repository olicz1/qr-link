App({
  onLaunch() {
    const store = require("./utils/store");
    store.ensureSeed();
  },
});
