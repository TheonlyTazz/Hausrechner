import { computed, ref, watch } from 'vue';
import de from '../../lang/de.js';
import en from '../../lang/en.js';

const messages = { de, en };

export function translate(language, key) {
  return messages[language]?.[key] ?? key;
}

export function useUiPreferences() {
  const language = ref(localStorage.getItem('hausrechner-language') || 'de');
  const theme = ref(localStorage.getItem('hausrechner-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
  const t = key => translate(language.value, key);
  const toggleLanguage = () => { language.value = language.value === 'de' ? 'en' : 'de'; };
  const toggleTheme = () => { theme.value = theme.value === 'dark' ? 'light' : 'dark'; };

  watch(language, value => {
    localStorage.setItem('hausrechner-language', value);
    document.documentElement.lang = value;
  }, { immediate: true });
  watch(theme, value => {
    localStorage.setItem('hausrechner-theme', value);
    document.documentElement.classList.toggle('dark', value === 'dark');
  }, { immediate: true });

  return { language: computed(() => language.value), theme: computed(() => theme.value), t, toggleLanguage, toggleTheme };
}
