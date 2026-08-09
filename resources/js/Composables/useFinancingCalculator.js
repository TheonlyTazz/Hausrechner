import { computed, reactive } from 'vue';
import { buildLoanPortfolio, scenarioStrategies } from './financingStrategies.js';

const roundCent = value => Math.round(Number(value || 0) * 100);
const euros = cents => Math.round(cents) / 100;
const percentRate = percent => Number(percent || 0) / 100 / 12;
const repaymentPriority = (a, b) => (b.rate - a.rate) || (a.name === 'KfW 124' ? -1 : b.name === 'KfW 124' ? 1 : 0);

function monthlyPayment(principal, annualRate, years) {
  const months = Math.max(1, Math.round(years * 12));
  const rate = percentRate(annualRate);
  if (!rate) return Math.ceil(principal / months);
  return Math.ceil(principal * rate / (1 - Math.pow(1 + rate, -months)));
}

function simulate(loans, hessenAnnual, monthlyBudget = null, horizonMonths = 600) {
  const items = loans.filter(l => l.principal > 0).map(l => ({ ...l, balance: l.principal }));
  const rows = [];
  let totalInterest = 0;
  let paidOffMonth = null;

  for (let month = 1; month <= horizonMonths && items.some(l => l.balance > 0); month++) {
    let monthInterest = 0;
    let monthPrincipal = 0;
    let monthScheduled = 0;
    const hessenAllocation = {};
    for (const loan of items) {
      if (loan.balance <= 0) continue;
      const interest = Math.round(loan.balance * percentRate(loan.rate));
      const interestOnly = loan.interestOnlyMonths && month <= loan.interestOnlyMonths;
      const balloonDue = loan.balloonMonth && month >= loan.balloonMonth;
      const scheduled = balloonDue ? interest + loan.balance : (interestOnly ? interest : loan.payment);
      const principalPaid = Math.max(0, Math.min(loan.balance, scheduled - interest));
      loan.balance -= principalPaid;
      monthInterest += interest;
      monthPrincipal += principalPaid;
      monthScheduled += interest + principalPaid;
    }
    let extraMonthly = monthlyBudget === null ? 0 : Math.max(0, monthlyBudget - monthScheduled);
    for (const loan of [...items].filter(loan => (!loan.interestOnlyMonths || month > loan.interestOnlyMonths) && (!loan.balloonMonth || month >= loan.balloonMonth)).sort(repaymentPriority)) {
      if (!extraMonthly) break;
      const extra = Math.min(loan.balance, extraMonthly);
      loan.balance -= extra;
      monthPrincipal += extra;
      extraMonthly -= extra;
    }
    if (month <= 120 && month % 12 === 0 && hessenAnnual > 0) {
      let remaining = hessenAnnual;
      for (const loan of [...items].sort(repaymentPriority)) {
        const extra = Math.min(loan.balance, remaining);
        loan.balance -= extra;
        monthPrincipal += extra;
        if (extra > 0) hessenAllocation[loan.name] = (hessenAllocation[loan.name] || 0) + extra;
        remaining -= extra;
        if (!remaining) break;
      }
    }
    totalInterest += monthInterest;
    rows.push({
      month,
      interest: monthInterest,
      principal: monthPrincipal,
      balance: items.reduce((sum, l) => sum + l.balance, 0),
      balances: Object.fromEntries(items.map(l => [l.name, l.balance])),
      hessenAllocation,
    });
    if (!items.some(l => l.balance > 0)) paidOffMonth = month;
  }
  return { rows, totalInterest, paidOffMonth, remaining: rows.at(-1)?.balance || 0 };
}

export const DEFAULT_INPUTS = Object.freeze({
    purchasePrice: 300000,
    transferTaxPercent: 6,
    notaryPercent: 1.5,
    brokerPercent: 3.57,
    equity: 60000,
    renovationEnabled: false,
    renovationBudget: 50000,
    grossArea: 160,
    utilityArea: 40,
    buyers: 1,
    children: 0,
    rentalIncome: 0,
    rentalIncomeHaircutPercent: 20,
    householdNetIncome: 4000,
    otherMonthlyIncome: 0,
    livingCosts: 1800,
    otherCommitments: 0,
    monthlySafetyBuffer: 500,
    wiBankEnabled: true,
    wiBankOverride: false,
    wiBankAmount: 100000,
    wiBankInterest: 1,
    wiBankTerm: 30,
    kfwEnabled: true,
    kfwAmount: 80000,
    kfwInterest: 3.5,
    kfwTerm: 25,
    kfwInterestOnlyYears: 1,
    employerEnabled: false,
    employerAmount: 25000,
    employerInterest: 1.5,
    employerPayment: 150,
    employerTerm: 20,
    employerBalloon: false,
    mainBankInterest: 3.5,
    mainBankTerm: 30,
    targetMonthlyRate: 1400,
    useTargetRate: true,
    chartYears: 30,
    currentAge: 35,
});

export function useFinancingCalculator(locale = { value: 'de' }) {
  const inputs = reactive({ ...DEFAULT_INPUTS });

  const formatCurrency = value => new Intl.NumberFormat(locale.value === 'en' ? 'en-GB' : 'de-DE', { style: 'currency', currency: 'EUR' }).format(value || 0);
  const formatPercent = value => new Intl.NumberFormat(locale.value === 'en' ? 'en-GB' : 'de-DE', { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 2 }).format((value || 0) / 100);
  const netLivingArea = computed(() => Math.max(0, Number(inputs.grossArea) - Number(inputs.utilityArea)));
  const wiBankAreaEligible = computed(() => netLivingArea.value <= 200);
  const wiBankEligible = computed(() => wiBankAreaEligible.value || inputs.wiBankOverride);
  const transferTax = computed(() => roundCent(inputs.purchasePrice * inputs.transferTaxPercent / 100));
  const ancillaryCosts = computed(() => roundCent(inputs.purchasePrice * (inputs.transferTaxPercent + inputs.notaryPercent + inputs.brokerPercent) / 100));
  const renovation = computed(() => inputs.renovationEnabled ? roundCent(inputs.renovationBudget) : 0);
  const totalCapital = computed(() => roundCent(inputs.purchasePrice) + ancillaryCosts.value + renovation.value);
  const hessenClaim = computed(() => roundCent(inputs.buyers * 10000 + inputs.children * 5000));
  const hessenGrant = computed(() => Math.min(hessenClaim.value, transferTax.value));
  const hessenAnnual = computed(() => Math.floor(hessenGrant.value / 10));
  const totalHouseholdIncome = computed(() => roundCent(inputs.householdNetIncome) + roundCent(inputs.otherMonthlyIncome) + roundCent(inputs.rentalIncome));
  const bankRentalIncome = computed(() => Math.round(roundCent(inputs.rentalIncome) * (1 - Number(inputs.rentalIncomeHaircutPercent || 0) / 100)));
  const availableOwnRate = computed(() => Math.max(0,
    roundCent(inputs.householdNetIncome) + roundCent(inputs.otherMonthlyIncome)
      - roundCent(inputs.livingCosts) - roundCent(inputs.otherCommitments) - roundCent(inputs.monthlySafetyBuffer),
  ));

  function buildScenario({ wiBank = inputs.wiBankEnabled, renovationOn = inputs.renovationEnabled } = {}) {
    const required = roundCent(inputs.purchasePrice) + ancillaryCosts.value + (renovationOn ? roundCent(inputs.renovationBudget) : 0);
    const { loans, bank } = buildLoanPortfolio({ inputs, required, equity: roundCent(inputs.equity), wiBank, wiBankEligible: wiBankEligible.value, roundCent, monthlyPayment, percentRate });
    const contractualMonthly = loans.reduce((sum, l) => sum + l.payment, 0);
    const targetGrossMonthly = roundCent(inputs.targetMonthlyRate) + roundCent(inputs.rentalIncome);
    const grossMonthly = inputs.useTargetRate ? Math.max(contractualMonthly, targetGrossMonthly) : contractualMonthly;
    const schedule = simulate(loans, hessenAnnual.value, inputs.useTargetRate ? grossMonthly : null, 600);
    return {
      required, loans, bank, grossMonthly, contractualMonthly,
      netMonthly: Math.max(0, grossMonthly - roundCent(inputs.rentalIncome)),
      schedule,
      debt: loans.reduce((sum, l) => sum + l.principal, 0),
    };
  }

  const scenarioWithWi = computed(() => buildScenario(scenarioStrategies.withWiBank(inputs)));
  const scenarioWithoutWi = computed(() => buildScenario(scenarioStrategies.withoutWiBank(inputs)));
  const scenarioRenovated = computed(() => buildScenario(scenarioStrategies.renovated(inputs)));
  const scenarioNoRenovation = computed(() => buildScenario(scenarioStrategies.unrenovated(inputs)));
  const activeScenario = computed(() => buildScenario());
  const interestSaved = computed(() => Math.max(0, scenarioWithoutWi.value.schedule.totalInterest - scenarioWithWi.value.schedule.totalInterest));
  const payoffMonths = computed(() => activeScenario.value.schedule.paidOffMonth);
  const payoffAge = computed(() => payoffMonths.value ? Number(inputs.currentAge) + payoffMonths.value / 12 : null);
  const payoffYear = computed(() => payoffMonths.value ? new Date().getFullYear() + Math.ceil(payoffMonths.value / 12) : null);
  const monthlySurplus = computed(() => availableOwnRate.value - activeScenario.value.netMonthly);
  const bankNetMonthly = computed(() => Math.max(0, activeScenario.value.grossMonthly - bankRentalIncome.value));
  const housingCostRatio = computed(() => {
    const incomeWithoutRent = roundCent(inputs.householdNetIncome) + roundCent(inputs.otherMonthlyIncome);
    return incomeWithoutRent > 0 ? activeScenario.value.netMonthly / incomeWithoutRent : null;
  });
  const applyAffordableRate = () => {
    inputs.targetMonthlyRate = euros(availableOwnRate.value);
    inputs.useTargetRate = true;
  };
  const hessenRouting = computed(() => {
    const totals = {};
    for (const row of activeScenario.value.schedule.rows) {
      for (const [loan, amount] of Object.entries(row.hessenAllocation || {})) totals[loan] = (totals[loan] || 0) + amount;
    }
    return Object.entries(totals);
  });

  function projectTarget(scenario) {
    const payment = roundCent(inputs.targetMonthlyRate) + roundCent(inputs.rentalIncome);
    const schedule = simulate(scenario.loans, hessenAnnual.value, payment, 600);
    const months = schedule.paidOffMonth;
    return { months, feasible: Boolean(months), age: months ? Number(inputs.currentAge) + months / 12 : null, year: months ? new Date().getFullYear() + Math.ceil(months / 12) : null };
  }
  const targetProjection = computed(() => projectTarget(activeScenario.value));
  const targetWithWi = computed(() => projectTarget(scenarioWithWi.value));
  const targetWithoutWi = computed(() => projectTarget(scenarioWithoutWi.value));

  const annualChart = computed(() => Array.from({ length: Number(inputs.chartYears) || 30 }, (_, year) => {
    const rows = activeScenario.value.schedule.rows.slice(year * 12, year * 12 + 12);
    return {
      year: new Date().getFullYear() + year + 1,
      interest: euros(rows.reduce((s, r) => s + r.interest, 0)),
      principal: euros(rows.reduce((s, r) => s + r.principal, 0)),
    };
  }).filter(row => row.interest || row.principal));
  const debtChart = computed(() => {
    const schedule = activeScenario.value.schedule;
    const years = Math.min(Number(inputs.chartYears) || 30, Math.ceil(schedule.rows.length / 12));
    return Array.from({ length: years + 1 }, (_, index) => {
      const row = index === 0 ? null : schedule.rows[Math.min(index * 12 - 1, schedule.rows.length - 1)];
      return {
        year: new Date().getFullYear() + index,
        balance: index === 0 ? euros(activeScenario.value.debt) : euros(row?.balance || 0),
      };
    });
  });

  return {
    inputs, formatCurrency, formatPercent, netLivingArea, wiBankAreaEligible, wiBankEligible,
    transferTax, ancillaryCosts, totalCapital, hessenClaim, hessenGrant, hessenAnnual,
    totalHouseholdIncome, bankRentalIncome, availableOwnRate, monthlySurplus, bankNetMonthly, housingCostRatio, applyAffordableRate, hessenRouting,
    activeScenario, scenarioWithWi, scenarioWithoutWi, scenarioRenovated, scenarioNoRenovation,
    interestSaved, payoffAge, payoffYear, targetProjection, targetWithWi, targetWithoutWi, annualChart, debtChart, euros,
  };
}
