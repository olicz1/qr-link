# 码柜 PayCase

A WeChat mini program demo for collecting payment QR codes and presenting them from a gallery. Tap a card to open a pay sheet, an in-app page, or the decoded text.

This repo is meant to grow into a real WeChat mini program: the browser app is the interactive demo, and `weapp/` is a native starter you can open in WeChat DevTools.

## What you can do in the demo

East Wind Noodles (东风面馆) is the sample merchant.

- **Gallery (码柜)** — WeChat Pay, Alipay, UnionPay, a weekend-set link, and a hours/text code. Pin or delete from the card menu.
- **Tap a card** — Payment codes open a WeChat-style sheet (edit amount → 立即支付). The weekend-set card opens an in-app menu. The hours card shows decoded text.
- **Upload (上传)** — Album or camera. The demo tries to decode the QR with jsQR and pre-fills channel + tap action.
- **Me (我的)** — Shop name (shown on the pay sheet), restore demo data, or clear the gallery. Codes stay in `localStorage` on this device.

No real charges. The pay button is a mocked `wx.requestPayment`.

## Run the browser demo

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:43147](http://127.0.0.1:43147). Desktop shows a phone frame; a narrow viewport is full-screen, like opening the mini program on a device.

## Open the native mini program

1. Install [WeChat DevTools](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html).
2. Import the `weapp/` folder.
3. Use a test AppID (or the tourist AppID already in `weapp/project.config.json`).
4. Seed QR images live in `weapp/images/`. Upload uses `wx.chooseMedia`.

## Project layout

```
src/lib/types.ts           Shared item shape (keep this when you add a backend)
src/lib/wechat-bridge.ts   Web stand-ins for wx.chooseMedia / wx.requestPayment / clipboard
src/lib/store.tsx          Gallery state + localStorage
src/lib/qr.ts              Generate + decode QR images
src/components/wechat/     Mini program chrome (capsule, tab bar, toasts)
src/components/gallery/    Code grid
src/components/pay/        Bottom sheet: pay / link / text
src/components/upload/     Add a code
weapp/                     Native WeChat mini program (same three tabs)
```

## Path to a production mini program

1. **AppID** — Register the mini program, replace `touristappid` in `weapp/project.config.json`.
2. **Media** — Keep using `wx.chooseMedia`. Persist files to WeChat Cloud or your CDN instead of temp paths.
3. **Decode** — The H5 demo uses jsQR. On WeChat, use a decode plugin or a cloud function, then keep `inferChannelAndAction`.
4. **Pay** — Merchant platform + a backend unified-order API. In `weapp/pages/index/index.js` `pay()`, replace the `setTimeout` with `wx.requestPayment`. The H5 seam is `requestPayment` in `src/lib/wechat-bridge.ts`.
5. **Same model** — `QrItem` (`id`, `title`, `channel`, `action`, `image`, `payload`, `amount`) is the contract between the demo and the native app.

A later step is wrapping this UI in Taro or uni-app so one codebase ships H5 + WeChat. The page map is already 码柜 / 上传 / 我的 plus a stack page for 周末套餐.
