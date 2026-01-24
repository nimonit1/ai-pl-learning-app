import { GoogleGenerativeAI } from "@google/generative-ai";

export async function generateQuizFromPrompt(apiKey: string, prompt: string, modelName: string = "gemini-1.5-flash") {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        console.log("Raw response from Gemini:", text);
        // JSON部分のみを抽出
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            try {
                return JSON.parse(jsonMatch[0]);
            } catch (parseError) {
                console.error("JSON Parse Error:", parseError);
                throw new Error("JSONのパースに失敗しました。AIの回答形式が正しくありません。");
            }
        }
        throw new Error("JSON形式のデータが見つかりませんでした。");
    } catch (error) {
        console.error("Gemini API Error:", error);
        throw error;
    }
}
