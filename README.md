# Check-page verification interaction (S5-DOC-022)

DOC-021 核对页右栏的核对交互实现：低置信度标红、逐项确认/修改、可编辑子表、只看红字段、block 问题定位。

**所有数据均为虚构**，无真实客户名称、个人信息或企业信息。

## Run / Test

```bash
npm install
npm run test      # Vitest 15 tests
npm run build     # tsc --noEmit && vite build
npm run dev       # http://127.0.0.1:4178
npm run screenshots  # system Chrome + playwright-core -> docs/screenshots/
```

Environment used for the verification below: Windows 11 (win32), Node v22.22.2, npm 10.9.7,
Vitest 3.2.7, Vite 6.4.3, React 18.3.1, tdesign-react 1.10.3, Chrome (version in `docs/screenshots/capture-report.json`).

## Files

| 文件 | 用途 |
|---|---|
| `src/CheckPage.tsx` | 交互组件（红底/标签/进度/逐项操作/原因闸/子表/告警定位/过滤） |
| `src/flags-copy.ts` | **flags 文案映射表**（独立文件，key→中文标签，运营可改文案不改代码） |
| `src/mock.ts` | mock 数据（6 flag types，8 字段，全部虚构） |
| `src/money.ts` | 金额元→分整数（字符串定点解析）+ USCC MOD31-1 校验 |
| `src/types.ts` | 数据模型 |
| `tests/acceptance.test.tsx` | Vitest 组件测试（4 条验收标准 + 范围句） |
| `docs/screenshots/` | 6 张 flag 状态截图 + 过滤开/关 + 总览 + capture-report.json |

## Acceptance criteria → evidence

1. **6 flags screenshots**：`docs/screenshots/flag-{low_confidence,case_mismatch,check_digit_fail,total_mismatch,missing_address,date_conflict}.png`；红底 `.field-row.flagged` + 标签 `FLAGS_COPY[key].label`，低置信度显示 `低置信度 72%`。测试：`AC1 — six flags` (4 assertions，含逐 flag 截图文件存在性断言)。
2. **Save disabled without reason**：`save-{field.id}` 为原生 `<button disabled>`；未选原因/值未变时 disabled，选原因且值已改则 enabled。测试：`AC2` (2 assertions)。
3. **1234.56 → 123456**：`yuanToCents` 字符串定点解析；组件提交经 `buildSavePayload` 生成 `value_cents: 123456`（整数）。测试：`AC3` (3 assertions，含组件 fireEvent + 请求体断言)。
4. **Only-red filter**：Switch 切换后仅保留 `review_state === 'flagged'` 行；截图 `filter-only-red-on.png` / `filter-only-red-off.png`。测试：`AC4` (2 assertions)。

## Integration points（对接点）

本单按统一技术约定使用接口桩/mock，无后端。对接其他工单时：

- `src/mock.ts` 的 `MOCK: CheckPageData` 对应 DOC-021 抽取输出。替换为 `GET /api/v1/documents/{id}/check-page` 返回同结构即可。
- `CheckPageProps.onSubmit(payload: SavePayload)` 为提交钩子；接后端时改为 `POST /api/v1/documents/{id}/verification`，`SavePayload.changes[].value_cents` 已是整数分，`payment_nodes`/`benefits` 同理。
- `src/flags-copy.ts` 的 `FLAGS_COPY` 为文案映射表，运营改文案无需改组件。
- 业务表统一字段（id UUID / org_id / site_id / created_at / created_by / updated_at / deleted_at）已在 `src/types.ts` 的 `FieldItem` 上体现；金额一律分存整数；无密钥/无境外 SDK。

## Verification output（真实运行）

见 `verification_log.md`——包含 `npm run test` / `npm run build` 的原始输出与截图 capture-report。
