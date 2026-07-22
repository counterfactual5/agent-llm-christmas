// Static metadata for the showcased GitHub projects.
// Live stats (stars/forks) are fetched separately via /api/repos.

export interface RepoMeta {
  name: string;
  tag: string;
  desc: string;
  url: string;
  badge: string;
}

export const REPOS: RepoMeta[] = [
  {
    name: 'uni-exec-engine',
    tag: 'Core Execution Engine',
    desc: 'Uniswap v2/v3/v4 execution engine: quote → approve → sign → broadcast, plus LP auto-rebalance (13K LOC, 99 tests).',
    url: 'https://github.com/counterfactual5/uni-exec-engine',
    badge: 'Python',
  },
  {
    name: 'defi-omni-cli',
    tag: 'Multi-Protocol CLI',
    desc: 'One CLI for Morpho Blue, Moonwell, Aave V3, Uniswap V3, 1inch, Lido, Compound, CCTP, and deBridge.',
    url: 'https://github.com/counterfactual5/defi-omni-cli',
    badge: 'Python',
  },
  {
    name: 'hl-trade-flow',
    tag: 'Perp DEX Trading',
    desc: 'Practical trading flow on top of official Hyperliquid SDK: quotes, slippage, positions, and orderbook.',
    url: 'https://github.com/counterfactual5/hl-trade-flow',
    badge: 'Python',
  },
  {
    name: 'polymarket-py',
    tag: 'Prediction Market SDK',
    desc: 'The Python client Polymarket never shipped: zero-dep market data + CLOB trading (EIP-191), 25+ endpoints.',
    url: 'https://github.com/counterfactual5/polymarket-py',
    badge: 'Python',
  },
  {
    name: 'agent-delegate',
    tag: 'Multi-Agent Orchestration',
    desc: 'Production-grade multi-agent router with intelligent routing, fallback chains, and pipeline workers.',
    url: 'https://github.com/counterfactual5/agent-delegate',
    badge: 'Python',
  },
  {
    name: 'Claude-Science-Proxy',
    tag: 'Tauri Desktop App',
    desc: 'Run Claude Science on your own model APIs with local sandbox, Skills/MCP managers, and web-search.',
    url: 'https://github.com/counterfactual5/Claude-Science-Proxy',
    badge: 'Rust / Tauri',
  },
];
