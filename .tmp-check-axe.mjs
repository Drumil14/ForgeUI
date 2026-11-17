import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage();
for (let i = 0; i < 30; i++) {
  try {
    await page.goto("http://localhost:3100/workspace", { waitUntil: "networkidle" });
    break;
  } catch { await new Promise((r) => setTimeout(r, 1000)); }
}
await page.waitForTimeout(2500); // let preview render + axe run

await page.getByRole("tab", { name: /a11y/i }).click();
await page.waitForTimeout(1200);

const axeHeader = await page.locator("text=Rendered DOM · axe-core").count();
const violations = await page.locator("text=violations").first().textContent().catch(() => null);
const passed = await page.locator("text=rules passed").first().textContent().catch(() => null);
const waiting = await page.locator("text=Waiting for the preview").count();
const manual = await page.locator("text=Needs manual verification").count();
const heuristic = await page.locator("text=Heuristic score").count();
console.log(JSON.stringify({ axeHeader, violations, passed, waiting, manual, heuristic }));
await browser.close();
