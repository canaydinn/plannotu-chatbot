export const config = {
  runtime: "nodejs"
};

import fetch from "node-fetch"; // 🆕
import fs from "fs";
import path from "path";
import { cosineSimilarity } from "../../utils/similarity";
import { getEmbedding } from "../../utils/embedding";

const dataPath = path.join(process.cwd(), "data", "plan_chunks_master_v3.jsonl");
const rawChunks = fs.readFileSync(dataPath, "utf-8")
  .split("\n")
  .filter(Boolean)
  .map((line) => JSON.parse(line));

console.log("📚 Chunk sayısı:", rawChunks.length);

export default async function handler(req, res) {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: "Prompt gerekli" });

  try {
    const queryEmbedding = await getEmbedding(prompt);

    const similarities = rawChunks.map((chunk) => {
      const score = cosineSimilarity(queryEmbedding, chunk.embedding);
      return { ...chunk, score };
    });

    const topChunks = similarities
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((chunk) => chunk.content);

    const context = topChunks.join("\n\n");

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4-turbo",
        messages: [
          {
            role: "system",
            content: "Sen uzman bir şehir plancısısın. Kullanıcının plan notu üretme isteğine aşağıdaki teknik ve biçimsel kurallara uyarak cevap ver:",
          },
          {
            role: "user",
            content: `Kullanıcı isteği: ${prompt}\n\nPlan arşivinden ilgi bağlam: ${context}`,
          },
        ],
      }),
    });

    const completion = await response.json();

    return res.status(200).json({ result: completion.choices[0].message.content });
  } catch (err) {
    console.error("Hata:", err.message);
    return res.status(500).json({ error: "Cevap oluşturulamadı.", detail: err.message });
  }
}
