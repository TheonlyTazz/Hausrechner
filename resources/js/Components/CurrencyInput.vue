<script setup>
import { computed } from 'vue';

const props = defineProps({ modelValue: { type: Number, default: 0 }, disabled: Boolean });
const emit = defineEmits(['update:modelValue']);
const formatted = computed(() => new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 }).format(Number(props.modelValue || 0)));
const update = event => {
  const digits = event.target.value.replace(/\D/g, '');
  emit('update:modelValue', digits ? Number(digits) : 0);
  event.target.value = new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 }).format(digits ? Number(digits) : 0);
};
</script>

<template><input :value="formatted" type="text" inputmode="numeric" :disabled="disabled" @input="update"></template>
