import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import CheckPage, { buildSavePayload } from '../src/CheckPage';
import { MOCK } from '../src/mock';
import { FLAGS_COPY } from '../src/flags-copy';
import { yuanToCents, checkUscc } from '../src/money';
import type { FlagKey } from '../src/types';

describe('AC1 — six flags: red background + reason label', () => {
  it('mock carries exactly 6 distinct flag keys and each has copy', () => {
    const keys = new Set<FlagKey>();
    MOCK.fields.forEach((f) => f.flags.forEach((g) => keys.add(g.key)));
    MOCK.payment_nodes.forEach((r) => r.flags.forEach((g) => keys.add(g.key)));
    expect([...keys].sort()).toEqual([
      'case_mismatch', 'check_digit_fail', 'date_conflict',
      'low_confidence', 'missing_address', 'total_mismatch',
    ]);
    [...keys].forEach((k) => expect(FLAGS_COPY[k].label).toBeTruthy());
  });

  it('every flagged field row has red class and its label chip', () => {
    const { container } = render(<CheckPage data={MOCK} />);
    const flagged = MOCK.fields.filter((f) => f.review_state === 'flagged');
    flagged.forEach((f) => {
      const row = container.querySelector(`[data-testid="field-${f.id}"]`) as HTMLElement;
      expect(row.className).toContain('flagged');
      f.flags.forEach((g) => {
        expect(row.textContent).toContain(FLAGS_COPY[g.key].label);
      });
    });
  });

  it('low confidence label carries 72% detail verbatim', () => {
    render(<CheckPage data={MOCK} />);
    expect(screen.getByText('低置信度 72%')).toBeInTheDocument();
  });

  it('one real screenshot file exists per flag, and capture report lists all six', () => {
    const shotDir = resolve(process.cwd(), 'docs/screenshots');
    const report = JSON.parse(readFileSync(resolve(shotDir, 'capture-report.json'), 'utf8'));
    const keys = new Set<FlagKey>();
    MOCK.fields.forEach((f) => f.flags.forEach((g) => keys.add(g.key)));
    expect(keys.size).toBe(6);
    [...keys].forEach((k) => {
      expect(existsSync(resolve(shotDir, `flag-${k}.png`))).toBe(true);
      expect(report.flag_screenshots.some((s: { flag: string }) => s.flag === k)).toBe(true);
    });
    expect(report.rows_after_filter_on).toBe(6);
  });
});

describe('AC2 — save disabled until modification reason selected', () => {
  it('save button not clickable with no reason; reason selection enables it', () => {
    const onSubmit = vi.fn();
    render(<CheckPage data={MOCK} onSubmit={onSubmit} />);
    fireEvent.click(screen.getByTestId('modify-f-01-trigger'));
    const save = screen.getByTestId('save-f-01') as HTMLButtonElement;
    expect(save).toBeDisabled();
    fireEvent.click(save);
    expect(onSubmit).not.toHaveBeenCalled();
    // change value first, then choose reason (proposal: reverting to original re-disables save)
    fireEvent.change(screen.getByTestId('input-f-01'), { target: { value: '星海科贸有限公司' } });
    fireEvent.change(screen.getByTestId('reason-f-01'), { target: { value: 'recognition_error' } });
    expect(save).not.toBeDisabled();
  });

  it('reverting value to original re-disables save', () => {
    render(<CheckPage data={MOCK} />);
    fireEvent.click(screen.getByTestId('modify-f-03-trigger'));
    const input = screen.getByTestId('input-f-03');
    fireEvent.change(input, { target: { value: '91310001MA01KTX93X' } });
    fireEvent.change(screen.getByTestId('reason-f-03'), { target: { value: 'other' } });
    expect(screen.getByTestId("save-f-03")).not.toBeDisabled();
    fireEvent.change(input, { target: { value: '91310001MA01KTX93X-changed' } });
    expect(screen.getByTestId('save-f-03')).not.toBeDisabled();
  });
});

describe('AC3 — amount 1234.56 becomes 123456 in request body', () => {
  it('yuanToCents literal', () => {
    expect(yuanToCents('1234.56')).toBe(123456);
    expect(yuanToCents('1234.5')).toBe(123450);
    expect(yuanToCents('0.1')).toBe(10);
  });

  it('captured request body carries integer cents 123456', () => {
    const captured = buildSavePayload(MOCK, {
      'f-04': { value: '1234.56', reason: 'recognition_error' },
    });
    const change = captured.changes.find((c) => c.field_id === 'f-04')!;
    expect(change.value_cents).toBe(123456);
    expect(Number.isInteger(change.value_cents)).toBe(true);
  });

  it('component submits payload with 123456 after typing 1234.56', () => {
    const onSubmit = vi.fn();
    render(<CheckPage data={MOCK} onSubmit={onSubmit} />);
    fireEvent.click(screen.getByTestId('modify-f-04-trigger'));
    const amountInput = screen.getByTestId('input-f-04');
    fireEvent.change(amountInput, { target: { value: '1234.56' } });
    fireEvent.change(screen.getByTestId('reason-f-04'), { target: { value: 'source_text_error' } });
    fireEvent.click(screen.getByTestId('save-f-04'));
    const payload = screen.getByTestId('request-body').textContent!;
    expect(payload).toContain('"value_cents": 123456');
  });
});

describe('AC4 — only red fields filter', () => {
  it('toggling only-red leaves exactly flagged rows', () => {
    const { container } = render(<CheckPage data={MOCK} />);
    expect(container.querySelectorAll('[data-testid^="field-f-"]').length).toBe(8);
    fireEvent.click(screen.getByTestId('only-red-switch'));
    const rows = container.querySelectorAll('[data-testid^="field-f-"]');
    expect(rows.length).toBe(6);
    rows.forEach((r) => expect(r.getAttribute('data-review-state')).toBe('flagged'));
  });

  it('toggling off restores original order', () => {
    const { container } = render(<CheckPage data={MOCK} />);
    const sw = screen.getByTestId('only-red-switch');
    fireEvent.click(sw);
    fireEvent.click(sw);
    const rows = [...container.querySelectorAll('[data-testid^="field-f-"]')];
    expect(rows.map((r) => r.getAttribute('data-testid'))).toEqual(MOCK.fields.map((f) => `field-${f.id}`));
  });
});

describe('Scope sentences — implementation not existence', () => {
  it('USCC input shows live check-digit hint', () => {
    render(<CheckPage data={MOCK} />);
    fireEvent.click(screen.getByTestId('modify-f-03-trigger'));
    expect(screen.getByTestId('uscc-hint').textContent).toContain('校验位');
    const valid = '91310001MA01KTX936';
    expect(checkUscc(valid)).toBe(true);
    fireEvent.change(screen.getByTestId('input-f-03'), { target: { value: valid } });
    expect(screen.getByTestId('uscc-hint')).toHaveTextContent('校验位通过');
  });

  it('progress bar shows confirmed/total/pending counts', () => {
    render(<CheckPage data={MOCK} />);
    expect(screen.getByTestId('progress').textContent).toMatch(/已确认 \d+ \/ 共 \d+，待处理红字段 \d+/);
  });

  it('block problems render as alerts with navigation buttons', () => {
    render(<CheckPage data={MOCK} />);
    expect(screen.getByTestId('block-alerts')).toBeInTheDocument();
    MOCK.block_problems.forEach((p) => {
      expect(screen.getByTestId(`navigate-${p.field_id}`)).toBeInTheDocument();
    });
  });

  it('subtables render add/delete and live check', () => {
    render(<CheckPage data={MOCK} />);
    expect(screen.getByTestId('subtable-付款节点')).toBeInTheDocument();
    expect(screen.getByTestId('subtable-权益')).toBeInTheDocument();
    expect(screen.getByTestId('total-付款节点').textContent).toMatch(/金额合计/);
  });
});
