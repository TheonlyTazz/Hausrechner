<script setup>
import { computed } from 'vue';
import { Line } from 'vue-chartjs';
import { CategoryScale, Chart as ChartJS, Legend, LinearScale, LineElement, PointElement, Tooltip } from 'chart.js';
ChartJS.register(CategoryScale, Legend, LinearScale, LineElement, PointElement, Tooltip);
const props = defineProps({ rows: { type: Array, required: true }, locale: { type: String, default: 'de' } });
const data = computed(() => ({ labels: props.rows.map(row => Math.round(row.year)), datasets: [
  { label: props.locale === 'en' ? 'ETF model value' : 'ETF-Modellwert', data: props.rows.map(row => row.etf / 100), borderColor: '#4f46e5', backgroundColor: '#4f46e5', tension: .2 },
  { label: props.locale === 'en' ? 'Remaining debt' : 'Restschuld', data: props.rows.map(row => row.debt / 100), borderColor: '#f97316', backgroundColor: '#f97316', tension: .2 },
  { label: props.locale === 'en' ? 'Net assets' : 'Nettovermögen', data: props.rows.map(row => row.net / 100), borderColor: '#059669', backgroundColor: '#059669', tension: .2 },
] }));
const currency = value => new Intl.NumberFormat(props.locale === 'en' ? 'en-GB' : 'de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
const options = computed(() => ({ responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false }, plugins: { legend: { position: 'bottom' }, tooltip: { callbacks: { label: context => `${context.dataset.label}: ${currency(context.raw)}` } } }, scales: { x: { grid: { display: false } }, y: { ticks: { callback: value => `${Math.round(value / 1000)} k€` } } } }));
</script>
<template><div class="h-80"><Line :data="data" :options="options" /></div></template>
