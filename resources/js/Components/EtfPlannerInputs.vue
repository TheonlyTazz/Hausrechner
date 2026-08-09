<script setup>
import { translate } from '../Composables/useUiPreferences';
import CurrencyInput from './CurrencyInput.vue';
const props = defineProps({ calculator: { type: Object, required: true }, language: { type: String, default: 'de' } });
const c = props.calculator;
const t = key => translate(props.language, key);
</script>
<template>
  <section class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
    <h2 class="font-bold">{{ t('ETF- & Tilgungsplaner') }}</h2>
    <p class="mt-1 text-xs text-slate-500">{{ t('Vergleicht die Verwendung deines monatlichen Gesamtbudgets bis zum Rentenalter.') }}</p>
    <div class="mt-3 grid grid-cols-2 gap-3 text-xs font-semibold text-slate-600">
      <label class="col-span-2">{{ t('Gesamtbudget Kredit + ETF/Monat (€)') }}<CurrencyInput v-model="c.inputs.etfMonthlyBudget" class="mt-1 w-full rounded-lg border-slate-300 text-sm" /></label>
      <label>{{ t('Rentenalter') }}<input v-model.number="c.inputs.retirementAge" type="number" :min="Number(c.inputs.currentAge) + 1" max="90" class="mt-1 w-full rounded-lg border-slate-300 text-sm"></label>
      <label>{{ t('Vorhandenes ETF-Kapital (€)') }}<CurrencyInput v-model="c.inputs.etfExistingCapital" class="mt-1 w-full rounded-lg border-slate-300 text-sm" /></label>
      <label>{{ t('Erwartete Rendite p.a. (%)') }}<input v-model.number="c.inputs.etfExpectedReturn" type="number" min="-10" max="20" step="0.1" class="mt-1 w-full rounded-lg border-slate-300 text-sm"></label>
      <label>{{ t('ETF-Kosten p.a. (%)') }}<input v-model.number="c.inputs.etfAnnualCosts" type="number" min="0" max="5" step="0.05" class="mt-1 w-full rounded-lg border-slate-300 text-sm"></label>
      <label>{{ t('Risikoabschlag (%)') }}<input v-model.number="c.inputs.etfRiskDiscount" type="number" min="0" max="15" step="0.25" class="mt-1 w-full rounded-lg border-slate-300 text-sm"></label>
      <label>{{ t('Modellsteuer auf Gewinne (%)') }}<input v-model.number="c.inputs.etfTaxRate" type="number" min="0" max="60" step="0.125" class="mt-1 w-full rounded-lg border-slate-300 text-sm"></label>
      <label>{{ t('Inflation p.a. (%)') }}<input v-model.number="c.inputs.etfInflation" type="number" min="0" max="10" step="0.1" class="mt-1 w-full rounded-lg border-slate-300 text-sm"></label>
      <label>{{ t('Entnahmerate p.a. (%)') }}<input v-model.number="c.inputs.etfWithdrawalRate" type="number" min="0" max="10" step="0.1" class="mt-1 w-full rounded-lg border-slate-300 text-sm"></label>
    </div>
    <div class="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs"><p class="font-bold text-slate-700">{{ t('Aktiver Zinsvergleich') }}</p><div class="mt-2 space-y-1"><div v-for="loan in c.activeScenario.value.loans" :key="loan.name" class="flex justify-between"><span>{{ t(loan.name) }}</span><strong>{{ c.formatPercent(loan.rate) }}</strong></div></div><p class="mt-2 border-t border-slate-200 pt-2 text-slate-500">{{ t('Kreditzinsen änderst du im Tab Darlehen; ETF-Annahmen direkt oben.') }}</p></div>
    <div class="mt-3 rounded-lg bg-amber-50 p-3 text-xs text-amber-900"><strong>{{ t('Wichtige Modellgrenze:') }}</strong> {{ t('ETF-Renditen sind unsicher. Kreditzinsen sind vertragliche Kosten. Das Ergebnis ist eine Szenariorechnung, keine Anlage- oder Steuerberatung.') }}</div>
  </section>
</template>
