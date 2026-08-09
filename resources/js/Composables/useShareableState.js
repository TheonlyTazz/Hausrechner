import { onMounted, ref, watch } from 'vue';

const PREFIX = '#profile=';
const encode = value => btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(value))));
const decode = value => JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(value), character => character.charCodeAt(0))));

export function useShareableState(inputs) {
  const shareMessage = ref('');
  const allowed = new Set(Object.keys(inputs));
  let ready = false;
  const clean = data => Object.fromEntries(Object.entries(data || {}).filter(([key, value]) => allowed.has(key) && ['number', 'boolean', 'string'].includes(typeof value)));
  const syncUrl = () => history.replaceState(null, '', `${location.pathname}${location.search}${PREFIX}${encode(clean({ ...inputs }))}`);

  onMounted(() => {
    if (location.hash.startsWith(PREFIX)) {
      try {
        Object.assign(inputs, clean(decode(location.hash.slice(PREFIX.length))));
        shareMessage.value = 'Geteilte Berechnung wurde geladen.';
      } catch {
        shareMessage.value = 'Der geteilte Link ist ungültig.';
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
      shareMessage.value = 'Link wurde kopiert.';
    } catch {
      window.prompt('Link kopieren:', location.href);
      shareMessage.value = 'Link ist bereit zum Kopieren.';
    }
    window.setTimeout(() => { shareMessage.value = ''; }, 2500);
  };
  return { shareMessage, copyShareLink };
}
