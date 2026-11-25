// Captures REAL browser screenshots with system Chrome via playwright-core.
// Usage: node tools/capture-screenshots.mjs
// Prereq: npm run dev server will be spawned by this script on 127.0.0.1:4178.
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(ROOT, 'docs/screenshots');
mkdirSync(OUT, { recursive: true });

const server = spawn('npx', ['vite', '--host', '127.0.0.1', '--port', '4178', '--strictPort'], {
  cwd: ROOT, stdio: 'pipe', shell: true,
});
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
let ready = false;
for (let i = 0; i < 60; i++) {
  try {
    const r = await fetch('http://127.0.0.1:4178/');
    if (r.ok) { ready = true; break; }
  } catch { /* not ready */ }
  await wait(500);
}
if (!ready) { console.error('vite server did not start'); server.kill(); process.exit(1); }

const browser = await chromium.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
  args: ['--no-sandbox', '--disable-gpu'],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 });
await page.goto('http://127.0.0.1:4178/', { waitUntil: 'networkidle' });
await page.waitForSelector('[data-testid="check-page"]');

const flags = ['low_confidence', 'case_mismatch', 'check_digit_fail', 'total_mismatch', 'missing_address', 'date_conflict'];
const report = [];

// One screenshot per flag: scroll to the field carrying that flag, highlight it.
for (const f of flags) {
  const chip = page.locator(`[data-testid="flag-${f}"]`);
  const count = await chip.count();
  if (!count) { console.error(`NO FLAG ${f}`); continue; }
  const row = chip.first().locator('xpath=ancestor::*[contains(@class,"field-row")]');
  await row.scrollIntoViewIfNeeded();
  await row.evaluate((el) => el.setAttribute('data-capture', 'true'));
  // Element-level screenshot: this single file shows exactly this flag's red row + label.
  await row.screenshot({ path: resolve(OUT, `flag-${f}.png`) });
  await row.evaluate((el) => el.removeAttribute('data-capture'));
  report.push({ flag: f, screenshot: `flag-${f}.png`, label: (await chip.first().innerText()).trim() });
}

// Only-red filtered screenshot
await page.locator('[data-testid="only-red-switch"]').click();
await wait(300);
await page.screenshot({ path: resolve(OUT, 'filter-only-red-on.png'), fullPage: true });
const rowsAfter = await page.locator('[data-testid^="field-f-"]').count();
await page.locator('[data-testid="only-red-switch"]').click();
await wait(300);
await page.screenshot({ path: resolve(OUT, 'filter-only-red-off.png'), fullPage: true });

// Full page overview
await page.screenshot({ path: resolve(OUT, 'overview.png'), fullPage: true });

const env = {
  os: process.platform,
  node: process.version,
  chrome: await browser.version(),
  captured_at: new Date().toISOString(),
  flag_screenshots: report,
  rows_after_filter_on: rowsAfter,
};
writeFileSync(resolve(OUT, 'capture-report.json'), JSON.stringify(env, null, 2));
console.log(JSON.stringify(env, null, 2));

await browser.close();
// Windows shell:true 下 server.pid 是 shell 进程，kill() 杀不掉 vite 子进程，
// stdio 管道不关会导致本进程挂起——用 taskkill 树杀并显式退出。
try {
  spawn('taskkill', ['/pid', String(server.pid), '/T', '/F'], { stdio: 'ignore', shell: true });
} catch { /* best effort */ }
process.exit(0);
