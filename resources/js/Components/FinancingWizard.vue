<script setup>
import { ref } from 'vue';

const props = defineProps({ calculator: { type: Object, required: true } });
const emit = defineEmits(['close']);
const step = ref(0);
const steps = ['Objekt', 'Einkommen', 'Haushalt', 'Darlehen'];
const c = props.calculator;
const finish = () => {
  c.applyAffordableRate();
  emit('close');
};
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4" role="dialog" aria-modal="true" aria-labelledby="wizard-title" @click.self="emit('close')">
    <div class="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
      <header class="sticky top-0 z-10 border-b border-slate-200 bg-white px-5 py-4 sm:px-7">
        <div class="flex items-start justify-between"><div><p class="text-xs font-bold uppercase tracking-wider text-teal-700">Schritt {{ step + 1 }} von {{ steps.length }}</p><h2 id="wizard-title" class="mt-1 text-xl font-bold">Finanzierung einrichten</h2></div><button type="button" class="rounded-lg p-2 text-2xl leading-none text-slate-400 hover:bg-slate-100 hover:text-slate-800" aria-label="Wizard schließen" @click="emit('close')">×</button></div>
        <div class="mt-4 grid grid-cols-4 gap-2"><button v-for="(name, index) in steps" :key="name" type="button" class="rounded-lg px-2 py-2 text-xs font-bold" :class="index === step ? 'bg-teal-700 text-white' : index < step ? 'bg-teal-50 text-teal-800' : 'bg-slate-100 text-slate-500'" @click="step = index">{{ name }}</button></div>
      </header>

      <div class="p-5 sm:p-7">
        <section v-if="step === 0">
          <h3 class="text-lg font-bold">Objekt und Kaufkosten</h3><p class="mt-1 text-sm text-slate-500">Kaufpreis, Nebenkosten und geplante Sanierung.</p>
          <div class="mt-5 grid gap-4 sm:grid-cols-2"><label class="sm:col-span-2">Kaufpreis (€)<input v-model.number="c.inputs.purchasePrice" type="number" step="5000" class="mt-1 w-full rounded-lg border-slate-300"></label><label>Grunderwerbsteuer (%)<input v-model.number="c.inputs.transferTaxPercent" type="number" step="0.1" class="mt-1 w-full rounded-lg border-slate-300"></label><label>Notar (%)<input v-model.number="c.inputs.notaryPercent" type="number" step="0.1" class="mt-1 w-full rounded-lg border-slate-300"></label><label>Makler (%)<input v-model.number="c.inputs.brokerPercent" type="number" step="0.01" class="mt-1 w-full rounded-lg border-slate-300"></label><label class="flex items-center justify-between rounded-lg bg-slate-100 p-3">Sanierung einplanen<input v-model="c.inputs.renovationEnabled" type="checkbox" class="rounded text-teal-700"></label><label v-if="c.inputs.renovationEnabled" class="sm:col-span-2">Sanierungsbudget (€)<input v-model.number="c.inputs.renovationBudget" type="number" step="5000" class="mt-1 w-full rounded-lg border-slate-300"></label></div>
        </section>

        <section v-else-if="step === 1">
          <h3 class="text-lg font-bold">Einkommen und Ausgaben</h3><p class="mt-1 text-sm text-slate-500">Aus diesen Angaben wird die tragbare eigene Rate berechnet.</p>
          <div class="mt-5 grid gap-4 sm:grid-cols-2"><label>Haushaltsnetto (€)<input v-model.number="c.inputs.householdNetIncome" type="number" step="100" class="mt-1 w-full rounded-lg border-slate-300"></label><label>Sonstige Einnahmen (€)<input v-model.number="c.inputs.otherMonthlyIncome" type="number" step="50" class="mt-1 w-full rounded-lg border-slate-300"></label><label>Lebenshaltung (€)<input v-model.number="c.inputs.livingCosts" type="number" step="100" class="mt-1 w-full rounded-lg border-slate-300"></label><label>Andere Verpflichtungen (€)<input v-model.number="c.inputs.otherCommitments" type="number" step="50" class="mt-1 w-full rounded-lg border-slate-300"></label><label>Sicherheitspuffer (€)<input v-model.number="c.inputs.monthlySafetyBuffer" type="number" step="50" class="mt-1 w-full rounded-lg border-slate-300"></label><label>Kaltmiete (€)<input v-model.number="c.inputs.rentalIncome" type="number" step="50" class="mt-1 w-full rounded-lg border-slate-300"></label></div>
          <div class="mt-5 rounded-xl bg-teal-50 p-4 text-teal-950"><span class="text-sm">Tragbare eigene Rate</span><strong class="block text-2xl">{{ c.formatCurrency(c.euros(c.availableOwnRate.value)) }}</strong></div>
        </section>

        <section v-else-if="step === 2">
          <h3 class="text-lg font-bold">Haushalt und Wohnfläche</h3><p class="mt-1 text-sm text-slate-500">Relevant für Hessengeld und die modellierte WI-Bank-Prüfung.</p>
          <div class="mt-5 grid gap-4 sm:grid-cols-2"><label>Käufer<input v-model.number="c.inputs.buyers" type="number" min="1" class="mt-1 w-full rounded-lg border-slate-300"></label><label>Kinder<input v-model.number="c.inputs.children" type="number" min="0" class="mt-1 w-full rounded-lg border-slate-300"></label><label>Bruttofläche (m²)<input v-model.number="c.inputs.grossArea" type="number" class="mt-1 w-full rounded-lg border-slate-300"></label><label>Keller/Nutzfläche (m²)<input v-model.number="c.inputs.utilityArea" type="number" class="mt-1 w-full rounded-lg border-slate-300"></label><label>Eigenkapital (€)<input v-model.number="c.inputs.equity" type="number" step="5000" class="mt-1 w-full rounded-lg border-slate-300"></label><label>Aktuelles Alter<input v-model.number="c.inputs.currentAge" type="number" min="18" max="90" class="mt-1 w-full rounded-lg border-slate-300"></label></div>
          <div class="mt-5 rounded-xl p-4" :class="c.wiBankAreaEligible.value ? 'bg-teal-50 text-teal-900' : 'bg-red-50 text-red-900'"><div class="flex justify-between font-bold"><span>WoFlV-Fläche</span><span>{{ c.netLivingArea.value }} m²</span></div><p class="mt-1 text-sm">{{ c.wiBankAreaEligible.value ? 'Unter der Modellgrenze von 200 m².' : 'WI Bank wird ohne Einzelfallprüfung deaktiviert.' }}</p></div>
        </section>

        <section v-else>
          <h3 class="text-lg font-bold">Darlehen und Zielrate</h3><p class="mt-1 text-sm text-slate-500">Die Details können anschließend im Darlehen-Tab weiter verfeinert werden.</p>
          <div class="mt-5 space-y-4"><div class="grid gap-4 sm:grid-cols-2"><label>Hauptbank-Zins (%)<input v-model.number="c.inputs.mainBankInterest" type="number" step="0.1" class="mt-1 w-full rounded-lg border-slate-300"></label><label>Hauptbank-Laufzeit (Jahre)<input v-model.number="c.inputs.mainBankTerm" type="number" min="1" max="50" class="mt-1 w-full rounded-lg border-slate-300"></label></div><label class="flex items-center justify-between rounded-lg border p-3 font-semibold">WI Bank Hessen verwenden<input v-model="c.inputs.wiBankEnabled" :disabled="!c.wiBankEligible.value" type="checkbox" class="rounded text-teal-700"></label><label class="flex items-center justify-between rounded-lg border p-3 font-semibold">KfW 124 verwenden<input v-model="c.inputs.kfwEnabled" type="checkbox" class="rounded text-teal-700"></label><label class="flex items-center justify-between rounded-lg border p-3 font-semibold">Arbeitgeberdarlehen verwenden<input v-model="c.inputs.employerEnabled" type="checkbox" class="rounded text-teal-700"></label><label class="block">Eigene Zielrate netto (€)<input v-model.number="c.inputs.targetMonthlyRate" type="number" step="50" class="mt-1 w-full rounded-lg border-slate-300"></label><label class="flex items-center justify-between rounded-lg bg-slate-900 p-4 font-semibold text-white">Zielrate zur schnelleren Tilgung verwenden<input v-model="c.inputs.useTargetRate" type="checkbox" class="rounded text-teal-600"></label></div>
        </section>
      </div>

      <footer class="sticky bottom-0 flex justify-between border-t border-slate-200 bg-white px-5 py-4 sm:px-7"><button type="button" class="rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold disabled:opacity-40" :disabled="step === 0" @click="step--">Zurück</button><button v-if="step < steps.length - 1" type="button" class="rounded-lg bg-slate-900 px-5 py-2 text-sm font-bold text-white" @click="step++">Weiter</button><button v-else type="button" class="rounded-lg bg-teal-700 px-5 py-2 text-sm font-bold text-white" @click="finish">Rate übernehmen & fertig</button></footer>
    </div>
  </div>
</template>
