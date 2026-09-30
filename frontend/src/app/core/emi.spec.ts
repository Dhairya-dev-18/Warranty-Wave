import { buildSchedule, emi } from './emi';

describe('EMI calculator', () => {
  it('computes the standard EMI', () => {
    expect(emi(500000, 11, 60)).toBeCloseTo(10870.7, 0);
  });
  it('schedule principal sums to the loan amount', () => {
    const rows = buildSchedule(450000, 11, 36);
    const total = rows.reduce((s, r) => s + r.principalPart, 0);
    expect(Math.round(total * 100) / 100).toBe(450000);
    expect(rows[rows.length - 1].balance).toBe(0);
  });
});
