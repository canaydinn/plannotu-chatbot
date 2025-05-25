// pages/api/save-message.js
import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Only POST requests allowed' });
  }

  const { user_id = 'anonymous', prompt, response } = req.body;

  if (!prompt || !response) {
    return res.status(400).json({ message: 'Prompt and response required' });
  }

  const csvPath = path.join(process.cwd(), 'messages.csv');
  const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
  const row = `"${timestamp}","${user_id}","${prompt.replace(/"/g, '""')}","${response.replace(/"/g, '""')}"\n`;

  try {
    if (!fs.existsSync(csvPath)) {
      fs.writeFileSync(csvPath, `"timestamp","user_id","prompt","response"\n`);
    }
    fs.appendFileSync(csvPath, row);
    res.status(200).json({ message: 'Saved successfully' });
  } catch (err) {
    console.error('CSV write error:', err);
    res.status(500).json({ message: 'Failed to save message' });
  }
}
