'use client';

import { useChat } from 'ai/react';
import { useState } from 'react';
import { ExternalLink, Activity, Bot, Send, Code, Sparkles, AlertCircle } from 'lucide-react';

const REPOS = [
  {
    name: 'uni-exec-engine',
    tag: 'Core Execution Engine',
    desc: 'Uniswap v2/v3/v4 execution engine: quote → approve → sign → broadcast, plus LP auto-rebalance (13K LOC, 99 tests).',
    url: 'https://github.com/counterfactual5/uni-exec-engine',
    badge: 'Python',
    toolStatus: 'Showcase',
  },
  {
    name: 'defi-omni-cli',
    tag: 'Multi-Protocol CLI',
    desc: 'One CLI for Morpho Blue, Moonwell, Aave V3, Uniswap V3, 1inch, Lido, Compound, CCTP, and deBridge.',
    url: 'https://github.com/counterfactual5/defi-omni-cli',
    badge: 'Python',
    toolStatus: 'Showcase',
  },
  {
    name: 'hl-trade-flow',
    tag: 'Perp DEX Trading',
    desc: 'Practical trading flow on top of official Hyperliquid SDK: quotes, slippage, positions, and orderbook.',
    url: 'https://github.com/counterfactual5/hl-trade-flow',
    badge: 'Python',
    toolStatus: 'Showcase',
  },
  {
    name: 'polymarket-py',
    tag: 'Prediction Market SDK',
    desc: 'The Python client Polymarket never shipped: zero-dep market data + CLOB trading (EIP-191), 25+ endpoints.',
    url: 'https://github.com/counterfactual5/polymarket-py',
    badge: 'Python',
    toolStatus: 'Planned tool',
  },
  {
    name: 'agent-delegate',
    tag: 'Multi-Agent Orchestration',
    desc: 'Production-grade multi-agent router with intelligent routing, fallback chains, and pipeline workers.',
    url: 'https://github.com/counterfactual5/agent-delegate',
    badge: 'Python',
    toolStatus: 'Showcase',
  },
  {
    name: 'Claude-Science-Proxy',
    tag: 'Tauri Desktop App',
    desc: 'Run Claude Science on your own model APIs with local sandbox, Skills/MCP managers, and web-search.',
    url: 'https://github.com/counterfactual5/Claude-Science-Proxy',
    badge: 'Rust / Tauri',
    toolStatus: 'Showcase',
  },
];

// IDs must match llm.christmas / CPA model catalog (see llm-christmas Models page FALLBACK_IDS)
const MODELS = [
  { id: 'grok-4.5', label: 'Grok 4.5' },
  { id: 'deepseek-v4-pro', label: 'DeepSeek V4 Pro' },
  { id: 'deepseek-v4-flash', label: 'DeepSeek V4 Flash' },
  { id: 'deepseek-v4-flash-free', label: 'DeepSeek V4 Flash (Free)' },
  { id: 'glm-5.2-free', label: 'GLM 5.2 Free' },
  { id: 'mistral-large-latest', label: 'Mistral Large' },
  { id: 'minimax-m3', label: 'MiniMax M3' },
  { id: 'mimo-v2.5-free', label: 'MiMo V2.5 Free' },
];

export default function AgentPage() {
  const [selectedModel, setSelectedModel] = useState(MODELS[0].id);
  const [error, setError] = useState<string | null>(null);

  const { messages, input, setInput, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
    body: { model: selectedModel },
    onError: (err) => {
      setError(err.message || 'Chat request failed');
    },
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

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-base flex items-center gap-2">
                agent.llm.christmas
                <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Agent Showcase
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                Powered by CPA gateway · left panel = OSS suite (not live tools yet)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-xs rounded-lg px-2.5 py-1.5 text-slate-200 outline-none focus:border-blue-500"
            >
              {MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
            <a
              href="https://llm.christmas"
              target="_blank"
              rel="noreferrer"
              className="text-xs px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 font-medium transition text-white flex items-center gap-1.5"
            >
              Gateway Status
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
            <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2 mb-1">
              <Code className="w-4 h-4 text-blue-400" />
              DeFi & Agent Execution Suite
            </h2>
            <p className="text-xs text-slate-400 mb-3">
              These are your GitHub projects. Chat currently talks to the model via CPA;
              tool adapters (HTTP wrappers around these repos) come next.
            </p>
            <div className="space-y-2.5 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
              {REPOS.map((repo) => (
                <a
                  key={repo.name}
                  href={repo.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block p-3 rounded-lg bg-slate-800/40 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600 transition group"
                >
                  <div className="flex items-center justify-between mb-1 gap-2">
                    <span className="font-semibold text-xs text-blue-400 group-hover:text-blue-300 flex items-center gap-1">
                      {repo.name}
                      <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition" />
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-300 shrink-0">
                      {repo.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">{repo.desc}</p>
                  <p className="text-[10px] text-amber-400/80 mt-1.5">{repo.toolStatus}</p>
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 flex flex-col bg-slate-900/40 border border-slate-800 rounded-xl h-[calc(100vh-120px)] overflow-hidden">
          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {error && (
              <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-200 flex gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold mb-0.5">Request failed</p>
                  <p className="text-red-200/90 break-all">{error}</p>
                  <p className="text-red-200/70 mt-1">
                    Check Vercel env: LLM_CHRISTMAS_BASE_URL (e.g. https://cpa.llm.christmas/v1) and
                    LLM_CHRISTMAS_API_KEY. Model id must exist on CPA.
                  </p>
                </div>
              </div>
            )}

            {messages.length === 0 && !error ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div className="max-w-md">
                  <h3 className="font-bold text-slate-200 text-base mb-1">Web3 Agent Interactive Demo</h3>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">
                    Chat is live via CPA. Left-side repos are showcase links; wiring them as server tools is the next step.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
                    <button
                      type="button"
                      onClick={() => setInput('Explain what uni-exec-engine does and how it differs from a thin Uniswap SDK.')}
                      className="p-2.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-xs text-slate-300 text-left transition"
                    >
                      <span className="text-blue-400 font-medium block mb-0.5">About uni-exec-engine</span>
                      How it differs from a thin SDK
                    </button>
                    <button
                      type="button"
                      onClick={() => setInput('What tools should a DeFi research agent expose as read-only HTTP APIs?')}
                      className="p-2.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-xs text-slate-300 text-left transition"
                    >
                      <span className="text-blue-400 font-medium block mb-0.5">Agent tool design</span>
                      Read-only HTTP tools for DeFi
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {m.role !== 'user' && (
                    <div className="w-7 h-7 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0 mt-0.5">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] rounded-xl px-4 py-2.5 text-xs leading-relaxed whitespace-pre-wrap ${
                      m.role === 'user'
                        ? 'bg-blue-600 text-white rounded-br-none'
                        : 'bg-slate-800/90 border border-slate-700/70 text-slate-200 rounded-bl-none'
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex gap-2 items-center text-xs text-slate-400 italic">
                <Activity className="w-3.5 h-3.5 animate-spin text-blue-400" />
                Agent is processing request...
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="p-3 border-t border-slate-800 bg-slate-900/60">
            <div className="flex items-center gap-2">
              <input
                value={input}
                onChange={handleInputChange}
                placeholder="Ask the Web3 Agent..."
                className="flex-1 bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium text-xs transition flex items-center gap-1.5"
              >
                <span>Send</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-[10px] text-slate-500 mt-2 px-1">
              Model: <span className="text-slate-300">{selectedModel}</span> · scripts for skills live in each GitHub
              repo / skills-formyself; this site does not shell-exec them yet.
            </p>
          </form>
        </div>
      </main>
    </div>
  );
}
