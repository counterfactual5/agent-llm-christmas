'use client';

import { useEffect, useState } from 'react';
import { Code, ExternalLink, GitFork, Star, Wrench, Zap } from 'lucide-react';
import { REPOS } from '@/lib/repos';

interface RepoStats {
  name: string;
  stars: number | null;
  forks: number | null;
}

const LIVE_TOOLS = [
  {
    name: 'get_token_price',
    label: 'Token Price',
    source: 'CoinGecko',
    sample: 'What is the current price of ETH and BTC? Include the 24h change.',
  },
  {
    name: 'get_defi_tvl',
    label: 'Protocol TVL',
    source: 'DefiLlama',
    sample: "What is Uniswap's current TVL? Break it down by chain.",
  },
  {
    name: 'get_github_repo',
    label: 'Repo Stats',
    source: 'GitHub API',
    sample: 'How many stars does uni-exec-engine have, and what does the repo do?',
  },
  {
    name: 'get_gas_price',
    label: 'Gas Price',
    source: 'tools.defiagent · Etherscan V2',
    sample: 'What is Ethereum gas right now? Is it a good time to transact?',
  },
];

export function RepoPanel({ onSuggest }: { onSuggest: (prompt: string) => void }) {
  const [stats, setStats] = useState<Record<string, RepoStats>>({});

  useEffect(() => {
    fetch('/api/repos')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data?.repos) return;
        const map: Record<string, RepoStats> = {};
        for (const s of data.repos) map[s.name] = s;
        setStats(map);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="glass sticky top-[72px] overflow-hidden rounded-[22px]">
      {/* built-in tools */}
      <div className="border-b border-white/5 bg-gradient-to-r from-amber-500/10 via-transparent to-sky-500/10 px-4 py-3">
        <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-white">
          <Zap className="h-4 w-4 text-amber-300" />
          Built-in Live Tools
        </div>
        <p className="text-[11px] leading-relaxed text-slate-400">
          Free public APIs the agent can call mid-conversation. Click one to try it.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2 p-3">
        {LIVE_TOOLS.map((tool) => (
          <button
            key={tool.name}
            type="button"
            onClick={() => onSuggest(tool.sample)}
            className="rounded-2xl border border-white/8 bg-white/[0.03] p-2.5 text-left transition hover:border-amber-400/30 hover:bg-amber-400/5"
          >
            <div className="mb-0.5 flex items-center gap-1.5">
              <Wrench className="h-3 w-3 text-amber-300/80" />
              <span className="text-xs font-semibold text-slate-200">{tool.label}</span>
            </div>
            <p className="text-[10px] text-slate-500">{tool.source}</p>
          </button>
        ))}
      </div>

      {/* github projects */}
      <div className="border-t border-white/5 px-4 py-3">
        <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-white">
          <Code className="h-4 w-4 text-sky-300" />
          GitHub Projects
        </div>
        <p className="text-[11px] leading-relaxed text-slate-400">
          Open-source DeFi & agent suite — ask the agent about any of these, it fetches live stats.
        </p>
      </div>
      <div className="scrollbar-thin max-h-[44vh] space-y-2 overflow-y-auto px-3 pb-3">
        {REPOS.map((repo) => {
          const s = stats[repo.name];
          return (
            <a
              key={repo.name}
              href={repo.url}
              target="_blank"
              rel="noreferrer"
              className="group block rounded-2xl border border-white/8 bg-white/[0.03] p-3 transition hover:border-sky-400/30 hover:bg-sky-400/5"
            >
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="flex items-center gap-1 text-xs font-semibold text-sky-300 group-hover:text-sky-200">
                  {repo.name}
                  <ExternalLink className="h-3 w-3 opacity-0 transition group-hover:opacity-100" />
                </span>
                <span className="shrink-0 rounded-md bg-white/5 px-1.5 py-0.5 text-[10px] text-slate-400 ring-1 ring-white/10">
                  {repo.badge}
                </span>
              </div>
              <p className="line-clamp-2 text-[11px] leading-relaxed text-slate-400">{repo.desc}</p>
              <div className="mt-1.5 flex items-center gap-3 text-[10px] text-slate-500">
                <span className="text-amber-300/80">{repo.tag}</span>
                <span className="ml-auto flex items-center gap-1">
                  <Star className="h-3 w-3" />
                  {s?.stars ?? '—'}
                </span>
                <span className="flex items-center gap-1">
                  <GitFork className="h-3 w-3" />
                  {s?.forks ?? '—'}
                </span>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
