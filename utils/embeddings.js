// utils/embedding.js

import { OpenAI } from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Verilen metnin OpenAI üzerinden embedding vektörünü alır
export async function getEmbedding(text) {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });

  return response.data[0].embedding;
<<<<<<< HEAD
}
=======
}
>>>>>>> 9ec22e01c65864020db0dec70cdbc7f8e68f39a9
