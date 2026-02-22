/**
 * クイズデータの選択肢をシャッフルし、正解インデックスを再計算する
 * @param q - クイズの問題データ
 * @returns シャッフル後の問題データ
 */
export function shuffleQuestion(q: any) {
    if (!q || !Array.isArray(q.options)) {
        console.error("Invalid question data:", q);
        return q;
    }

    // 選択肢が文字列でない場合は強制的に文字列化する
    const options = q.options.map((opt: any) => typeof opt === 'string' ? opt : String(opt));

    const optionsWithIndex = options.map((opt: string, i: number) => ({ opt, isCorrect: i === q.answerIndex }));
    const shuffled = [...optionsWithIndex];

    // フィッシャー–イェーツのシャッフルアルゴリズム
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return {
        ...q,
        options: shuffled.map(o => o.opt),
        answerIndex: shuffled.findIndex(o => o.isCorrect)
    };
}

/**
 * クイズ全体のデータを処理し、各問題のシャッフルとID付与を行う
 * @param data - AIから生成された生のクイズデータ
 * @returns アプリ内で扱える形式のクイズデータ
 */
export function processQuizData(data: any) {
    if (!data || !Array.isArray(data.questions)) {
        throw new Error("クイズデータの形式が正しくありません（questions配列が見つかりません）。");
    }

    if (data.questions.length === 0) {
        throw new Error("クイズの問題が1件も見つかりませんでした。");
    }

    const randomizedQuestions = data.questions.map((q: any) => shuffleQuestion(q));

    return {
        ...data,
        questions: randomizedQuestions,
        id: crypto.randomUUID(),
        createdAt: Date.now()
    };
}

