import { OpenAIStream, StreamingTextResponse } from 'ai';
import OpenAI from 'openai';

export const runtime = 'edge';

const openai = new OpenAI({
  apiKey: process.env.LLM_CHRISTMAS_API_KEY || process.env.OPENAI_API_KEY || 'demo-key',
  baseURL: process.env.LLM_CHRISTMAS_BASE_URL || 'https://llm.christmas/v1',
});

export async function POST(req: Request) {
  const { messages, model = 'gpt-4o' } = await req.json();

  const response = await openai.chat.completions.create({
    model,
    stream: true,
    messages: [
      {
        role: 'system',
        content: `You are the Web3 & DeFi Agent on agent.llm.christmas. 
You are equipped with tools to query prediction markets, token prices, wallet balances, and funding rates.
Be concise, analytical, and helpful.`,
      },
      ...messages,
    ],
  });

  const stream = OpenAIStream(response as any);
  return new StreamingTextResponse(stream);
}
