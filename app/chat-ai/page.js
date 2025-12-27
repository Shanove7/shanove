  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = { role: "user", content: input };
    
    // Update UI langsung biar cepet
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      // Panggil API Route kita sendiri (aman)
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMsg] }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessages(prev => [...prev, data]); // Data isinya { role: "assistant", content: "..." }
        saveToHistory([...messages, userMsg, data]);
      } else {
        throw new Error("API Error");
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: "system", content: "Maaf, Xyon AI sedang sibuk." }]);
    }
    setLoading(false);
  };
