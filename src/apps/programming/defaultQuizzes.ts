/**
 * プログラミング学習アプリの初期クイズデータ
 */
export const DEFAULT_PROGRAMMING_QUIZZES = [
    {
        title: "Python 基礎クイズ",
        language: "python",
        difficulty: "初級",
        questions: [
            {
                question: "Pythonでリストに要素を追加するメソッドはどれ？",
                options: ["add()", "push()", "append()", "insert_end()"],
                answerIndex: 2,
                explanation: "append()メソッドは、リストの最後に新しい要素を1つ追加するために使用されます。"
            },
            {
                question: "Pythonの数値を整数に変換する関数はどれ？",
                options: ["int()", "float()", "str()", "bool()"],
                answerIndex: 0,
                explanation: "int()関数は、数値や文字列を整数型に変換します。"
            }
        ]
    },
    {
        title: "C言語 ポインタ基礎",
        language: "C",
        difficulty: "中級",
        questions: [
            {
                question: "変数のアドレスを取得するための演算子はどれ？",
                options: ["*", "&", "->", "."],
                answerIndex: 1,
                explanation: "&演算子（アドレス演算子）を変数の前に付けることで、その変数のメモリ上のアドレスを取得できます。"
            }
        ]
    }
];
