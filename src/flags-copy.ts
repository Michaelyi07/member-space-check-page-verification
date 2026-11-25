// Flags copy mapping table — separate file per ticket requirement.
// Ops may reword labels here without touching component code.
import type { FlagKey } from './types';

export const FLAGS_COPY: Record<FlagKey, { label: string; description: string }> = {
  low_confidence: {
    label: '低置信度',
    description: '抽取置信度低于阈值，需人工确认',
  },
  case_mismatch: {
    label: '大小写不一致',
    description: '同一主体名称的大小写/全半角形式不一致',
  },
  check_digit_fail: {
    label: '校验位失败',
    description: '统一社会信用代码校验位未通过',
  },
  total_mismatch: {
    label: '合计不符',
    description: '子表比例合计或金额合计与总额不一致',
  },
  missing_address: {
    label: '地址缺失',
    description: '必填地址字段在原文中未识别到',
  },
  date_conflict: {
    label: '日期冲突',
    description: '抽取日期与上下文日期不一致',
  },
};

export const MODIFY_REASONS = [
  { value: 'recognition_error', label: '识别错误' },
  { value: 'source_text_error', label: '原文有误' },
  { value: 'missing_address', label: '补录缺失' },
  { value: 'other', label: '其他' },
] as const;

// flag with confidence detail renders e.g. "低置信度 72%"
export function flagLabel(key: FlagKey, detail?: string): string {
  const base = FLAGS_COPY[key]?.label ?? key;
  return detail ? `${base} ${detail}` : base;
}
