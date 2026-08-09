export const scenarioStrategies = {
  withWiBank: inputs => ({ wiBank: true, renovationOn: inputs.renovationEnabled }),
  withoutWiBank: inputs => ({ wiBank: false, renovationOn: inputs.renovationEnabled }),
  renovated: () => ({ renovationOn: true }),
  unrenovated: () => ({ renovationOn: false }),
};

export function buildLoanPortfolio({ inputs, required, equity, wiBank, wiBankEligible, renovationLoans = [], roundCent, monthlyPayment, percentRate }) {
  const employer = inputs.employerEnabled ? Math.min(roundCent(inputs.employerAmount), required) : 0;
  const kfw = inputs.kfwEnabled ? Math.min(roundCent(inputs.kfwAmount), Math.max(0, required - equity - employer)) : 0;
  const wi = wiBank && wiBankEligible ? Math.min(roundCent(inputs.wiBankAmount), Math.max(0, required - equity - employer - kfw)) : 0;
  let remaining = Math.max(0, required - equity - employer - kfw - wi);
  const fundingLoans = renovationLoans.map(funding => {
    const principal = Math.min(roundCent(funding.amount), remaining);
    remaining -= principal;
    return { name: funding.name, principal, rate: funding.interestRate, payment: monthlyPayment(principal, funding.interestRate, Math.max(1, funding.termYears - funding.interestOnlyYears)), interestOnlyMonths: funding.interestOnlyYears * 12, renovationFunding: true };
  });
  const bank = remaining;
  const loans = [
    { name: 'Hauptbank', principal: bank, rate: inputs.mainBankInterest, payment: monthlyPayment(bank, inputs.mainBankInterest, inputs.mainBankTerm) },
    { name: 'WI Bank Hessen', principal: wi, rate: inputs.wiBankInterest, payment: monthlyPayment(wi, inputs.wiBankInterest, inputs.wiBankTerm) },
    { name: 'KfW 124', principal: kfw, rate: inputs.kfwInterest, payment: monthlyPayment(kfw, inputs.kfwInterest, Math.max(1, inputs.kfwTerm - inputs.kfwInterestOnlyYears)), interestOnlyMonths: inputs.kfwInterestOnlyYears * 12 },
    { name: 'AG-Darlehen', principal: employer, rate: inputs.employerInterest, payment: inputs.employerBalloon ? Math.round(employer * percentRate(inputs.employerInterest)) : roundCent(inputs.employerPayment), interestOnlyMonths: inputs.employerBalloon ? Math.max(0, inputs.employerTerm * 12 - 1) : 0, balloonMonth: inputs.employerBalloon ? inputs.employerTerm * 12 : null },
    ...fundingLoans,
  ].filter(loan => loan.principal > 0);
  return { loans, bank };
}
