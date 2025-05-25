// pages/api/chat.js
import { google } from 'googleapis';

export default async function handler(req, res) {
  const { prompt } = req.body;
  const user_id = 'web_user_1';

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  let reply = "Yanıt alınamadı.";
  const timestamp = new Date().toISOString().replace("T", " ").slice(0, 19);

  try {
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
          { role: "system", content: "Sen bir şehir plancısısın ve şehir plancılara plan notu hazırlamada yardımcı oluyorsun." },
          { role: "user", content: prompt },
        ],
      }),
    });

    const data = await openaiRes.json();
    reply = data.choices?.[0]?.message?.content || reply;
  } catch (openaiErr) {
    console.error("🔴 OpenAI API error:", openaiErr.message);
    return res.status(500).json({ error: "OpenAI yanıt hatası", detail: openaiErr.message });
  }

  // 2️⃣ Google Sheets'e kaydet
  try {
    if (!process.env.GOOGLE_SERVICE_ACCOUNT || !process.env.GOOGLE_SHEET_ID) {
      throw new Error("Google Sheets env değişkenleri eksik");
    }

    const creds = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);
    const auth = new google.auth.GoogleAuth({
      credentials: creds,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "plan_notu!A:D",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[timestamp, user_id, prompt, reply]],
      },
    });

  } catch (sheetErr) {
    console.error("🛑 Sheets API error:", sheetErr.stack);
    return res.status(500).json({ error: "Sheets API hatası", detail: sheetErr.message });
  }

  // 3️⃣ Cevabı frontend'e gönder
  res.status(200).json({ result: reply });
}
