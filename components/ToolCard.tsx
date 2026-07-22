'use client';

import { useState } from 'react';
import { Wrench, ChevronDown, ChevronRight, CheckCircle2, XCircle } from 'lucide-react';

export interface ToolEventData {
  type: 'tool_event';
  tool: string;
  args: Record<string, unknown>;
  status: 'running' | 'done' | 'error';
  result?: string;
}

const TOOL_LABELS: Record<string, string> = {
  get_token_price: 'Token Price · CoinGecko',
  get_defi_tvl: 'Protocol TVL · DefiLlama',
  get_github_repo: 'Repo Stats · GitHub',
  get_gas_price: 'Gas Price · Ethereum RPC',
};

function fmtUsd(n: unknown): string {
  const v = Number(n);
  if (!Number.isFinite(v)) return '?';
  if (v >= 1e9) return `$${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(2)}M`;
  if (v >= 1e3) return `$${(v / 1e3).toFixed(1)}K`;
  return `$${v.toFixed(2)}`;
}

function fmtPct(n: unknown): string {
  const v = Number(n);
  if (!Number.isFinite(v)) return '';
  return `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`;
}

/** One-line human summary of a successful tool result. */
function summarize(tool: string, data: any): string {
  try {
    switch (tool) {
      case 'get_token_price':
        return Object.entries(data)
          .map(([id, v]: [string, any]) => `${id} ${fmtUsd(v.usd)} (${fmtPct(v.usd_24h_change)} 24h)`)
          .join(' · ');
      case 'get_defi_tvl':
        return `${data.name ?? '?'} TVL ${fmtUsd(data.tvl_usd)} (${fmtPct(data.change_1d_pct)} 1d)`;
      case 'get_github_repo':
        return `${data.full_name}: ★ ${data.stars ?? '?'} · forks ${data.forks ?? '?'} · ${data.language ?? 'n/a'}`;
      case 'get_gas_price':
        return `${data.gas_price_gwei ?? '?'} gwei on ${data.network ?? 'ethereum'}`;
      default:
        return '';
    }
  } catch {
    return '';
  }
}

export function ToolCard({ event }: { event: ToolEventData }) {
  const [open, setOpen] = useState(false);
  let parsed: any = null;
  try {
    parsed = event.result ? JSON.parse(event.result) : null;
  } catch {
    parsed = null;
  }
  const ok = parsed?.ok === true;
  const summary = ok ? summarize(event.tool, parsed.data) : '';

  return (
    <div className="rounded-lg border border-slate-700/70 bg-slate-900/70 text-[11px] overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-2.5 py-1.5 hover:bg-slate-800/60 transition text-left"
      >
        <Wrench className="w-3.5 h-3.5 text-blue-400 shrink-0" />
        <span className="font-medium text-slate-300">
          {TOOL_LABELS[event.tool] ?? event.tool}
        </span>
        {Object.entries(event.args).map(([k, v]) => (
          <span
            key={k}
            className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-400 truncate max-w-[140px]"
          >
            {String(v)}
          </span>
        ))}
        <span className="ml-auto flex items-center gap-1 shrink-0">
          {event.status !== 'done' ? (
            <span className="text-slate-500 italic">running…</span>
          ) : ok ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <XCircle className="w-3.5 h-3.5 text-red-400" />
          )}
          {open ? (
            <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
          )}
        </span>
      </button>
      {event.status === 'done' && !open && summary && (
        <p className="px-2.5 pb-1.5 text-slate-400">{summary}</p>
      )}
      {event.status === 'done' && !open && !ok && parsed?.error && (
        <p className="px-2.5 pb-1.5 text-red-300/90">{String(parsed.error)}</p>
      )}
      {open && (
        <pre className="px-2.5 py-2 border-t border-slate-700/70 bg-slate-950/60 text-slate-400 overflow-x-auto whitespace-pre-wrap break-all">
          {event.result ?? ''}
        </pre>
      )}
    </div>
  );
}
