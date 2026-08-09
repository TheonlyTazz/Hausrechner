import { describe, expect, test } from 'vitest';
import { useFinancingCalculator } from '../resources/js/Composables/useFinancingCalculator.js';
import { buildSharePayload, compressSharePayload, decodeSharePayload, decompressSharePayload, encodeSharePayload, expandSharePayload } from '../resources/js/Composables/useShareableState.js';

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
