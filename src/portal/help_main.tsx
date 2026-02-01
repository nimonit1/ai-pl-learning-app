import React from 'react'
import ReactDOM from 'react-dom/client'
import Help from './Help.tsx'
import '../index.css' // 共通スタイルを適用

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <Help />
    </React.StrictMode>,
)
