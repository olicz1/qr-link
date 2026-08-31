# 码柜 PayCase

A WeChat mini program for collecting payment QR codes and presenting them from a gallery. Tap a card to open a pay sheet, an in-app page, or the decoded text.

Open this repo folder in [WeChat DevTools](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html). Edit the same files here in Cursor.

## What you can do

East Wind Noodles (东风面馆) is the sample merchant.

- **Gallery (码柜)** — WeChat Pay, Alipay, UnionPay, a weekend-set link, and a hours/text code. Pin or delete from the card.
- **Tap a card** — Payment codes open a WeChat-style sheet (edit amount → 立即支付). The weekend-set card opens an in-app menu. The hours card shows decoded text.
- **Upload (上传)** — Album or camera via `wx.chooseMedia`.
- **Me (我的)** — Shop name (shown on the pay sheet), restore demo data, or clear the gallery. Codes stay in `wx` storage on this device.

No real charges. The pay button is a mocked `wx.requestPayment`.

## Open in WeChat DevTools

1. Install [WeChat DevTools](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html).
2. Import this folder (the one that contains `app.json` and `project.config.json`).
3. Use a test AppID, or the tourist AppID already in `project.config.json`.
4. Seed QR images live in `images/`.

## Layout

```
app.js / app.json / app.wxss   Mini program entry
pages/index                    Gallery + pay sheet
pages/upload                   Add a code
pages/me                       Shop name + restore / clear
pages/promo                    Weekend set (stack page)
components/tab-bar             Bottom tabs
utils/store.js                 Gallery state + wx storage
images/                        Seed QR images
```

## Path to production

1. **AppID** — Register the mini program, replace `touristappid` in `project.config.json`.
2. **Media** — Keep using `wx.chooseMedia`. Persist files to WeChat Cloud or your CDN instead of temp paths.
3. **Decode** — Use a decode plugin or a cloud function after upload, then infer channel and tap action.
4. **Pay** — Merchant platform + a backend unified-order API. In `pages/index/index.js` `pay()`, replace the `setTimeout` with `wx.requestPayment`.
5. **Model** — Each code is `{ id, title, channel, action, image, payload, amount }`.
