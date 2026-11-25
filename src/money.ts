// 金额一律以「分」存整数（统一技术约定）。
// 字符串定点解析，避免 parseFloat 浮点漂移。

export function yuanToCents(input: string): number {
  const s = String(input ?? '').trim().replace(/,/g, '');
  if (s === '') throw new Error('empty amount');
  const m = /^(-?)(\d+)(?:\.(\d{1,2}))?$/.exec(s);
  if (!m) throw new Error(`invalid amount: ${input}`);
  const sign = m[1] === '-' ? -1 : 1;
  const yuan = BigInt(m[2]);
  const frac = (m[3] ?? '').padEnd(2, '0');
  const cents = yuan * 100n + BigInt(frac);
  return sign * Number(cents);
}

// 统一社会信用代码 GB 32100-2015 MOD31-1（本机知识卡算法，虚构测试数据）
const W = [1, 3, 9, 27, 19, 26, 16, 17, 20, 29, 25, 13, 8, 24, 10, 30, 28];
const CHARSET = '0123456789ABCDEFGHJKLMNPQRTUWXY';
const CHAR2VAL = new Map<string, number>([...CHARSET].map((c, i) => [c, i]));

export function checkUscc(code: string): boolean {
  const s = String(code ?? '').trim().toUpperCase();
  if (s.length !== 18) return false;
  for (const c of s) if (!CHAR2VAL.has(c)) return false;
  let sum = 0;
  for (let i = 0; i < 17; i++) sum += (CHAR2VAL.get(s[i]) as number) * W[i];
  const expected = CHARSET[(31 - (sum % 31)) % 31];
  return s[17] === expected;
}

export function formatYuan(cents: number): string {
  const sign = cents < 0 ? '-' : '';
  const n = Math.abs(Math.trunc(cents));
  return `${sign}${Math.floor(n / 100)}.${String(n % 100).padStart(2, '0')}`;
}
