import React from 'react'

/**
 * ジャンル選択カードのデータ定義
 */
const GENRES = [
    {
        id: 'programming',
        title: 'Programming',
        description: 'Master code, logic, and algorithms.',
        icon: '🤖',
        path: '/apps/programming/index.html',
        color: 'var(--accent-blue)'
    },
    {
        id: 'history',
        title: 'History',
        description: 'Journey through time and civilizations.',
        icon: '🏛️',
        path: '#', // 後日追加予定
        color: 'var(--accent-orange)',
        disabled: true
    },
    {
        id: 'cooking',
        title: 'Cooking',
        description: 'Culinary arts, recipes, and flavors.',
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
                <h1>AI QUIZ NEXUS</h1>
                <p className="subtitle">Choose your realm to start learning</p>
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
                            {genre.disabled && <span className="coming-soon">Coming Soon</span>}
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
