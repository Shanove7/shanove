import OpenAI from "openai";

export default async function handler(req, res) {
  // Cek harus method POST
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const client = new OpenAI({
    baseURL: "https://api.cerebras.ai/v1",
    apiKey: process.env.CEREBRAS_API_KEY, // Ini ngambil dari Vercel tadi
  });

  try {
    const { messages } = req.body; // Langsung ambil body

    const completion = await client.chat.completions.create({
      messages: messages,
      model: "qwen-3-235b-a22b-instruct-2507",
    });

    res.status(200).json(completion.choices[0].message);
  } catch (error) {
    res.status(500).json({ error: "Xyon AI Error: " + error.message });
  }
}

