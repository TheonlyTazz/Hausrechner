import { describe, expect, test } from 'vitest';
import { useFinancingCalculator } from '../resources/js/Composables/useFinancingCalculator.js';
import { buildSharePayload, compressSharePayload, decodeSharePayload, decompressSharePayload, encodeSharePayload, expandSharePayload } from '../resources/js/Composables/useShareableState.js';
import { buildEtfPlan, simulateEtfStrategy } from '../resources/js/Composables/etfPlanner.ts';

describe('financing scenarios', () => {
  test('WI Bank strategy reduces the main bank allocation and total interest', () => {
    const calculator = useFinancingCalculator();
    expect(calculator.scenarioWithWi.value.bank).toBeLessThan(calculator.scenarioWithoutWi.value.bank);
    expect(calculator.scenarioWithWi.value.debt).toBe(calculator.scenarioWithoutWi.value.debt);
    expect(calculator.scenarioWithWi.value.schedule.totalInterest).toBeLessThan(calculator.scenarioWithoutWi.value.schedule.totalInterest);
  });

  test('renovation scenario adds exactly the configured budget', () => {
    const calculator = useFinancingCalculator();
    expect(calculator.scenarioRenovated.value.required - calculator.scenarioNoRenovation.value.required).toBe(calculator.inputs.renovationBudget * 100);
  });

  test('target payment shortens the simulated payoff period', () => {
    const calculator = useFinancingCalculator();
    const baseline = calculator.activeScenario.value.schedule.paidOffMonth;
    calculator.inputs.targetMonthlyRate += 500;
    expect(calculator.activeScenario.value.schedule.paidOffMonth).toBeLessThan(baseline);
  });

  test('WI Bank is excluded above the WoFlV model limit', () => {
    const calculator = useFinancingCalculator();
    calculator.inputs.grossArea = 260;
    calculator.inputs.utilityArea = 20;
    expect(calculator.wiBankAreaEligible.value).toBe(false);
    expect(calculator.activeScenario.value.loans.some(loan => loan.name === 'WI Bank Hessen')).toBe(false);
  });

  test('Hessengeld uses the highest-interest active loan first', () => {
    const calculator = useFinancingCalculator();
    expect(calculator.hessenRouting.value[0]?.[0]).toBe('KfW 124');
  });

  test('schedule remains integer-cent precise and reaches zero', () => {
    const calculator = useFinancingCalculator();
    const schedule = calculator.activeScenario.value.schedule;
    expect(schedule.remaining).toBe(0);
    expect(Number.isInteger(schedule.totalInterest)).toBe(true);
    expect(schedule.rows.every(row => Number.isInteger(row.balance) && row.balance >= 0)).toBe(true);
  });

  test('housing utilities and maintenance reserve affect affordability and total housing costs', () => {
    const calculator = useFinancingCalculator();
    expect(calculator.totalHousingCosts.value).toBe(calculator.activeScenario.value.netMonthly + 50000);
    const available = calculator.availableOwnRate.value;
    calculator.inputs.monthlyHousingUtilities += 100;
    expect(calculator.availableOwnRate.value).toBe(available - 10000);
    expect(calculator.totalHousingCosts.value).toBe(calculator.activeScenario.value.netMonthly + 60000);
  });

  test('renovation grants reduce required capital and the main-bank loan exactly', () => {
    const calculator = useFinancingCalculator();
    calculator.inputs.renovationEnabled = true;
    const baseline = calculator.activeScenario.value;
    calculator.inputs.renovationFunding.push({ id: 'grant', preset: 'bafa', name: 'BAFA', kind: 'grant', amount: 12000, interestRate: 0, interestOnlyYears: 0, termYears: 0 });
    expect(calculator.activeScenario.value.required).toBe(baseline.required - 1_200_000);
    expect(calculator.activeScenario.value.bank).toBe(baseline.bank - 1_200_000);
    expect(calculator.activeScenario.value.renovationGrant).toBe(1_200_000);
  });

  test('renovation credits become amortized portfolio components', () => {
    const calculator = useFinancingCalculator();
    calculator.inputs.renovationEnabled = true;
    calculator.inputs.renovationFunding.push({ id: 'kfw261', preset: 'kfw261', name: 'KfW 261', kind: 'credit', amount: 30000, interestRate: 1.5, interestOnlyYears: 2, termYears: 25 });
    const loan = calculator.activeScenario.value.loans.find(item => item.name === 'KfW 261');
    expect(loan?.principal).toBe(3_000_000);
    expect(loan?.interestOnlyMonths).toBe(24);
    expect(calculator.activeScenario.value.renovationFundingCredit).toBe(3_000_000);
    expect(calculator.activeScenario.value.schedule.rows.some(row => row.balances['KfW 261'] < 3_000_000)).toBe(true);
  });

  test('grants cannot exceed the renovation budget', () => {
    const calculator = useFinancingCalculator();
    calculator.inputs.renovationEnabled = true;
    calculator.inputs.renovationFunding.push({ id: 'grant', name: 'Grant', kind: 'grant', amount: 999999 });
    expect(calculator.renovationGrantTotal.value).toBe(calculator.inputs.renovationBudget * 100);
  });

  test('scenario C exposes the interest benefit of cheaper renovation funding', () => {
    const calculator = useFinancingCalculator();
    calculator.inputs.renovationEnabled = true;
    calculator.inputs.renovationFunding.push({ id: 'cheap', name: 'Förderkredit', kind: 'credit', amount: 30000, interestRate: 0.5, interestOnlyYears: 0, termYears: 30 });
    expect(calculator.scenarioRenovated.value.loans.some(loan => loan.renovationFunding)).toBe(true);
    expect(calculator.renovationFundingInterestSaved.value).toBeGreaterThan(0);
  });

  test('subsidized credits remain active while the renovation toggle is off', () => {
    const calculator = useFinancingCalculator();
    calculator.inputs.renovationFunding.push({ id: 'c-only', name: 'KfW 270', kind: 'credit', amount: 15000, interestRate: 2, interestOnlyYears: 1, termYears: 20 });
    expect(calculator.activeScenario.value.loans.some(loan => loan.name === 'KfW 270')).toBe(true);
    expect(calculator.scenarioRenovated.value.loans.some(loan => loan.name === 'KfW 270')).toBe(true);
  });

  test('one-time grants stay inactive without a renovation budget', () => {
    const calculator = useFinancingCalculator();
    const baseline = calculator.activeScenario.value.required;
    calculator.inputs.renovationFunding.push({ id: 'grant-off', name: 'BAFA', kind: 'grant', amount: 10000 });
    expect(calculator.activeScenario.value.required).toBe(baseline);
    expect(calculator.activeScenario.value.renovationGrant).toBe(0);
  });

  test('KfW 124 is available independently of renovation', () => {
    const calculator = useFinancingCalculator();
    calculator.inputs.renovationEnabled = false;
    calculator.inputs.kfwEnabled = true;
    expect(calculator.activeScenario.value.loans.find(loan => loan.name === 'KfW 124')?.principal).toBeGreaterThan(0);
  });

  test('BAFA example reconciles gross need, equity, grant and every loan without a double deduction', () => {
    const calculator = useFinancingCalculator();
    Object.assign(calculator.inputs, {
      purchasePrice: 325000, equity: 35000, renovationEnabled: true, renovationBudget: 105000,
      wiBankAmount: 140000, kfwAmount: 100000, employerEnabled: true, employerAmount: 50000,
    });
    calculator.inputs.renovationFunding.push(
      { id: '270', name: 'KfW 270', kind: 'credit', amount: 20000, interestRate: 3.8, interestOnlyYears: 1, termYears: 20 },
      { id: '261', name: 'KfW 261', kind: 'credit', amount: 85000, interestRate: 2.5, interestOnlyYears: 1, termYears: 30 },
      { id: 'bafa', name: 'BAFA', kind: 'grant', amount: 4000 },
    );
    const scenario = calculator.activeScenario.value;
    expect(calculator.totalCapital.value).toBe(46_597_750);
    expect(scenario.required).toBe(46_197_750);
    expect(scenario.bank).toBe(3_197_750);
    expect(scenario.debt).toBe(42_697_750);
    expect(scenario.debt + calculator.inputs.equity * 100 + scenario.renovationGrant).toBe(calculator.totalCapital.value);
    expect(scenario.loans.reduce((sum, loan) => sum + loan.principal, 0)).toBe(scenario.debt);
  });
});

test('share payload uses a compact sparse positional schema', () => {
  const defaults = { purchasePrice: 300000, equity: 60000, children: 0 };
  const payload = buildSharePayload({ ...defaults, equity: 75000 }, defaults);
  expect(payload).toEqual([2, 4, 75000]);
  expect(expandSharePayload(decodeSharePayload(encodeSharePayload(payload)))).toEqual({ equity: 75000 });
});

test('legacy object payloads remain readable', () => {
  expect(expandSharePayload({ version: 1, values: { equity: 75000 } })).toEqual({ equity: 75000 });
});

test('compressed share payload round-trips and is shorter than positional Base64', () => {
  const payload = [2, 0, 325000, 4, 35000, 6, 85000, 7, 280, 8, 136, 10, 3, 13, 4900, 15, 2400, 38, 1150];
  const compressed = compressSharePayload(payload);
  expect(decompressSharePayload(compressed)).toEqual(payload);
  expect(compressed.length).toBeLessThan(encodeSharePayload(payload).length);
});

test('renovation funding round-trips through the positional share payload', () => {
  const defaults = { renovationFunding: [] };
  const renovationFunding = [{ id: 'kfw261', preset: 'kfw261', name: 'KfW 261', kind: 'credit', amount: 30000, interestRate: 1.5, interestOnlyYears: 2, termYears: 25 }];
  const expanded = expandSharePayload(decompressSharePayload(compressSharePayload(buildSharePayload({ renovationFunding }, defaults))));
  expect(expanded.renovationFunding).toEqual(renovationFunding);
});

test('ETF planner assumptions round-trip through the positional share payload', () => {
  const defaults = { retirementAge: 67, etfMonthlyBudget: 2200, etfExpectedReturn: 6 };
  const values = { retirementAge: 65, etfMonthlyBudget: 2500, etfExpectedReturn: 5.5 };
  const expanded = expandSharePayload(decompressSharePayload(compressSharePayload(buildSharePayload(values, defaults))));
  expect(expanded).toMatchObject(values);
});

describe('ETF and repayment planner', () => {
  const loans = [
    { name: 'Cheap loan', principal: 1000000, rate: 1, payment: 50000 },
    { name: 'Expensive loan', principal: 2000000, rate: 5, payment: 100000 },
  ];
  const inputs = { currentAge: 40, retirementAge: 41, monthlyBudget: 2000, existingCapital: 0, expectedReturn: 6, annualCosts: 0.2, taxRate: 25, riskDiscount: 2, inflation: 2, withdrawalRate: 3.5 };

  test('debt-first sends surplus to the highest-rate active loan', () => {
    const result = simulateEtfStrategy(loans, inputs, 'debt-first');
    const expensive = result.allocation.find(row => row.name === 'Expensive loan');
    expect(expensive.extra).toBeGreaterThan(0);
    expect(result.firstMonthEtf).toBe(0);
  });

  test('ETF-first preserves minimum payments and invests the free budget', () => {
    const result = simulateEtfStrategy(loans, inputs, 'etf-first');
    expect(result.allocation.reduce((sum, row) => sum + row.minimum, 0)).toBeGreaterThan(0);
    expect(result.firstMonthEtf).toBeGreaterThan(0);
    expect(result.totalContributions).toBeGreaterThan(result.firstMonthEtf);
  });

  test('planner recommends the risk-adjusted strategy and still exposes the raw projected maximum', () => {
    const plan = buildEtfPlan(loans, inputs);
    expect(plan.results.map(result => result.strategy)).toEqual(['debt-first', 'balanced', 'etf-first']);
    expect(plan.recommended.strategy).toBe('balanced');
    expect(plan.projectedMaximum.netAssets).toBe(Math.max(...plan.results.map(result => result.netAssets)));
  });

  test('a 3.5 percent loan is repaid before a risky 6 percent ETF under default adjustments', () => {
    const plan = buildEtfPlan([{ name: 'Mortgage', principal: 20000000, rate: 3.5, payment: 90000 }], { ...inputs, expectedReturn: 6, annualCosts: 0.2, taxRate: 26.375, riskDiscount: 2 });
    expect(plan.riskAdjustedEtfReturn).toBeLessThan(3.5);
    expect(plan.recommended.allocation[0].extra).toBeGreaterThan(0);
    expect(plan.recommended.firstMonthEtf).toBe(0);
  });

  test('equal-rate loans prioritize KfW 124 and reallocate after it is paid off', () => {
    const phaseInputs = { ...inputs, retirementAge: 43, monthlyBudget: 2000, expectedReturn: 6, annualCosts: 0.2, taxRate: 26.375, riskDiscount: 2 };
    const plan = buildEtfPlan([
      { name: 'Main bank', principal: 2000000, rate: 3.5, payment: 50000 },
      { name: 'KfW 124', principal: 500000, rate: 3.5, payment: 25000 },
    ], phaseInputs);
    expect(plan.recommended.phases[0].target).toBe('KfW 124');
    expect(plan.recommended.phases.some(phase => phase.target === 'Main bank')).toBe(true);
    expect(plan.recommended.phases.some(phase => phase.target === 'ETF')).toBe(true);
  });

  test('budget below contractual payments is reported as a shortfall', () => {
    const result = simulateEtfStrategy(loans, { ...inputs, monthlyBudget: 100 }, 'balanced');
    expect(result.monthlyShortfall).toBeGreaterThan(0);
    expect(result.firstMonthEtf).toBe(0);
  });
});
