<script setup>
defineProps({ text: { type: String, required: true } });
</script>

<template><details class="group relative inline-block"><summary class="flex h-5 w-5 cursor-pointer list-none items-center justify-center rounded-full border border-slate-400 text-[11px] font-bold text-slate-500 hover:border-indigo-500 hover:text-indigo-600" :aria-label="text">?</summary><div class="absolute left-0 z-30 mt-2 w-72 rounded-lg bg-slate-950 p-3 text-left text-xs font-normal leading-relaxed text-white shadow-xl group-open:block">{{ text }}</div></details></template>
