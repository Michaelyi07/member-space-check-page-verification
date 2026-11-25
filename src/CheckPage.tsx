import React, { useMemo, useState } from 'react';
import { Button, Select, Switch, Tag, Alert, Input } from 'tdesign-react';
import { FLAGS_COPY, MODIFY_REASONS, flagLabel } from './flags-copy';
import { checkUscc, yuanToCents } from './money';
import type {
  CheckPageData, FieldItem, FieldFlag, ModifyReason, SavePayload, SubRow, ValueType,
} from './types';

const REASON_OPTIONS = MODIFY_REASONS.map((r) => ({ label: r.label, value: r.value }));

/** 金额转分：供组件测试直接断言的纯函数入口（AC3） */
export function buildSavePayload(
  data: CheckPageData,
  edits: Record<string, { value: string; reason: ModifyReason }>,
): SavePayload {
  const changes = Object.entries(edits).map(([fieldId, e]) => {
    const f = data.fields.find((x) => x.id === fieldId);
    const base = { field_id: fieldId, value: e.value, reason: e.reason };
    if (f?.value_type === 'amount') return { ...base, value_cents: yuanToCents(e.value) };
    return base;
  });
  const toCents = (rows: SubRow[]) => rows.map((r) => ({
    id: r.id, amount_cents: yuanToCents(r.amount_yuan), ratio: Number(r.ratio),
  }));
  return {
    document_id: data.document_id,
    changes,
    payment_nodes: toCents(data.payment_nodes),
    benefits: toCents(data.benefits),
  };
}

function FlagChips({ flags }: { flags: FieldFlag[] }) {
  if (!flags.length) return null;
  return (
    <span className="flag-chips" data-testid="flag-chips">
      {flags.map((f) => (
        <Tag key={f.key} theme="danger" variant="light" data-testid={`flag-${f.key}`}>
          {flagLabel(f.key, f.detail)}
        </Tag>
      ))}
    </span>
  );
}

function ValueEditor({
  field, value, onChange,
}: { field: FieldItem; value: string; onChange: (v: string) => void }) {
  const t: ValueType = field.value_type;
  if (t === 'tax_rate') {
    return (
      <Select
        value={value}
        options={[
          { label: '0%', value: '0' }, { label: '3%', value: '3' },
          { label: '6%', value: '6' }, { label: '9%', value: '9' }, { label: '13%', value: '13' },
        ]}
        onChange={(v) => onChange(String(v ?? ''))}
      />
    );
  }
  if (t === 'uscc') {
    const ok = checkUscc(value);
    return (
      <span className="uscc-wrap">
        <input value={value} onChange={(e) => onChange(e.target.value)} data-testid={`input-${field.id}`} />
        <span className={ok ? 'uscc-hint ok' : 'uscc-hint bad'} data-testid="uscc-hint">
          {ok ? '校验位通过' : '校验位未通过'}
        </span>
      </span>
    );
  }
  if (t === 'date') {
    return <input value={value} onChange={(e) => onChange(e.target.value)} placeholder="YYYY-MM-DD" data-testid={`input-${field.id}`} />;
  }
  if (t === 'amount') {
    return (
      <span className="amount-wrap">
        <span className="yuan-sign">¥</span>
        <input value={value} onChange={(e) => onChange(e.target.value)} data-testid={`input-${field.id}`} />
        <span className="cents-hint">提交为 {safeCents(value)} 分</span>
      </span>
    );
  }
  return <input value={value} onChange={(e) => onChange(e.target.value)} data-testid={`input-${field.id}`} />;
}

function safeCents(v: string): string {
  try { return String(yuanToCents(v)); } catch { return '—'; }
}

function ModifyPanel({
  field, draftValue, onDraftChange, reason, onReasonChange, onSave, onCancel,
}: {
  field: FieldItem;
  draftValue: string;
  onDraftChange: (v: string) => void;
  reason: ModifyReason | '';
  onReasonChange: (r: ModifyReason | '') => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  // AC2: 未选原因 → 保存禁用；值改回原值也禁用
  const unchanged = draftValue === field.value;
  const disabled = !reason || unchanged;
  return (
    <div className="modify-panel" data-testid={`modify-${field.id}`}>
      <ValueEditor field={field} value={draftValue} onChange={onDraftChange} />
      <div className="reason-row">
        <label htmlFor={`reason-${field.id}`}>修改原因 <span className="required">*</span></label>
        <select
          id={`reason-${field.id}`}
          data-testid={`reason-${field.id}`}
          aria-label="修改原因"
          value={reason}
          onChange={(e) => onReasonChange(e.target.value as ModifyReason | '')}
        >
          <option value="">请选择修改原因</option>
          {MODIFY_REASONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
      </div>
      <div className="modify-actions">
        <button type="button" className="native-save" disabled={disabled} onClick={onSave} data-testid={`save-${field.id}`}>
          保存
        </button>
        <Button variant="outline" onClick={onCancel}>取消</Button>
        {disabled && <span className="save-hint">请选择修改原因后保存</span>}
      </div>
    </div>
  );
}

function FieldRow({
  field, editing, draftValue, reason, onStartEdit, onDraftChange, onReasonChange,
  onSave, onCancel, onAccept, onPickCandidate,
}: {
  field: FieldItem;
  editing: boolean;
  draftValue: string;
  reason: ModifyReason | '';
  onStartEdit: () => void;
  onDraftChange: (v: string) => void;
  onReasonChange: (r: ModifyReason | '') => void;
  onSave: () => void;
  onCancel: () => void;
  onAccept: () => void;
  onPickCandidate: (v: string) => void;
}) {
  const flagged = field.review_state === 'flagged';
  return (
    <div
      id={`field-${field.id}`}
      className={`field-row ${flagged ? 'flagged' : ''} ${field.confirmed ? 'confirmed' : ''}`}
      data-testid={`field-${field.id}`}
      data-review-state={field.review_state}
    >
      <div className="field-head">
        <span className="field-name">{field.name}</span>
        <FlagChips flags={field.flags} />
        {field.confirmed && <Tag theme="success" variant="light">已确认</Tag>}
      </div>
      <div className="field-value">{field.value || <span className="empty-value">（空）</span>}</div>
      {field.candidates && field.candidates.length > 1 && (
        <div className="candidates">
          备选：
          {field.candidates.map((c) => (
            <button key={c} type="button" className="candidate-btn" data-testid={`candidate-${field.id}`} onClick={() => onPickCandidate(c)}>
              {c}
            </button>
          ))}
        </div>
      )}
      {!editing && (
        <div className="row-actions">
          <Button size="small" variant="outline" data-testid={`accept-${field.id}`} onClick={onAccept}>接受</Button>
          <Button size="small" variant="outline" data-testid={`modify-${field.id}-trigger`} onClick={onStartEdit}>修改</Button>
        </div>
      )}
      {editing && (
        <ModifyPanel
          field={field} draftValue={draftValue} reason={reason}
          onDraftChange={onDraftChange} onReasonChange={onReasonChange}
          onSave={onSave} onCancel={onCancel}
        />
      )}
    </div>
  );
}

function SubTable({
  title, rows, grandTotalCents, onChange,
}: {
  title: string;
  rows: SubRow[];
  grandTotalCents: number;
  onChange: (rows: SubRow[]) => void;
}) {
  const amountSum = rows.reduce((a, r) => a + safeCentsNum(r.amount_yuan), 0);
  const ratioSum = rows.reduce((a, r) => a + (Number(r.ratio) || 0), 0);
  const amountOk = amountSum === grandTotalCents;
  const ratioOk = ratioSum === 100;
  const update = (id: string, patch: Partial<SubRow>) =>
    onChange(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const add = () => onChange([...rows, {
    id: `r-${Date.now()}`, label: '新增行', amount_yuan: '0.00', ratio: '0', flags: [],
  }]);
  return (
    <section className="subtable" data-testid={`subtable-${title}`}>
      <h3>{title}</h3>
      <table>
        <thead><tr><th>项目</th><th>金额（元）</th><th>比例（%）</th><th>校验</th><th>操作</th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} data-testid={`row-${r.id}`}>
              <td><input value={r.label} onChange={(e) => update(r.id, { label: e.target.value })} /></td>
              <td><input data-testid={`amount-${r.id}`} value={r.amount_yuan} onChange={(e) => update(r.id, { amount_yuan: e.target.value })} /></td>
              <td><input data-testid={`ratio-${r.id}`} value={r.ratio} onChange={(e) => update(r.id, { ratio: e.target.value })} /></td>
              <td className={amountOk && ratioOk ? 'ok' : 'bad'}>
                {amountOk && ratioOk ? '一致' : '不一致'}
              </td>
              <td><button type="button" onClick={() => onChange(rows.filter((x) => x.id !== r.id))}>删除</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="subtable-total" data-testid={`total-${title}`}>
        金额合计 {(amountSum / 100).toFixed(2)} / 总额 {(grandTotalCents / 100).toFixed(2)}
        {' · '}比例合计 {ratioSum}% {ratioOk ? '✓' : '✗'}
        <Button size="small" variant="outline" onClick={add}>新增行</Button>
      </div>
    </section>
  );
}

function safeCentsNum(v: string): number {
  try { return yuanToCents(v); } catch { return 0; }
}

export interface CheckPageProps {
  data: CheckPageData;
  onSubmit?: (payload: SavePayload) => void;
}

export default function CheckPage({ data, onSubmit }: CheckPageProps) {
  const [fields, setFields] = useState<FieldItem[]>(data.fields);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [reason, setReason] = useState<ModifyReason | ''>('');
  const [onlyRed, setOnlyRed] = useState(false);
  const [payments, setPayments] = useState<SubRow[]>(data.payment_nodes);
  const [benefits, setBenefits] = useState<SubRow[]>(data.benefits);
  const [submitted, setSubmitted] = useState<SavePayload | null>(null);

  const confirmed = fields.filter((f) => f.review_state === 'confirmed' || f.confirmed).length;
  const redCount = fields.filter((f) => f.review_state === 'flagged' && !f.confirmed).length;
  const visible = useMemo(() => (onlyRed ? fields.filter((f) => f.review_state === 'flagged') : fields), [fields, onlyRed]);
  const grandTotalCents = yuanToCents(data.grand_total_yuan);

  const patchField = (id: string, patch: Partial<FieldItem>) =>
    setFields((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));

  const navigate = (fieldId: string) => {
    const el = document.getElementById(`field-${fieldId}`);
    if (el && typeof el.scrollIntoView === 'function') el.scrollIntoView({ block: 'center' });
    el?.setAttribute('data-navigated', 'true');
  };

  const handleSave = (field: FieldItem) => {
    const payload = buildSavePayload(
      { ...data, fields, payment_nodes: payments, benefits },
      { [field.id]: { value: draft, reason: reason as ModifyReason } },
    );
    setSubmitted(payload);
    onSubmit?.(payload);
    patchField(field.id, { value: draft, review_state: 'confirmed', confirmed: true, flags: [] });
    setEditing(null); setReason('');
  };

  const handleAccept = (field: FieldItem) =>
    patchField(field.id, { review_state: 'confirmed', confirmed: true, flags: [] });

  const handlePick = (field: FieldItem, v: string) => {
    patchField(field.id, { value: v });
    setDraft(v); setEditing(field.id); setReason('');
  };

  return (
    <div className="check-page" data-testid="check-page">
      <header className="page-head">
        <h1>合同字段核对 · 右栏</h1>
        <div className="progress" data-testid="progress">
          已确认 {confirmed} / 共 {fields.length}，待处理红字段 {redCount}
        </div>
        <label className="only-red">
          <Switch data-testid="only-red-switch" value={onlyRed} onChange={(v) => setOnlyRed(Boolean(v))} />
          <span>只看红字段</span>
        </label>
      </header>

      {data.block_problems.length > 0 && (
        <div className="block-alerts" data-testid="block-alerts">
          {data.block_problems.map((p) => (
            <div key={p.id} className="block-alert-row">
              <Alert theme="error" message={p.message} />
              <Button size="small" variant="outline" data-testid={`navigate-${p.field_id}`} onClick={() => navigate(p.field_id)}>定位</Button>
            </div>
          ))}
        </div>
      )}

      <div className="field-list" data-testid="field-list">
        {visible.map((f) => (
          <FieldRow
            key={f.id} field={f}
            editing={editing === f.id} draftValue={draft} reason={reason}
            onStartEdit={() => { setEditing(f.id); setDraft(f.value); setReason(''); }}
            onDraftChange={setDraft} onReasonChange={setReason}
            onSave={() => handleSave(f)} onCancel={() => { setEditing(null); setReason(''); }}
            onAccept={() => handleAccept(f)} onPickCandidate={(v) => handlePick(f, v)}
          />
        ))}
      </div>

      <SubTable title="付款节点" rows={payments} grandTotalCents={grandTotalCents} onChange={setPayments} />
      <SubTable title="权益" rows={benefits} grandTotalCents={grandTotalCents} onChange={setBenefits} />

      <div className="submit-zone">
        <Button theme="primary" data-testid="submit-all" onClick={() => onSubmit?.(submitted as SavePayload)}>提交核对结果</Button>
        {submitted && <pre data-testid="request-body">{JSON.stringify(submitted, null, 2)}</pre>}
      </div>
    </div>
  );
}

export { FLAGS_COPY };
