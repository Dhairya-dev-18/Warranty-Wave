export const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

/** EMI = P x r x (1+r)^n / ((1+r)^n - 1), r = annual rate / 12 / 100 */
export function emi(principal: number, annualRate: number, months: number): number {
  if (principal <= 0 || months <= 0) return 0;
  const r = annualRate / 12 / 100;
  if (r === 0) return round2(principal / months);
  const f = Math.pow(1 + r, months);
  return round2((principal * r * f) / (f - 1));
}

export interface EmiRow { installmentNo: number; principalPart: number; interestPart: number; amount: number; balance: number; }

/** Amortization schedule; the last installment absorbs rounding so principal parts sum to P. */
export function buildSchedule(principal: number, annualRate: number, months: number): EmiRow[] {
  const e = emi(principal, annualRate, months);
  const r = annualRate / 12 / 100;
  const rows: EmiRow[] = [];
  let bal = principal;
  for (let i = 1; i <= months; i++) {
    const interest = round2(bal * r);
    const prin = i === months ? round2(bal) : round2(e - interest);
    bal = round2(bal - prin);
    rows.push({ installmentNo: i, principalPart: prin, interestPart: interest, amount: round2(prin + interest), balance: bal });
  }
  return rows;
}
