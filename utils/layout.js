function pageMetrics() {
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
  return {
    safeBottom,
    tabBar,
    pagePad: tabBar + safeBottom + 40,
    sheetPad: 16 + safeBottom,
  };
}

module.exports = { pageMetrics };
