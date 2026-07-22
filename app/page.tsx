'use client';

import { useChat } from 'ai/react';
import { useEffect, useRef, useState } from 'react';
import {
  Activity,
  AlertCircle,
  Bot,
  ExternalLink,
  Github,
  MessageSquare,
  Send,
  Sparkles,
  Square,
} from 'lucide-react';
import { Markdown } from '@/components/Markdown';
import { RepoPanel } from '@/components/RepoPanel';
import { ToolCard, ToolEventData } from '@/components/ToolCard';

// IDs must match llm.christmas / CPA model catalog (see llm-christmas Models page FALLBACK_IDS)
const MODELS = [
  { id: 'deepseek-v4-flash-200k', label: 'DeepSeek V4 Flash 200K' },
  { id: 'grok-4.5', label: 'Grok 4.5' },
  { id: 'deepseek-v4-pro', label: 'DeepSeek V4 Pro' },
  { id: 'deepseek-v4-flash', label: 'DeepSeek V4 Flash' },
  { id: 'glm-5.2-free', label: 'GLM 5.2 Free' },
  { id: 'mistral-large-latest', label: 'Mistral Large' },
  { id: 'minimax-m3', label: 'MiniMax M3' },
  { id: 'mimo-v2.5-free', label: 'MiMo V2.5 Free' },
];

const SUGGESTIONS = [
  {
    title: 'Live token prices',
    prompt: 'What is the current price of ETH and BTC? Include the 24h change.',
  },
  {
    title: 'Uniswap TVL',
    prompt: "What is Uniswap's current TVL? Break it down by chain.",
  },
  {
    title: 'About uni-exec-engine',
    prompt: 'How many stars does uni-exec-engine have, and what does the repo do?',
  },
  {
    title: 'Gas check',
    prompt: 'What is Ethereum gas right now? Is it a good time to transact?',
  },
];

function toolEventsOf(annotations: unknown): ToolEventData[] {
  if (!Array.isArray(annotations)) return [];
  return annotations.filter(
    (a): a is ToolEventData =>
      !!a && typeof a === 'object' && (a as any).type === 'tool_event' && !!(a as any).tool
  );
}

export default function AgentPage() {
  const [selectedModel, setSelectedModel] = useState(MODELS[0].id);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { messages, input, setInput, handleInputChange, handleSubmit, isLoading, stop } = useChat({
    api: '/api/chat',
    body: { model: selectedModel },
    onError: (err) => setError(err.message || 'Chat request failed'),
    onResponse: (res) => {
      if (!res.ok) {
        res
          .clone()
          .json()
          .then((data) => setError(data?.error || res.statusText))
          .catch(() => setError(res.statusText));
      } else {
        setError(null);
      }
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isLoading]);

  const suggest = (prompt: string) => {
    setInput(prompt);
    inputRef.current?.focus();
  };

  return (
    <div className="min-h-screen text-slate-100">
      {/* top bar */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#070a12]/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400/20 to-violet-500/20 ring-1 ring-white/10">
              <Bot className="h-5 w-5 text-sky-300" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-sm font-semibold tracking-tight text-white sm:text-base">
                  agent.llm.christmas
                </h1>
                <span className="rounded-full bg-amber-400/10 px-2 py-0.5 text-[10px] font-medium text-amber-300 ring-1 ring-amber-400/20">
                  Live Tools
                </span>
              </div>
              <p className="truncate text-[11px] text-slate-400">
                Web3 agent demo with built-in price / TVL / repo / gas tools
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="max-w-[130px] rounded-xl border border-white/10 bg-slate-900/80 px-2.5 py-1.5 text-xs text-slate-100 outline-none transition focus:ring-2 focus:ring-sky-400/40 sm:max-w-none"
            >
              {MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
            <a
              href="https://github.com/counterfactual5"
              target="_blank"
              rel="noreferrer"
              aria-label="GitHub profile"
              className="hidden rounded-xl border border-white/10 bg-slate-900/80 p-1.5 text-slate-300 transition hover:bg-slate-800 sm:flex"
            >
              <Github className="h-4 w-4" />
            </a>
            <a
              href="https://llm.christmas"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-lg shadow-sky-900/30 transition hover:brightness-110"
            >
              Gateway
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1400px] grid-cols-1 gap-4 px-4 py-4 sm:px-6 lg:grid-cols-12 lg:gap-5 lg:py-5">
        {/* chat — first on mobile, right column on desktop */}
        <section className="order-1 flex min-h-[70vh] flex-col lg:order-2 lg:col-span-8 xl:col-span-9">
          <div className="glass flex min-h-[70vh] flex-1 flex-col overflow-hidden rounded-[22px] lg:min-h-[calc(100vh-120px)]">
            <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
              <div className="flex items-center gap-2 text-sm font-medium text-white">
                <MessageSquare className="h-4 w-4 text-violet-300" />
                Conversation
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                Model <span className="text-slate-200">{selectedModel}</span>
              </div>
            </div>

            <div className="scrollbar-thin flex-1 space-y-4 overflow-y-auto px-3 py-4 sm:px-5">
              {error && (
                <div className="flex gap-2 rounded-2xl border border-red-400/25 bg-red-500/10 px-3 py-2.5 text-xs text-red-100">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <div>
                    <p className="font-semibold">Request failed</p>
                    <p className="mt-0.5 break-all text-red-100/90">{error}</p>
                    <p className="mt-1 text-red-100/70">
                      Check env: LLM_CHRISTMAS_API_KEY and LLM_CHRISTMAS_BASE_URL (default
                      https://api.llm.christmas/v1). Model id must exist on the gateway.
                    </p>
                  </div>
                </div>
              )}

              {messages.length === 0 && !error ? (
                <div className="flex h-full flex-col items-center justify-center px-2 py-10 text-center">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-3xl bg-gradient-to-br from-sky-400/20 to-violet-500/20 ring-1 ring-white/10">
                    <Sparkles className="h-7 w-7 text-sky-300" />
                  </div>
                  <h2 className="text-lg font-semibold tracking-tight text-white">
                    Web3 Agent with Live Built-in Tools
                  </h2>
                  <p className="mt-2 max-w-lg text-sm leading-relaxed text-slate-400">
                    The agent calls free public APIs mid-chat — prices, TVL, repo stats, gas. Tool
                    calls show up as cards above the answer. Try one:
                  </p>
                  <div className="mt-6 grid w-full max-w-2xl grid-cols-1 gap-2 sm:grid-cols-2">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s.title}
                        type="button"
                        onClick={() => suggest(s.prompt)}
                        className="rounded-2xl border border-white/8 bg-white/[0.03] p-3 text-left transition hover:border-sky-400/30 hover:bg-sky-400/5"
                      >
                        <div className="text-xs font-semibold text-sky-200">{s.title}</div>
                        <div className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-slate-400">
                          {s.prompt}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((m) => {
                  const isUser = m.role === 'user';
                  const toolEvents = isUser ? [] : toolEventsOf(m.annotations);
                  return (
                    <div
                      key={m.id}
                      className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      {!isUser && (
                        <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400/20 to-violet-500/20 ring-1 ring-white/10">
                          <Bot className="h-4 w-4 text-sky-300" />
                        </div>
                      )}
                      <div
                        className={`max-w-[min(100%,720px)] ${isUser ? 'flex flex-col items-end' : 'space-y-2'}`}
                      >
                        {toolEvents.length > 0 && (
                          <div className="w-full space-y-1.5">
                            {toolEvents.map((ev, i) => (
                              <ToolCard key={`${ev.tool}-${i}`} event={ev} />
                            ))}
                          </div>
                        )}
                        <div
                          className={`rounded-[18px] px-3.5 py-2.5 text-[13px] leading-relaxed sm:px-4 ${
                            isUser
                              ? 'rounded-br-md bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-900/20'
                              : 'rounded-bl-md border border-white/8 bg-white/[0.04] text-slate-100'
                          }`}
                        >
                          {isUser ? (
                            <div className="whitespace-pre-wrap">{m.content}</div>
                          ) : (
                            <Markdown>{m.content}</Markdown>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}

              {isLoading && (
                <div className="flex items-center gap-2 pl-10 text-xs text-slate-400">
                  <Activity className="h-3.5 w-3.5 animate-spin text-sky-300" />
                  Agent is thinking — this may include live tool calls…
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            <form onSubmit={handleSubmit} className="border-t border-white/5 bg-black/20 p-3 sm:p-4">
              <div className="flex items-end gap-2 rounded-2xl border border-white/10 bg-slate-950/70 p-2 shadow-inner ring-1 ring-white/5 focus-within:border-sky-400/40 focus-within:ring-sky-400/20">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={handleInputChange}
                  rows={1}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (!isLoading && input.trim()) {
                        handleSubmit(e as any);
                      }
                    }
                  }}
                  placeholder="Ask about prices, TVL, repos, gas — or anything else…"
                  className="max-h-36 min-h-[44px] flex-1 resize-none bg-transparent px-2 py-2.5 text-sm text-slate-100 outline-none placeholder:text-slate-500"
                />
                {isLoading ? (
                  <button
                    type="button"
                    onClick={stop}
                    className="inline-flex h-11 items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
                  >
                    <Square className="h-4 w-4" />
                    <span className="hidden sm:inline">Stop</span>
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={!input.trim()}
                    className="inline-flex h-11 items-center gap-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 px-4 text-sm font-semibold text-white shadow-lg shadow-sky-900/30 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Send className="h-4 w-4" />
                    <span className="hidden sm:inline">Send</span>
                  </button>
                )}
              </div>
              <p className="mt-2 px-1 text-[10px] text-slate-500">
                Enter to send · Shift+Enter newline · tools run server-side via free public APIs
              </p>
            </form>
          </div>
        </section>

        {/* left rail — second on mobile */}
        <aside className="order-2 lg:order-1 lg:col-span-4 xl:col-span-3">
          <RepoPanel onSuggest={suggest} />
        </aside>
      </main>
    </div>
  );
}
