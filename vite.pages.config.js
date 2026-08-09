import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
    base: '/Hausrechner/',
    publicDir: false,
    plugins: [vue()],
    build: {
        outDir: 'dist',
        emptyOutDir: true,
    },
});
