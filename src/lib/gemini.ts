import { GoogleGenerativeAI } from "@google/generative-ai";

export async function generateQuizFromPrompt(apiKey: string, prompt: string) {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        // JSON部分のみを抽出
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        throw new Error("JSONの解析に失敗しました。");
    } catch (error) {
        console.error("Gemini API Error:", error);
        throw error;
    }
}
