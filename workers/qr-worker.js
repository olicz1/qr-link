const { decodeRgba } = require("./decode-rgba");

worker.onMessage((msg) => {
  const id = msg && msg.id;
  try {
    const raw = msg.buffer || msg.data;
    const pixels = raw instanceof Uint8ClampedArray ? raw : new Uint8ClampedArray(raw);
    const text = decodeRgba(pixels, msg.width, msg.height, { thorough: !!msg.thorough });
    worker.postMessage({ id, text: text || "" });
  } catch (err) {
    worker.postMessage({ id, text: "", error: (err && err.message) || "decode" });
  }
});
