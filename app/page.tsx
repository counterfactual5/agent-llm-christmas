'use client';

import { useChat } from 'ai/react';
import { useEffect, useRef, useState } from 'react';
import {
  ExternalLink,
  Activity,
  Bot,
  Send,
  Sparkles,
  AlertCircle,
  Github,
  Code2,
  Database,
  TerminalSquare,
  Network,
  MessageSquare,
} from 'lucide-react';
import { Markdown } from '@/components/Markdown';

const REPOS = [
  {
    name: 'uni-exec-engine',
    tag: 'Core Execution Engine',
    desc: 'Uniswap v2/v3/v4 execution engine: quote → approve → sign → broadcast, plus LP auto-rebalance.',
    url: 'https://github.com/counterfactual5/uni-exec-engine',
    badge: 'Python',
    icon: <Database className="w-4 h-4 text-indigo-500" />,
    demoPrompt: "Use uni-exec-engine to build a quote request plan for swapping 1 ETH to USDC on Ethereum. Do not invent an output amount.",
  },
  {
    name: 'evm-wallet-scanner',
    tag: 'Wallet Portfolio Scanner',
    desc: 'Multi-chain wallet asset scanner: query native and token balances across EVM networks.',
    url: 'https://github.com/counterfactual5/evm-wallet-scanner',
    badge: 'Python',
    icon: <Sparkles className="w-4 h-4 text-cyan-500" />,
    demoPrompt: "Scan token balances for wallet 0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8 on Ethereum.",
  },
  {
    name: 'erc20-checker',
    tag: 'Token Allowance Inspector',
    desc: 'Scan token approvals, locate spent allowance risks, and build raw revoke transaction payloads.',
    url: 'https://github.com/counterfactual5/erc20-checker',
    badge: 'Python',
    icon: <AlertCircle className="w-4 h-4 text-red-500" />,
    demoPrompt: "Scan active token approvals for wallet 0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8.",
  },
  {
    name: 'defi-omni-cli',
    tag: 'Multi-Protocol CLI',
    desc: 'One CLI for Morpho Blue, Moonwell, Aave V3, Uniswap V3, 1inch, Lido, Compound, CCTP, and deBridge.',
    url: 'https://github.com/counterfactual5/defi-omni-cli',
    badge: 'Python',
    icon: <TerminalSquare className="w-4 h-4 text-rose-500" />,
    demoPrompt: "Run the defi-omni-cli doctor on Ethereum mainnet and explain each RPC and gas preflight check.",
  },
  {
    name: 'hl-trade-flow',
    tag: 'Perp DEX Trading',
    desc: 'Practical trading flow on top of official Hyperliquid SDK: quotes, slippage, positions, and orderbook.',
    url: 'https://github.com/counterfactual5/hl-trade-flow',
    badge: 'Python',
    icon: <Activity className="w-4 h-4 text-emerald-500" />,
    demoPrompt: "Use hl-trade-flow to estimate a $10,000 BTC buy from the live Hyperliquid L2 book with a 0.5% slippage limit.",
  },
  {
    name: 'polymarket-sdk',
    tag: 'Prediction Market SDK',
    desc: 'The Python client Polymarket never shipped: zero-dep market data + CLOB trading (EIP-191).',
    url: 'https://github.com/counterfactual5/polymarket-sdk',
    badge: 'Python',
    icon: <Network className="w-4 h-4 text-amber-500" />,
    demoPrompt: "Use polymarket-sdk to search for active Bitcoin prediction markets and summarize their live outcome prices.",
  },
];

const MODELS = [
  { id: 'deepseek-v4-flash-200k', label: 'DeepSeek V4 Flash 200K' },
  { id: 'deepseek-v4-pro', label: 'DeepSeek V4 Pro' },
  { id: 'deepseek-v4-flash', label: 'DeepSeek V4 Flash' },
  { id: 'glm-5.2', label: 'GLM 5.2' },
  { id: 'mistral-large-latest', label: 'Mistral Large' },
  { id: 'minimax-m3', label: 'MiniMax M3' },
];

export default function AgentPage() {
  const [selectedModel, setSelectedModel] = useState('deepseek-v4-flash-200k');
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { messages, input, setInput, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
    body: { model: selectedModel },
    onError: (err) => setError(err.message || 'Chat request failed'),
    onResponse: (res) => {
      if (!res.ok) {
        res.clone().json().then((data) => setError(data?.error || res.statusText)).catch(() => setError(res.statusText));
      } else {
        setError(null);
      }
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div className="min-h-screen text-slate-900 selection:bg-blue-100">
      {/* Top Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between px-5 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 border border-blue-100">
              <Bot className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h1 className="flex items-center gap-2 text-[15px] font-bold text-slate-800 tracking-tight">
                agent.llm.christmas
                <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
                  Live Tools
                </span>
              </h1>
              <p className="text-[11px] text-slate-500 font-medium">
                Live package tools: order books, LP risk, RPC preflight, and market validation
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-shadow cursor-pointer"
            >
              {MODELS.map((m) => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </select>
            <a
              href="https://llm.christmas"
              target="_blank"
              rel="noreferrer"
              className="hidden sm:flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 transition"
            >
              Gateway <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-[1200px] flex-col lg:flex-row gap-6 px-5 py-6 h-[calc(100vh-65px)]">
        {/* Left Sidebar (Tools & Repos) */}
        <aside className="w-full lg:w-[320px] flex flex-col gap-4 overflow-hidden shrink-0">
          
          <div className="glass-panel p-4 flex flex-col flex-1 overflow-hidden">
            <div className="mb-4">
              <h2 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                <Code2 className="h-4 w-4" /> GitHub Projects
              </h2>
              <p className="text-[11px] text-slate-500">
                Open-source DeFi & agent suite — click one to ask the agent about it.
              </p>
            </div>

            <div className="scrollbar-thin flex-1 overflow-y-auto space-y-3 pr-2">
              {REPOS.map((repo) => (
                <div
                  key={repo.name}
                  onClick={() => setInput(repo.demoPrompt)}
                  className="group cursor-pointer rounded-xl border border-slate-200 bg-slate-50/50 p-3 transition hover:bg-white hover:border-blue-200 hover:shadow-[0_4px_12px_rgba(37,99,235,0.06)]"
                >
                  <div className="flex items-start justify-between mb-1.5">
                    <div className="flex items-center gap-1.5 font-semibold text-slate-800 text-[13px]">
                      {repo.icon}
                      {repo.name}
                    </div>
                    <span className="shrink-0 rounded bg-slate-200/60 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-slate-500">
                      {repo.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed mb-2.5">
                    {repo.desc}
                  </p>
                  <div className="flex items-center justify-between text-[10px] font-medium text-slate-400">
                    <span className="text-blue-500/80 group-hover:text-blue-600 transition">Try prompt &rarr;</span>
                    <a 
                      href={repo.url} 
                      target="_blank" 
                      rel="noreferrer" 
                      onClick={(e) => e.stopPropagation()} 
                      className="hover:text-slate-700 flex items-center gap-1"
                    >
                      <Github className="h-3 w-3" /> View Repo
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Right Chat Area */}
        <section className="flex-1 flex flex-col glass-panel overflow-hidden relative bg-white">
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-5 py-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <MessageSquare className="h-4 w-4 text-blue-500" />
              Conversation
            </div>
            <div className="text-[11px] font-medium text-slate-400">
              <span className="inline-block w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5 animate-pulse"></span>
              Live Model: {selectedModel}
            </div>
          </div>

          <div className="scrollbar-thin flex-1 overflow-y-auto px-5 py-6">
            {error && (
              <div className="mb-4 flex gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Request failed</p>
                  <p className="mt-0.5 break-all opacity-90">{error}</p>
                </div>
              </div>
            )}

            {messages.length === 0 && !error ? (
              <div className="flex h-full flex-col items-center justify-center px-4 text-center">
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 border border-blue-100 shadow-sm">
                  <Sparkles className="h-6 w-6 text-blue-500" />
                </div>
                <h2 className="text-lg font-bold text-slate-800 tracking-tight">Web3 Agent with Live Built-in Tools</h2>
                <p className="mt-2 max-w-md text-sm text-slate-500 leading-relaxed">
                  The agent invokes the published Python packages on a read-only VPS bridge. Try a real package workflow:
                </p>
                <div className="mt-8 grid w-full max-w-xl grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={() => setInput("Use hl-trade-flow to estimate a $10,000 BTC buy from the live Hyperliquid L2 book with a 0.5% slippage limit.")}
                    className="flex flex-col text-left rounded-xl border border-slate-200 bg-white p-4 transition hover:border-blue-300 hover:shadow-[0_4px_20px_rgba(37,99,235,0.06)]"
                  >
                    <span className="text-xs font-bold text-slate-700 mb-1">L2 execution quote</span>
                    <span className="text-[11px] text-slate-500 leading-relaxed">Walk Hyperliquid's live book and calculate fill price, depth, and slippage.</span>
                  </button>
                  <button
                    onClick={() => setInput("Use uni-exec-engine to build a quote request plan for swapping 1 ETH to USDC on Ethereum. Do not invent an output amount.")}
                    className="flex flex-col text-left rounded-xl border border-slate-200 bg-white p-4 transition hover:border-blue-300 hover:shadow-[0_4px_20px_rgba(37,99,235,0.06)]"
                  >
                    <span className="text-xs font-bold text-slate-700 mb-1">Uniswap request plan</span>
                    <span className="text-[11px] text-slate-500 leading-relaxed">Resolve tokens and construct the real Trading API payload without fake output.</span>
                  </button>
                  <button
                    onClick={() => setInput("Run the defi-omni-cli doctor on Ethereum mainnet and explain each RPC and gas preflight check.")}
                    className="flex flex-col text-left rounded-xl border border-slate-200 bg-white p-4 transition hover:border-blue-300 hover:shadow-[0_4px_20px_rgba(37,99,235,0.06)] sm:col-span-2"
                  >
                    <span className="text-xs font-bold text-slate-700 mb-1">DeFi execution preflight</span>
                    <span className="text-[11px] text-slate-500 leading-relaxed">Use defi-omni-cli to verify the chain, RPC, signer state, balance, and gas.</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6 pb-4">
                {messages.map((m) => {
                  const isUser = m.role === 'user';
                  return (
                    <div key={m.id} className={`flex gap-3 max-w-[85%] ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}>
                      <div className={`shrink-0 flex h-8 w-8 items-center justify-center rounded-full shadow-sm border ${isUser ? 'bg-slate-100 border-slate-200' : 'bg-blue-600 border-blue-700'}`}>
                        {isUser ? <span className="text-[11px] font-bold text-slate-500">YOU</span> : <Bot className="h-4 w-4 text-white" />}
                      </div>
                      <div className={`relative px-4 py-3 text-[13.5px] leading-relaxed shadow-sm ${
                        isUser
                          ? 'bg-slate-100 text-slate-800 rounded-2xl rounded-tr-sm border border-slate-200'
                          : 'bg-white text-slate-700 rounded-2xl rounded-tl-sm border border-slate-200'
                      }`}>
                        {isUser ? <div className="whitespace-pre-wrap">{m.content}</div> : <Markdown>{m.content || ''}</Markdown>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {isLoading && (
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-4 pl-11">
                <Activity className="h-4 w-4 animate-spin text-blue-500" />
                <span className="animate-pulse">Agent is thinking and processing tools...</span>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <form onSubmit={handleSubmit} className="border-t border-slate-100 bg-slate-50 p-4">
            <div className="mx-auto flex items-end gap-3 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm transition-shadow focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-500/10">
              <textarea
                value={input}
                onChange={handleInputChange}
                rows={1}
                placeholder="Ask about prices, TVL, repos, gas — or click a project card on the left..."
                className="max-h-32 min-h-[44px] flex-1 resize-none bg-transparent px-3 py-2.5 text-sm text-slate-800 outline-none placeholder:text-slate-400"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (!isLoading && input.trim()) handleSubmit(e as any);
                  }
                }}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md transition hover:bg-blue-700 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
              >
                <Send className="h-4 w-4 ml-0.5" />
              </button>
            </div>
            <div className="mt-2 text-center text-[10.5px] font-medium text-slate-400">
              Enter to send · Shift+Enter newline · Tools run server-side via free public APIs
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}
