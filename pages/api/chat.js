// pages/api/chat.js
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  // 1️⃣ OpenAI'den yanıt al
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "ft:gpt-3.5-turbo-0125:deu:plan-notu-gpt-v1:Bb3Kr4j0",
      messages: [
        { role: "system", content: "Sen bir öğretmen asistanısın ve öğretmenlere plan hazırlamada yardımcı oluyorsun." },
        { role: "user", content: prompt },
      ],
    }),
  });

  const data = await response.json();
  const reply = data.choices?.[0]?.message?.content || "Yanıt alınamadı.";

  // 2️⃣ CSV dosyasına kaydet
  const csvPath = path.join(process.cwd(), "messages.csv");
  const timestamp = new Date().toISOString().replace("T", " ").slice(0, 19);
  const row = `"${timestamp}","anonymous","${prompt.replace(/"/g, '""')}","${reply.replace(/"/g, '""')}"\n`;

  try {
    if (!fs.existsSync(csvPath)) {
      fs.writeFileSync(csvPath, `"timestamp","user_id","prompt","response"\n`);
    }
    fs.appendFileSync(csvPath, row);
  } catch (err) {
    console.error("CSV write error:", err);
  }

  // 3️⃣ Yanıtı gönder
  res.status(200).json({ result: reply });
}
