export type EtfStrategy = 'debt-first' | 'etf-first' | 'balanced';

export interface PlannerLoan { name: string; principal: number; rate: number; payment: number; interestOnlyMonths?: number; balloonMonth?: number | null }
export interface EtfPlannerInputs { currentAge: number; retirementAge: number; monthlyBudget: number; existingCapital: number; expectedReturn: number; annualCosts: number; taxRate: number; riskDiscount: number; inflation: number; withdrawalRate: number }
export interface AllocationRow { name: string; minimum: number; extra: number }
export interface EtfPlanResult { strategy: EtfStrategy; etfAtRetirement: number; realEtfValue: number; debtAtRetirement: number; netAssets: number; totalInterest: number; totalContributions: number; monthlyRetirementWithdrawal: number; paidOffMonth: number | null; monthlyShortfall: number; firstMonthEtf: number; allocation: AllocationRow[]; timeline: Array<{ year: number; etf: number; debt: number; net: number }> }

const cents = (euros: number): number => Math.round((Number(euros) || 0) * 100);
const annualToMonthly = (percent: number): number => (Number(percent) || 0) / 100 / 12;
const priority = (a: PlannerLoan, b: PlannerLoan): number => b.rate - a.rate;

export function simulateEtfStrategy(sourceLoans: PlannerLoan[], inputs: EtfPlannerInputs, strategy: EtfStrategy, hessenAnnual = 0): EtfPlanResult {
  const months = Math.max(1, Math.round((Math.max(inputs.currentAge, inputs.retirementAge) - inputs.currentAge) * 12));
  const loans = sourceLoans.map(loan => ({ ...loan, balance: loan.principal }));
  const budget = cents(inputs.monthlyBudget);
  const monthlyEtfRate = annualToMonthly(inputs.expectedReturn - inputs.annualCosts);
  const riskAdjustedReturn = inputs.expectedReturn - inputs.annualCosts - inputs.riskDiscount;
  let etf = cents(inputs.existingCapital);
  let contributions = etf;
  let totalInterest = 0;
  let paidOffMonth: number | null = null;
  let monthlyShortfall = 0;
  let firstMonthEtf = 0;
  const allocation = new Map<string, AllocationRow>();
  const timeline: EtfPlanResult['timeline'] = [{ year: new Date().getFullYear(), etf, debt: loans.reduce((sum, loan) => sum + loan.balance, 0), net: etf - loans.reduce((sum, loan) => sum + loan.balance, 0) }];

  for (let month = 1; month <= months; month += 1) {
    etf = Math.round(etf * (1 + monthlyEtfRate));
    let scheduledTotal = 0;
    for (const loan of loans) {
      if (loan.balance <= 0) continue;
      const interest = Math.round(loan.balance * annualToMonthly(loan.rate));
      const interestOnly = Boolean(loan.interestOnlyMonths && month <= loan.interestOnlyMonths);
      const balloonDue = Boolean(loan.balloonMonth && month >= loan.balloonMonth);
      const scheduled = balloonDue ? interest + loan.balance : (interestOnly ? interest : loan.payment);
      const principal = Math.max(0, Math.min(loan.balance, scheduled - interest));
      loan.balance -= principal;
      scheduledTotal += interest + principal;
      totalInterest += interest;
      if (month === 1) allocation.set(loan.name, { name: loan.name, minimum: interest + principal, extra: 0 });
    }

    monthlyShortfall = Math.max(monthlyShortfall, Math.max(0, scheduledTotal - budget));
    let free = Math.max(0, budget - scheduledTotal);
    const active = loans.filter(loan => loan.balance > 0).sort(priority);
    const debtGetsExtra = strategy === 'debt-first' || (strategy === 'balanced' && active.length > 0 && active[0].rate >= riskAdjustedReturn);
    if (debtGetsExtra) {
      for (const loan of active) {
        if (!free) break;
        const extra = Math.min(loan.balance, free);
        loan.balance -= extra;
        free -= extra;
        if (month === 1) {
          const row = allocation.get(loan.name) || { name: loan.name, minimum: 0, extra: 0 };
          row.extra += extra;
          allocation.set(loan.name, row);
        }
      }
    }
    if (free > 0) {
      etf += free;
      contributions += free;
      if (month === 1) firstMonthEtf = free;
    }

    if (month <= 120 && month % 12 === 0 && hessenAnnual > 0) {
      let grant = hessenAnnual;
      for (const loan of loans.filter(item => item.balance > 0).sort(priority)) {
        const extra = Math.min(loan.balance, grant);
        loan.balance -= extra;
        grant -= extra;
        if (!grant) break;
      }
    }
    const debt = loans.reduce((sum, loan) => sum + loan.balance, 0);
    if (paidOffMonth === null && debt === 0) paidOffMonth = month;
    if (month % 12 === 0 || month === months) timeline.push({ year: new Date().getFullYear() + month / 12, etf, debt, net: etf - debt });
  }

  const gains = Math.max(0, etf - contributions);
  const etfAfterTax = Math.round(etf - gains * (Math.max(0, inputs.taxRate) / 100));
  const debtAtRetirement = loans.reduce((sum, loan) => sum + loan.balance, 0);
  const years = months / 12;
  const realEtfValue = Math.round(etfAfterTax / Math.pow(1 + Math.max(0, inputs.inflation) / 100, years));
  return {
    strategy, etfAtRetirement: etfAfterTax, realEtfValue, debtAtRetirement, netAssets: etfAfterTax - debtAtRetirement,
    totalInterest, totalContributions: contributions, monthlyRetirementWithdrawal: Math.round(etfAfterTax * Math.max(0, inputs.withdrawalRate) / 100 / 12),
    paidOffMonth, monthlyShortfall, firstMonthEtf, allocation: [...allocation.values()], timeline,
  };
}

export function buildEtfPlan(loans: PlannerLoan[], inputs: EtfPlannerInputs, hessenAnnual = 0) {
  const results = (['debt-first', 'balanced', 'etf-first'] as EtfStrategy[]).map(strategy => simulateEtfStrategy(loans, inputs, strategy, hessenAnnual));
  const recommended = results.reduce((best, result) => result.netAssets > best.netAssets ? result : best);
  return { results, recommended };
}
