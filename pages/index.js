// pages/index.js
import { useState } from "react";
import axios from "axios";

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const newMessage = { role: "user", content: input };
    setMessages([...messages, newMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await axios.post("/api/chat", { prompt: input });
      const reply = { role: "assistant", content: res.data.result };
      setMessages((prev) => [...prev, newMessage, reply]);
       // ✅ CSV'ye yaz
    await axios.post("/api/save-message", {
      user_id: "web_user_1",
      prompt: input,
      response: replyText,
    });
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "❌ Hata oluştu. Lütfen tekrar deneyin." },
      ]);
    }

    setLoading(false);
  };

  return (
    <div className="max-w-xl mx-auto p-4 font-sans">
      <h1 className="text-2xl font-bold mb-4">📘 Plan Notu GPT</h1>

      <div className="space-y-2 mb-4 h-96 overflow-y-auto border p-2 rounded bg-white">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`p-2 rounded ${
              msg.role === "user" ? "bg-blue-100 text-right" : "bg-gray-100 text-left"
            }`}
          >
            {msg.content}
          </div>
        ))}
        {loading && (
          <div className="bg-yellow-100 p-2 rounded text-center">Yanıt bekleniyor...</div>
        )}
      </div>

      <div className="flex gap-2">
        <input
          className="flex-grow border p-2 rounded"
          placeholder="Bir soru yaz..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button
          onClick={sendMessage}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Gönder
        </button>
      </div>
    </div>
  );
}
