<script setup>
import { computed } from 'vue';
import { FUNDING_PRESETS, createFunding } from '../Composables/renovationFunding.ts';
import { translate } from '../Composables/useUiPreferences';
import CurrencyInput from './CurrencyInput.vue';

const props = defineProps({ calculator: { type: Object, required: true }, language: { type: String, default: 'de' } });
const c = props.calculator;
const t = key => translate(props.language, key);
const items = computed(() => c.inputs.renovationFunding);
const add = preset => { c.inputs.renovationFunding.push(createFunding(preset)); };
const remove = index => { c.inputs.renovationFunding.splice(index, 1); };
</script>

<template>
  <section class="mt-4 rounded-xl border border-indigo-200 bg-indigo-50/60 p-3">
    <div><p class="text-xs font-bold uppercase tracking-wide text-indigo-700">{{ t('Förderungen & Zusatzkredite') }}</p><p class="mt-1 text-xs text-slate-500">{{ t('Konditionen sind Modellannahmen und müssen beim Förderinstitut geprüft werden.') }}</p></div>
    <div class="mt-3 flex flex-wrap gap-2">
      <button v-for="preset in FUNDING_PRESETS" :key="preset.key" type="button" class="rounded-lg border border-indigo-200 bg-white px-2.5 py-2 text-left text-[11px] font-bold text-indigo-900 hover:bg-indigo-100" @click="add(preset.key)">＋ {{ preset.name }}</button>
      <button type="button" class="rounded-lg bg-indigo-700 px-3 py-2 text-[11px] font-bold text-white hover:bg-indigo-600" @click="add('')">＋ {{ t('Eigene Förderung') }}</button>
    </div>

    <div v-if="items.length" class="mt-3 space-y-3">
      <article v-for="(item, index) in items" :key="item.id" class="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
        <div class="flex items-start gap-2"><label class="min-w-0 flex-1 text-xs font-semibold text-slate-600">{{ t('Typ / Name') }}<input v-model.trim="item.name" maxlength="80" class="mt-1 w-full rounded-lg border-slate-300 text-sm"></label><button type="button" class="mt-5 rounded-lg px-2 py-1 text-lg text-red-600 hover:bg-red-50" :aria-label="t('Förderung entfernen')" @click="remove(index)">×</button></div>
        <div class="mt-2 grid grid-cols-2 gap-2 text-xs font-semibold text-slate-600">
          <label>{{ t('Art der Förderung') }}<select v-model="item.kind" class="mt-1 w-full rounded-lg border-slate-300 text-sm"><option value="credit">{{ t('Kredit') }}</option><option value="grant">{{ t('Einmalzuschuss') }}</option></select></label>
          <label>{{ t(item.kind === 'credit' ? 'Kreditsumme (€)' : 'Zuschussbetrag (€)') }}<CurrencyInput v-model="item.amount" class="mt-1 w-full rounded-lg border-slate-300 text-sm" /></label>
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
