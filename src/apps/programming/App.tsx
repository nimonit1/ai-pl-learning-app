import { useState, useEffect } from 'react'
import { generateQuizFromPrompt } from '../../shared/lib/gemini'
import { processQuizData, shuffleQuestion } from '../../shared/lib/quizUtils'
import { DEFAULT_PROGRAMMING_QUIZZES } from './defaultQuizzes'

/**
 * クイズ情報の型定義
 */
interface Quiz {
    id: string;
    title: string;
    language: 'C' | 'python' | 'VBA';
    difficulty: string;
    questions: Question[];
    createdAt: number;
    isDefault?: boolean; // デフォルト問題かどうか
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
 * プログラミングジャンル固有のトピック設定
 */
const TOPICS = {
    C: ['ポインタ', 'メモリ管理', '構造体', '標準ライブラリ', '制御構文', '配列・文字列'],
    python: ['リスト内包表記', 'デコレータ', 'クラス・継承', '例外処理', '標準ライブラリ', 'データ型・辞書'],
    VBA: ['セル操作(Range/Cells)', 'ループ処理', 'ユーザーフォーム', 'イベント', '変数の型・スコープ', 'エラーハンドリング']
}

/**
 * プログラミング学習クイズアプリ - メインコンポーネント
 */
function App() {
    // --- 状態管理 (State) ---
    const [quizzes, setQuizzes] = useState<Quiz[]>([])
    const [view, setView] = useState<'dashboard' | 'create' | 'play' | 'settings'>('dashboard')
    const [apiKey, setApiKey] = useState(localStorage.getItem('gemini_api_key') || '')
    const [selectedModel, setSelectedModel] = useState(localStorage.getItem('gemini_model') || 'gemini-1.5-flash')

    // 生成・プレイ用の状態
    const [selectedLang, setSelectedLang] = useState<'C' | 'python' | 'VBA'>('python')
    const [difficulty, setDifficulty] = useState('中級')
    const [selectedTopics, setSelectedTopics] = useState<string[]>([])
    const [customPrompt, setCustomPrompt] = useState('')
    const [isGenerating, setIsGenerating] = useState(false)
    const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null)
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
    const [score, setScore] = useState(0)
    const [showResult, setShowResult] = useState(false)
    const [userAnswer, setUserAnswer] = useState<number | null>(null)
    const [pasteText, setPasteText] = useState('')
    const [isPasting, setIsPasting] = useState(false)

    // --- 副作用 (Effects) ---

    // 初回に保存済みクイズとデフォルトクイズを読み込む
    useEffect(() => {
        const saved = localStorage.getItem('ai_quizzes')
        const userQuizzes = saved ? JSON.parse(saved) : []

        // デフォルトクイズにIDを付与（未付与の場合）
        const defaults = DEFAULT_PROGRAMMING_QUIZZES.map((q, i) => ({
            ...q,
            id: `default-${i}`,
            createdAt: 0,
            isDefault: true
        })) as Quiz[];

        setQuizzes([...userQuizzes, ...defaults])
    }, [])

    // 選択状態が変わるたびにプロンプトを自動更新
    useEffect(() => {
        const topicsStr = selectedTopics.length > 0 ? `テーマは「${selectedTopics.join(', ')}」に関連させてください。` : ""
        const titleTopics = selectedTopics.length > 0 ? ` - ${selectedTopics.join('/')}` : ""
        const prompt = `
プログラミング言語「${selectedLang}」の学習用クイズを、難易度「${difficulty}」で5問作成してください。
${topicsStr}
※正解の選択肢の位置（answerIndex）が特定の番号に偏らないよう、問題ごとにランダムに変更してください。

回答形式は以下のJSONフォーマットのみを返してください。解説等は不要です。

{
  "title": "${selectedLang}クイズ (${difficulty}${titleTopics})",
  "language": "${selectedLang}",
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
        setCustomPrompt(prompt)
    }, [selectedLang, difficulty, selectedTopics])

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

    // トピックの選択切り替え
    const handleTopicToggle = (topic: string) => {
        setSelectedTopics(prev =>
            prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic]
        )
    }

    // クイズの自動生成（API実行）
    const handleCreate = async () => {
        if (!apiKey) {
            alert('先に設定画面でAPIキーを入力してください。')
            setView('settings')
            return
        }
        setIsGenerating(true)
        try {
            const data = await generateQuizFromPrompt(apiKey, customPrompt, selectedModel)
            const newQuiz = processQuizData(data)

            const userSaved = localStorage.getItem('ai_quizzes')
            const userQuizzes = userSaved ? JSON.parse(userSaved) : []
            const updatedUser = [newQuiz, ...userQuizzes]
            localStorage.setItem('ai_quizzes', JSON.stringify(updatedUser))

            // 全表示リストを更新
            const defaults = DEFAULT_PROGRAMMING_QUIZZES.map((q, i) => ({ ...q, id: `default-${i}`, isDefault: true }))
            setQuizzes([...updatedUser, ...defaults] as any)

            setCurrentQuiz(newQuiz)
            setView('play')
            resetQuiz()
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
        navigator.clipboard.writeText(customPrompt).then(() => {
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

            const userSaved = localStorage.getItem('ai_quizzes')
            const userQuizzes = userSaved ? JSON.parse(userSaved) : []
            const updatedUser = [newQuiz, ...userQuizzes]
            localStorage.setItem('ai_quizzes', JSON.stringify(updatedUser))

            const defaults = DEFAULT_PROGRAMMING_QUIZZES.map((q, i) => ({ ...q, id: `default-${i}`, isDefault: true }))
            setQuizzes([...updatedUser, ...defaults] as any)

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
            setShowResult(true)
        }
    }

    // クイズの削除
    const deleteQuiz = (id: string) => {
        if (id.startsWith('default-')) {
            alert('デフォルト問題は削除できません。')
            return
        }
        if (!window.confirm('この問題を削除しますか？')) return

        const userSaved = localStorage.getItem('ai_quizzes')
        const userQuizzes = userSaved ? JSON.parse(userSaved) : []
        const updatedUser = userQuizzes.filter((q: any) => q.id !== id)
        localStorage.setItem('ai_quizzes', JSON.stringify(updatedUser))

        const defaults = DEFAULT_PROGRAMMING_QUIZZES.map((q, i) => ({ ...q, id: `default-${i}`, isDefault: true }))
        setQuizzes([...updatedUser, ...defaults] as any)
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

                const userSaved = localStorage.getItem('ai_quizzes')
                const userQuizzes = userSaved ? JSON.parse(userSaved) : []
                const updatedUser = [newEntry, ...userQuizzes]
                localStorage.setItem('ai_quizzes', JSON.stringify(updatedUser))

                const defaults = DEFAULT_PROGRAMMING_QUIZZES.map((q, i) => ({ ...q, id: `default-${i}`, isDefault: true }))
                setQuizzes([...updatedUser, ...defaults] as any)
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
                <h1 onClick={() => setView('dashboard')} style={{ cursor: 'pointer' }}>AI Quiz Master (Programming)</h1>
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
                            <h2>新しく問題を生成する</h2>
                            <div className="generator-container">
                                <div className="setup-panel">
                                    <div className="setup-group">
                                        <label>言語</label>
                                        <div className="selector-row">
                                            {(['C', 'python', 'VBA'] as const).map(lang => (
                                                <button
                                                    key={lang}
                                                    className={selectedLang === lang ? 'active' : ''}
                                                    onClick={() => { setSelectedLang(lang); setSelectedTopics([]); }}
                                                >
                                                    {lang}
                                                </button>
                                            ))}
                                        </div>
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

                                    <div className="setup-group">
                                        <label>項目（複数選択可）</label>
                                        <div className="topics-grid">
                                            {TOPICS[selectedLang].map(topic => (
                                                <button
                                                    key={topic}
                                                    className={`topic-chip ${selectedTopics.includes(topic) ? 'selected' : ''}`}
                                                    onClick={() => handleTopicToggle(topic)}
                                                >
                                                    {topic}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="prompt-panel">
                                    <div className="prompt-header">
                                        <label>生成プロンプト（編集可能）</label>
                                        <button className="copy-btn-small" onClick={handleCopyPrompt}>プロンプトをコピー</button>
                                    </div>
                                    <textarea
                                        value={customPrompt}
                                        onChange={(e) => setCustomPrompt(e.target.value)}
                                        placeholder="プロンプトがここに生成されます..."
                                    />
                                    <button
                                        className="generate-btn"
                                        onClick={handleCreate}
                                        disabled={isGenerating}
                                    >
                                        {isGenerating ? 'AIが生成中...' : 'Gemini APIで生成する'}
                                    </button>
                                    <p className="hint-small">※APIキーがない場合は、プロンプトをコピーして外部AIに貼り付けてください。</p>
                                </div>
                            </div>
                        </section>

                        {/* リストパネル */}
                        <section className="list-section">
                            <div className="list-header">
                                <h2>作成済みの問題</h2>
                                <div className="import-controls">
                                    <button className="btn-secondary" onClick={() => setIsPasting(!isPasting)}>
                                        {isPasting ? '閉じる' : 'テキストから取り込む'}
                                    </button>
                                    <label className="btn-secondary">
                                        JSONファイル読込
                                        <input type="file" accept=".json" onChange={importQuiz} hidden />
                                    </label>
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
                                <p>まだ問題がありません。上のパネルから作成してみましょう。</p>
                            ) : (
                                <div className="quiz-list">
                                    {quizzes.map(quiz => (
                                        <div key={quiz.id} className={`quiz-card ${quiz.isDefault ? 'is-default' : ''}`}>
                                            <div className="card-header">
                                                <h3>{quiz.title} {quiz.isDefault && <small>(公式)</small>}</h3>
                                                <div className="card-controls">
                                                    <button onClick={() => exportQuiz(quiz)} title="エクスポート">↓</button>
                                                    {!quiz.isDefault && <button onClick={() => deleteQuiz(quiz.id)} className="delete" title="削除">×</button>}
                                                </div>
                                            </div>
                                            <p>{quiz.language} | {quiz.difficulty}</p>
                                            <button className="play-btn" onClick={() => {
                                                const shuffledQuiz = {
                                                    ...quiz,
                                                    questions: quiz.questions.map(q => shuffleQuestion(q))
                                                };
                                                setCurrentQuiz(shuffledQuiz);
                                                setView('play');
                                                resetQuiz();
                                            }}>挑戦する</button>
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
                                <p>{score === currentQuiz.questions.length ? '満点です！素晴らしい！' : 'お疲れ様でした！次も頑張りましょう。'}</p>
                                <button className="return-btn" onClick={() => setView('dashboard')}>ダッシュボードに戻る</button>
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
                <p>© 2026 AI Quiz Master</p>
            </footer>
        </div>
    )
}

export default App
