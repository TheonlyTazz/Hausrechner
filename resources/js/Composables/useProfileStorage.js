import { ref } from 'vue';
import { sanitizeFundingList } from './renovationFunding.ts';

const STORAGE_KEY = 'hausrechner-profiles-v1';

export function useProfileStorage(inputs, language = { value: 'de' }) {
  const profiles = ref([]);
  const message = ref('');
  const allowedKeys = new Set(Object.keys(inputs));
  const text = (de, en) => language.value === 'en' ? en : de;

  const sanitizeInputs = data => Object.fromEntries(Object.entries(data || {}).flatMap(([key, value]) => {
    if (!allowedKeys.has(key)) return [];
    if (key === 'renovationFunding') return [[key, sanitizeFundingList(value)]];
    return ['string', 'number', 'boolean'].includes(typeof value) ? [[key, value]] : [];
  }));
  const persist = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles.value));
  const refresh = () => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      profiles.value = Array.isArray(stored) ? stored.filter(profile => profile?.id && profile?.name && profile?.data) : [];
    } catch {
      profiles.value = [];
      message.value = text('Gespeicherte Profile konnten nicht gelesen werden.', 'Saved profiles could not be read.');
    }
  };
  const save = name => {
    const cleanName = String(name || '').trim().slice(0, 60);
    if (!cleanName) throw new Error(text('Bitte einen Profilnamen eingeben.', 'Please enter a profile name.'));
    const existing = profiles.value.find(profile => profile.name.toLocaleLowerCase() === cleanName.toLocaleLowerCase());
    const profile = {
      id: existing?.id || crypto.randomUUID(),
      name: cleanName,
      updatedAt: new Date().toISOString(),
      data: sanitizeInputs({ ...inputs }),
    };
    profiles.value = [profile, ...profiles.value.filter(item => item.id !== profile.id)];
    persist();
    message.value = text(`Profil „${cleanName}“ wurde lokal gespeichert.`, `Profile “${cleanName}” was saved locally.`);
  };
  const load = id => {
    const profile = profiles.value.find(item => item.id === id);
    if (!profile) return;
    const data = sanitizeInputs(profile.data);
    if (!Object.hasOwn(data, 'renovationFunding')) data.renovationFunding = [];
    Object.assign(inputs, data);
    message.value = text(`Profil „${profile.name}“ wurde geladen.`, `Profile “${profile.name}” was loaded.`);
  };
  const remove = id => {
    profiles.value = profiles.value.filter(item => item.id !== id);
    persist();
    message.value = text('Profil wurde gelöscht.', 'Profile was deleted.');
  };
  const exportProfile = id => {
    const selected = profiles.value.find(item => item.id === id);
    const payload = selected || { id: crypto.randomUUID(), name: 'Hausrechner', updatedAt: new Date().toISOString(), data: sanitizeInputs({ ...inputs }) };
    const blob = new Blob([JSON.stringify({ format: 'hausrechner-profile', version: 1, profile: payload }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${payload.name.replace(/[^a-z0-9äöüß_-]+/gi, '-') || 'hausrechner'}.json`;
    link.click();
    URL.revokeObjectURL(url);
    message.value = text('Profil wurde exportiert.', 'Profile was exported.');
  };
  const importProfile = async file => {
    if (!file || file.size > 1_000_000) throw new Error(text('Die Profildatei ist ungültig oder zu groß.', 'The profile file is invalid or too large.'));
    const payload = JSON.parse(await file.text());
    if (payload?.format !== 'hausrechner-profile' || payload?.version !== 1 || !payload?.profile?.data) throw new Error(text('Das Dateiformat wird nicht unterstützt.', 'The file format is not supported.'));
    const name = String(payload.profile.name || text('Importiertes Profil', 'Imported profile')).trim().slice(0, 60);
    const profile = { id: crypto.randomUUID(), name, updatedAt: new Date().toISOString(), data: sanitizeInputs(payload.profile.data) };
    if (!Object.keys(profile.data).length) throw new Error(text('Die Datei enthält keine gültigen Rechnerdaten.', 'The file contains no valid calculator data.'));
    profiles.value = [profile, ...profiles.value];
    persist();
    load(profile.id);
    message.value = text(`Profil „${name}“ wurde importiert und geladen.`, `Profile “${name}” was imported and loaded.`);
  };

  refresh();
  return { profiles, message, save, load, remove, exportProfile, importProfile };
}
