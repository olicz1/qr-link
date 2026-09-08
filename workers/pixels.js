function toGray(data, w, h) {
  const gray = new Uint8Array(w * h);
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    gray[p] = (data[i] * 77 + data[i + 1] * 150 + data[i + 2] * 29) >> 8;
  }
  return gray;
}

function cropRgba(data, w, h, box) {
  const x0 = Math.max(0, Math.round(box.x));
  const y0 = Math.max(0, Math.round(box.y));
  const cw = Math.max(8, Math.min(w - x0, Math.round(box.w)));
  const ch = Math.max(8, Math.min(h - y0, Math.round(box.h)));
  const out = new Uint8ClampedArray(cw * ch * 4);
  for (let y = 0; y < ch; y++) {
    const src = ((y0 + y) * w + x0) * 4;
    out.set(data.subarray(src, src + cw * 4), y * cw * 4);
  }
  return { data: out, w: cw, h: ch };
}

function downscaleRgba(data, w, h, maxSide) {
  const scale = Math.min(1, maxSide / Math.max(w, h));
  if (scale >= 1) return { data, w, h };
  const nw = Math.max(1, Math.round(w * scale));
  const nh = Math.max(1, Math.round(h * scale));
  const out = new Uint8ClampedArray(nw * nh * 4);
  for (let y = 0; y < nh; y++) {
    const sy = Math.min(h - 1, Math.floor(((y + 0.5) / nh) * h));
    for (let x = 0; x < nw; x++) {
      const sx = Math.min(w - 1, Math.floor(((x + 0.5) / nw) * w));
      const si = (sy * w + sx) * 4;
      const di = (y * nw + x) * 4;
      out[di] = data[si];
      out[di + 1] = data[si + 1];
      out[di + 2] = data[si + 2];
      out[di + 3] = 255;
    }
  }
  return { data: out, w: nw, h: nh };
}

function contrastBoxes(gray, w, h) {
  const gw = 16;
  const gh = 16;
  const scores = [];
  for (let gy = 0; gy < gh; gy++) {
    for (let gx = 0; gx < gw; gx++) {
      const x0 = Math.floor((gx * w) / gw);
      const x1 = Math.floor(((gx + 1) * w) / gw);
      const y0 = Math.floor((gy * h) / gh);
      const y1 = Math.floor(((gy + 1) * h) / gh);
      let min = 255;
      let max = 0;
      for (let y = y0; y < y1; y++) {
        const row = y * w;
        for (let x = x0; x < x1; x++) {
          const v = gray[row + x];
          if (v < min) min = v;
          if (v > max) max = v;
        }
      }
      scores.push({ gx, gy, score: max - min });
    }
  }
  scores.sort((a, b) => b.score - a.score);
  const boxes = [];
  const seen = {};
  for (let i = 0; i < scores.length && boxes.length < 3; i++) {
    const cell = scores[i];
    if (cell.score < 40) break;
    const key = cell.gx + "x" + cell.gy;
    if (seen[key]) continue;
    seen[key] = true;
    const pad = 2;
    const x = Math.floor(((cell.gx - pad) * w) / gw);
    const y = Math.floor(((cell.gy - pad) * h) / gh);
    const bw = Math.floor(((pad * 2 + 3) * w) / gw);
    const bh = Math.floor(((pad * 2 + 3) * h) / gh);
    boxes.push({
      x: Math.max(0, x),
      y: Math.max(0, y),
      w: Math.min(w, bw, 560),
      h: Math.min(h, bh, 560),
    });
  }
  return boxes;
}

module.exports = {
  toGray,
  cropRgba,
  downscaleRgba,
  contrastBoxes,
};
