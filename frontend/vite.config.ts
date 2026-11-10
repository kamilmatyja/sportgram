import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    build: {
        cssCodeSplit: false,
        chunkSizeWarningLimit: 2000,
        rollupOptions: {
            output: {
                codeSplitting: false,
                entryFileNames: 'assets/[name].min.js',
                assetFileNames: 'assets/[name].min.[ext]',
            },
        },
    },
    server: {
        host: true,
        port: 5173,
        hmr: {
            host: 'localhost',
            port: 5173,
        },
        proxy: {
            '/api': {
                target: 'http://localhost:8080',
                changeOrigin: true,
            },
        },
    },
});
