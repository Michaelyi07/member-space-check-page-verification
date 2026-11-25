# Verification log — S5-DOC-022（真实运行输出）

> 环境：Windows 11 (win32) / Node v22.22.2 / npm 10.9.7 / Vitest 3.2.7 / Vite 6.4.3 / React 18.3.1 / tdesign-react 1.10.3 / @types/node 24.10.1 / Chrome 157.0.8103.80（版本另见 docs/screenshots/capture-report.json）。

## 1. `npm run test`（Vitest 15 tests，verbose）

```
RUN  v3.2.7

 ✓ tests/acceptance.test.tsx > AC1 — six flags: red background + reason label > mock carries exactly 6 distinct flag keys and each has copy 4ms
 ✓ tests/acceptance.test.tsx > AC1 — six flags: red background + reason label > every flagged field row has red class and its label chip 163ms
 ✓ tests/acceptance.test.tsx > AC1 — six flags: red background + reason label > low confidence label carries 72% detail verbatim 65ms
 ✓ tests/acceptance.test.tsx > AC1 — six flags: red background + reason label > one real screenshot file exists per flag, and capture report lists all six 3ms
 ✓ tests/acceptance.test.tsx > AC2 — save disabled until modification reason selected > save button not clickable with no reason; reason selection enables it 137ms
 ✓ tests/acceptance.test.tsx > AC2 — save disabled until modification reason selected > reverting value to original re-disables save 144ms
 ✓ tests/acceptance.test.tsx > AC3 — amount 1234.56 becomes 123456 in request body > yuanToCents literal 1ms
 ✓ tests/acceptance.test.tsx > AC3 — amount 1234.56 becomes 123456 in request body > captured request body carries integer cents 123456 1ms
 ✓ tests/acceptance.test.tsx > AC3 — amount 1234.56 becomes 123456 in request body > component submits payload with 123456 after typing 1234.56 168ms
 ✓ tests/acceptance.test.tsx > AC4 — only red fields filter > toggling only-red leaves exactly flagged rows 71ms
 ✓ tests/acceptance.test.tsx > AC4 — only red fields filter > toggling off restores original order 90ms
 ✓ tests/acceptance.test.tsx > Scope sentences — implementation not existence > USCC input shows live check-digit hint 98ms
 ✓ tests/acceptance.test.tsx > Scope sentences — implementation not existence > progress bar shows confirmed/total/pending counts 44ms
 ✓ tests/acceptance.test.tsx > Scope sentences — implementation not existence > block problems render as alerts with navigation buttons 70ms
 ✓ tests/acceptance.test.tsx > Scope sentences — implementation not existence > subtables render add/delete and live check 45ms

 Test Files  1 passed (1)
      Tests  15 passed (15)
   Duration  32.75s
```

## 2. `npm run build`（tsc --noEmit && vite build）

```
> check-page-verification@1.0.0 build
> tsc --noEmit && vite build

vite v6.4.3 building for production...
transforming...
✓ 2184 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   0.42 kB │ gzip:   0.32 kB
dist/assets/index-XV_m7Byg.css  116.96 kB │ gzip:  12.55 kB
dist/assets/index-Y3KVlhS-.js   359.48 kB │ gzip: 116.13 kB
✓ built in 27.45s
```

## 3. 截图（真实浏览器）

`npm run screenshots` → `docs/screenshots/`：
- `flag-{6 keys}.png` — 每个 flag 一张元素级截图（红底 + 原因标签）
- `filter-only-red-on.png` / `filter-only-red-off.png` — 过滤开关两态
- `overview.png` — 整页总览
- `capture-report.json` — OS/Node/Chrome 版本 + 捕获时间 + 过滤后行数（rows_after_filter_on: 6）

截图用 playwright-core 驱动系统 Chrome 157.0.8103.80（真实渲染，非 jsdom）。
