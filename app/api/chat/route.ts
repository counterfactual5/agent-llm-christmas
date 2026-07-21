import { OpenAIStream, StreamingTextResponse } from 'ai';
import OpenAI from 'openai';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { messages, model = 'deepseek-v4-flash' } = await req.json();

    const apiKey =
      process.env.LLM_CHRISTMAS_API_KEY ||
      process.env.OPENAI_API_KEY ||
      '';
    const baseURL =
      process.env.LLM_CHRISTMAS_BASE_URL ||
      'https://cpa.llm.christmas/v1';

    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error:
            'Missing LLM_CHRISTMAS_API_KEY (or OPENAI_API_KEY) in Vercel environment variables.',
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const openai = new OpenAI({
      apiKey,
      baseURL,
    });

    const response = await openai.chat.completions.create({
      model,
      stream: true,
      messages: [
        {
          role: 'system',
          content: `You are the Web3 & DeFi Agent on agent.llm.christmas.
You help users explore prediction markets, DEX quotes, wallets, and funding rates.
When tools are not wired yet, answer from general knowledge and clearly say demo mode.
Be concise, analytical, and helpful.`,
        },
        ...messages,
      ],
    });

    const stream = OpenAIStream(response as any);
    return new StreamingTextResponse(stream);
  } catch (err: any) {
    console.error('chat route error:', err);
    const message =
      err?.message ||
      err?.error?.message ||
      'Upstream model request failed. Check CPA base URL, API key, and model id.';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
