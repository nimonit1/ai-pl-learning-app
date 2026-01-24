import { resolve } from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        react(),
        basicSsl()
    ],
    server: {
        https: true,
        host: true, // スマホ等からのアクセスを許可
    },
    base: './', // GitHub Pagesなどのサブディレクトリ公開に対応
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
                programming: resolve(__dirname, 'apps/programming/index.html'),
            },
        },
    },
})
