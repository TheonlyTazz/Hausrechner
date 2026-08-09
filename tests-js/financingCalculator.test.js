import assert from 'node:assert/strict';
import test from 'node:test';
import { useFinancingCalculator } from '../resources/js/Composables/useFinancingCalculator.js';

test('WI Bank strategy reduces the main bank allocation', () => {
  const calculator = useFinancingCalculator();
  assert.ok(calculator.scenarioWithWi.value.bank < calculator.scenarioWithoutWi.value.bank);
  assert.equal(calculator.scenarioWithWi.value.debt, calculator.scenarioWithoutWi.value.debt);
});

test('target payment shortens the simulated payoff period', () => {
  const calculator = useFinancingCalculator();
  const baseline = calculator.activeScenario.value.schedule.paidOffMonth;
  calculator.inputs.targetMonthlyRate += 500;
  assert.ok(calculator.activeScenario.value.schedule.paidOffMonth < baseline);
});

test('WI Bank is excluded above the WoFlV model limit', () => {
  const calculator = useFinancingCalculator();
  calculator.inputs.grossArea = 260;
  calculator.inputs.utilityArea = 20;
  assert.equal(calculator.wiBankAreaEligible.value, false);
  assert.equal(calculator.activeScenario.value.loans.some(loan => loan.name === 'WI Bank Hessen'), false);
});

test('Hessengeld uses the highest-interest active loan first', () => {
  const calculator = useFinancingCalculator();
  assert.equal(calculator.hessenRouting.value[0]?.[0], 'KfW 124');
});
