import { OpenAIStream, StreamingTextResponse } from 'ai';
import OpenAI from 'openai';

// nodejs is more reliable for long upstream streams than edge + custom gateways
export const runtime = 'nodejs';
export const maxDuration = 60;

function normalizeBaseUrl(raw: string) {
  let base = (raw || '').trim().replace(/\/$/, '');
  if (!base) base = 'https://api.llm.christmas/v1';
  // allow either https://host or https://host/v1
  if (!/\/v1$/i.test(base)) base = `${base}/v1`;
  return base;
}

export async function POST(req: Request) {
  try {
    const { messages, model = 'deepseek-v4-flash' } = await req.json();

    const apiKey =
      process.env.LLM_CHRISTMAS_API_KEY ||
      process.env.OPENAI_API_KEY ||
      '';
    const baseURL = normalizeBaseUrl(
      process.env.LLM_CHRISTMAS_BASE_URL || 'https://api.llm.christmas/v1'
    );

    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error:
            'Missing LLM_CHRISTMAS_API_KEY in Vercel env. Create a key on llm.christmas and set it for Production + Preview.',
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
    const status = err?.status || err?.statusCode || err?.response?.status;
    const detail =
      err?.error?.message ||
      err?.message ||
      (typeof err === 'string' ? err : null) ||
      'Upstream model request failed.';

    let hint = '';
    if (status === 401 || /invalid token|unauthorized|api key/i.test(String(detail))) {
      hint =
        ' API key rejected — use a valid llm.christmas / new-api token (sk-...), not an empty or wrong key.';
    } else if (status === 404 || /model/i.test(String(detail))) {
      hint = ' Model id may not exist on this gateway — pick an id from the dropdown catalog.';
    } else if (status === 502 || status === 503 || /502|bad gateway|ECONNREFUSED/i.test(String(detail))) {
      hint =
        ' Gateway 502 — try BASE_URL https://api.llm.christmas/v1 (new-api). If using cpa.llm.christmas, confirm that host is healthy.';
    }

    return new Response(
      JSON.stringify({
        error: `${detail}${status ? ` (HTTP ${status})` : ''}.${hint}`,
        baseURL: normalizeBaseUrl(
          process.env.LLM_CHRISTMAS_BASE_URL || 'https://api.llm.christmas/v1'
        ),
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
