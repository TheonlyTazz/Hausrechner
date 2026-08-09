export type EtfStrategy = 'debt-first' | 'etf-first' | 'balanced';

export interface PlannerLoan { name: string; principal: number; rate: number; payment: number; interestOnlyMonths?: number; balloonMonth?: number | null }
export interface EtfPlannerInputs { currentAge: number; retirementAge: number; monthlyBudget: number; existingCapital: number; expectedReturn: number; annualCosts: number; taxRate: number; riskDiscount: number; inflation: number; withdrawalRate: number; monthlyAdditionalEtf?: number }
export interface AllocationRow { name: string; minimum: number; extra: number }
export interface MonthlyAllocation { month: number; loans: AllocationRow[]; etf: number; dedicatedEnergyEtf: number; shortfall: number }
export interface AllocationPhase { startMonth: number; endMonth: number; target: string; monthlyAmount: number }
export interface EtfPlanResult { strategy: EtfStrategy; etfAtRetirement: number; realEtfValue: number; debtAtRetirement: number; netAssets: number; totalInterest: number; totalContributions: number; monthlyRetirementWithdrawal: number; paidOffMonth: number | null; monthlyShortfall: number; firstMonthEtf: number; allocation: AllocationRow[]; monthlyAllocations: MonthlyAllocation[]; phases: AllocationPhase[]; timeline: Array<{ year: number; etf: number; debt: number; net: number }> }

const cents = (euros: number): number => Math.round((Number(euros) || 0) * 100);
const annualToMonthly = (percent: number): number => (Number(percent) || 0) / 100 / 12;
const priority = (a: PlannerLoan, b: PlannerLoan): number => (b.rate - a.rate) || (a.name === 'KfW 124' ? -1 : b.name === 'KfW 124' ? 1 : 0);

export function simulateEtfStrategy(sourceLoans: PlannerLoan[], inputs: EtfPlannerInputs, strategy: EtfStrategy, hessenAnnual = 0): EtfPlanResult {
  const months = Math.max(1, Math.round((Math.max(inputs.currentAge, inputs.retirementAge) - inputs.currentAge) * 12));
  const loans = sourceLoans.map(loan => ({ ...loan, balance: loan.principal }));
  const budget = cents(inputs.monthlyBudget);
  const monthlyEtfRate = annualToMonthly(inputs.expectedReturn - inputs.annualCosts);
  const riskAdjustedReturn = Math.max(0, (inputs.expectedReturn - inputs.annualCosts) * (1 - Math.max(0, inputs.taxRate) / 100) - inputs.riskDiscount);
  let etf = cents(inputs.existingCapital);
  let contributions = etf;
  let totalInterest = 0;
  let paidOffMonth: number | null = null;
  let monthlyShortfall = 0;
  let firstMonthEtf = 0;
  const allocation = new Map<string, AllocationRow>();
  const monthlyAllocations: MonthlyAllocation[] = [];
  const phases: AllocationPhase[] = [];
  const timeline: EtfPlanResult['timeline'] = [{ year: new Date().getFullYear(), etf, debt: loans.reduce((sum, loan) => sum + loan.balance, 0), net: etf - loans.reduce((sum, loan) => sum + loan.balance, 0) }];

  for (let month = 1; month <= months; month += 1) {
    etf = Math.round(etf * (1 + monthlyEtfRate));
    const dedicatedEtf = cents(inputs.monthlyAdditionalEtf || 0);
    etf += dedicatedEtf;
    contributions += dedicatedEtf;
    if (month === 1) firstMonthEtf += dedicatedEtf;
    let scheduledTotal = 0;
    const monthAllocation = new Map<string, AllocationRow>();
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
      monthAllocation.set(loan.name, { name: loan.name, minimum: interest + principal, extra: 0 });
    }

    monthlyShortfall = Math.max(monthlyShortfall, Math.max(0, scheduledTotal - budget));
    let free = Math.max(0, budget - scheduledTotal);
    const active = loans.filter(loan => loan.balance > 0).sort(priority);
    const debtGetsExtra = strategy === 'debt-first' || (strategy === 'balanced' && active.length > 0 && active[0].rate >= riskAdjustedReturn);
    const phaseTarget = free > 0 ? (debtGetsExtra && active.length ? active[0].name : 'ETF') : '';
    if (phaseTarget && phases.at(-1)?.target !== phaseTarget) {
      if (phases.length) phases[phases.length - 1].endMonth = month - 1;
      phases.push({ startMonth: month, endMonth: months, target: phaseTarget, monthlyAmount: free });
    }
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
        const monthRow = monthAllocation.get(loan.name) || { name: loan.name, minimum: 0, extra: 0 };
        monthRow.extra += extra;
        monthAllocation.set(loan.name, monthRow);
      }
    }
    if (free > 0) {
      etf += free;
      contributions += free;
      if (month === 1) firstMonthEtf += free;
    }
    monthlyAllocations.push({ month, loans: [...monthAllocation.values()], etf: dedicatedEtf + free, dedicatedEnergyEtf: dedicatedEtf, shortfall: Math.max(0, scheduledTotal - budget) });

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
    paidOffMonth, monthlyShortfall, firstMonthEtf, allocation: [...allocation.values()], monthlyAllocations, phases, timeline,
  };
}

export function buildEtfPlan(loans: PlannerLoan[], inputs: EtfPlannerInputs, hessenAnnual = 0) {
  const results = (['debt-first', 'balanced', 'etf-first'] as EtfStrategy[]).map(strategy => simulateEtfStrategy(loans, inputs, strategy, hessenAnnual));
  const recommended = results.find(result => result.strategy === 'balanced') as EtfPlanResult;
  const projectedMaximum = results.reduce((best, result) => result.netAssets > best.netAssets ? result : best);
  const riskAdjustedEtfReturn = Math.max(0, (inputs.expectedReturn - inputs.annualCosts) * (1 - Math.max(0, inputs.taxRate) / 100) - inputs.riskDiscount);
  const highestLoanRate = Math.max(0, ...loans.filter(loan => loan.principal > 0).map(loan => loan.rate));
  return { results, recommended, projectedMaximum, riskAdjustedEtfReturn, highestLoanRate };
}

export interface TotalWealthInputs {
  purchasePrice: number;
  renovationBudget: number;
  valueAddingShare: number;
  propertyAppreciation: number;
  monthlyEnergySavings: number;
  energyReinvestmentShare: number;
}

export function buildTotalWealthComparison(withRenovationLoans: PlannerLoan[], withoutRenovationLoans: PlannerLoan[], plannerInputs: EtfPlannerInputs, wealthInputs: TotalWealthInputs, hessenAnnual = 0) {
  const years = Math.max(0, Number(plannerInputs.retirementAge) - Number(plannerInputs.currentAge));
  const reinvestedMonthly = Math.max(0, Number(wealthInputs.monthlyEnergySavings)) * Math.min(100, Math.max(0, Number(wealthInputs.energyReinvestmentShare))) / 100;
  const withPlan = buildEtfPlan(withRenovationLoans, { ...plannerInputs, monthlyAdditionalEtf: reinvestedMonthly }, hessenAnnual).recommended;
  const withPlanWithoutSavings = buildEtfPlan(withRenovationLoans, { ...plannerInputs, monthlyAdditionalEtf: 0 }, hessenAnnual).recommended;
  const withoutPlan = buildEtfPlan(withoutRenovationLoans, { ...plannerInputs, monthlyAdditionalEtf: 0 }, hessenAnnual).recommended;
  const appreciationFactor = Math.pow(1 + Math.max(-100, Number(wealthInputs.propertyAppreciation)) / 100, years);
  const valueAddingRenovation = Math.max(0, Number(wealthInputs.renovationBudget)) * Math.min(100, Math.max(0, Number(wealthInputs.valueAddingShare))) / 100;
  const withProperty = cents((Math.max(0, Number(wealthInputs.purchasePrice)) + valueAddingRenovation) * appreciationFactor);
  const withoutProperty = cents(Math.max(0, Number(wealthInputs.purchasePrice)) * appreciationFactor);
  const decorate = (plan: EtfPlanResult, propertyValue: number) => ({
    plan,
    propertyValue,
    liquidNetWorth: plan.etfAtRetirement - plan.debtAtRetirement,
    totalNetWorth: propertyValue + plan.etfAtRetirement - plan.debtAtRetirement,
  });
  return {
    withRenovation: decorate(withPlan, withProperty),
    withoutRenovation: decorate(withoutPlan, withoutProperty),
    valueAddingRenovation: cents(valueAddingRenovation),
    reinvestedMonthly: cents(reinvestedMonthly),
    energyEtfEffect: withPlan.etfAtRetirement - withPlanWithoutSavings.etfAtRetirement,
    years,
  };
}
