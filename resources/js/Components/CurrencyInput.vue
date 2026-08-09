<script setup>
import { computed, inject, ref } from 'vue';

const props = defineProps({ modelValue: { type: Number, default: 0 }, disabled: Boolean });
const emit = defineEmits(['update:modelValue']);
const locale = inject('hausrechner-locale', ref('de'));
const numberLocale = computed(() => locale.value === 'en' ? 'en-GB' : 'de-DE');
const formatted = computed(() => new Intl.NumberFormat(numberLocale.value, { maximumFractionDigits: 0 }).format(Number(props.modelValue || 0)));
const update = event => {
  const digits = event.target.value.replace(/\D/g, '');
  emit('update:modelValue', digits ? Number(digits) : 0);
  event.target.value = new Intl.NumberFormat(numberLocale.value, { maximumFractionDigits: 0 }).format(digits ? Number(digits) : 0);
};
</script>

<template><input :value="formatted" type="text" inputmode="numeric" :disabled="disabled" @input="update"></template>
