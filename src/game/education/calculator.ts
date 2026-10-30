export type BudgetKind = 'care' | 'transport' | 'equipment' | 'respite';
export const BUDGET_NAMES: Record<BudgetKind, string> = { care: '照顧及專業服務', transport: '交通接送', equipment: '輔具及居家無障礙', respite: '喘息服務' };
export const CARE_LIMITS = [10020,15460,18580,24100,28070,32090,36180];
export function budgetLimit(cms: number, kind: BudgetKind, zone: number, equipmentGroup: number) {
  if (!Number.isInteger(cms) || cms < 2 || cms > 8) throw new Error('CMS 須為 2–8 級');
  return kind === 'care' ? CARE_LIMITS[cms-2] : kind === 'transport' ? [1680,1840,2000,2400][zone-1] : kind === 'equipment' ? (equipmentGroup === 2 ? 60000 : 40000) : cms >= 7 ? 48510 : 32340;
}
export function estimate(total: number, limit: number, rate: number) {
  if (![total,limit,rate].every(Number.isFinite) || total < 0 || limit < 0 || rate < 0 || rate > 1) throw new Error('試算輸入無效');
  const covered = Math.min(total,limit);
  const copay = Math.floor(covered*rate);
  const excess = Math.max(0,total-limit);
  return { total, covered, copay, excess, selfPay: copay+excess, subsidy: covered-copay, remaining: Math.max(0,limit-total) };
}
