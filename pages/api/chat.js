// pages/api/chat.js
import { google } from 'googleapis';

export default async function handler(req, res) {
  const { prompt } = req.body;
  const user_id = 'web_user_1'; // dilersen oturumdan alabilirsin

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  // 1️⃣ OpenAI'den yanıt al
  const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
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

  const data = await openaiRes.json();
  const reply = data.choices?.[0]?.message?.content || "Yanıt alınamadı.";
  const timestamp = new Date().toISOString().replace("T", " ").slice(0, 19);

  // 2️⃣ Google Sheets'e kaydet
  try {
    const creds = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);

    const auth = new google.auth.GoogleAuth({
      credentials: creds,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    const sheetId = process.env.GOOGLE_SHEET_ID;

    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: "plan_notu!A:D",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[timestamp, user_id, prompt, reply]],
      },
    });

  } catch (err) {
    console.error("🛑 Sheets API error:", err.message);
  }

  // 3️⃣ Cevabı frontend'e gönder
  res.status(200).json({ result: reply });
}
