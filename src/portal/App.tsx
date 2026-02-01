/**
 * ジャンル選択カードのデータ定義
 */
const GENRES = [
    {
        id: 'programming',
        title: 'プログラミング',
        description: 'コード、ロジック、アルゴリズムをマスターしよう。',
        icon: '🤖',
        path: 'apps/programming/index.html',
        color: 'var(--accent-blue)'
    },
    {
        id: 'custom',
        title: 'カスタム生成',
        description: '好きなテーマでAIがクイズを作成します。',
        icon: '✨',
        path: 'apps/custom/index.html',
        color: 'var(--accent-purple)'
    },
    {
        id: 'history',
        title: '歴史（準備中）',
        description: '時間と文明を巡る旅へ。',
        icon: '🏛️',
        path: '#', // 後日追加予定
        color: 'var(--accent-orange)',
        disabled: true
    },
    {
        id: 'cooking',
        title: '料理（準備中）',
        description: 'レシピ、テクニック、食の知識。',
        icon: '👨‍🍳',
        path: '#', // 後日追加予定
        color: 'var(--accent-purple)',
        disabled: true
    }
]

/**
 * ジャンル選択ポータル画面 - メインコンポーネント
 */
function App() {
    return (
        <div className="container portal-container">
            <header className="portal-header">
                <h1>TeraQ</h1>
                <p className="subtitle">学ぶジャンルを選んでスタート（AI寺子屋）</p>
                <a href="apps/help/index.html" className="help-link">アプリについて / 使い方</a>
            </header>

            <main className="portal-main">
                <div className="genre-grid">
                    {GENRES.map(genre => (
                        <div
                            key={genre.id}
                            className={`genre-card ${genre.disabled ? 'disabled' : ''}`}
                            style={{ '--card-accent': genre.color } as any}
                            onClick={() => !genre.disabled && (window.location.href = genre.path)}
                        >
                            <div className="genre-icon">{genre.icon}</div>
                            <div className="genre-info">
                                <h2>{genre.title}</h2>
                                <p>{genre.description}</p>
                            </div>
                            {genre.disabled && <span className="coming-soon">準備中</span>}
                        </div>
                    ))}
                </div>
            </main>

            <footer>
                <p>© 2026 AI Quiz Master - Nexus Portal</p>
            </footer>
        </div>
    )
}

export default App
