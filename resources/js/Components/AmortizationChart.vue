<script setup>
import { computed } from 'vue';
import { Bar } from 'vue-chartjs';
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Legend, Tooltip } from 'chart.js';
ChartJS.register(BarElement, CategoryScale, LinearScale, Legend, Tooltip);
const props = defineProps({ rows: { type: Array, required: true } });
const data = computed(() => ({
  labels: props.rows.map(r => r.year),
  datasets: [
    { label: 'Zinsen', data: props.rows.map(r => r.interest), backgroundColor: '#f59e0b', stack: 'rate' },
    { label: 'Tilgung inkl. Hessengeld', data: props.rows.map(r => r.principal), backgroundColor: '#0f766e', stack: 'rate' },
  ],
}));
const currency = value => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value);
const options = { responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false }, scales: { x: { stacked: true, title: { display: true, text: 'Jahr' }, grid: { display: false } }, y: { stacked: true, title: { display: true, text: 'Zahlung pro Jahr' }, ticks: { callback: value => `${Math.round(value / 1000)} T€` } } }, plugins: { legend: { position: 'bottom' }, tooltip: { callbacks: { label: context => `${context.dataset.label}: ${currency(context.raw)}` } } } };
</script>
<template><div class="h-72"><Bar :data="data" :options="options" /></div></template>
