function userDir() {
  return (wx.env && wx.env.USER_DATA_PATH) || "";
}

function alreadyKept(src) {
  if (!src) return true;
  if (src.indexOf("/images/") === 0) return true;
  const dir = userDir();
  return !!(dir && src.indexOf(dir) === 0);
}

function saveToUser(tempFilePath) {
  return new Promise((resolve) => {
    const dest = userDir() + "/qr-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8) + ".jpg";
    wx.getFileSystemManager().saveFile({
      tempFilePath,
      filePath: dest,
      success: (res) => resolve((res && res.savedFilePath) || dest),
      fail: () => resolve(tempFilePath),
    });
  });
}

function persistImage(src) {
  if (!src || alreadyKept(src)) return Promise.resolve(src);
  return new Promise((resolve) => {
    const finish = (path) => resolve(path || src);
    const timer = setTimeout(() => finish(src), 4000);
    const done = (path) => {
      clearTimeout(timer);
      finish(path);
    };
    if (typeof wx.compressImage !== "function") {
      saveToUser(src).then(done);
      return;
    }
    wx.compressImage({
      src,
      quality: 70,
      compressedWidth: 720,
      success: (res) => saveToUser(res.tempFilePath).then(done),
      fail: () => saveToUser(src).then(done),
    });
  });
}

module.exports = { persistImage };
