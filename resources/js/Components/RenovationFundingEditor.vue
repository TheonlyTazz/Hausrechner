<script setup>
import { computed } from 'vue';
import { FUNDING_PRESETS, createFunding } from '../Composables/renovationFunding.ts';
import { translate } from '../Composables/useUiPreferences';
import CurrencyInput from './CurrencyInput.vue';

const props = defineProps({ calculator: { type: Object, required: true }, language: { type: String, default: 'de' } });
const c = props.calculator;
const t = key => translate(props.language, key);
const items = computed(() => c.inputs.renovationFunding);
const resolved = id => c.renovationFunding.value.find(item => item.id === id);
const add = preset => {
  if (['bafa', 'kfw358'].includes(preset) && items.value.some(item => item.preset === preset)) return;
  c.inputs.renovationFunding.push(createFunding(preset));
};
const remove = index => { c.inputs.renovationFunding.splice(index, 1); };
</script>

<template>
  <section class="mt-4 rounded-xl border border-indigo-200 bg-indigo-50/60 p-3">
    <div><p class="text-xs font-bold uppercase tracking-wide text-indigo-700">{{ t('Förderungen & Zusatzkredite') }}</p><p class="mt-1 text-xs text-slate-500">{{ t('Konditionen sind Modellannahmen und müssen beim Förderinstitut geprüft werden.') }}</p></div>
    <p class="mt-2 rounded-lg bg-white p-2 text-[11px] text-slate-600">{{ t('KfW 124 kann im Darlehen-Tab unabhängig von einer Sanierung aktiviert werden. KfW 358/359 setzt grundsätzlich eine Zuschusszusage für energetische Einzelmaßnahmen voraus.') }}</p>
    <p v-if="!c.inputs.renovationEnabled && items.some(item => item.kind === 'grant')" class="mt-2 rounded-lg bg-amber-50 p-2 text-[11px] font-semibold text-amber-800">{{ t('Einmalzuschüsse werden erst bei aktivierter Sanierung vom Sanierungsbudget abgezogen. Förderkredite bleiben aktiv.') }}</p>
    <div class="mt-3 flex flex-wrap gap-2">
      <button v-for="preset in FUNDING_PRESETS" :key="preset.key" type="button" class="rounded-lg border border-indigo-200 bg-white px-2.5 py-2 text-left text-[11px] font-bold text-indigo-900 hover:bg-indigo-100" @click="add(preset.key)">＋ {{ preset.name }}</button>
      <button type="button" class="rounded-lg bg-indigo-700 px-3 py-2 text-[11px] font-bold text-white hover:bg-indigo-600" @click="add('')">＋ {{ t('Eigene Förderung') }}</button>
    </div>

    <div v-if="items.length" class="mt-3 space-y-3">
      <article v-for="(item, index) in items" :key="item.id" class="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
        <div class="flex items-start gap-2"><label class="min-w-0 flex-1 text-xs font-semibold text-slate-600">{{ t('Typ / Name') }}<input v-model.trim="item.name" maxlength="80" class="mt-1 w-full rounded-lg border-slate-300 text-sm"></label><button type="button" class="mt-5 rounded-lg px-2 py-1 text-lg text-red-600 hover:bg-red-50" :aria-label="t('Förderung entfernen')" @click="remove(index)">×</button></div>
        <div class="mt-2 grid grid-cols-2 gap-2 text-xs font-semibold text-slate-600">
          <label>{{ t('Art der Förderung') }}<select v-model="item.kind" class="mt-1 w-full rounded-lg border-slate-300 text-sm"><option value="credit">{{ t('Kredit') }}</option><option value="grant">{{ t('Einmalzuschuss') }}</option></select></label>
          <label>{{ t(item.kind === 'credit' ? 'Kreditsumme (€)' : 'Zuschussbetrag (€)') }}
            <span v-if="item.autoCalculate && ['bafa', 'kfw358'].includes(item.preset)" class="mt-1 block rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-800">{{ c.formatCurrency(resolved(item.id)?.amount || 0) }}</span>
            <CurrencyInput v-else v-model="item.amount" class="mt-1 w-full rounded-lg border-slate-300 text-sm" />
          </label>
          <label v-if="['bafa', 'kfw358'].includes(item.preset)" class="col-span-2 flex items-center justify-between rounded-lg bg-slate-50 p-2">{{ t('Automatisch aus den Sanierungskosten berechnen') }}<input v-model="item.autoCalculate" type="checkbox" class="rounded text-emerald-700"></label>
          <template v-if="item.preset === 'bafa' && item.autoCalculate">
            <label class="col-span-2 flex items-center justify-between rounded-lg bg-slate-50 p-2">{{ t('Individueller Sanierungsfahrplan (iSFP) vorhanden') }}<input v-model="item.isfp" type="checkbox" class="rounded text-emerald-700"></label>
            <label v-if="item.isfp" class="col-span-2">{{ t('BAFA-Regelstand') }}<select v-model="item.bafaRuleSet" class="mt-1 w-full rounded-lg border-slate-300 text-sm"><option value="current-2026">{{ t('Aktuell ab 21.07.2026') }}</option><option value="legacy-before-2026-07-21">{{ t('Altregel für Zusage vor 21.07.2026') }}</option></select></label>
            <p class="col-span-2 rounded-lg bg-amber-50 p-2 text-[11px] font-normal text-amber-900">{{ item.bafaRuleSet === 'current-2026' && item.isfp ? t('Aktuell: 15 % bis 60.000 €, plus 5 % iSFP-Bonus nur für den Anteil über 30.000 €.') : t(item.isfp ? 'Altregel: 20 % bis 60.000 €.' : '15 % bis maximal 30.000 € förderfähige Kosten.') }}</p>
          </template>
          <p v-if="item.preset === 'kfw358' && item.autoCalculate" class="col-span-2 rounded-lg bg-amber-50 p-2 text-[11px] font-normal text-amber-900">{{ t('Modellmaximum: Sanierungskosten minus Zuschüsse, höchstens 120.000 €. Maßgeblich sind Förderzusage und förderfähige Kosten im Bescheid.') }}</p>
          <template v-if="item.kind === 'credit'">
            <label>{{ t('Sollzins p.a. (%)') }}<input v-model.number="item.interestRate" type="number" min="0" max="30" step="0.01" class="mt-1 w-full rounded-lg border-slate-300 text-sm"></label>
            <label>{{ t('Laufzeit (Jahre)') }}<input v-model.number="item.termYears" type="number" min="1" max="50" class="mt-1 w-full rounded-lg border-slate-300 text-sm"></label>
            <label class="col-span-2">{{ t('Tilgungsfreie Anlaufjahre') }}<input v-model.number="item.interestOnlyYears" type="number" min="0" :max="Math.max(0, Number(item.termYears) - 1)" class="mt-1 w-full rounded-lg border-slate-300 text-sm"></label>
          </template>
        </div>
      </article>
    </div>
    <p v-else class="mt-3 rounded-lg border border-dashed border-indigo-200 p-3 text-center text-xs text-slate-500">{{ t('Noch keine Förderung hinzugefügt.') }}</p>
    <div v-if="items.length" class="mt-3 grid grid-cols-2 gap-2 text-xs"><div class="rounded-lg bg-white p-2"><span class="text-slate-500">{{ t('Zuschüsse gesamt') }}</span><strong class="block text-emerald-700">{{ c.formatCurrency(c.euros(c.renovationGrantTotal.value)) }}</strong></div><div class="rounded-lg bg-white p-2"><span class="text-slate-500">{{ t('Förderkredite geplant') }}</span><strong class="block text-indigo-800">{{ c.formatCurrency(c.renovationLoans.value.reduce((sum, item) => sum + Number(item.amount || 0), 0)) }}</strong></div></div>
  </section>
</template>
