import { ref } from 'vue';

const STORAGE_KEY = 'hausrechner-profiles-v1';

export function useProfileStorage(inputs) {
  const profiles = ref([]);
  const message = ref('');
  const allowedKeys = new Set(Object.keys(inputs));

  const sanitizeInputs = data => Object.fromEntries(Object.entries(data || {}).filter(([key, value]) =>
    allowedKeys.has(key) && ['string', 'number', 'boolean'].includes(typeof value),
  ));
  const persist = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles.value));
  const refresh = () => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      profiles.value = Array.isArray(stored) ? stored.filter(profile => profile?.id && profile?.name && profile?.data) : [];
    } catch {
      profiles.value = [];
      message.value = 'Gespeicherte Profile konnten nicht gelesen werden.';
    }
  };
  const save = name => {
    const cleanName = String(name || '').trim().slice(0, 60);
    if (!cleanName) throw new Error('Bitte einen Profilnamen eingeben.');
    const existing = profiles.value.find(profile => profile.name.toLocaleLowerCase() === cleanName.toLocaleLowerCase());
    const profile = {
      id: existing?.id || crypto.randomUUID(),
      name: cleanName,
      updatedAt: new Date().toISOString(),
      data: sanitizeInputs({ ...inputs }),
    };
    profiles.value = [profile, ...profiles.value.filter(item => item.id !== profile.id)];
    persist();
    message.value = `Profil „${cleanName}“ wurde lokal gespeichert.`;
  };
  const load = id => {
    const profile = profiles.value.find(item => item.id === id);
    if (!profile) return;
    Object.assign(inputs, sanitizeInputs(profile.data));
    message.value = `Profil „${profile.name}“ wurde geladen.`;
  };
  const remove = id => {
    profiles.value = profiles.value.filter(item => item.id !== id);
    persist();
    message.value = 'Profil wurde gelöscht.';
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
    message.value = 'Profil wurde exportiert.';
  };
  const importProfile = async file => {
    if (!file || file.size > 1_000_000) throw new Error('Die Profildatei ist ungültig oder zu groß.');
    const payload = JSON.parse(await file.text());
    if (payload?.format !== 'hausrechner-profile' || payload?.version !== 1 || !payload?.profile?.data) throw new Error('Das Dateiformat wird nicht unterstützt.');
    const name = String(payload.profile.name || 'Importiertes Profil').trim().slice(0, 60);
    const profile = { id: crypto.randomUUID(), name, updatedAt: new Date().toISOString(), data: sanitizeInputs(payload.profile.data) };
    if (!Object.keys(profile.data).length) throw new Error('Die Datei enthält keine gültigen Rechnerdaten.');
    profiles.value = [profile, ...profiles.value];
    persist();
    load(profile.id);
    message.value = `Profil „${name}“ wurde importiert und geladen.`;
  };

  refresh();
  return { profiles, message, save, load, remove, exportProfile, importProfile };
}
