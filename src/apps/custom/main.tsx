import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import '../../shared/styles/base.css'

/**
 * カスタムクイズアプリのエントリーポイント
 */
ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
)

// サービスワーカーの登録（PWA対応）
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(err => {
            console.log('サービスワーカーの登録に失敗しました: ', err);
        });
    });
}
