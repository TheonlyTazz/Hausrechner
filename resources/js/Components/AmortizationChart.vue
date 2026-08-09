<script setup>
import { computed } from 'vue';
import { Bar } from 'vue-chartjs';
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Legend, Tooltip } from 'chart.js';
ChartJS.register(BarElement, CategoryScale, LinearScale, Legend, Tooltip);
const props = defineProps({ rows: { type: Array, required: true }, locale: { type: String, default: 'de' } });
const data = computed(() => ({
  labels: props.rows.map(r => r.year),
  datasets: [
    { label: props.locale === 'en' ? 'Interest' : 'Zinsen', data: props.rows.map(r => r.interest), backgroundColor: '#f59e0b', stack: 'rate' },
    { label: props.locale === 'en' ? 'Principal incl. Hessengeld' : 'Tilgung inkl. Hessengeld', data: props.rows.map(r => r.principal), backgroundColor: '#0f766e', stack: 'rate' },
  ],
}));
const currency = value => new Intl.NumberFormat(props.locale === 'en' ? 'en-GB' : 'de-DE', { style: 'currency', currency: 'EUR' }).format(value);
const options = computed(() => ({ responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false }, scales: { x: { stacked: true, title: { display: true, text: props.locale === 'en' ? 'Year' : 'Jahr' }, grid: { display: false } }, y: { stacked: true, title: { display: true, text: props.locale === 'en' ? 'Annual payment' : 'Zahlung pro Jahr' }, ticks: { callback: value => `${Math.round(value / 1000)} k€` } } }, plugins: { legend: { position: 'bottom' }, tooltip: { callbacks: { label: context => `${context.dataset.label}: ${currency(context.raw)}` } } } }));
</script>
<template><div class="h-72"><Bar :data="data" :options="options" /></div></template>
