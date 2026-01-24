/**
 * クイズデータの選択肢をシャッフルし、正解インデックスを再計算する
 * @param q - クイズの問題データ
 * @returns シャッフル後の問題データ
 */
export function shuffleQuestion(q: any) {
    const optionsWithIndex = q.options.map((opt: string, i: number) => ({ opt, isCorrect: i === q.answerIndex }));
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
    const randomizedQuestions = data.questions.map((q: any) => shuffleQuestion(q));

    return {
        ...data,
        questions: randomizedQuestions,
        id: crypto.randomUUID(),
        createdAt: Date.now()
    };
}
