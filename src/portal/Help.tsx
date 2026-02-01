import React from 'react'

/**
 * ヘルプ（アプリ紹介）ページコンポーネント
 */
function Help() {
    return (
        <div className="container help-container" style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
            <header style={{ textAlign: 'center', marginBottom: '3rem' }}>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: 'var(--accent-blue)' }}>TeraQ</h1>
                <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>AIと一緒に学ぶ、あなただけの知識ベース</p>
                <div style={{ marginTop: '2rem' }}>
                    <a href="../../index.html" className="btn-secondary" style={{ textDecoration: 'none', padding: '0.8rem 1.5rem', borderRadius: '20px', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
                        ← ポータルに戻る
                    </a>
                </div>
            </header>

            <main>
                <section className="help-section" style={{ marginBottom: '4rem', background: 'var(--card-bg)', padding: '2rem', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                    <h2 style={{ borderBottom: '2px solid var(--accent-blue)', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>TeraQ（テラキュー）の由来</h2>
                    <p style={{ lineHeight: '1.8', fontSize: '1.1rem' }}>
                        このアプリの名前は、江戸時代の学び舎<strong>「寺子屋 (Tera-koya)」</strong>と、
                        知的探究の象徴である<strong>「Q (Quiz / Quest)」</strong>を掛け合わせて生まれました。
                    </p>
                    <p style={{ lineHeight: '1.8', fontSize: '1.1rem', marginTop: '1rem' }}>
                        かつての寺子屋が、読み書きそろばんを通じて人々の生活を支えたように、
                        <strong>「現代のAI寺子屋」</strong>として、誰もが自由にAIと対話し、
                        自分だけの知識を深めていく場所でありたいという願いが込められています。
                    </p>
                </section>

                <section className="help-section" style={{ marginBottom: '4rem' }}>
                    <h2 style={{ borderBottom: '2px solid var(--accent-purple)', paddingBottom: '0.5rem', marginBottom: '1.5rem' }}>使い方ガイド</h2>

                    <div className="step-card" style={{ display: 'flex', gap: '1.5rem', marginBottom: '2rem', alignItems: 'flex-start' }}>
                        <div style={{ background: 'var(--accent-purple)', color: 'white', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0 }}>1</div>
                        <div>
                            <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-primary)' }}>ジャンルを選ぶ</h3>
                            <p style={{ color: 'var(--text-secondary)' }}>ポータル画面から、「プログラミング」や「カスタム生成」など、学びたいジャンルを選んで入室します。</p>
                        </div>
                    </div>

                    <div className="step-card" style={{ display: 'flex', gap: '1.5rem', marginBottom: '2rem', alignItems: 'flex-start' }}>
                        <div style={{ background: 'var(--accent-purple)', color: 'white', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0 }}>2</div>
                        <div>
                            <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-primary)' }}>AIにクイズを作ってもらう</h3>
                            <p style={{ color: 'var(--text-secondary)' }}>ダッシュボードの生成パネルで条件を入力すると、AI（Gemini）があなたのためにオリジナルのクイズを作成します。</p>
                        </div>
                    </div>

                    <div className="step-card" style={{ display: 'flex', gap: '1.5rem', marginBottom: '2rem', alignItems: 'flex-start' }}>
                        <div style={{ background: 'var(--accent-purple)', color: 'white', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', flexShrink: 0 }}>3</div>
                        <div>
                            <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-primary)' }}>解いて、成長する</h3>
                            <p style={{ color: 'var(--text-secondary)' }}>クイズに挑戦しましょう。結果は履歴として残り、グラフで成長を確認できます。苦手な部分は何度も復習できます。</p>
                        </div>
                    </div>
                </section>
            </main>

            <footer style={{ textAlign: 'center', marginTop: '4rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                <p>&copy; 2026 TeraQ Project</p>
            </footer>
        </div>
    )
}

export default Help
