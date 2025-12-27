import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(req) {
  try {
    // 1. Ambil pesan dari frontend
    const body = await req.json();
    const messages = body.messages;

    // 2. Konek ke Cerebras (Pake Key dari Vercel Env)
    const client = new OpenAI({
      baseURL: "https://api.cerebras.ai/v1",
      apiKey: process.env.CEREBRAS_API_KEY, 
    });

    // 3. Request ke AI
    const completion = await client.chat.completions.create({
      messages: messages,
      model: "llama3-70b-8192",
    });

    // 4. Balikin jawaban ke Frontend
    return NextResponse.json(completion.choices[0].message);

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
