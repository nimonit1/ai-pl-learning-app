import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import '../../shared/styles/base.css'

/**
 * プログラミング学習アプリのエントリーポイント
 * /apps/programming/index.html から呼び出される
 */
ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
)

// サービスワーカーの登録（PWA対応）
// ルートディレクトリの sw.js を参照するように設定
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(err => {
            console.log('サービスワーカーの登録に失敗しました: ', err);
        });
    });
}
