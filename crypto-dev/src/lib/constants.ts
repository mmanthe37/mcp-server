export const SUPPORTED_CHAINS = [
  { id: 1, name: "Ethereum", icon: "⟠", rpc: "https://eth.llamarpc.com" },
  { id: 137, name: "Polygon", icon: "⬡", rpc: "https://polygon.llamarpc.com" },
  { id: 42161, name: "Arbitrum", icon: "🔵", rpc: "https://arb1.arbitrum.io/rpc" },
  { id: 10, name: "Optimism", icon: "🔴", rpc: "https://mainnet.optimism.io" },
  { id: 8453, name: "Base", icon: "🔷", rpc: "https://mainnet.base.org" },
  { id: 43114, name: "Avalanche", icon: "🔺", rpc: "https://api.avax.network/ext/bc/C/rpc" },
  { id: 56, name: "BSC", icon: "🟡", rpc: "https://bsc-dataseed.binance.org" },
] as const;

export const NAV_ITEMS = [
  { href: "/", label: "DevShell", icon: "Terminal" },
  { href: "/dashboard", label: "Dashboard", icon: "LayoutDashboard" },
  { href: "/ecosystems", label: "Ecosystems", icon: "Globe" },
  { href: "/bots", label: "Bot Forge", icon: "Bot" },
  { href: "/discover", label: "Discovery", icon: "Compass" },
  { href: "/governance", label: "Governance", icon: "Vote" },
  { href: "/analytics", label: "Analytics", icon: "BarChart3" },
  { href: "/settings", label: "Settings", icon: "Settings" },
] as const;

export const BOT_TYPE_KEYS = [
  "Trading",
  "Signal",
  "OnchainSocial",
  "Chat",
  "Other",
] as const;

export type BotType = (typeof BOT_TYPE_KEYS)[number];

export const BOT_TYPES = [
  { id: "sniper", name: "Token Sniper", icon: "🎯", description: "Snipe new token launches & liquidity additions" },
  { id: "arbitrage", name: "Arbitrage", icon: "⚡", description: "Cross-DEX price discrepancies" },
  { id: "mev", name: "MEV Bot", icon: "🔥", description: "Sandwich, backrun & frontrun strategy executor" },
  { id: "signal", name: "Signal Bot", icon: "📡", description: "Monitor wallets & emit webhook alerts" },
  { id: "scraper", name: "Data Scraper", icon: "🕷️", description: "On-chain data extraction & indexing" },
  { id: "social", name: "Social Bot", icon: "💬", description: "Monitor decentralized social platforms" },
  { id: "ai-chat", name: "AI Chat Agent", icon: "🤖", description: "LLM-powered trading assistant" },
  { id: "liquidation", name: "Liquidation Bot", icon: "💀", description: "Monitor under-collateralized positions" },
  { id: "copy-trade", name: "Copy Trader", icon: "🔄", description: "Mirror whale wallet activity" },
  { id: "rebalancer", name: "Portfolio Rebalancer", icon: "⚖️", description: "Auto-rebalance portfolio allocations" },
  { id: "custom", name: "Custom", icon: "🛠️", description: "Build from scratch with SDK" },
] as const;
