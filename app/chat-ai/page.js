"use client";
import { useState, useEffect, useRef } from "react";
import { Send, Trash2, Plus, Cpu, MessageSquare } from "lucide-react";

export default function AIChat() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem("xyon_chat_history");
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    // 1. Simpan pesan user
    const userMsg = { role: "user", content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      // 2. TEMBAK KE BACKEND (pages/api/chat.js)
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMsg] }),
      });

      const data = await response.json();

      if (response.ok) {
        // 3. Masukkan balasan ASLI dari Cerebras
        setMessages(prev => [...prev, data]); 
      } else {
        throw new Error(data.error || "Gagal fetch");
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: "system", content: "⚠️ Error: Cek console / API Key." }]);
    }
    setLoading(false);
  };

  const startNewChat = () => {
    if (messages.length > 0) {
      const newHistory = [{ id: Date.now(), title: messages[0].content.substring(0, 20) + "...", msgs: messages }, ...history];
      setHistory(newHistory);
      localStorage.setItem("xyon_chat_history", JSON.stringify(newHistory));
    }
    setMessages([]);
  };

  return (
    <div className="flex h-screen bg-slate-950 text-white overflow-hidden font-sans">
      {/* Sidebar (Hidden on Mobile) */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 p-4 hidden md:flex flex-col">
        <div className="font-bold text-xl mb-6 text-cyan-400 tracking-wider flex items-center gap-2">
          <Cpu/> XYON AI
        </div>
        <button onClick={startNewChat} className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 p-3 rounded-lg mb-4 transition">
          <Plus size={18} /> New Chat
        </button>
        <div className="flex-1 overflow-y-auto space-y-2">
          {history.map((h) => (
            <div key={h.id} className="p-3 hover:bg-slate-800 rounded cursor-pointer text-sm text-slate-300 truncate">
              {h.title}
            </div>
          ))}
        </div>
      </aside>

      {/* Main Chat */}
      <main className="flex-1 flex flex-col relative">
        {/* Header Mobile */}
        <div className="md:hidden p-4 bg-slate-900 border-b border-slate-800 flex justify-between items-center">
            <span className="font-bold text-cyan-400">XYON AI</span>
            <button onClick={startNewChat}><Plus size={20}/></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-50">
              <Cpu size={64} className="mb-4" />
              <p>Ready to assist, Sir Kasan.</p>
            </div>
          )}
          
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-4 rounded-2xl ${
                m.role === 'user' 
                ? 'bg-cyan-600 text-white rounded-br-none' 
                : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700'
              }`}>
                {m.content}
              </div>
            </div>
          ))}
          
          {loading && (
            <div className="flex justify-start">
              <div className="bg-slate-800 p-4 rounded-2xl rounded-bl-none border border-slate-700 text-cyan-400 animate-pulse">
                Xyon is typing...
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>

        {/* Input */}
        <div className="p-4 bg-slate-900 border-t border-slate-800">
          <div className="max-w-4xl mx-auto flex gap-2">
            <input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Perintah..."
              className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-cyan-500 text-white"
            />
            <button onClick={handleSend} disabled={loading} className="bg-cyan-600 p-3 rounded-xl hover:bg-cyan-700 transition disabled:opacity-50">
              <Send size={20} />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
    }
  
