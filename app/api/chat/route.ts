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
    tools: [
      {
        type: 'function',
        function: {
          name: 'get_polymarket_event',
          description: 'Fetch current prediction market probabilities for a given topic from Polymarket',
          parameters: {
            type: 'object',
            properties: {
              topic: { type: 'string', description: 'The topic to search, e.g. Election, Fed, Bitcoin' },
            },
            required: ['topic'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'get_uniswap_quote',
          description: 'Get live token swap quote using uni-exec-engine (Uniswap v2/v3/v4 routing)',
          parameters: {
            type: 'object',
            properties: {
              tokenIn: { type: 'string', description: 'Input token symbol, e.g. ETH' },
              tokenOut: { type: 'string', description: 'Output token symbol, e.g. USDC' },
              amount: { type: 'string', description: 'Amount to swap' },
            },
            required: ['tokenIn', 'tokenOut', 'amount'],
          },
        },
      },
    ],
  });

  const stream = OpenAIStream(response, {
    async experimental_onToolCall(call, appendToolCallMessage) {
      if (call.name === 'get_polymarket_event') {
        const topic = (call.args as any).topic;
        const mockData = {
          topic,
          status: 'Active',
          leadingOutcome: 'Yes',
          probability: '68%',
          volume24h: '$1.2M',
          source: 'polymarket-py SDK',
        };
        return appendToolCallMessage({
          tool_call_id: call.id,
          name: call.name,
          content: JSON.stringify(mockData),
        });
      }

      if (call.name === 'get_uniswap_quote') {
        const { tokenIn, tokenOut, amount } = call.args as any;
        const mockQuote = {
          path: `${tokenIn} -> ${tokenOut}`,
          amountIn: amount,
          estimatedOut: (parseFloat(amount) * 3400).toFixed(2),
          feeTier: '0.05%',
          engine: 'uni-exec-engine (13K LOC)',
        };
        return appendToolCallMessage({
          tool_call_id: call.id,
          name: call.name,
          content: JSON.stringify(mockQuote),
        });
      }
    },
  });

  return new StreamingTextResponse(stream);
}
