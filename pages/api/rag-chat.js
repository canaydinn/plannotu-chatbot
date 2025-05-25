// pages/api/rag-chat.js
import { OpenAI } from "openai";
import fs from "fs";
import path from "path";
import { cosineSimilarity } from "../../../utils/similarity";
import { getEmbedding } from "../../../utils/embedding";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Chunk verisini oku (JSONL dosyasını .js dosyasına çevirebilirsin deploy için)
const dataPath = path.join(process.cwd(), "data", "plan_chunks_master_v3.jsonl");
const rawChunks = fs.readFileSync(dataPath, "utf-8")
  .split("\n")
  .filter(Boolean)
  .map((line) => JSON.parse(line));

export default async function handler(req, res) {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: "Prompt gerekli" });

  try {
    const queryEmbedding = await getEmbedding(prompt);

    // Benzer chunk'ları bul (ilk 5)
    const similarities = rawChunks.map((chunk) => {
      const score = cosineSimilarity(queryEmbedding, chunk.embedding);
      return { ...chunk, score };
    });

    const topChunks = similarities
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((chunk) => chunk.content);

    const context = topChunks.join("\n\n");

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        {
          role: "system",
          content:
            "Sen uzman bir şehir plancısısın. Kullanıcıdan gelen istemlere dayalı olarak, plan notu diliyle ve mevzuata uygun teknik açıklamalar yap. Yanıtlarını aşağıdaki formata göre ver:

📘 Plan Notu: [Alan Türü]

1. ...
2. ...
3. ...

En sona “Bu not yukarıdaki kaynak plan notu örneklerine dayanmaktadır.” şeklinde kapanış cümlesi ekle."
        },
        {
          role: "user",
          content: `Kullanıcı isteği: ${prompt}\n\nPlan arşivinden ilgi bağlam: ${context}`
        }
      ]
    });

    return res.status(200).json({ result: completion.choices[0].message.content });
  } catch (err) {
    console.error("Hata:", err.message);
    return res.status(500).json({ error: "Cevap oluşturulamadı.", detail: err.message });
  }
}
