import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage();
const logs = [];
page.on("console", (m) => logs.push(`[${m.type()}] ${m.text()}`));
page.on("pageerror", (e) => logs.push(`[pageerror] ${e.message}`));

// Intercept messages arriving at the parent window
await page.addInitScript(() => {
  window.__messages = [];
  window.addEventListener("message", (e) => {
    try { window.__messages.push(JSON.stringify(e.data).slice(0, 200)); } catch {}
  });
});

await page.goto("http://localhost:3100/workspace", { waitUntil: "networkidle" });
await page.waitForTimeout(4000);

const messages = await page.evaluate(() => window.__messages);
console.log("parent messages:", JSON.stringify(messages, null, 1));
console.log("console:", logs.slice(0, 20).join("\n"));
await browser.close();
