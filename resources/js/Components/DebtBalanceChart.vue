<script setup>
import { computed } from 'vue';
import { Line } from 'vue-chartjs';
import { CategoryScale, Chart as ChartJS, Filler, Legend, LinearScale, LineElement, PointElement, Title, Tooltip } from 'chart.js';

ChartJS.register(CategoryScale, Filler, Legend, LinearScale, LineElement, PointElement, Title, Tooltip);

const props = defineProps({ rows: { type: Array, required: true } });
const data = computed(() => ({
  labels: props.rows.map(row => row.year),
  datasets: [{
    label: 'Restschuld',
    data: props.rows.map(row => row.balance),
    borderColor: '#0f766e',
    backgroundColor: 'rgba(20, 184, 166, .14)',
    pointRadius: 2,
    pointHoverRadius: 5,
    borderWidth: 3,
    fill: true,
    tension: .2,
  }],
}));
const options = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { intersect: false, mode: 'index' },
  plugins: {
    legend: { display: false },
    tooltip: { callbacks: { label: context => `Restschuld: ${new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(context.raw)}` } },
  },
  scales: {
    x: { title: { display: true, text: 'Jahr' }, grid: { display: false } },
    y: {
      beginAtZero: true,
      title: { display: true, text: 'Restschuld in Euro' },
      ticks: { callback: value => `${new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 }).format(value)} €` },
    },
  },
};
</script>

<template><div class="h-80"><Line :data="data" :options="options" /></div></template>
