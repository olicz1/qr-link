import { chromium } from "/tmp/paycase-record/node_modules/playwright/index.mjs";
import { mkdirSync, renameSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(ROOT, "docs");
const RAW_DIR = path.join(OUT_DIR, ".demo-raw");
const URL = process.env.DEMO_URL ?? "http://127.0.0.1:43147/";
const UPLOAD_QR = path.join(ROOT, "docs/upload-sample.png");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function click(page, locator) {
  await locator.first().waitFor({ state: "visible", timeout: 20_000 });
  await locator.first().scrollIntoViewIfNeeded();
  const box = await locator.first().boundingBox();
  if (!box) throw new Error("locator has no box");
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, {
    steps: 18,
  });
  await sleep(220);
  await page.mouse.down();
  await sleep(80);
  await page.mouse.up();
}

async function clickAt(page, x, y) {
  await page.mouse.move(x, y, { steps: 16 });
  await sleep(180);
  await page.mouse.down();
  await sleep(70);
  await page.mouse.up();
}

async function dismissSheet(page) {
  const backdrop = page.getByRole("button", { name: "Dismiss" });
  await backdrop.waitFor({ state: "visible", timeout: 10_000 });
  const box = await backdrop.boundingBox();
  if (!box) throw new Error("sheet backdrop has no box");
  await clickAt(page, box.x + box.width / 2, box.y + 36);
  await backdrop.waitFor({ state: "hidden", timeout: 8_000 });
}

async function typeSlow(page, locator, text) {
  await click(page, locator);
  await locator.first().fill("");
  for (const ch of text) {
    await page.keyboard.type(ch, { delay: 70 });
  }
}

async function installCursor(page) {
  await page.addInitScript(() => {
    localStorage.removeItem("paycase.codes.v1");
    localStorage.removeItem("paycase.profile.v1");

    const style = document.createElement("style");
    style.textContent = `
      #demo-cursor {
        position: fixed;
        left: 0;
        top: 0;
        width: 22px;
        height: 22px;
        margin-left: -11px;
        margin-top: -11px;
        border-radius: 50%;
        border: 2px solid #07C160;
        background: rgba(7, 193, 96, 0.32);
        box-shadow: 0 0 0 4px rgba(7, 193, 96, 0.16);
        pointer-events: none;
        z-index: 2147483647;
        transition: transform 80ms ease, background 80ms ease;
      }
      #demo-cursor.down {
        transform: scale(0.72);
        background: rgba(7, 193, 96, 0.55);
      }
    `;
    document.documentElement.appendChild(style);
    const el = document.createElement("div");
    el.id = "demo-cursor";
    document.documentElement.appendChild(el);
    window.addEventListener(
      "mousemove",
      (e) => {
        el.style.left = `${e.clientX}px`;
        el.style.top = `${e.clientY}px`;
      },
      true,
    );
    window.addEventListener("mousedown", () => el.classList.add("down"), true);
    window.addEventListener("mouseup", () => el.classList.remove("down"), true);
  });
}

async function runDemo(page) {
  const phoneNav = page.locator("nav");

  await click(page, page.getByRole("button", { name: "WeChat", exact: true }));
  await sleep(900);
  await click(page, page.getByRole("button", { name: "All", exact: true }));
  await sleep(800);

  await click(page, page.getByRole("heading", { name: "微信收款" }));
  await page.getByRole("button", { name: /立即支付/ }).waitFor();
  await sleep(900);

  const amount = page.locator('input[placeholder="0.00"]');
  await typeSlow(page, amount, "22.00");
  await sleep(400);
  await click(page, page.getByRole("button", { name: /立即支付/ }));
  await page.getByRole("heading", { name: "支付成功" }).waitFor();
  await sleep(1200);
  await click(page, page.getByRole("button", { name: "Done" }));
  await sleep(700);

  await click(page, page.getByRole("heading", { name: "周末套餐" }));
  await page.getByRole("button", { name: "Open weekend menu" }).waitFor();
  await sleep(700);
  await click(page, page.getByRole("button", { name: "Open weekend menu" }));
  await page.waitForURL("**/promo", { timeout: 10_000 });
  await sleep(1400);
  await click(page, page.getByRole("link", { name: "Back to 码柜" }));
  await page.waitForURL((url) => url.pathname === "/", { timeout: 10_000 });
  await sleep(700);

  await click(page, page.getByRole("heading", { name: "营业时间" }));
  await page.getByRole("button", { name: "Copy text" }).waitFor();
  await sleep(1100);
  await dismissSheet(page);
  await sleep(400);

  await click(page, phoneNav.getByRole("link", { name: "上传" }));
  await page.waitForURL("**/upload", { timeout: 10_000 });
  await page.getByText("Choose a QR image").waitFor();
  await sleep(600);

  await click(page, page.getByRole("button", { name: "Album" }));
  await page.locator('input[type="file"]').first().setInputFiles(UPLOAD_QR);
  await page.getByText("QR detected", { exact: true }).waitFor({ timeout: 15_000 });
  await sleep(500);
  await typeSlow(page, page.getByPlaceholder("微信收款"), "柜台备用");
  await sleep(250);
  await typeSlow(page, page.locator('input[placeholder="18.00"]'), "16.00");
  await sleep(400);
  await click(page, page.getByRole("button", { name: "Save to gallery" }));
  await page.waitForURL((url) => url.pathname === "/", { timeout: 10_000 });
  await page.getByRole("heading", { name: "柜台备用" }).waitFor({ timeout: 15_000 });
  await sleep(1100);

  await click(page, phoneNav.getByRole("link", { name: "我的" }));
  await page.waitForURL("**/me", { timeout: 10_000 });
  await page.getByText("Codes in 码柜").waitFor();
  await sleep(1400);

  await click(page, phoneNav.getByRole("link", { name: "码柜" }));
  await page.waitForURL((url) => url.pathname === "/", { timeout: 10_000 });
  await page.getByRole("heading", { name: "柜台备用" }).waitFor();
  await sleep(1600);
}

mkdirSync(RAW_DIR, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  channel: "chrome",
});

const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1.5,
  locale: "zh-CN",
  permissions: ["clipboard-read", "clipboard-write"],
  recordVideo: {
    dir: RAW_DIR,
    size: { width: 1440, height: 900 },
  },
});

const page = await context.newPage();
await installCursor(page);

await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 90_000 });
await page.getByRole("heading", { name: "微信收款" }).waitFor({ timeout: 30_000 });
await sleep(1400);

try {
  await runDemo(page);
} catch (error) {
  await page.screenshot({
    path: path.join(OUT_DIR, "paycase-demo-fail.png"),
    fullPage: true,
  });
  throw error;
} finally {
  await context.close();
  await browser.close();
}

const recorded = readdirSync(RAW_DIR).find((name) => name.endsWith(".webm"));
if (!recorded) {
  throw new Error("Playwright did not write a video file.");
}

const dest = path.join(OUT_DIR, "paycase-demo.webm");
if (existsSync(dest)) {
  renameSync(dest, path.join(OUT_DIR, "paycase-demo.prev.webm"));
}
renameSync(path.join(RAW_DIR, recorded), dest);
console.log(dest);
