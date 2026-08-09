<script setup>
import { ref, toRef } from 'vue';
import { useProfileStorage } from '../Composables/useProfileStorage';
import { translate } from '../Composables/useUiPreferences';

const props = defineProps({ inputs: { type: Object, required: true }, language: { type: String, default: 'de' } });
const emit = defineEmits(['close']);
const name = ref('');
const fileInput = ref(null);
const store = useProfileStorage(props.inputs, toRef(props, 'language'));
const t = key => translate(props.language, key);

const save = () => {
  try { store.save(name.value); name.value = ''; } catch (error) { store.message.value = error.message; }
};
const importFile = async event => {
  try { await store.importProfile(event.target.files?.[0]); } catch (error) { store.message.value = error.message; }
  event.target.value = '';
};
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4" role="dialog" aria-modal="true" aria-labelledby="profiles-title" @click.self="emit('close')">
    <div class="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-7">
      <div class="flex items-start justify-between"><div><p class="text-xs font-bold uppercase tracking-wider text-teal-700">{{ t('Nur in diesem Browser') }}</p><h2 id="profiles-title" class="mt-1 text-xl font-bold">{{ t('Profile importieren & exportieren') }}</h2><p class="mt-1 text-sm text-slate-500">{{ t('Profile werden lokal gespeichert und nicht an einen Server übertragen.') }}</p></div><button type="button" class="rounded-lg p-2 text-2xl leading-none text-slate-400 hover:bg-slate-100" aria-label="Profile schließen" @click="emit('close')">×</button></div>

      <form class="mt-6 flex gap-2" @submit.prevent="save"><input v-model="name" type="text" maxlength="60" placeholder="Profilname, z. B. Haus A" class="min-w-0 flex-1 rounded-lg border-slate-300"><button class="rounded-lg bg-teal-700 px-4 py-2 text-sm font-bold text-white" type="submit">{{ t('Aktuelle Daten speichern') }}</button></form>
      <p v-if="store.message.value" class="mt-3 rounded-lg bg-slate-100 p-3 text-sm">{{ store.message.value }}</p>

      <div class="mt-6 space-y-2">
        <div v-if="!store.profiles.value.length" class="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">{{ t('Noch keine lokalen Profile gespeichert.') }}</div>
        <article v-for="profile in store.profiles.value" :key="profile.id" class="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"><div><strong>{{ profile.name }}</strong><p class="mt-1 text-xs text-slate-500">{{ new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(profile.updatedAt)) }}</p></div><div class="flex flex-wrap gap-2"><button type="button" class="rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white" @click="store.load(profile.id)">{{ t('Laden') }}</button><button type="button" class="rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold" @click="store.exportProfile(profile.id)">{{ t('Export') }}</button><button type="button" class="rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-700" @click="store.remove(profile.id)">{{ t('Löschen') }}</button></div></article>
      </div>

      <div class="mt-6 flex flex-col gap-2 border-t border-slate-200 pt-5 sm:flex-row"><input ref="fileInput" type="file" accept="application/json,.json" class="hidden" @change="importFile"><button type="button" class="rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold" @click="fileInput.click()">{{ t('JSON-Profil importieren') }}</button><button type="button" class="rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold" @click="store.exportProfile()">{{ t('Aktuelle Daten direkt exportieren') }}</button></div>
    </div>
  </div>
</template>
