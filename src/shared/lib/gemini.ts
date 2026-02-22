import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Gemini APIを使用してプロンプトからクイズデータを生成する
 * @param apiKey - Gemini APIキー
 * @param prompt - クイズ生成用のプロンプト
 * @param modelName - 使用するモデル名（デフォルトはgemini-1.5-flash）
 * @returns パースされたクイズデータ（JSON）
 */
export async function generateQuizFromPrompt(apiKey: string, prompt: string, modelName: string = "gemini-1.5-flash") {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        console.log("Geminiからの生応答:", text);

        // 応答テキストからJSON部分（{ ... }）のみを抽出
        // 最も外側の { と } を探す
        const firstBrace = text.indexOf('{');
        const lastBrace = text.lastIndexOf('}');

        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            const jsonText = text.substring(firstBrace, lastBrace + 1);
            try {
                return JSON.parse(jsonText);
            } catch (parseError) {
                console.error("JSONパースエラー:", parseError);
                throw new Error("JSONの解析に失敗しました。AIの回答形式が正しくない可能性があります。");
            }
        }

        throw new Error("JSON形式のデータが見つかりませんでした。");
    } catch (error) {
        console.error("Gemini APIエラー:", error);
        throw error;
    }
}
