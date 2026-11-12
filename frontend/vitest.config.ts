import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    test: {
        globals: true,
        environment: 'jsdom',
        environmentOptions: {
            jsdom: {
                url: 'http://localhost:5173',
            },
        },
        setupFiles: './src/test/setup.ts',
        pool: 'forks',
        css: false,
        testTimeout: 10000,
    },
});
