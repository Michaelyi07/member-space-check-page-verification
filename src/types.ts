// 本交付所有数据均为虚构，不含真实客户/个人信息。
export type FlagKey =
  | 'low_confidence'
  | 'case_mismatch'
  | 'check_digit_fail'
  | 'total_mismatch'
  | 'missing_address'
  | 'date_conflict';

export type ReviewState = 'flagged' | 'confirmed' | 'pending';
export type ValueType = 'text' | 'date' | 'amount' | 'tax_rate' | 'uscc' | 'percent';

export interface FieldFlag {
  key: FlagKey;
  detail?: string; // e.g. "72%"
}

export interface FieldItem {
  id: string; // UUID-format fictional id
  org_id: string;
  site_id: string;
  name: string;
  value_type: ValueType;
  value: string; // display value (amount shown in yuan)
  candidates?: string[];
  review_state: ReviewState;
  flags: FieldFlag[];
  confirmed?: boolean;
}

export interface SubRow {
  id: string;
  label: string;
  amount_yuan: string; // display, converted to cents on submit
  ratio: string; // display percent, e.g. "30"
  flags: FieldFlag[];
}

export interface BlockProblem {
  id: string;
  level: 'block';
  message: string;
  field_id: string;
}

export interface CheckPageData {
  document_id: string;
  org_id: string;
  site_id: string;
  fields: FieldItem[];
  payment_nodes: SubRow[];
  benefits: SubRow[];
  grand_total_yuan: string;
  block_problems: BlockProblem[];
}

export type ModifyReason = 'recognition_error' | 'source_text_error' | 'missing_address' | 'other';

export interface SavePayload {
  document_id: string;
  changes: Array<{
    field_id: string;
    value: string;
    value_cents?: number; // integer cents, only for amount rows
    reason: ModifyReason;
  }>;
  payment_nodes: Array<{ id: string; amount_cents: number; ratio: number }>;
  benefits: Array<{ id: string; amount_cents: number; ratio: number }>;
}
