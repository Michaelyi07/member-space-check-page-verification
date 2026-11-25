// Mock data — 100% fictional. No real person/company/customer name.
// This is the interface stub for DOC-021 extraction output; see README "Integration points".
import type { CheckPageData } from './types';

export const MOCK: CheckPageData = {
  document_id: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
  org_id: '11111111-2222-4333-8444-555555555555',
  site_id: '66666666-7777-4888-8999-000000000000',
  fields: [
    {
      id: 'f-01', org_id: '11111111-2222-4333-8444-555555555555', site_id: '66666666-7777-4888-8999-000000000000',
      name: '乙方名称', value_type: 'text', value: '星海科贸有限责任公司',
      candidates: ['星海科贸有限责任公司', '星海科贸有限公司'],
      review_state: 'flagged', flags: [{ key: 'low_confidence', detail: '72%' }],
    },
    {
      id: 'f-02', org_id: '11111111-2222-4333-8444-555555555555', site_id: '66666666-7777-4888-8999-000000000000',
      name: '主体名称（英文）', value_type: 'text', value: 'Northwind LTD',
      candidates: ['Northwind LTD', 'northwind ltd'],
      review_state: 'flagged', flags: [{ key: 'case_mismatch' }],
    },
    {
      id: 'f-03', org_id: '11111111-2222-4333-8444-555555555555', site_id: '66666666-7777-4888-8999-000000000000',
      name: '统一社会信用代码', value_type: 'uscc', value: '91310001MA01KTX937',
      review_state: 'flagged', flags: [{ key: 'check_digit_fail' }],
    },
    {
      id: 'f-04', org_id: '11111111-2222-4333-8444-555555555555', site_id: '66666666-7777-4888-8999-000000000000',
      name: '合同总额', value_type: 'amount', value: '1000.00',
      review_state: 'flagged', flags: [{ key: 'total_mismatch' }],
    },
    {
      id: 'f-05', org_id: '11111111-2222-4333-8444-555555555555', site_id: '66666666-7777-4888-8999-000000000000',
      name: '乙方地址', value_type: 'text', value: '',
      review_state: 'flagged', flags: [{ key: 'missing_address' }],
    },
    {
      id: 'f-06', org_id: '11111111-2222-4333-8444-555555555555', site_id: '66666666-7777-4888-8999-000000000000',
      name: '签署日期', value_type: 'date', value: '2026-03-01',
      candidates: ['2026-03-01', '2026-08-01'],
      review_state: 'flagged', flags: [{ key: 'date_conflict' }],
    },
    {
      id: 'f-07', org_id: '11111111-2222-4333-8444-555555555555', site_id: '66666666-7777-4888-8999-000000000000',
      name: '税率', value_type: 'tax_rate', value: '13', review_state: 'confirmed', flags: [],
    },
    {
      id: 'f-08', org_id: '11111111-2222-4333-8444-555555555555', site_id: '66666666-7777-4888-8999-000000000000',
      name: '合同编号', value_type: 'text', value: 'HT-2026-0001', review_state: 'pending', flags: [],
    },
  ],
  payment_nodes: [
    { id: 'p-1', label: '预付款', amount_yuan: '370.37', ratio: '30', flags: [{ key: 'total_mismatch' }] },
    { id: 'p-2', label: '尾款', amount_yuan: '864.19', ratio: '70', flags: [] },
  ],
  benefits: [
    { id: 'b-1', label: '优先对接权益', amount_yuan: '246.91', ratio: '20', flags: [] },
    { id: 'b-2', label: '年度Report权益', amount_yuan: '987.65', ratio: '80', flags: [] },
  ],
  grand_total_yuan: '1234.56',
  block_problems: [
    { id: 'blk-1', level: 'block', message: '统一社会信用代码校验位未通过，必须确认后才能提交', field_id: 'f-03' },
    { id: 'blk-2', level: 'block', message: '付款节点金额合计与合同总额不一致', field_id: 'f-04' },
  ],
};

// 仅供测试使用：8 行中 6 flagged + 2 normal，用于 AC4 过滤断言
export const FILTER_MOCK: CheckPageData = {
  ...MOCK,
  fields: [...MOCK.fields], // 6 flagged (f-01..f-06) + f-07 confirmed + f-08 pending
};
