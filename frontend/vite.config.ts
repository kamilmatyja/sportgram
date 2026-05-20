import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    server: {
        port: 5173,
        proxy: {
            '/api': {
                target: 'http://localhost:8080',
                changeOrigin: true,
            },
        },
    },
    build: {
        rollupOptions: {
            input: {
                main: './index.html',
                sw: './src/sw.ts'
            },
            output: {
                entryFileNames: assetInfo => {
                    return assetInfo.name === 'sw' ? 'sw.js' : 'assets/[name]-[hash].js';
                }
            }
        }
    }
})