// pages/api/chat.js
export default async function handler(req, res) {
  const { prompt } = req.body;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "ft:gpt-3.5-turbo-0125:your-org:plan-notu-gpt:xyz123",
      messages: [
        { role: "system", content: "Sen bir öğretmen asistanısın ve öğretmenlere plan hazırlamada yardımcı oluyorsun." },
        { role: "user", content: prompt },
      ],
    }),
  });

  const data = await response.json();
  const reply = data.choices?.[0]?.message?.content || "Yanıt alınamadı.";

  res.status(200).json({ result: reply });
}
