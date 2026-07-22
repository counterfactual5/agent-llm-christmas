// Built-in tools exposed to the chat agent.
// All backed by free, key-less public APIs so they work on Vercel edge runtime.

export const TOOL_DEFINITIONS = [
  {
    type: 'function' as const,
    function: {
      name: 'get_token_price',
      description:
        'Get current USD price and 24h change for crypto tokens via CoinGecko. Use for questions about token prices.',
      parameters: {
        type: 'object',
        properties: {
          ids: {
            type: 'string',
            description:
              'Comma-separated CoinGecko token ids, e.g. "ethereum,bitcoin,solana". Use lowercase full names, not tickers.',
          },
        },
        required: ['ids'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_defi_tvl',
      description:
        'Get Total Value Locked (TVL) for a DeFi protocol via DefiLlama. Use for questions about protocol TVL, rankings, or chain breakdowns.',
      parameters: {
        type: 'object',
        properties: {
          protocol: {
            type: 'string',
            description: 'Protocol slug on DefiLlama, e.g. "uniswap", "aave", "morpho-blue", "hyperliquid".',
          },
        },
        required: ['protocol'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_github_repo',
      description:
        'Get GitHub repository stats (stars, forks, description, language). Use for questions about the showcased projects or any public repo.',
      parameters: {
        type: 'object',
        properties: {
          repo: {
            type: 'string',
            description: 'Repository in "owner/name" form, e.g. "counterfactual5/uni-exec-engine".',
          },
        },
        required: ['repo'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_gas_price',
      description: 'Get current Ethereum mainnet gas price in gwei via a public RPC endpoint.',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
];

export interface ToolEvent {
  tool: string;
  args: Record<string, unknown>;
  status: 'running' | 'done' | 'error';
  result?: string;
}

const FETCH_TIMEOUT_MS = 10_000;

async function fetchJson(url: string, init?: RequestInit): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        'User-Agent': 'agent-llm-christmas',
        Accept: 'application/json',
        ...(init?.headers || {}),
      },
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} from ${new URL(url).hostname}`);
    }
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

async function getTokenPrice(ids: string): Promise<unknown> {
  const clean = ids
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 10)
    .join(',');
  if (!clean) throw new Error('No valid token ids provided');
  const data = await fetchJson(
    `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(
      clean
    )}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true`
  );
  if (data && typeof data === 'object' && !Array.isArray(data) && Object.keys(data).length === 0) {
    throw new Error(`Unknown token id(s): ${clean}. Use CoinGecko ids like "ethereum", not tickers.`);
  }
  return data;
}

async function getDefiTvl(protocol: string): Promise<unknown> {
  const slug = protocol.trim().toLowerCase().replace(/\s+/g, '-');
  const data = (await fetchJson(`https://api.llama.fi/protocol/${encodeURIComponent(slug)}`)) as any;
  if (!data || typeof data !== 'object' || data.error) {
    throw new Error(`Protocol "${slug}" not found on DefiLlama`);
  }
  const chainTvls = data.currentChainTvls || {};
  const topChains = Object.entries(chainTvls)
    .filter(([, v]) => typeof v === 'number')
    .sort((a: any, b: any) => b[1] - a[1])
    .slice(0, 8)
    .map(([chain, tvl]) => ({ chain, tvl: Math.round(tvl as number) }));
  const tvlSeries = Array.isArray(data.tvl) ? data.tvl : [];
  const latestTvl = tvlSeries[tvlSeries.length - 1]?.totalLiquidityUSD;
  const chainSum = Object.values(chainTvls).reduce<number>(
    (sum, v) => sum + (typeof v === 'number' ? v : 0),
    0
  );
  return {
    name: data.name,
    category: data.category,
    tvl_usd: Math.round(typeof latestTvl === 'number' ? latestTvl : chainSum),
    change_1d_pct: data.change_1d,
    change_7d_pct: data.change_7d,
    top_chains: topChains,
    url: data.url,
  };
}

async function getGithubRepo(repo: string): Promise<unknown> {
  const clean = repo.trim().replace(/^https?:\/\/github\.com\//, '').replace(/\/$/, '');
  if (!/^[\w.-]+\/[\w.-]+$/.test(clean)) {
    throw new Error(`Invalid repo "${repo}". Use "owner/name" form.`);
  }
  const data = (await fetchJson(`https://api.github.com/repos/${clean}`)) as any;
  return {
    full_name: data.full_name,
    description: data.description,
    stars: data.stargazers_count,
    forks: data.forks_count,
    open_issues: data.open_issues_count,
    language: data.language,
    topics: data.topics,
    created_at: data.created_at,
    pushed_at: data.pushed_at,
    url: data.html_url,
  };
}

async function getGasPrice(): Promise<unknown> {
  const data = (await fetchJson('https://ethereum-rpc.publicnode.com', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'eth_gasPrice',
      params: [],
    }),
  })) as any;
  const wei = parseInt(data?.result, 16);
  if (!Number.isFinite(wei)) throw new Error('Unexpected RPC response');
  return {
    gas_price_gwei: Math.round((wei / 1e9) * 100) / 100,
    network: 'ethereum-mainnet',
    source: 'publicnode.com',
  };
}

/** Execute a tool call and return a JSON string suitable for a `tool` role message. */
export async function executeTool(name: string, args: Record<string, unknown>): Promise<string> {
  try {
    let result: unknown;
    switch (name) {
      case 'get_token_price':
        result = await getTokenPrice(String(args.ids ?? ''));
        break;
      case 'get_defi_tvl':
        result = await getDefiTvl(String(args.protocol ?? ''));
        break;
      case 'get_github_repo':
        result = await getGithubRepo(String(args.repo ?? ''));
        break;
      case 'get_gas_price':
        result = await getGasPrice();
        break;
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
    return JSON.stringify({ ok: true, data: result });
  } catch (err: any) {
    return JSON.stringify({ ok: false, error: err?.message || 'Tool execution failed' });
  }
}
