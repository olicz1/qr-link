let cached = null;

function pageMetrics() {
  if (cached) return cached;

  let info = {};
  try {
    info = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
  } catch (e) {
    info = {};
  }

  let safeBottom = 0;
  if (info.safeAreaInsets && typeof info.safeAreaInsets.bottom === "number") {
    safeBottom = info.safeAreaInsets.bottom;
  } else if (info.safeArea && info.screenHeight) {
    safeBottom = Math.max(0, info.screenHeight - info.safeArea.bottom);
  }

  const tabBar = 56;
  cached = {
    safeBottom,
    tabBar,
    pagePad: tabBar + safeBottom + 40,
    sheetPad: 16 + safeBottom,
  };
  return cached;
}

function syncTabBar(active) {
  try {
    const pages = getCurrentPages();
    const page = pages[pages.length - 1];
    if (!page || typeof page.getTabBar !== "function") return;
    const bar = page.getTabBar();
    if (bar) bar.setData({ active });
  } catch (e) {}
}

module.exports = { pageMetrics, syncTabBar };
