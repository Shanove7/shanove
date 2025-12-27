"use client";
import { useState, useRef, useEffect } from "react";
import { Send, Cpu, Trash2 } from "lucide-react";

export default function AIChat() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = { role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      // INI BAGIAN PENTING: Dia manggil file route.js
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMsg] }),
      });

      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Error");

      setMessages((prev) => [...prev, data]);
    } catch (error) {
      // Kalau error, dia bakal bilang ini:
      setMessages((prev) => [...prev, { role: "system", content: "⚠️ Gagal connect ke server Xyon." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-black text-white p-4">
      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {messages.length === 0 && <div className="text-center text-gray-500 mt-20">Xyon AI Ready.</div>}
        
        {messages.map((m, i) => (
          <div key={i} className={`p-3 rounded-lg max-w-[80%] ${m.role === 'user' ? 'bg-cyan-600 ml-auto' : 'bg-gray-800'}`}>
            {m.content}
          </div>
        ))}
        {loading && <div className="text-cyan-500 animate-pulse">Xyon mengetik...</div>}
        <div ref={scrollRef} />
      </div>

      <div className="flex gap-2">
        <input 
          className="flex-1 bg-gray-900 border border-gray-700 p-3 rounded text-white"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Ketik pesan..."
        />
        <button onClick={handleSend} className="bg-cyan-600 p-3 rounded"><Send /></button>
      </div>
    </div>
  );
    }
            
