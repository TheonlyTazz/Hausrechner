<script setup>
import { ref } from 'vue';
import AmortizationChart from '../Components/AmortizationChart.vue';
import DebtBalanceChart from '../Components/DebtBalanceChart.vue';
import FinancingWizard from '../Components/FinancingWizard.vue';
import ProfileManager from '../Components/ProfileManager.vue';
import { useFinancingCalculator } from '../Composables/useFinancingCalculator';
import { useUiPreferences } from '../Composables/useUiPreferences';

const preferences = useUiPreferences();
const languagePreference = preferences.language;
const t = preferences.t;
const c = useFinancingCalculator(languagePreference);
const euro = cents => c.formatCurrency(c.euros(cents));
const years = months => months ? (languagePreference.value === 'en' ? `${Math.floor(months / 12)} yrs ${months % 12} mos` : `${Math.floor(months / 12)} J. ${months % 12} Mon.`) : (languagePreference.value === 'en' ? 'over 50 years' : 'über 50 Jahre');
const print = () => window.print();
const activeChart = ref('payments');
const activeInput = ref('object');
const wizardOpen = ref(false);
const profilesOpen = ref(false);
const inputTabs = [['object', 'Objekt'], ['income', 'Einkommen'], ['household', 'Haushalt'], ['loans', 'Darlehen']];
</script>

<template>
  <div class="min-h-screen bg-slate-50 text-slate-900 transition-colors dark:bg-slate-950 dark:text-slate-100">
    <header class="bg-slate-950 text-white no-print">
      <div class="mx-auto flex max-w-[1600px] items-center justify-between px-4 py-4 lg:px-8">
        <div><p class="text-xs font-semibold uppercase tracking-[.2em] text-teal-300">{{ t('Finanzierungsplanung') }}</p><h1 class="text-xl font-bold">{{ t('Hauskaufrechner Hessen') }}</h1></div>
        <div class="flex flex-wrap justify-end gap-2"><button type="button" class="rounded-lg border border-slate-700 px-3 py-2 text-sm font-semibold hover:bg-slate-800" :aria-label="languagePreference === 'de' ? 'Switch to English' : 'Auf Deutsch wechseln'" @click="preferences.toggleLanguage">{{ languagePreference === 'de' ? 'EN' : 'DE' }}</button><button type="button" class="rounded-lg border border-slate-700 px-3 py-2 text-sm font-semibold hover:bg-slate-800" aria-label="Farbschema wechseln" @click="preferences.toggleTheme">{{ preferences.theme.value === 'dark' ? '☀' : '◐' }}</button><button type="button" class="rounded-lg border border-slate-700 px-3 py-2 text-sm font-semibold hover:bg-slate-800" @click="profilesOpen = true">{{ t('Profile') }}</button><button type="button" class="rounded-lg bg-teal-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-teal-400" @click="wizardOpen = true">{{ t('Planungs-Wizard') }}</button><button @click="print" class="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-teal-50">{{ t('PDF / Druckansicht') }}</button></div>
      </div>
    </header>

    <main class="mx-auto max-w-[1600px] space-y-5 px-4 py-5 lg:px-8">
      <section class="print-grid grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <article v-for="item in [
          ['Kapitalbedarf', euro(c.totalCapital.value), 'Kauf inkl. Kosten & Sanierung'],
          ['Rate brutto', euro(c.activeScenario.value.grossMonthly), c.inputs.useTargetRate ? 'Zielrate inkl. Miete' : 'vertragliche Raten'],
          ['Rate netto', euro(c.activeScenario.value.netMonthly), languagePreference === 'en' ? `after ${c.formatCurrency(c.inputs.rentalIncome)} cold rent` : `nach ${c.formatCurrency(c.inputs.rentalIncome)} Kaltmiete`],
          ['Zinsvorteil WI Bank', euro(c.interestSaved.value), 'Modellrechnung bis Ablösung'],
          ['Voraussichtlich schuldenfrei', c.payoffYear.value || (languagePreference === 'en' ? '> 50 years' : '> 50 Jahre'), c.payoffAge.value ? (languagePreference === 'en' ? `at approx. age ${c.payoffAge.value.toFixed(1)}` : `mit ca. ${c.payoffAge.value.toFixed(1)} Jahren`) : 'Rate prüfen'],
        ]" :key="item[0]" class="print-avoid rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">{{ t(item[0]) }}</p><p class="mt-1 text-2xl font-bold text-slate-950">{{ item[1] }}</p><p class="mt-1 text-xs text-slate-500">{{ t(item[2]) }}</p>
        </article>
      </section>

      <div class="grid gap-5 xl:grid-cols-[390px_1fr]">
        <aside class="space-y-4 no-print">
          <nav class="grid grid-cols-2 gap-1 rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm" aria-label="Eingabebereiche"><button v-for="tab in inputTabs" :key="tab[0]" type="button" class="rounded-lg px-3 py-2 text-xs font-bold transition" :class="activeInput === tab[0] ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'" @click="activeInput = tab[0]">{{ t(tab[1]) }}</button></nav>
          <section v-show="activeInput === 'object'" class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 class="font-bold">{{ t('Objekt & Kaufnebenkosten') }}</h2>
            <div class="mt-3 grid grid-cols-2 gap-3">
              <label class="col-span-2 text-xs font-semibold text-slate-600">{{ t('Kaufpreis (€)') }}<input v-model.number="c.inputs.purchasePrice" type="number" step="5000" class="mt-1 w-full rounded-lg border-slate-300 text-sm"></label>
              <label v-for="field in [['transferTaxPercent','GrESt %'],['notaryPercent','Notar %'],['brokerPercent','Makler %']]" :key="field[0]" class="text-xs font-semibold text-slate-600">{{ t(field[1]) }}<input v-model.number="c.inputs[field[0]]" type="number" step="0.01" class="mt-1 w-full rounded-lg border-slate-300 text-sm"></label>
              <div class="rounded-lg bg-slate-50 p-2 text-xs"><span class="text-slate-500">{{ t('Nebenkosten') }}</span><strong class="block">{{ euro(c.ancillaryCosts.value) }}</strong></div>
            </div>
            <label class="mt-4 flex items-center justify-between rounded-lg bg-slate-100 p-3 text-sm font-semibold"><span>{{ t(c.inputs.renovationEnabled ? 'Mit Sanierung' : 'Null-Sanierung') }}</span><input v-model="c.inputs.renovationEnabled" type="checkbox" class="rounded text-teal-700"></label>
            <label v-if="c.inputs.renovationEnabled" class="mt-2 block text-xs font-semibold text-slate-600">{{ t('Sanierungsbudget (€)') }}<input v-model.number="c.inputs.renovationBudget" type="number" step="5000" class="mt-1 w-full rounded-lg border-slate-300 text-sm"></label>
          </section>

          <section v-show="activeInput === 'income'" class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 class="font-bold">{{ t('Einkommen & Haushaltsbudget') }}</h2>
            <p class="mt-1 text-xs text-slate-500">{{ t('Ermittelt die monatlich tragbare eigene Rate vor Mieteinnahmen.') }}</p>
            <div class="mt-3 grid grid-cols-2 gap-3 text-xs font-semibold text-slate-600">
              <label>{{ t('Haushaltsnetto (€)') }}<input v-model.number="c.inputs.householdNetIncome" type="number" step="100" class="mt-1 w-full rounded-lg border-slate-300 text-sm"></label>
              <label>{{ t('Sonstige Einnahmen (€)') }}<input v-model.number="c.inputs.otherMonthlyIncome" type="number" step="50" class="mt-1 w-full rounded-lg border-slate-300 text-sm"></label>
              <label>{{ t('Lebenshaltung (€)') }}<input v-model.number="c.inputs.livingCosts" type="number" step="100" class="mt-1 w-full rounded-lg border-slate-300 text-sm"></label>
              <label>{{ t('Andere Verpflichtungen (€)') }}<input v-model.number="c.inputs.otherCommitments" type="number" step="50" class="mt-1 w-full rounded-lg border-slate-300 text-sm"></label>
              <label class="col-span-2">{{ t('Sicherheitspuffer (€)') }}<input v-model.number="c.inputs.monthlySafetyBuffer" type="number" step="50" class="mt-1 w-full rounded-lg border-slate-300 text-sm"></label>
            </div>
            <div class="mt-3 rounded-lg bg-teal-50 p-3 text-sm text-teal-950">
              <div class="flex justify-between"><span>{{ t('Einnahmen inkl. Kaltmiete') }}</span><strong>{{ euro(c.totalHouseholdIncome.value) }}</strong></div>
              <div class="flex justify-between"><span>{{ t('Tragbare eigene Rate') }}</span><strong>{{ euro(c.availableOwnRate.value) }}</strong></div>
              <div class="mt-1 flex justify-between"><span>{{ t('Aktuell geplante Nettorate') }}</span><strong>{{ euro(c.activeScenario.value.netMonthly) }}</strong></div>
              <div class="mt-1 flex justify-between text-amber-800"><span>{{ t('Bank-Sicht nach Mietabschlag') }}</span><strong>{{ euro(c.bankNetMonthly.value) }}</strong></div>
              <div class="mt-1 flex justify-between"><span>{{ t('Rate / Nettoeinkommen') }}</span><strong>{{ c.housingCostRatio.value === null ? '–' : c.formatPercent(c.housingCostRatio.value * 100) }}</strong></div>
              <div class="mt-2 flex justify-between border-t border-teal-200 pt-2" :class="c.monthlySurplus.value < 0 ? 'text-red-700' : 'text-teal-800'"><span>{{ t(c.monthlySurplus.value < 0 ? 'Monatliche Unterdeckung' : 'Verbleibender Puffer') }}</span><strong>{{ euro(Math.abs(c.monthlySurplus.value)) }}</strong></div>
              <button type="button" class="mt-3 w-full rounded-lg bg-teal-800 px-3 py-2 text-xs font-bold text-white hover:bg-teal-700" @click="c.applyAffordableRate">{{ t('Als Zielrate übernehmen') }}</button>
            </div>
          </section>

          <section v-show="activeInput === 'household'" class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 class="font-bold">{{ t('Haushalt & Wohnfläche') }}</h2>
            <div class="mt-3 grid grid-cols-2 gap-3">
              <label v-for="field in [['grossArea','Bruttofläche m²'],['utilityArea','Keller/Nutzfläche m²'],['buyers','Käufer'],['children','Kinder']]" :key="field[0]" class="text-xs font-semibold text-slate-600">{{ t(field[1]) }}<input v-model.number="c.inputs[field[0]]" type="number" class="mt-1 w-full rounded-lg border-slate-300 text-sm"></label>
            </div>
            <div class="mt-3 rounded-lg p-3" :class="c.wiBankAreaEligible.value ? 'bg-teal-50 text-teal-900' : 'bg-red-50 text-red-900'">
              <div class="flex justify-between text-sm font-bold"><span>{{ t('WoFlV-Fläche') }}</span><span>{{ c.netLivingArea.value }} m²</span></div>
              <p v-if="c.wiBankAreaEligible.value" class="mt-1 text-xs">{{ Math.max(0, 200 - c.netLivingArea.value) }} m² {{ t('Noch bis zur Modellgrenze.').toLocaleLowerCase() }}</p>
              <p v-if="!c.wiBankAreaEligible.value" class="mt-1 text-xs font-semibold">{{ t('Gefahr des Förderausschlusses: über 200 m².') }}</p>
              <label v-if="!c.wiBankAreaEligible.value" class="mt-2 flex gap-2 text-xs"><input v-model="c.inputs.wiBankOverride" type="checkbox"> {{ t('Einzelfallprüfung / Dispenzantrag annehmen') }}</label>
            </div>
            <div class="mt-3 grid grid-cols-2 gap-3"><label class="text-xs font-semibold text-slate-600">{{ t('Eigenkapital (€)') }}<input v-model.number="c.inputs.equity" type="number" step="5000" class="mt-1 w-full rounded-lg border-slate-300 text-sm"></label><label class="text-xs font-semibold text-slate-600">{{ t('Kaltmiete/Monat (€)') }}<input v-model.number="c.inputs.rentalIncome" type="number" step="50" class="mt-1 w-full rounded-lg border-slate-300 text-sm"><span class="mt-1 block font-normal text-amber-700">{{ t('Bank-Ansatz: ca.') }} {{ euro(c.bankRentalIncome.value) }}</span></label><label class="text-xs font-semibold text-slate-600">{{ t('Mietabschlag Bank (%)') }}<input v-model.number="c.inputs.rentalIncomeHaircutPercent" type="number" min="0" max="100" step="5" class="mt-1 w-full rounded-lg border-slate-300 text-sm"><span class="mt-1 block font-normal text-slate-400">{{ t('Modellannahme, bankabhängig') }}</span></label><label class="text-xs font-semibold text-slate-600">{{ t('Aktuelles Alter') }}<input v-model.number="c.inputs.currentAge" type="number" min="18" max="90" class="mt-1 w-full rounded-lg border-slate-300 text-sm"></label><label class="text-xs font-semibold text-slate-600">{{ t('Diagramm (Jahre)') }}<select v-model.number="c.inputs.chartYears" class="mt-1 w-full rounded-lg border-slate-300 text-sm"><option v-for="n in [10, 20, 30, 40, 50]" :key="n" :value="n">{{ n }}</option></select></label></div>
          </section>

          <section v-show="activeInput === 'loans'" class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 class="font-bold">{{ t('Darlehen & Zielrate') }}</h2>
            <div class="mt-3 space-y-3 text-xs">
              <div class="rounded-lg border border-slate-200 p-3"><p class="mb-2 font-bold">{{ t('Hauptbank') }}</p><div class="grid grid-cols-2 gap-2"><label>{{ t('Zins %') }}<input v-model.number="c.inputs.mainBankInterest" type="number" step="0.1" class="mt-1 w-full rounded border-slate-300"></label><label>{{ t('Laufzeit (J.)') }}<input v-model.number="c.inputs.mainBankTerm" type="number" min="1" max="50" class="mt-1 w-full rounded border-slate-300"></label></div></div>
              <div class="rounded-lg border border-slate-200 p-3"><label class="flex justify-between font-bold">{{ t('WI Bank Hessen') }}<input v-model="c.inputs.wiBankEnabled" :disabled="!c.wiBankEligible.value" type="checkbox" class="rounded text-teal-700"></label><div v-if="c.inputs.wiBankEnabled" class="mt-2 grid grid-cols-3 gap-2"><label>{{ t('Betrag €') }}<input v-model.number="c.inputs.wiBankAmount" type="number" step="5000" class="mt-1 w-full rounded border-slate-300"></label><label>{{ t('Zins %') }}<input v-model.number="c.inputs.wiBankInterest" type="number" step="0.1" class="mt-1 w-full rounded border-slate-300"></label><label>{{ t('Laufzeit J.') }}<input v-model.number="c.inputs.wiBankTerm" type="number" min="1" max="50" class="mt-1 w-full rounded border-slate-300"></label></div></div>
              <div class="rounded-lg border border-slate-200 p-3"><label class="flex justify-between font-bold">KfW 124<input v-model="c.inputs.kfwEnabled" type="checkbox" class="rounded text-teal-700"></label><div v-if="c.inputs.kfwEnabled" class="mt-2 grid grid-cols-2 gap-2"><label>{{ t('Betrag €') }}<input v-model.number="c.inputs.kfwAmount" type="number" step="5000" class="mt-1 w-full rounded border-slate-300"></label><label>{{ t('Zins %') }}<input v-model.number="c.inputs.kfwInterest" type="number" step="0.1" class="mt-1 w-full rounded border-slate-300"></label><label>{{ t('Laufzeit J.') }}<input v-model.number="c.inputs.kfwTerm" type="number" min="1" max="50" class="mt-1 w-full rounded border-slate-300"></label><label>{{ t('Tilgungsfrei J.') }}<select v-model.number="c.inputs.kfwInterestOnlyYears" class="mt-1 w-full rounded border-slate-300"><option v-for="n in [0,1,2,3]" :key="n" :value="n">{{ n }}</option></select></label></div></div>
              <div class="rounded-lg border border-slate-200 p-3"><label class="flex justify-between font-bold">{{ t('Arbeitgeberdarlehen') }}<input v-model="c.inputs.employerEnabled" type="checkbox" class="rounded text-teal-700"></label><div v-if="c.inputs.employerEnabled" class="mt-2 grid grid-cols-2 gap-2"><label>{{ t('Betrag €') }}<input v-model.number="c.inputs.employerAmount" type="number" step="5000" class="mt-1 w-full rounded border-slate-300"></label><label>{{ t('Zins %') }}<input v-model.number="c.inputs.employerInterest" type="number" step="0.1" class="mt-1 w-full rounded border-slate-300"></label><label>{{ t('Monatsrate €') }}<input v-model.number="c.inputs.employerPayment" :disabled="c.inputs.employerBalloon" type="number" step="10" class="mt-1 w-full rounded border-slate-300 disabled:opacity-50"></label><label>{{ t('Laufzeit J.') }}<input v-model.number="c.inputs.employerTerm" type="number" min="1" max="50" class="mt-1 w-full rounded border-slate-300"></label><label class="col-span-2 flex items-center justify-between">{{ t('Endfällige Tilgung') }}<input v-model="c.inputs.employerBalloon" type="checkbox" class="rounded text-teal-700"></label></div></div>
            </div>
            <div class="mt-3 rounded-lg bg-slate-900 p-3 text-white"><label class="flex items-center justify-between text-sm font-bold">{{ t('Zielrate zur schnelleren Tilgung verwenden') }}<input v-model="c.inputs.useTargetRate" type="checkbox" class="rounded text-teal-600"></label><label class="mt-3 block text-xs text-slate-300">{{ t('Eigene Rate netto/Monat (€)') }}<input v-model.number="c.inputs.targetMonthlyRate" :disabled="!c.inputs.useTargetRate" type="number" step="50" class="mt-1 w-full rounded border-slate-600 bg-slate-800 text-white disabled:opacity-50"></label><p class="mt-2 text-xs text-slate-300">{{ t('Gesamtzahlung inkl. Miete:') }} <strong class="text-white">{{ c.formatCurrency(Number(c.inputs.targetMonthlyRate) + Number(c.inputs.rentalIncome)) }}</strong></p><p class="mt-1 font-bold" :class="c.targetProjection.value.feasible ? 'text-teal-300' : 'text-red-300'">{{ c.targetProjection.value.feasible ? `${years(c.targetProjection.value.months)} · ${c.targetProjection.value.year}` : t('Rate deckt die Zinsen nicht') }}</p></div>
          </section>
        </aside>

        <div class="space-y-5">
          <section v-if="!c.wiBankAreaEligible.value" class="rounded-xl border-2 border-red-300 bg-red-50 p-4 text-red-900"><strong>{{ t('Förderhinweis:') }}</strong> {{ t('Die errechnete WoFlV-Fläche überschreitet 200 m². Das WI-Bank-Darlehen wird deaktiviert, solange keine Einzelfallprüfung angenommen wird.') }}</section>
          <section class="print-avoid rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><p class="text-xs font-semibold uppercase tracking-wide text-slate-500">{{ t('Aktive Finanzierung') }}</p><h2 class="text-lg font-bold">{{ t('Darlehensaufteilung') }}</h2></div><div class="text-right text-sm text-slate-500"><p>{{ t('Hessengeld') }}: {{ euro(c.hessenGrant.value) }} · {{ euro(c.hessenAnnual.value) }}/{{ t('Jahr') }}</p><p v-if="c.hessenRouting.value.length" class="mt-1 text-xs font-semibold text-teal-700">{{ t('Sondertilgung zuerst:') }} {{ c.hessenRouting.value[0][0] }} ({{ t('höchster aktiver Zins') }})</p></div></div>
            <div class="mt-4 overflow-x-auto"><table class="w-full text-sm"><thead class="border-b text-left text-xs uppercase text-slate-500"><tr><th class="py-2">{{ t('Baustein') }}</th><th class="text-right">{{ t('Betrag') }}</th><th class="text-right">{{ t('Zins') }}</th><th class="text-right">{{ t('Mindestrate') }}</th></tr></thead><tbody><tr v-for="loan in c.activeScenario.value.loans" :key="loan.name" class="border-b border-slate-100"><td class="py-3 font-semibold">{{ t(loan.name) }}</td><td class="text-right">{{ euro(loan.principal) }}</td><td class="text-right">{{ c.formatPercent(loan.rate) }}</td><td class="text-right font-semibold">{{ euro(loan.payment) }}</td></tr></tbody><tfoot><tr class="font-bold"><td class="pt-3">{{ t('Fremdkapital gesamt') }}</td><td class="pt-3 text-right">{{ euro(c.activeScenario.value.debt) }}</td><td class="pt-3 text-right text-slate-500">{{ t('Mindestrate') }}</td><td class="pt-3 text-right">{{ euro(c.activeScenario.value.contractualMonthly) }}</td></tr><tr v-if="c.inputs.useTargetRate" class="font-bold text-teal-800"><td class="pt-2" colspan="3">{{ t('Geplante Gesamtzahlung inkl. Miete') }}</td><td class="pt-2 text-right">{{ euro(c.activeScenario.value.grossMonthly) }}</td></tr></tfoot></table></div>
          </section>

          <section class="print-avoid rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div class="flex flex-col gap-3 border-b border-slate-200 pb-3 sm:flex-row sm:items-end sm:justify-between">
              <div><h2 class="font-bold">{{ t('Finanzierungsverlauf') }}</h2><p class="mt-1 text-xs text-slate-500">{{ t('Alle Diagramme reagieren direkt auf deine Eingaben.') }}</p></div>
              <div class="inline-flex rounded-lg bg-slate-100 p-1 text-sm font-semibold" role="tablist" aria-label="Finanzierungsdiagramme">
                <button type="button" role="tab" :aria-selected="activeChart === 'payments'" class="rounded-md px-3 py-2 transition" :class="activeChart === 'payments' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-800'" @click="activeChart = 'payments'">{{ t('Zins & Tilgung') }}</button>
                <button type="button" role="tab" :aria-selected="activeChart === 'debt'" class="rounded-md px-3 py-2 transition" :class="activeChart === 'debt' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-800'" @click="activeChart = 'debt'">{{ t('Restschuld') }}</button>
              </div>
            </div>
            <div v-show="activeChart === 'payments'" role="tabpanel"><div class="mt-4 flex justify-between"><p class="text-sm font-semibold">{{ t('Zins- und Tilgungsverlauf') }}</p><span class="text-xs text-slate-500">{{ c.inputs.chartYears }} {{ t('Jahre') }}</span></div><AmortizationChart class="mt-3" :rows="c.annualChart.value" :locale="languagePreference" /></div>
            <div v-show="activeChart === 'debt'" role="tabpanel"><div class="mt-4 flex justify-between"><p class="text-sm font-semibold">{{ t('Restschuldverlauf') }}</p><strong class="text-sm text-teal-800">{{ t('Schuldenfrei in') }} {{ years(c.activeScenario.value.schedule.paidOffMonth) }}</strong></div><DebtBalanceChart class="mt-3" :rows="c.debtChart.value" :locale="languagePreference" /></div>
          </section>

          <section class="print-full grid gap-4 lg:grid-cols-3">
            <article v-for="scenario in [
              ['A · Mit WI Bank', c.scenarioWithWi.value, 'border-teal-300'],
              ['B · Ohne WI Bank', c.scenarioWithoutWi.value, 'border-amber-300'],
              [c.inputs.renovationEnabled ? 'C · Null-Sanierung' : 'C · Mit Sanierung', c.inputs.renovationEnabled ? c.scenarioNoRenovation.value : c.scenarioRenovated.value, 'border-slate-300']
            ]" :key="scenario[0]" class="print-avoid rounded-xl border-t-4 bg-white p-4 shadow-sm" :class="scenario[2]">
              <p class="text-xs font-bold uppercase text-slate-500">{{ t(scenario[0]) }}</p><p class="mt-2 text-2xl font-bold">{{ euro(scenario[1].netMonthly) }} <span class="text-xs font-normal text-slate-500">{{ t('netto/Monat') }}</span></p>
              <dl class="mt-3 space-y-1 text-sm"><div class="flex justify-between"><dt>{{ t('Kapitalbedarf') }}</dt><dd class="font-semibold">{{ euro(scenario[1].required) }}</dd></div><div class="flex justify-between"><dt>{{ t('Hauptbank') }}</dt><dd class="font-semibold">{{ euro(scenario[1].bank) }}</dd></div><div class="flex justify-between"><dt>{{ t('Zinsen gesamt') }}</dt><dd class="font-semibold">{{ euro(scenario[1].schedule.totalInterest) }}</dd></div><div class="flex justify-between"><dt>{{ t('Laufzeit') }}</dt><dd class="font-semibold">{{ years(scenario[1].schedule.paidOffMonth) }}</dd></div><div v-if="scenario[0].includes('WI Bank')" class="flex justify-between border-t pt-1"><dt>{{ t('Bei Zielrate') }}</dt><dd class="font-semibold">{{ years(scenario[0].startsWith('A') ? c.targetWithWi.value.months : c.targetWithoutWi.value.months) }}</dd></div></dl>
            </article>
          </section>
          <p class="text-xs text-slate-500">{{ t('Unverbindliche Modellrechnung, keine Förderzusage oder Finanzberatung. Konditionen, Förderfähigkeit, Sondertilgungsrechte und WoFlV-Berechnung vor Antragstellung mit Förderinstitut und Bank prüfen.') }}</p>
        </div>
      </div>
    </main>
    <FinancingWizard v-if="wizardOpen" :calculator="c" :language="languagePreference" @close="wizardOpen = false" />
    <ProfileManager v-if="profilesOpen" :inputs="c.inputs" :language="languagePreference" @close="profilesOpen = false" />
  </div>
</template>
