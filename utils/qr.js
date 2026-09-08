let worker = null;
let workerFailed = false;
let jobId = 0;
const jobs = {};

function alive(opts) {
  return !opts || typeof opts.alive !== "function" || opts.alive();
}

function decodeLocal(data, w, h, thorough) {
  return require("../workers/decode-rgba").decodeRgba(data, w, h, { thorough });
}

function dropWorker() {
  if (worker) {
    try {
      worker.terminate();
    } catch (e) {}
  }
  worker = null;
  Object.keys(jobs).forEach((id) => {
    const job = jobs[id];
    delete jobs[id];
    if (job && job.resolve) job.resolve("");
  });
}

function getWorker() {
  if (workerFailed) return null;
  if (worker) return worker;
  if (typeof wx.createWorker !== "function") {
    workerFailed = true;
    return null;
  }
  try {
    worker = wx.createWorker("workers/qr-worker.js");
    worker.onMessage((msg) => {
      const job = jobs[msg && msg.id];
      if (!job) return;
      delete jobs[msg.id];
      clearTimeout(job.timer);
      job.resolve((msg && msg.text) || "");
    });
    if (typeof worker.onProcessKilled === "function") {
      worker.onProcessKilled(() => {
        worker = null;
      });
    }
    return worker;
  } catch (e) {
    workerFailed = true;
    worker = null;
    return null;
  }
}

function decodePixels(data, w, h, thorough) {
  const wkr = getWorker();
  if (!wkr) {
    return new Promise((resolve) => {
      setTimeout(() => {
        try {
          resolve(decodeLocal(data, w, h, thorough) || "");
        } catch (e) {
          resolve("");
        }
      }, 0);
    });
  }

  const id = ++jobId;
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      delete jobs[id];
      resolve("");
    }, 10000);
    jobs[id] = { resolve, timer };
    try {
      wkr.postMessage({
        id,
        buffer: data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength),
        width: w,
        height: h,
        thorough: !!thorough,
      });
    } catch (e) {
      clearTimeout(timer);
      delete jobs[id];
      try {
        resolve(decodeLocal(data, w, h, thorough) || "");
      } catch (err) {
        resolve("");
      }
    }
  });
}

function getCanvas(w, h) {
  return wx.createOffscreenCanvas({ type: "2d", width: w, height: h });
}

function decodeQr(src, opts) {
  const thorough = !!(opts && opts.thorough);
  const maxSide = thorough ? 640 : 480;
  return new Promise((resolve, reject) => {
    if (!alive(opts)) {
      resolve("");
      return;
    }
    wx.getImageInfo({
      src,
      success: (info) => {
        if (!alive(opts)) {
          resolve("");
          return;
        }
        const path = info.path || src;
        const ow = info.width || 0;
        const oh = info.height || 0;
        if (!ow || !oh) {
          reject(new Error("bad image"));
          return;
        }

        const scale = Math.min(1, maxSide / Math.max(ow, oh));
        const w = Math.max(1, Math.round(ow * scale));
        const h = Math.max(1, Math.round(oh * scale));
        const board = getCanvas(w, h);
        const ctx = board.getContext("2d");
        const image = board.createImage();
        image.onload = () => {
          if (!alive(opts)) {
            resolve("");
            return;
          }
          try {
            ctx.clearRect(0, 0, w, h);
            ctx.drawImage(image, 0, 0, w, h);
            const frame = ctx.getImageData(0, 0, w, h);
            decodePixels(frame.data, frame.width, frame.height, thorough)
              .then((text) => resolve(alive(opts) ? text : ""))
              .catch(() => resolve(""));
          } catch (err) {
            reject(err);
          }
        };
        image.onerror = () => reject(new Error("image load"));
        image.src = path;
      },
      fail: reject,
    });
  });
}

function warmWorker() {
  getWorker();
}

function cancelDecodeJobs() {
  dropWorker();
}

module.exports = Object.assign(
  {
    decodeQr,
    warmWorker,
    cancelDecodeJobs,
  },
  require("./open"),
);
