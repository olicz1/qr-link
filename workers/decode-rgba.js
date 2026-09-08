let jsQR = null;

function getJsQR() {
  if (!jsQR) jsQR = require("./jsqr");
  return jsQR;
}

function readJsQR(data, w, h, invert) {
  const code = getJsQR()(data, w, h, {
    inversionAttempts: invert ? "attemptBoth" : "dontInvert",
  });
  return code && code.data ? String(code.data) : "";
}

function toGray(data, w, h) {
  const gray = new Uint8Array(w * h);
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    gray[p] = (data[i] * 77 + data[i + 1] * 150 + data[i + 2] * 29) >> 8;
  }
  return gray;
}

function otsu(gray) {
  const hist = new Array(256);
  for (let i = 0; i < 256; i++) hist[i] = 0;
  for (let i = 0; i < gray.length; i++) hist[gray[i]]++;
  let sum = 0;
  for (let i = 0; i < 256; i++) sum += i * hist[i];
  const total = gray.length;
  let sumB = 0;
  let wB = 0;
  let max = 0;
  let thresh = 120;
  for (let t = 0; t < 256; t++) {
    wB += hist[t];
    if (!wB) continue;
    const wF = total - wB;
    if (!wF) break;
    sumB += t * hist[t];
    const mB = sumB / wB;
    const mF = (sum - sumB) / wF;
    const between = wB * wF * (mB - mF) * (mB - mF);
    if (between > max) {
      max = between;
      thresh = t;
    }
  }
  return thresh;
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

function ratioOk(run) {
  const total = run[0] + run[1] + run[2] + run[3] + run[4];
  if (total < 7) return false;
  const m = total / 7;
  const loose = m * 1.05;
  return (
    Math.abs(run[0] - m) < loose &&
    Math.abs(run[1] - m) < loose &&
    Math.abs(run[2] - 3 * m) < m * 1.6 &&
    Math.abs(run[3] - m) < loose &&
    Math.abs(run[4] - m) < loose &&
    run[2] >= run[0] * 1.4 &&
    run[2] >= run[4] * 1.4
  );
}

function scanAxis(dark, w, h, cx, cy, dx, dy) {
  const run = [0, 0, 0, 0, 0];
  let x = Math.round(cx);
  let y = Math.round(cy);
  const inside = () => x >= 0 && y >= 0 && x < w && y < h;
  while (inside() && dark[y * w + x]) {
    x -= dx;
    y -= dy;
  }
  while (inside() && !dark[y * w + x]) {
    x -= dx;
    y -= dy;
  }
  for (let i = 0; i < 5; i++) {
    const want = i % 2 === 0;
    const startX = x;
    const startY = y;
    while (inside() && dark[y * w + x] === want) {
      x += dx;
      y += dy;
    }
    run[i] = Math.abs(x - startX) + Math.abs(y - startY);
    if (!run[i]) return 0;
  }
  return ratioOk(run) ? 1 : 0;
}

function findFinderHits(dark, w, h) {
  const hits = [];
  for (let y = 1; y < h; y += 2) {
    let x = 0;
    const row = y * w;
    while (x < w) {
      if (!dark[row + x]) {
        x++;
        continue;
      }
      const run = [0, 0, 0, 0, 0];
      const start = x;
      for (let i = 0; i < 5 && x < w; i++) {
        const want = i % 2 === 0;
        const a = x;
        while (x < w && dark[row + x] === want) x++;
        run[i] = x - a;
        if (!run[i]) break;
      }
      if (run[4] && ratioOk(run)) {
        const cx = start + run[0] + run[1] + run[2] / 2;
        if (scanAxis(dark, w, h, cx, y, 0, 1)) {
          hits.push({
            x: cx,
            y: y,
            size: run[0] + run[1] + run[2] + run[3] + run[4],
          });
        }
      }
      x = start + Math.max(1, run[0]);
    }
  }
  return hits;
}

function clusterHits(hits) {
  const groups = [];
  hits.forEach((hit) => {
    let found = null;
    let best = 1e9;
    for (let i = 0; i < groups.length; i++) {
      const g = groups[i];
      const dx = hit.x - g.x;
      const dy = hit.y - g.y;
      const d = dx * dx + dy * dy;
      const lim = Math.max(16, (g.size + hit.size) * 0.5);
      if (d < lim * lim && d < best) {
        best = d;
        found = g;
      }
    }
    if (found) {
      const n = found.n + 1;
      found.x = (found.x * found.n + hit.x) / n;
      found.y = (found.y * found.n + hit.y) / n;
      found.size = (found.size * found.n + hit.size) / n;
      found.n = n;
    } else {
      groups.push({ x: hit.x, y: hit.y, size: hit.size, n: 1 });
    }
  });
  groups.sort((a, b) => b.n - a.n);
  return groups;
}

function dist2(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

function orderFinders(a, b, c) {
  const dAB = dist2(a, b);
  const dAC = dist2(a, c);
  const dBC = dist2(b, c);
  let tl;
  let o1;
  let o2;
  if (dAB >= dAC && dAB >= dBC) {
    tl = c;
    o1 = a;
    o2 = b;
  } else if (dAC >= dAB && dAC >= dBC) {
    tl = b;
    o1 = a;
    o2 = c;
  } else {
    tl = a;
    o1 = b;
    o2 = c;
  }
  const cross = (o1.x - tl.x) * (o2.y - tl.y) - (o1.y - tl.y) * (o2.x - tl.x);
  return {
    tl,
    tr: cross < 0 ? o2 : o1,
    bl: cross < 0 ? o1 : o2,
  };
}

function expandQuad(tl, tr, bl, br, factor) {
  const cx = (tl.x + tr.x + bl.x + br.x) / 4;
  const cy = (tl.y + tr.y + bl.y + br.y) / 4;
  const grow = (p) => ({
    x: cx + (p.x - cx) * factor,
    y: cy + (p.y - cy) * factor,
  });
  return [grow(tl), grow(tr), grow(br), grow(bl)];
}

function solve8(A, b) {
  const n = 8;
  const M = A.map((row, i) => row.concat([b[i]]));
  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let r = col + 1; r < n; r++) {
      if (Math.abs(M[r][col]) > Math.abs(M[pivot][col])) pivot = r;
    }
    const tmp = M[col];
    M[col] = M[pivot];
    M[pivot] = tmp;
    const diag = M[col][col];
    if (Math.abs(diag) < 1e-8) return null;
    for (let c = col; c <= n; c++) M[col][c] /= diag;
    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const f = M[r][col];
      if (!f) continue;
      for (let c = col; c <= n; c++) M[r][c] -= f * M[col][c];
    }
  }
  return M.map((row) => row[n]);
}

function homography(dst, src) {
  const A = [];
  const b = [];
  for (let i = 0; i < 4; i++) {
    const x = dst[i].x;
    const y = dst[i].y;
    const u = src[i].x;
    const v = src[i].y;
    A.push([x, y, 1, 0, 0, 0, -u * x, -u * y]);
    b.push(u);
    A.push([0, 0, 0, x, y, 1, -v * x, -v * y]);
    b.push(v);
  }
  const h = solve8(A, b);
  if (!h) return null;
  return h.concat([1]);
}

function applyH(H, x, y) {
  const w = H[6] * x + H[7] * y + H[8];
  return {
    x: (H[0] * x + H[1] * y + H[2]) / w,
    y: (H[3] * x + H[4] * y + H[5]) / w,
  };
}

function sampleBilinear(data, w, h, x, y) {
  if (x < 0 || y < 0 || x >= w - 1 || y >= h - 1) return [255, 255, 255, 255];
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const fx = x - x0;
  const fy = y - y0;
  const i00 = (y0 * w + x0) * 4;
  const i10 = i00 + 4;
  const i01 = i00 + w * 4;
  const i11 = i01 + 4;
  const out = [0, 0, 0, 255];
  for (let c = 0; c < 3; c++) {
    const v0 = data[i00 + c] * (1 - fx) + data[i10 + c] * fx;
    const v1 = data[i01 + c] * (1 - fx) + data[i11 + c] * fx;
    out[c] = v0 * (1 - fy) + v1 * fy;
  }
  return out;
}

function warpQuad(data, w, h, quad, size) {
  const dst = [
    { x: 0, y: 0 },
    { x: size - 1, y: 0 },
    { x: size - 1, y: size - 1 },
    { x: 0, y: size - 1 },
  ];
  const H = homography(dst, quad);
  if (!H) return null;
  const out = new Uint8ClampedArray(size * size * 4);
  let p = 0;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const s = applyH(H, x, y);
      const pix = sampleBilinear(data, w, h, s.x, s.y);
      out[p++] = pix[0];
      out[p++] = pix[1];
      out[p++] = pix[2];
      out[p++] = 255;
    }
  }
  return out;
}

function unwarpFromFinders(data, w, h) {
  const gray = toGray(data, w, h);
  const thresh = otsu(gray);
  const dark = new Uint8Array(w * h);
  for (let i = 0; i < gray.length; i++) dark[i] = gray[i] < thresh ? 1 : 0;
  const groups = clusterHits(findFinderHits(dark, w, h)).filter((g) => g.n >= 1);
  if (groups.length < 3) return [];
  const ordered = orderFinders(groups[0], groups[1], groups[2]);
  const br = {
    x: ordered.tr.x + ordered.bl.x - ordered.tl.x,
    y: ordered.tr.y + ordered.bl.y - ordered.tl.y,
  };
  const out = [];
  [1.35, 1.55, 1.75].forEach((factor) => {
    const quad = expandQuad(ordered.tl, ordered.tr, ordered.bl, br, factor);
    const warped = warpQuad(data, w, h, quad, 400);
    if (warped) out.push({ data: warped, w: 400, h: 400 });
  });
  return out;
}

function decodeParts(overview, crops, full, photo) {
  if (overview) {
    const text = readJsQR(overview.data, overview.w, overview.h, false);
    if (text) return text;
  }

  const list = crops || [];
  for (let i = 0; i < list.length; i++) {
    const crop = list[i];
    const text = readJsQR(crop.data, crop.w, crop.h, true);
    if (text) return text;
  }

  if (photo) {
    const target = list[0] || full || overview;
    if (target) {
      const warped = unwarpFromFinders(target.data, target.w, target.h);
      for (let i = 0; i < warped.length; i++) {
        const text = readJsQR(warped[i].data, warped[i].w, warped[i].h, true);
        if (text) return text;
      }
    }
  }

  if (full && (!overview || full.w !== overview.w || full.h !== overview.h)) {
    const text = readJsQR(full.data, full.w, full.h, true);
    if (text) return text;
  }
  return "";
}

function decodeRgba(data, w, h, opts) {
  const photo = !!(opts && (opts.photo || opts.thorough));
  const overview = downscaleRgba(data, w, h, 720);
  const gray = toGray(data, w, h);
  const boxes = contrastBoxes(gray, w, h);
  const crops = boxes.map((box) => cropRgba(data, w, h, box));
  const full = { data, w, h };
  return decodeParts(overview, crops, full, photo);
}

function decodePhotoParts(parts) {
  return decodeParts(
    parts.overview || null,
    parts.crops || [],
    parts.full || null,
    parts.photo !== false,
  );
}

module.exports = {
  decodeRgba,
  decodePhotoParts,
  readJsQR,
  toGray,
  cropRgba,
  downscaleRgba,
  contrastBoxes,
};
