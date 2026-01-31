import { useState, useEffect, useRef } from 'react'
import { generateQuizFromPrompt } from '../../shared/lib/gemini'
import { processQuizData, shuffleQuestion } from '../../shared/lib/quizUtils'

/**
 * クイズ情報の型定義
 */
interface Quiz {
    id: string;
    title: string;
    genre: string; // ジャンルを追加
    difficulty: string;
    questions: Question[];
    createdAt: number;
}

/**
 * 各問題の型定義
 */
interface Question {
    question: string;
    options: string[];
    answerIndex: number;
    explanation: string;
}

/**
 * 得点履歴の型定義
 */
interface ScoreRecord {
    score: number;
    totalQuestions: number;
    percentage: number;
    timestamp: number;
}

interface ScoreHistory {
    quizId: string;
    targetScore: number; // 目標点数（パーセンテージ）
    scores: ScoreRecord[];
}

/**
 * 履歴管理のヘルパー関数
 */
const HISTORY_STORAGE_KEY = 'quiz_score_history_custom'; // カスタム用のキーに変更

// 全履歴を取得
const getAllHistory = (): Record<string, ScoreHistory> => {
    const saved = localStorage.getItem(HISTORY_STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
};

// 特定のクイズの履歴を取得
const getQuizHistory = (quizId: string): ScoreHistory | null => {
    const allHistory = getAllHistory();
    return allHistory[quizId] || null;
};

// 得点を記録
const saveScore = (quizId: string, score: number, totalQuestions: number) => {
    const allHistory = getAllHistory();
    const percentage = Math.round((score / totalQuestions) * 100);

    if (!allHistory[quizId]) {
        allHistory[quizId] = {
            quizId,
            targetScore: 80, // デフォルト目標
            scores: []
        };
    }

    allHistory[quizId].scores.push({
        score,
        totalQuestions,
        percentage,
        timestamp: Date.now()
    });

    // 最新5件のみ保持
    if (allHistory[quizId].scores.length > 5) {
        allHistory[quizId].scores = allHistory[quizId].scores.slice(-5);
    }

    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(allHistory));
};

// 目標点数を設定
const setTargetScore = (quizId: string, targetScore: number) => {
    const allHistory = getAllHistory();

    if (!allHistory[quizId]) {
        allHistory[quizId] = {
            quizId,
            targetScore,
            scores: []
        };
    } else {
        allHistory[quizId].targetScore = targetScore;
    }

    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(allHistory));
};

// 特定のクイズの履歴をリセット
const resetQuizHistory = (quizId: string) => {
    const allHistory = getAllHistory();
    if (allHistory[quizId]) {
        allHistory[quizId].scores = [];
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(allHistory));
    }
};

// 全履歴をリセット
const resetAllHistory = () => {
    localStorage.removeItem(HISTORY_STORAGE_KEY);
};

// クイズ削除時に履歴も削除
const deleteQuizHistory = (quizId: string) => {
    const allHistory = getAllHistory();
    delete allHistory[quizId];
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(allHistory));
};

/**
 * 得点推移グラフコンポーネント
 */
interface ScoreChartProps {
    history: ScoreHistory;
}

const ScoreChart: React.FC<ScoreChartProps> = ({ history }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [chartWidth, setChartWidth] = useState(500);

    // 親要素の幅に合わせてキャンバスサイズを調整
    useEffect(() => {
        const updateSize = () => {
            if (containerRef.current) {
                const width = containerRef.current.clientWidth;
                setChartWidth(width);
            }
        };

        updateSize();
        window.addEventListener('resize', updateSize);
        return () => window.removeEventListener('resize', updateSize);
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // 解像度対応（高画質化）
        const dpr = window.devicePixelRatio || 1;
        canvas.width = chartWidth * dpr;
        canvas.height = 300 * dpr;
        ctx.scale(dpr, dpr);

        const width = chartWidth;
        const height = 300;
        const padding = 40;
        const graphWidth = width - padding * 2;
        const graphHeight = height - padding * 2;

        // クリア
        ctx.clearRect(0, 0, width, height);

        if (graphWidth <= 0) return; // 幅が小さすぎる場合は描画しない

        // 背景
        ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.fillRect(padding, padding, graphWidth, graphHeight);

        // グリッド線
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 4; i++) {
            const y = padding + (graphHeight / 4) * i;
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(width - padding, y);
            ctx.stroke();
        }

        // Y軸ラベル
        ctx.fillStyle = '#a0a0a0';
        ctx.font = '12px Inter, sans-serif';
        ctx.textAlign = 'right';
        for (let i = 0; i <= 4; i++) {
            const y = padding + (graphHeight / 4) * i;
            const label = `${100 - i * 25}%`;
            ctx.fillText(label, padding - 10, y + 4);
        }

        const scores = history.scores;
        const pointSpacing = graphWidth / Math.max(scores.length - 1, 1);

        // 目標ライン
        if (history.targetScore) {
            const targetY = padding + graphHeight * (1 - history.targetScore / 100);
            ctx.strokeStyle = '#ff4d4d';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(padding, targetY);
            ctx.lineTo(width - padding, targetY);
            ctx.stroke();
            ctx.setLineDash([]);

            // 目標ラベル
            ctx.fillStyle = '#ff4d4d';
            ctx.textAlign = 'left';
            ctx.fillText(`目標: ${history.targetScore}%`, width - padding + 5, targetY + 4);
        }

        // 折れ線グラフ
        ctx.strokeStyle = '#58a6ff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        scores.forEach((record, index) => {
            const x = padding + pointSpacing * index;
            const y = padding + graphHeight * (1 - record.percentage / 100);
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        ctx.stroke();

        // ポイント
        scores.forEach((record, index) => {
            const x = padding + pointSpacing * index;
            const y = padding + graphHeight * (1 - record.percentage / 100);

            ctx.fillStyle = '#58a6ff';
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, Math.PI * 2);
            ctx.fill();

            // X軸ラベル
            ctx.fillStyle = '#a0a0a0';
            ctx.font = '11px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`${index + 1}回目`, x, height - padding + 20);

            // パーセンテージラベル
            ctx.fillStyle = '#58a6ff';
            ctx.font = 'bold 12px Inter, sans-serif';
            ctx.fillText(`${record.percentage}%`, x, y - 10);
        });

    }, [history, chartWidth]);

    return (
        <div ref={containerRef} style={{ width: '100%', maxWidth: '600px', margin: '0 auto' }}>
            <canvas ref={canvasRef} style={{ width: '100%', height: '300px', display: 'block' }} className="score-chart" />
        </div>
    );
};

/**
 * カスタムクイズ生成アプリ - メインコンポーネント
 */
function App() {
    // --- 状態管理 (State) ---
    const [quizzes, setQuizzes] = useState<Quiz[]>([])
    const [view, setView] = useState<'dashboard' | 'create' | 'play' | 'settings'>('dashboard')
    const [apiKey, setApiKey] = useState(localStorage.getItem('gemini_api_key') || '')
    const [selectedModel, setSelectedModel] = useState(localStorage.getItem('gemini_model') || 'gemini-1.5-flash')

    // 生成・プレイ用の状態
    const [customGenre, setCustomGenre] = useState('')
    const [customDetails, setCustomDetails] = useState('')
    const [difficulty, setDifficulty] = useState('中級')
    const [generatedPrompt, setGeneratedPrompt] = useState('')
    const [isGenerating, setIsGenerating] = useState(false)
    const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null)
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
    const [score, setScore] = useState(0)
    const [showResult, setShowResult] = useState(false)
    const [userAnswer, setUserAnswer] = useState<number | null>(null)
    const [pasteText, setPasteText] = useState('')
    const [isPasting, setIsPasting] = useState(false)
    const [editingTarget, setEditingTarget] = useState<{ quizId: string; value: string } | null>(null)

    // リファレンス
    const listSectionRef = useRef<HTMLElement>(null)

    // --- 副作用 (Effects) ---

    // 初回に保存済みクイズを読み込む
    useEffect(() => {
        const saved = localStorage.getItem('ai_quizzes_custom')
        const userQuizzes = saved ? JSON.parse(saved) : []
        setQuizzes(userQuizzes)
    }, [])

    // 入力内容が変わるたびにプロンプトを自動更新
    useEffect(() => {
        if (!customGenre) {
            setGeneratedPrompt('（ジャンルを入力するとここにプロンプトが生成されます）')
            return
        }

        const prompt = `
以下の条件で学習用の4択クイズを5問作成してください。

【テーマ・ジャンル】
${customGenre}

【詳細条件・重点項目】
${customDetails || '特になし（一般的な内容で作成してください）'}

【難易度】
${difficulty}

※正解の選択肢の位置（answerIndex）が特定の番号に偏らないよう、問題ごとにランダムに変更してください。

回答形式は以下のJSONフォーマットのみを返してください。解説等は不要です。

{
  "title": "${customGenre}クイズ (${difficulty})",
  "genre": "${customGenre}",
  "difficulty": "${difficulty}",
  "questions": [
    {
      "question": "問題文",
      "options": ["選択肢1", "選択肢2", "選択肢3", "選択肢4"],
      "answerIndex": 0,
      "explanation": "正解の解説"
    }
  ]
}
`.trim()
        setGeneratedPrompt(prompt)
    }, [customGenre, customDetails, difficulty])

    // --- ハンドラー (Handlers) ---

    // APIキーの保存
    const saveApiKey = (key: string) => {
        setApiKey(key)
        localStorage.setItem('gemini_api_key', key)
    }

    // APIキーの消去
    const deleteApiKey = () => {
        if (window.confirm('保存されているAPIキーを消去してもよろしいですか？')) {
            setApiKey('')
            localStorage.removeItem('gemini_api_key')
        }
    }

    // クイズの自動生成（API実行）
    const handleCreate = async () => {
        if (!apiKey) {
            alert('先に設定画面でAPIキーを入力してください。')
            setView('settings')
            return
        }
        if (!customGenre) {
            alert('ジャンルを入力してください。')
            return
        }

        setIsGenerating(true)
        try {
            const data = await generateQuizFromPrompt(apiKey, generatedPrompt, selectedModel)
            const newQuiz = processQuizData(data)

            // ジャンル情報を補完（AIが返さない場合があるため）
            if (!newQuiz.genre) newQuiz.genre = customGenre;

            const userSaved = localStorage.getItem('ai_quizzes_custom')
            const userQuizzes = userSaved ? JSON.parse(userSaved) : []
            const updatedUser = [newQuiz, ...userQuizzes]
            localStorage.setItem('ai_quizzes_custom', JSON.stringify(updatedUser))

            setQuizzes(updatedUser)

            setCurrentQuiz(newQuiz)
            setView('play')
            resetQuiz()

            // 生成後にリスト部分までスムーズスクロール（モバイル用）
            setTimeout(() => {
                listSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        } catch (e: any) {
            console.error('Quiz Generation Error Details:', e);
            const errorMsg = e.message || '不明なエラー';
            alert(`生成に失敗しました。\n原因: ${errorMsg}\n\nAPIキーや通信状態、プロンプトの内容を確認してください。`);
        } finally {
            setIsGenerating(false)
        }
    }

    // プロンプトのコピー
    const handleCopyPrompt = () => {
        navigator.clipboard.writeText(generatedPrompt).then(() => {
            alert('プロンプトをクリップボードにコピーしました！')
        }).catch(() => {
            alert('コピーに失敗しました。')
        })
    }

    // 手動インポート処理
    const handleManualImport = () => {
        if (!pasteText.trim()) return;
        try {
            const jsonMatch = pasteText.match(/\{[\s\S]*\}/);
            if (!jsonMatch) throw new Error("JSONが見つかりません");

            const data = JSON.parse(jsonMatch[0]);
            const newQuiz = processQuizData(data);

            // ジャンルがなければ「Imported」とする
            if (!newQuiz.genre) newQuiz.genre = 'Imported';

            const userSaved = localStorage.getItem('ai_quizzes_custom')
            const userQuizzes = userSaved ? JSON.parse(userSaved) : []
            const updatedUser = [newQuiz, ...userQuizzes]
            localStorage.setItem('ai_quizzes_custom', JSON.stringify(updatedUser))

            setQuizzes(updatedUser)

            setPasteText('');
            setIsPasting(false);
            alert('クイズをインポートしました！');
        } catch {
            alert('インポートに失敗しました。AIの回答からJSONを正しく抽出できませんでした。');
        }
    }

    // クイズプレイ情報の初期化
    const resetQuiz = () => {
        setCurrentQuestionIndex(0)
        setScore(0)
        setShowResult(false)
        setUserAnswer(null)
    }

    // 解答選択時の処理
    const handleAnswer = (index: number) => {
        if (userAnswer !== null) return
        setUserAnswer(index)
        if (index === currentQuiz?.questions[currentQuestionIndex].answerIndex) {
            setScore(score + 1)
        }
    }

    // 次の問題へ進む
    const nextQuestion = () => {
        if (!currentQuiz) return
        if (currentQuestionIndex < currentQuiz.questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1)
            setUserAnswer(null)
        } else {
            // 結果画面へ遷移する前に得点を記録
            saveScore(currentQuiz.id, score, currentQuiz.questions.length)
            setShowResult(true)
        }
    }

    // クイズの削除
    const deleteQuiz = (id: string) => {
        if (!window.confirm('この問題を削除しますか？')) return

        // 履歴も一緒に削除
        deleteQuizHistory(id)

        const userSaved = localStorage.getItem('ai_quizzes_custom')
        const userQuizzes = userSaved ? JSON.parse(userSaved) : []
        const updatedUser = userQuizzes.filter((q: any) => q.id !== id)
        localStorage.setItem('ai_quizzes_custom', JSON.stringify(updatedUser))

        setQuizzes(updatedUser)
    }

    // 履歴リセット（個別）
    const handleResetQuizHistory = (id: string) => {
        if (!window.confirm('このクイズの履歴をリセットしてもよろしいですか？')) return
        resetQuizHistory(id)
        alert('履歴をリセットしました。')
    }

    // 履歴リセット（全体）
    const handleResetAllHistory = () => {
        if (!window.confirm('すべてのクイズの履歴をリセットしてもよろしいですか？この操作は取り消せません。')) return
        resetAllHistory()
        alert('全履歴をリセットしました。')
    }

    // 目標点数の設定を開始
    const handleStartEditTarget = (quizId: string) => {
        const history = getQuizHistory(quizId)
        const currentTarget = history?.targetScore || 80
        setEditingTarget({ quizId, value: String(currentTarget) })
    }

    // 目標点数の保存
    const handleSaveTarget = () => {
        if (!editingTarget) return
        const target = parseInt(editingTarget.value, 10)
        if (isNaN(target) || target < 0 || target > 100) {
            alert('目標点数は0から100の間で入力してください。')
            return
        }
        setTargetScore(editingTarget.quizId, target)
        setEditingTarget(null)
        alert(`目標点数を${target}%に設定しました。`)
    }

    // クイズのエクスポート
    const exportQuiz = (quiz: Quiz) => {
        const blob = new Blob([JSON.stringify(quiz, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${quiz.title}.json`
        a.click()
    }

    // JSONファイルの取り込み
    const importQuiz = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        const reader = new FileReader()
        reader.onload = (event) => {
            try {
                const quiz = JSON.parse(event.target?.result as string)
                const newEntry = { ...quiz, id: crypto.randomUUID() }

                // ジャンルがなければ「Imported」とする
                if (!newEntry.genre) newEntry.genre = 'Imported';

                const userSaved = localStorage.getItem('ai_quizzes_custom')
                const userQuizzes = userSaved ? JSON.parse(userSaved) : []
                const updatedUser = [newEntry, ...userQuizzes]
                localStorage.setItem('ai_quizzes_custom', JSON.stringify(updatedUser))

                setQuizzes(updatedUser)
            } catch {
                alert('JSONの読み込みに失敗しました。')
            }
        }
        reader.readAsText(file)
    }

    // --- レンダリング (UI) ---
    return (
        <div className="container">
            <header>
                <h1 onClick={() => setView('dashboard')} style={{ cursor: 'pointer' }}>AI Quiz Generator (Custom)</h1>
                <nav>
                    <button onClick={() => setView('dashboard')} className={view === 'dashboard' ? 'active' : ''}>ホーム</button>
                    <button onClick={() => setView('settings')} className={view === 'settings' ? 'active' : ''}>設定</button>
                    <button onClick={() => window.location.href = '../../index.html'} className="btn-portal">ジャンル選択へ</button>
                </nav>
            </header>

            <main>
                {/* ダッシュボード画面 */}
                {view === 'dashboard' && (
                    <div className="dashboard-grid">
                        {/* 生成パネル */}
                        <section className="create-section">
                            <h2>オリジナル問題を作る</h2>
                            <div className="generator-container">
                                <div className="setup-panel">
                                    <div className="setup-group">
                                        <label>学習したいジャンル・テーマ</label>
                                        <input
                                            type="text"
                                            value={customGenre}
                                            onChange={(e) => setCustomGenre(e.target.value)}
                                            placeholder="例：日本史、Python、料理、マーベル映画..."
                                            className="input-large"
                                            style={{
                                                width: '100%',
                                                padding: '1rem',
                                                fontSize: '1.2rem',
                                                borderRadius: '12px',
                                                border: '1px solid var(--glass-border)',
                                                background: 'rgba(0,0,0,0.3)',
                                                color: 'white',
                                                marginBottom: '1rem'
                                            }}
                                        />
                                    </div>

                                    <div className="setup-group">
                                        <label>詳細条件・重点項目（任意）</label>
                                        <textarea
                                            value={customDetails}
                                            onChange={(e) => setCustomDetails(e.target.value)}
                                            placeholder="例：戦国時代を中心に。家康の政策について詳しく。"
                                            style={{
                                                width: '100%',
                                                height: '100px',
                                                padding: '1rem',
                                                borderRadius: '12px',
                                                border: '1px solid var(--glass-border)',
                                                background: 'rgba(0,0,0,0.3)',
                                                color: 'white',
                                                fontFamily: 'inherit',
                                                marginBottom: '1rem'
                                            }}
                                        />
                                    </div>

                                    <div className="setup-group">
                                        <label>難易度</label>
                                        <div className="selector-row">
                                            {['初級', '中級', '上級'].map(diff => (
                                                <button
                                                    key={diff}
                                                    className={difficulty === diff ? 'active' : ''}
                                                    onClick={() => setDifficulty(diff)}
                                                >
                                                    {diff}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="prompt-panel">
                                    <div className="prompt-header">
                                        <label>生成プロンプト（自動生成）</label>
                                        <button className="copy-btn-small" onClick={handleCopyPrompt}>プロンプトをコピー</button>
                                    </div>
                                    <textarea
                                        value={generatedPrompt}
                                        onChange={(e) => setGeneratedPrompt(e.target.value)}
                                        placeholder="設定を入力するとプロンプトが生成されます..."
                                        style={{ height: '150px' }}
                                    />
                                    <button
                                        className="generate-btn"
                                        onClick={handleCreate}
                                        disabled={isGenerating}
                                    >
                                        {isGenerating ? 'AIが生成中...' : '生成する (Gemini API)'}
                                    </button>
                                    <p className="hint-small">※APIキーがない場合は、プロンプトをコピーして外部AIに貼り付けてください。</p>
                                </div>
                            </div>
                        </section>

                        {/* リストパネル */}
                        <section className="list-section" ref={listSectionRef}>
                            <div className="list-header">
                                <h2>作成済みの問題</h2>
                                <div className="import-controls">
                                    <button className="btn-secondary" onClick={() => setIsPasting(!isPasting)}>
                                        {isPasting ? '閉じる' : 'テキスト取込'}
                                    </button>
                                    <label className="btn-secondary">
                                        JSON読込
                                        <input type="file" accept=".json" onChange={importQuiz} hidden />
                                    </label>
                                    <button className="btn-secondary btn-danger" onClick={handleResetAllHistory} title="全履歴リセット">
                                        全履歴リセット
                                    </button>
                                </div>
                            </div>

                            {/* テキスト貼り付けインポートエリア */}
                            {isPasting && (
                                <div className="paste-import-box">
                                    <textarea
                                        value={pasteText}
                                        onChange={(e) => setPasteText(e.target.value)}
                                        placeholder="AIからの回答（JSONを含むテキスト）をここに貼り付けてください..."
                                    />
                                    <div className="paste-actions">
                                        <button className="generate-btn" onClick={handleManualImport}>取り込む</button>
                                    </div>
                                </div>
                            )}

                            {quizzes.length === 0 ? (
                                <p>まだ問題がありません。左のパネルから好きなジャンルで作成してみましょう。</p>
                            ) : (
                                <div className="quiz-list">
                                    {quizzes.map(quiz => (
                                        <div
                                            key={quiz.id}
                                            className="quiz-card"
                                            onClick={() => {
                                                const shuffledQuiz = {
                                                    ...quiz,
                                                    questions: quiz.questions.map(q => shuffleQuestion(q))
                                                };
                                                setCurrentQuiz(shuffledQuiz);
                                                setView('play');
                                                resetQuiz();
                                            }}
                                        >
                                            <div className="card-header">
                                                <h3>{quiz.title}</h3>
                                                <div className="card-controls">
                                                    <button onClick={(e) => { e.stopPropagation(); exportQuiz(quiz); }} title="エクスポート">↓</button>
                                                    <button onClick={(e) => { e.stopPropagation(); handleResetQuizHistory(quiz.id); }} title="履歴リセット">↻</button>
                                                    <button onClick={(e) => { e.stopPropagation(); deleteQuiz(quiz.id); }} className="delete" title="削除">×</button>
                                                </div>
                                            </div>
                                            <p>{quiz.genre} | {quiz.difficulty}</p>

                                            {/* 目標得点設定 */}
                                            <div className="target-score-section" onClick={(e) => e.stopPropagation()}>
                                                {editingTarget?.quizId === quiz.id ? (
                                                    <div className="target-edit">
                                                        <label>目標:</label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max="100"
                                                            value={editingTarget.value}
                                                            onChange={(e) => setEditingTarget({ ...editingTarget, value: e.target.value })}
                                                            className="target-input"
                                                        />
                                                        <span>%</span>
                                                        <button onClick={handleSaveTarget} className="btn-save">保存</button>
                                                        <button onClick={() => setEditingTarget(null)} className="btn-cancel">キャンセル</button>
                                                    </div>
                                                ) : (
                                                    <div className="target-display">
                                                        <span>目標: {getQuizHistory(quiz.id)?.targetScore || 80}%</span>
                                                        <button onClick={() => handleStartEditTarget(quiz.id)} className="btn-edit">編集</button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    </div>
                )}

                {/* プレイ画面 */}
                {view === 'play' && currentQuiz && (
                    <div className="play-page">
                        {!showResult ? (
                            <div className="question-box">
                                <div className="quiz-header">
                                    <div className="quiz-info">
                                        <span className="quiz-title-small">{currentQuiz.title}</span>
                                        <span>問題 {currentQuestionIndex + 1} / {currentQuiz.questions.length}</span>
                                    </div>
                                    <div className="progress-bar">
                                        <div
                                            className="progress-fill"
                                            style={{ width: `${((currentQuestionIndex + 1) / currentQuiz.questions.length) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                                <h3>{currentQuiz.questions[currentQuestionIndex].question}</h3>
                                <div className="options-grid">
                                    {currentQuiz.questions[currentQuestionIndex].options.map((option, idx) => (
                                        <button
                                            key={idx}
                                            className={`option-btn ${userAnswer === idx ? (idx === currentQuiz.questions[currentQuestionIndex].answerIndex ? 'correct' : 'wrong') : ''} ${userAnswer !== null && idx === currentQuiz.questions[currentQuestionIndex].answerIndex ? 'correct' : ''}`}
                                            onClick={() => handleAnswer(idx)}
                                            disabled={userAnswer !== null}
                                        >
                                            {option}
                                        </button>
                                    ))}
                                </div>
                                {userAnswer !== null && (
                                    <div className="explanation-box">
                                        <p className={userAnswer === currentQuiz.questions[currentQuestionIndex].answerIndex ? 'correct-text' : 'wrong-text'}>
                                            {userAnswer === currentQuiz.questions[currentQuestionIndex].answerIndex ? '正解！' : '不正解...'}
                                        </p>
                                        <p className="explanation-text">{currentQuiz.questions[currentQuestionIndex].explanation}</p>
                                        <button className="next-btn" onClick={nextQuestion}>
                                            {currentQuestionIndex < currentQuiz.questions.length - 1 ? '次の問題へ' : '結果を見る'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="result-box">
                                <h2>結果発表</h2>
                                <div className="score-display">
                                    <span className="score-num">{score}</span>
                                    <span className="score-total">/ {currentQuiz.questions.length}</span>
                                </div>
                                <div className="score-percentage">
                                    {Math.round((score / currentQuiz.questions.length) * 100)}%
                                </div>
                                <p className="result-message">
                                    {score === currentQuiz.questions.length
                                        ? '満点です！素晴らしい！🎉'
                                        : score >= currentQuiz.questions.length * 0.8
                                            ? '素晴らしい！よく頑張りました！👏'
                                            : score >= currentQuiz.questions.length * 0.6
                                                ? 'いい調子です！もう少しです！💪'
                                                : 'お疲れ様でした！次も頑張りましょう。📚'}
                                </p>

                                {/* 得点推移グラフ */}
                                {(() => {
                                    const history = getQuizHistory(currentQuiz.id);
                                    if (history && history.scores.length >= 1) {
                                        return (
                                            <div className="score-history-section">
                                                <h3>得点の推移</h3>
                                                <ScoreChart history={history} />
                                            </div>
                                        );
                                    }
                                    return null;
                                })()}

                                <div className="result-actions">
                                    <button className="retry-btn" onClick={() => {
                                        const shuffledQuiz = {
                                            ...currentQuiz,
                                            questions: currentQuiz.questions.map(q => shuffleQuestion(q))
                                        };
                                        setCurrentQuiz(shuffledQuiz);
                                        resetQuiz();
                                    }}>もう一度挑戦</button>
                                    <button className="return-btn" onClick={() => setView('dashboard')}>ダッシュボードに戻る</button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* 設定画面 */}
                {view === 'settings' && (
                    <div className="settings-page">
                        <h2>設定</h2>
                        <div className="form-group">
                            <label>Gemini API キー</label>
                            <div className="api-key-row">
                                <input
                                    type="password"
                                    value={apiKey}
                                    onChange={(e) => saveApiKey(e.target.value)}
                                    placeholder="APIキーを入力してください"
                                />
                                <button
                                    className="delete-key-btn"
                                    onClick={deleteApiKey}
                                    title="キーを消去"
                                    disabled={apiKey.trim() === ''}
                                >
                                    消去
                                </button>
                            </div>
                            <p className="hint">※キーはブラウザのlocalStorageに保存され、問題生成時のみ使用されます。</p>
                        </div>

                        <div className="form-group">
                            <label>使用するモデル</label>
                            <select
                                value={selectedModel}
                                onChange={(e) => {
                                    setSelectedModel(e.target.value);
                                    localStorage.setItem('gemini_model', e.target.value);
                                }}
                                className="model-select"
                            >
                                <option value="gemini-1.5-flash-latest">Gemini 1.5 Flash (推奨・安定)</option>
                                <option value="gemini-1.5-pro-latest">Gemini 1.5 Pro (高精度)</option>
                                <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                                <option value="gemini-2.5-flash">Gemini 2.5 Flash (最新・高速)</option>
                                <option value="gemini-2.5-pro">Gemini 2.5 Pro (最新・最高性能)</option>
                            </select>
                            <p className="hint">※2026年現在の最新モデル（2.5系）も無料枠で利用可能です。</p>
                        </div>
                        <button className="save-back-btn" onClick={() => setView('dashboard')}>戻る</button>
                    </div>
                )}
            </main>

            <footer>
                <p>© 2026 AI Quiz Generator - Custom Realm</p>
            </footer>
        </div>
    )
}

export default App
