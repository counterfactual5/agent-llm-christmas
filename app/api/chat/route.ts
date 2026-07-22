import OpenAI from 'openai';

export const runtime = 'nodejs';
export const maxDuration = 60;

const SYSTEM_PROMPT = `You are the Web3 & DeFi Agent on agent.llm.christmas, a public showcase of open-source DeFi/agent tooling by github.com/counterfactual5.

You have 4 built-in tools:
- get_token_price: live USD prices (CoinGecko)
- get_defi_tvl: protocol TVL (DefiLlama)
- get_github_repo: GitHub repo stats
- get_gas_price: current Ethereum gas

Use tools for price/TVL/gas/repo questions. Always cite the data source. For everything else answer from your knowledge. Format in Markdown. Be concise and helpful.`;

const TOOL_DEFINITIONS = [
  {
    type: 'function',
    function: {
      name: 'get_token_price',
      description: 'Get USD price and 24h change via CoinGecko.',
      parameters: { type: 'object', properties: { ids: { type: 'string', description: 'Comma-separated CoinGecko ids, e.g. "ethereum,bitcoin".' } }, required: ['ids'] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_defi_tvl',
      description: 'Get TVL via DefiLlama.',
      parameters: { type: 'object', properties: { protocol: { type: 'string', description: 'Protocol slug, e.g. "uniswap".' } }, required: ['protocol'] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_github_repo',
      description: 'Get GitHub repo stats.',
      parameters: { type: 'object', properties: { repo: { type: 'string', description: 'owner/name, e.g. "counterfactual5/uni-exec-engine".' } }, required: ['repo'] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_gas_price',
      description: 'Current Ethereum gas price in gwei.',
      parameters: { type: 'object', properties: {} },
    },
  },
];

const FETCH_TIMEOUT_MS = 10_000;
async function fetchJson(url: string, init: RequestInit = {}): Promise<any> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...init, signal: ctrl.signal });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

async function executeTool(name: string, args: any): Promise<string> {
  try {
    if (name === 'get_token_price') {
      const ids = String(args.ids || '').trim();
      const data = await fetchJson(`https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(ids)}&vs_currencies=usd&include_24hr_change=true`);
      return JSON.stringify({ source: 'CoinGecko', data });
    }
    if (name === 'get_defi_tvl') {
      const protocol = String(args.protocol || '').trim();
      const data = await fetchJson(`https://api.llama.fi/protocol/${encodeURIComponent(protocol)}`);
      return JSON.stringify({ source: 'DefiLlama', protocol: data?.name || protocol, tvlUsd: data?.tvl, chainTvls: data?.chainTvls });
    }
    if (name === 'get_github_repo') {
      const repo = String(args.repo || '').trim();
      const data = await fetchJson(`https://api.github.com/repos/${encodeURIComponent(repo)}`);
      return JSON.stringify({ source: 'GitHub', name: data.full_name, stars: data.stargazers_count, forks: data.forks_count, language: data.language, description: data.description, url: data.html_url });
    }
    if (name === 'get_gas_price') {
      const data = await fetchJson('https://api.etherscan.io/api?module=gastracker&action=gasoracle');
      return JSON.stringify({ source: 'Etherscan', data: data?.result });
    }
    return JSON.stringify({ error: `unknown tool: ${name}` });
  } catch (err: any) {
    return JSON.stringify({ error: String(err?.message || err) });
  }
}

function jsonError(message: string, status = 500) {
  return new Response(JSON.stringify({ error: message }), { status, headers: { 'Content-Type': 'application/json' } });
}

/**
 * Build an AI-SDK v3 protocol stream from scratch (no OpenAIStream parser).
 * The frontend `useChat` hook accepts:
 *   - "0:<json-string>" → text delta
 *   - "d:<json-string>" → finish metadata
 *   - custom annotations for tool events
 */
function aiSdkV3TextStream(chunks: AsyncIterable<string>): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    async start(controller) {
      try {
        for await (const c of chunks) {
          if (!c) continue;
          controller.enqueue(encoder.encode(`0:${JSON.stringify(c)}\n`));
        }
        controller.enqueue(encoder.encode(`d:${JSON.stringify({ finishReason: 'stop' })}\n`));
      } catch (e) {
        // Send a finish marker with an error annotation so the UI can show it
        controller.enqueue(
          encoder.encode(`d:${JSON.stringify({ finishReason: 'error', error: String((e as any)?.message || e) })}\n`)
        );
      } finally {
        controller.close();
      }
    },
  });
}

export async function POST(req: Request) {
  try {
    const { messages, model = 'deepseek-v4-flash-200k' } = await req.json();

    const apiKey = process.env.LLM_CHRISTMAS_API_KEY || process.env.OPENAI_API_KEY || '';
    const baseURL = (process.env.LLM_CHRISTMAS_BASE_URL || 'https://api.llm.christmas/v1').replace(/\/$/, '');

    if (!apiKey) return jsonError('Missing LLM_CHRISTMAS_API_KEY in Vercel environment variables.');
    if (!Array.isArray(messages)) return jsonError('Invalid request: messages must be an array.', 400);

    const openai = new OpenAI({ apiKey, baseURL });
    const baseMessages = [{ role: 'system', content: SYSTEM_PROMPT }, ...messages];

    // Phase 1: non-streaming — decide tool calls
    const first = await openai.chat.completions.create({
      model,
      stream: false,
      messages: baseMessages,
      tools: TOOL_DEFINITIONS as any,
      tool_choice: 'auto',
    } as any);
    const firstChoice: any = (first as any).choices?.[0];
    const firstMsg = firstChoice?.message;
    const toolCalls: any[] = firstMsg?.tool_calls || [];

    if (toolCalls.length === 0) {
      // No tools requested — stream the (already complete) assistant text by chunking.
      const text: string = firstMsg?.content || '';
      const chunks = text.match(/.{1,40}/g) || [text];
      const data: string[] = chunks.length > 0 ? chunks : [''];
      return new Response(aiSdkV3TextStream((async function* () {
        for (const c of data) {
          yield c;
          await new Promise((r) => setTimeout(r, 8));
        }
      })()), {
        headers: { 'Content-Type': 'text/plain; charset=utf-8', 'X-Vercel-AI-Data-Stream': 'v1' },
      });
    }

    // Tools requested — run them, then stream a 2nd call for the final answer.
    const conversation: any[] = [...baseMessages, firstMsg];

    for (const call of toolCalls) {
      const toolName = call.function?.name;
      let toolArgs: any = {};
      try {
        toolArgs = JSON.parse(call.function?.arguments || '{}');
      } catch {
        toolArgs = {};
      }
      const result = await executeTool(toolName, toolArgs);
      conversation.push({ role: 'tool', tool_call_id: call.id, content: result });
    }

    // Phase 2: streaming final answer (no tools param so model answers in prose)
    const response = await openai.chat.completions.create({
      model,
      stream: true,
      messages: conversation,
    } as any);

    return new Response(aiSdkV3TextStream(toTextStream(response as any)), {
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'X-Vercel-AI-Data-Stream': 'v1' },
    });
  } catch (err: any) {
    console.error('chat route error:', err);
    const status = err?.status || err?.statusCode || err?.response?.status;
    const detail = err?.error?.message || err?.message || (typeof err === 'string' ? err : null) || 'Upstream model request failed.';
    let hint = '';
    if (status === 401 || /invalid token|unauthorized|api key/i.test(String(detail))) {
      hint = ' API key rejected — use a valid llm.christmas / new-api token (sk-...).';
    } else if (status === 404 || /model/i.test(String(detail))) {
      hint = ' Model id may not exist on this gateway — pick an id from the dropdown catalog.';
    } else if (status === 502 || /502|bad gateway|ECONNREFUSED/i.test(String(detail))) {
      hint = ' Gateway 502 — try BASE_URL https://api.llm.christmas/v1 (new-api).';
    }
    return jsonError(`${detail}${status ? ` (HTTP ${status})` : ''}.${hint}`);
  }
}


async function* toTextStream(response: any) {
  for await (const chunk of response) {
    const delta = chunk?.choices?.[0]?.delta?.content;
    if (delta) yield delta;
  }
}
