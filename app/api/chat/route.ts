import { OpenAIStream, StreamData, StreamingTextResponse } from 'ai';
import OpenAI from 'openai';
import { executeTool, TOOL_DEFINITIONS, ToolEvent } from '@/lib/tools';

export const runtime = 'nodejs';
export const maxDuration = 60;

const SYSTEM_PROMPT = `You are the Web3 & DeFi Agent on agent.llm.christmas, a public showcase of open-source DeFi/agent tooling by github.com/counterfactual5.

You have 4 built-in tools backed by live public APIs:
- get_token_price: current USD prices (CoinGecko)
- get_defi_tvl: protocol TVL data (DefiLlama)
- get_github_repo: GitHub repo stats — use this when asked about the showcased projects (owner is "counterfactual5", e.g. counterfactual5/uni-exec-engine)
- get_gas_price: current Ethereum gas price

Rules:
- Use tools for anything price/TVL/gas/repo related instead of guessing numbers. If you need several tools, call them all in one block. Always mention the data source in your answer.
- If a tool returns an error, say so plainly and suggest a corrected query if obvious.
- For everything else, answer from general knowledge. Be concise, analytical, and helpful.
- Format answers in Markdown (tables for comparisons, code blocks for code).`;

function jsonError(message: string, status = 500) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/** True when the gateway/model rejects the `tools` parameter itself. */
function isToolsUnsupportedError(err: any): boolean {
  const msg = String(err?.message || err?.error?.message || '').toLowerCase();
  const status = err?.status ?? err?.error?.status;
  if (status === 400 || status === 404 || status === 422) {
    return (
      msg.includes('tool') ||
      msg.includes('function') ||
      msg.includes('not supported') ||
      msg.includes('unknown field') ||
      msg.includes('invalid parameter')
    );
  }
  return false;
}

/** Plain-text stream (no data-stream protocol) for responses without tool events. */
function plainTextResponse(text: string) {
  const encoder = new TextEncoder();
  return new StreamingTextResponse(
    new ReadableStream({
      start(controller) {
        if (text) controller.enqueue(encoder.encode(text));
        controller.close();
      },
    })
  );
}

export async function POST(req: Request) {
  try {
    const { messages, model = 'deepseek-v4-flash-200k' } = await req.json();

    const apiKey = process.env.LLM_CHRISTMAS_API_KEY || process.env.OPENAI_API_KEY || '';
    const baseURL = (process.env.LLM_CHRISTMAS_BASE_URL || 'https://api.llm.christmas/v1').replace(/\/$/, '');

    if (!apiKey) {
      return jsonError(
        'Missing LLM_CHRISTMAS_API_KEY (or OPENAI_API_KEY) in Vercel environment variables.'
      );
    }
    if (!Array.isArray(messages)) {
      return jsonError('Invalid request: messages must be an array.', 400);
    }

    const openai = new OpenAI({ apiKey, baseURL });
    const baseMessages = [{ role: 'system', content: SYSTEM_PROMPT }, ...messages];

    // --- Phase 1: one non-streaming call with tools to get tool-call decisions ---
    let conversation: any[] = baseMessages;
    const toolEvents: ToolEvent[] = [];

    try {
      const completion = await openai.chat.completions.create({
        model,
        stream: false,
        messages: baseMessages,
        tools: TOOL_DEFINITIONS,
        tool_choice: 'auto',
      } as any);

      const choice = completion.choices?.[0];
      const toolCalls: any[] = choice?.message?.tool_calls || [];

      if (toolCalls.length === 0) {
        // Direct answer — we already have the full text, no second upstream call needed.
        return plainTextResponse(choice?.message?.content || '');
      }

      // Execute all tool calls (parallel-safe: our 4 tools are independent).
      conversation = [...conversation, choice.message];
      const results = await Promise.all(
        toolCalls.map(async (call) => {
          let args: Record<string, unknown> = {};
          try {
            args = JSON.parse(call.function?.arguments || '{}');
          } catch {
            args = {};
          }
          const result = await executeTool(call.function?.name, args);
          return { call, args, result };
        })
      );
      for (const { call, args, result } of results) {
        toolEvents.push({ tool: call.function?.name, args, status: 'done', result });
        conversation = [
          ...conversation,
          { role: 'tool', tool_call_id: call.id, content: result },
        ];
      }
    } catch (err: any) {
      if (isToolsUnsupportedError(err)) {
        // Gateway/model can't do tool calling — fall back to plain streaming chat.
        const fallback = await openai.chat.completions.create({
          model,
          stream: true,
          messages: baseMessages,
        });
        return new StreamingTextResponse(OpenAIStream(fallback as any));
      }
      throw err;
    }

    // --- Phase 2: stream the final answer (no tools param → model must reply in text) ---
    const data = new StreamData();
        for (const event of toolEvents) {
          // Cast: StreamData expects JSONValue; our ToolEvent shape is serializable JSON
          data.appendMessageAnnotation({
            type: 'tool_event',
            tool: event.tool,
            args: event.args as Record<string, string | number | boolean | null>,
            status: event.status,
            result: event.result ?? null,
          } as any);
        }

    const response = await openai.chat.completions.create({
      model,
      stream: true,
      messages: conversation,
    });

    const stream = OpenAIStream(response as any, {
      experimental_streamData: true,
      onFinal: () => {
        data.close();
      },
    });
    return new StreamingTextResponse(stream, {}, data);
  } catch (err: any) {
    console.error('chat route error:', err);
    const message =
      err?.message ||
      err?.error?.message ||
      'Upstream model request failed. Check CPA base URL, API key, and model id.';
    return jsonError(message);
  }
}
