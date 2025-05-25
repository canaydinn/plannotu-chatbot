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
console.log("📚 Chunk sayısı:", rawChunks.length); // ✅ BURAYA EKLE

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
      content: `
Sen uzman bir şehir plancısısın. Kullanıcının plan notu üretme isteğine aşağıdaki teknik ve biçimsel kurallara uyarak cevap ver:

Yanıt formatın zorunlu olarak şu şekilde olmalıdır:

📘 Plan Notu: [Alan Türü]

1. Yapılaşma şartları ve emsal değeri belirtilir.  
2. Yükseklik, çekme mesafeleri, kat adedi gibi fiziksel koşullar belirtilir.  
3. Uygulama, sosyal donatı ve diğer koşullar madde madde yazılır.

En sona şu cümleyi mutlaka yaz:  
Bu not yukarıdaki kaynak plan notu örneklerine dayanmaktadır.


Yanıt kesinlikle madde madde olmalı. Serbest metin kullanma.
`
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
