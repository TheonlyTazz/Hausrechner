import { onMounted, ref, watch } from 'vue';

const PREFIX = '#profile=';
const encode = value => btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(value))));
const decode = value => JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(value), character => character.charCodeAt(0))));
export const buildSharePayload = (inputs, defaults) => ({ version: 1, values: Object.fromEntries(Object.entries(inputs).filter(([key, value]) => value !== defaults[key])) });

export function useShareableState(inputs, defaults, language = { value: 'de' }) {
  const shareMessage = ref('');
  const allowed = new Set(Object.keys(inputs));
  let ready = false;
  const clean = data => Object.fromEntries(Object.entries(data || {}).filter(([key, value]) => allowed.has(key) && ['number', 'boolean', 'string'].includes(typeof value)));
  const text = (de, en) => language.value === 'en' ? en : de;
  const syncUrl = () => history.replaceState(null, '', `${location.pathname}${location.search}${PREFIX}${encode(buildSharePayload(clean({ ...inputs }), defaults))}`);

  onMounted(() => {
    if (location.hash.startsWith(PREFIX)) {
      try {
        const payload = decode(location.hash.slice(PREFIX.length));
        Object.assign(inputs, clean(payload?.values || payload));
        shareMessage.value = text('Geteilte Berechnung wurde geladen.', 'Shared calculation loaded.');
      } catch {
        shareMessage.value = text('Der geteilte Link ist ungültig.', 'The shared link is invalid.');
      }
    }
    ready = true;
    syncUrl();
  });
  watch(inputs, () => { if (ready) syncUrl(); }, { deep: true, flush: 'post' });
  const copyShareLink = async () => {
    syncUrl();
    try {
      await navigator.clipboard.writeText(location.href);
      shareMessage.value = text('Link wurde kopiert.', 'Link copied.');
    } catch {
      window.prompt('Link kopieren:', location.href);
      shareMessage.value = text('Link ist bereit zum Kopieren.', 'The link is ready to copy.');
    }
    window.setTimeout(() => { shareMessage.value = ''; }, 2500);
  };
  return { shareMessage, copyShareLink };
}
