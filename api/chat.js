export default async function handler(req, res) {
  // 1. Cek Method
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 2. Ambil Pesan & Key
  const { messages } = req.body;
  const apiKey = process.env.CEREBRAS_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'API Key belum disetting di Vercel' });
  }

  try {
    // 3. Request ke Cerebras pake fetch bawaan (biar ga usah install openai sdk)
    const response = await fetch("https://api.cerebras.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "llama3-70b-8192",
        messages: messages,
        temperature: 0.7
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || 'Error dari Cerebras');
    }

    // 4. Kirim balik
    res.status(200).json(data.choices[0].message);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

