import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { createPublicClient, http, formatEther, formatUnits, isAddress } from "viem";
import { mainnet, base, polygon, arbitrum, optimism, bsc } from "viem/chains";
import type { Chain } from "viem";

// ─── Chain map ────────────────────────────────────────────────────────────────
const CHAINS: Record<string, Chain> = {
  ethereum: mainnet,
  base: base as unknown as Chain,
  polygon: polygon as unknown as Chain,
  arbitrum: arbitrum as unknown as Chain,
  optimism: optimism as unknown as Chain,
  bsc: bsc as unknown as Chain,
};

const PUBLIC_RPCS: Record<string, string> = {
  ethereum: "https://cloudflare-eth.com",
  base: "https://mainnet.base.org",
  polygon: "https://polygon-rpc.com",
  arbitrum: "https://arb1.arbitrum.io/rpc",
  optimism: "https://mainnet.optimism.io",
  bsc: "https://bsc-dataseed.binance.org",
};

function getClient(chain: string) {
  const c = CHAINS[chain] ?? mainnet;
  const rpc = PUBLIC_RPCS[chain] ?? PUBLIC_RPCS.ethereum;
  return createPublicClient({ chain: c, transport: http(rpc) });
}

// ─── Fetch helpers ─────────────────────────────────────────────────────────────
async function cgFetch(path: string) {
  const res = await fetch(`https://api.coingecko.com/api/v3${path}`, {
    headers: { "Accept": "application/json" },
  });
  if (!res.ok) throw new Error(`CoinGecko ${res.status}: ${res.statusText}`);
  return res.json();
}

async function defiLlamaFetch(path: string) {
  const res = await fetch(`https://api.llama.fi${path}`);
  if (!res.ok) throw new Error(`DefiLlama ${res.status}: ${res.statusText}`);
  return res.json();
}

async function coincapFetch(path: string) {
  const res = await fetch(`https://api.coincap.io/v2${path}`);
  if (!res.ok) throw new Error(`CoinCap ${res.status}: ${res.statusText}`);
  return res.json();
}

// ─── Tool registration ─────────────────────────────────────────────────────────
export function registerWeb3Tools(server: McpServer): void {

  // ── 1. Token price ─────────────────────────────────────────────────────────
  server.tool(
    "get_token_price",
    "Get current price, market cap, 24h volume, and 24h change for any crypto token. Use CoinGecko IDs (e.g. bitcoin, ethereum, dogecoin, pepe, bonk).",
    {
      token_id: z.string().describe("CoinGecko token ID, e.g. 'bitcoin', 'ethereum', 'pepe', 'bonk'"),
      vs_currency: z.string().default("usd").describe("Quote currency, e.g. usd, eth, btc"),
    },
    async ({ token_id, vs_currency }) => {
      const data = await cgFetch(
        `/simple/price?ids=${token_id}&vs_currencies=${vs_currency}&include_market_cap=true&include_24hr_vol=true&include_24hr_change=true&include_last_updated_at=true`
      );
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  // ── 2. Search tokens ───────────────────────────────────────────────────────
  server.tool(
    "search_token",
    "Search CoinGecko for tokens, coins, exchanges by name or ticker. Returns IDs, symbols, and rankings.",
    { query: z.string().describe("Token name or ticker symbol, e.g. 'PEPE', 'Solana', 'BONK'") },
    async ({ query }) => {
      const data = await cgFetch(`/search?query=${encodeURIComponent(query)}`);
      const coins = (data.coins ?? []).slice(0, 10).map((c: any) => ({
        id: c.id, symbol: c.symbol, name: c.name, market_cap_rank: c.market_cap_rank,
      }));
      return { content: [{ type: "text", text: JSON.stringify(coins, null, 2) }] };
    }
  );

  // ── 3. Trending tokens ─────────────────────────────────────────────────────
  server.tool(
    "get_trending_tokens",
    "Get the top 7 trending coins on CoinGecko in the last 24 hours (useful for memecoin hunting).",
    {},
    async () => {
      const data = await cgFetch("/search/trending");
      const trending = (data.coins ?? []).map((c: any) => ({
        rank: c.item.score + 1,
        name: c.item.name,
        symbol: c.item.symbol,
        id: c.item.id,
        market_cap_rank: c.item.market_cap_rank,
        price_btc: c.item.price_btc,
      }));
      return { content: [{ type: "text", text: JSON.stringify(trending, null, 2) }] };
    }
  );

  // ── 4. Top gainers/losers ──────────────────────────────────────────────────
  server.tool(
    "get_top_movers",
    "Get top gaining and losing coins in the last 24h by percentage change. Great for memecoin/altcoin scanning.",
    {
      limit: z.number().int().min(5).max(50).default(20).describe("Number of coins to scan (top 250 by market cap)"),
    },
    async ({ limit }) => {
      const data = await cgFetch(
        `/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=1&price_change_percentage=24h`
      );
      const sorted = [...data].sort((a: any, b: any) => b.price_change_percentage_24h - a.price_change_percentage_24h);
      const gainers = sorted.slice(0, limit).map((c: any) => ({
        name: c.name, symbol: c.symbol, change_24h: `${c.price_change_percentage_24h?.toFixed(2)}%`, price: c.current_price,
      }));
      const losers = sorted.slice(-limit).reverse().map((c: any) => ({
        name: c.name, symbol: c.symbol, change_24h: `${c.price_change_percentage_24h?.toFixed(2)}%`, price: c.current_price,
      }));
      return { content: [{ type: "text", text: JSON.stringify({ gainers, losers }, null, 2) }] };
    }
  );

  // ── 5. Wallet ETH/token balance ────────────────────────────────────────────
  server.tool(
    "get_wallet_balance",
    "Get the native token balance (ETH, MATIC, BNB, etc.) of any wallet address on a supported chain.",
    {
      address: z.string().describe("EVM wallet address (0x...)"),
      chain: z.enum(["ethereum", "base", "polygon", "arbitrum", "optimism", "bsc"]).default("ethereum"),
    },
    async ({ address, chain }) => {
      if (!isAddress(address)) return { content: [{ type: "text", text: "Invalid address" }], isError: true };
      const client = getClient(chain);
      const balance = await client.getBalance({ address: address as `0x${string}` });
      return {
        content: [{
          type: "text",
          text: JSON.stringify({ address, chain, balance_wei: balance.toString(), balance_native: formatEther(balance) }, null, 2),
        }],
      };
    }
  );

  // ── 6. Gas prices ──────────────────────────────────────────────────────────
  server.tool(
    "get_gas_price",
    "Get current gas price and block info for a chain. Supports ethereum, base, polygon, arbitrum, optimism, bsc.",
    {
      chain: z.enum(["ethereum", "base", "polygon", "arbitrum", "optimism", "bsc"]).default("ethereum"),
    },
    async ({ chain }) => {
      const client = getClient(chain);
      const [gasPrice, block] = await Promise.all([
        client.getGasPrice(),
        client.getBlock(),
      ]);
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            chain,
            gas_price_wei: gasPrice.toString(),
            gas_price_gwei: formatUnits(gasPrice, 9),
            block_number: block.number?.toString(),
            block_timestamp: new Date(Number(block.timestamp) * 1000).toISOString(),
          }, null, 2),
        }],
      };
    }
  );

  // ── 7. ERC-20 token balance ────────────────────────────────────────────────
  server.tool(
    "get_erc20_balance",
    "Get ERC-20 token balance for a wallet address on any supported EVM chain.",
    {
      wallet_address: z.string().describe("Wallet address (0x...)"),
      token_address: z.string().describe("ERC-20 contract address (0x...)"),
      chain: z.enum(["ethereum", "base", "polygon", "arbitrum", "optimism", "bsc"]).default("ethereum"),
    },
    async ({ wallet_address, token_address, chain }) => {
      if (!isAddress(wallet_address) || !isAddress(token_address)) {
        return { content: [{ type: "text", text: "Invalid address" }], isError: true };
      }
      const client = getClient(chain);
      const erc20Abi = [
        { name: "balanceOf", type: "function", stateMutability: "view", inputs: [{ name: "account", type: "address" }], outputs: [{ name: "", type: "uint256" }] },
        { name: "decimals", type: "function", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "uint8" }] },
        { name: "symbol", type: "function", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "string" }] },
        { name: "name", type: "function", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "string" }] },
      ] as const;
      const [balance, decimals, symbol, name] = await Promise.all([
        client.readContract({ address: token_address as `0x${string}`, abi: erc20Abi, functionName: "balanceOf", args: [wallet_address as `0x${string}`] }),
        client.readContract({ address: token_address as `0x${string}`, abi: erc20Abi, functionName: "decimals" }),
        client.readContract({ address: token_address as `0x${string}`, abi: erc20Abi, functionName: "symbol" }),
        client.readContract({ address: token_address as `0x${string}`, abi: erc20Abi, functionName: "name" }),
      ]);
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            wallet: wallet_address, token_address, chain, name, symbol,
            balance_raw: balance.toString(),
            balance_formatted: formatUnits(balance as bigint, decimals as number),
          }, null, 2),
        }],
      };
    }
  );

  // ── 8. Transaction lookup ──────────────────────────────────────────────────
  server.tool(
    "get_transaction",
    "Look up any on-chain transaction by hash on a supported EVM chain.",
    {
      tx_hash: z.string().describe("Transaction hash (0x...)"),
      chain: z.enum(["ethereum", "base", "polygon", "arbitrum", "optimism", "bsc"]).default("ethereum"),
    },
    async ({ tx_hash, chain }) => {
      const client = getClient(chain);
      const tx = await client.getTransaction({ hash: tx_hash as `0x${string}` });
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            hash: tx.hash,
            from: tx.from,
            to: tx.to,
            value_eth: formatEther(tx.value),
            gas: tx.gas?.toString(),
            gas_price_gwei: tx.gasPrice ? formatUnits(tx.gasPrice, 9) : null,
            block_number: tx.blockNumber?.toString(),
            nonce: tx.nonce,
          }, null, 2),
        }],
      };
    }
  );

  // ── 9. DeFi TVL (DefiLlama) ───────────────────────────────────────────────
  server.tool(
    "get_defi_tvl",
    "Get Total Value Locked (TVL) for a DeFi protocol from DefiLlama. Use protocol slug, e.g. 'uniswap', 'aave', 'curve', 'lido'.",
    { protocol: z.string().describe("Protocol slug from DefiLlama, e.g. uniswap, aave, curve, lido, pancakeswap") },
    async ({ protocol }) => {
      const data = await defiLlamaFetch(`/protocol/${protocol}`);
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            name: data.name,
            symbol: data.symbol,
            chain: data.chain,
            category: data.category,
            tvl_usd: data.tvl,
            chains: data.chains,
            description: data.description,
            url: data.url,
          }, null, 2),
        }],
      };
    }
  );

  // ── 10. Top DeFi protocols ────────────────────────────────────────────────
  server.tool(
    "get_top_defi_protocols",
    "Get top DeFi protocols ranked by TVL from DefiLlama.",
    { limit: z.number().int().min(5).max(50).default(20).describe("Number of protocols to return") },
    async ({ limit }) => {
      const data = await defiLlamaFetch("/protocols");
      const top = data.slice(0, limit).map((p: any) => ({
        rank: p.rank ?? data.indexOf(p) + 1,
        name: p.name,
        symbol: p.symbol,
        tvl_usd: p.tvl,
        chain: p.chain,
        category: p.category,
        change_1d: p.change_1d,
        change_7d: p.change_7d,
      }));
      return { content: [{ type: "text", text: JSON.stringify(top, null, 2) }] };
    }
  );

  // ── 11. NFT floor price (via CoinGecko) ───────────────────────────────────
  server.tool(
    "get_nft_collection",
    "Get NFT collection stats including floor price, market cap, volume, and 24h changes from CoinGecko.",
    { collection_id: z.string().describe("CoinGecko NFT collection ID, e.g. 'cryptopunks', 'bored-ape-yacht-club', 'azuki'") },
    async ({ collection_id }) => {
      const data = await cgFetch(`/nfts/${collection_id}`);
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            id: data.id,
            name: data.name,
            symbol: data.symbol,
            contract_address: data.contract_address,
            floor_price: data.floor_price,
            market_cap: data.market_cap,
            volume_24h: data.volume_24h,
            floor_price_24h_change: data.floor_price_in_usd_24h_percentage_change,
            total_supply: data.total_supply,
            owners_count: data.number_of_unique_addresses,
            description: data.description?.substring(0, 200),
          }, null, 2),
        }],
      };
    }
  );

  // ── 12. Trending NFTs ──────────────────────────────────────────────────────
  server.tool(
    "get_trending_nfts",
    "Get the top trending NFT collections on CoinGecko right now.",
    {},
    async () => {
      const data = await cgFetch("/search/trending");
      const nfts = (data.nfts ?? []).slice(0, 7).map((n: any) => ({
        name: n.name,
        symbol: n.symbol,
        id: n.id,
        floor_price_eth: n.floor_price_in_native_currency,
        floor_price_usd: n.floor_price_in_usd,
        change_24h: n.floor_price_24h_percentage_change,
      }));
      return { content: [{ type: "text", text: JSON.stringify(nfts, null, 2) }] };
    }
  );

  // ── 13. Token price history ───────────────────────────────────────────────
  server.tool(
    "get_token_price_history",
    "Get historical price data for a token. Returns daily OHLC data for charting or analysis.",
    {
      token_id: z.string().describe("CoinGecko token ID, e.g. bitcoin, ethereum, pepe"),
      days: z.number().int().min(1).max(365).default(30).describe("Number of days of history to fetch"),
      vs_currency: z.string().default("usd"),
    },
    async ({ token_id, days, vs_currency }) => {
      const data = await cgFetch(`/coins/${token_id}/market_chart?vs_currency=${vs_currency}&days=${days}&interval=daily`);
      const prices = (data.prices ?? []).map(([ts, price]: [number, number]) => ({
        date: new Date(ts).toISOString().split("T")[0],
        price: parseFloat(price.toFixed(8)),
      }));
      return { content: [{ type: "text", text: JSON.stringify({ token_id, vs_currency, prices }, null, 2) }] };
    }
  );

  // ── 14. Market overview ───────────────────────────────────────────────────
  server.tool(
    "get_crypto_market_overview",
    "Get a global crypto market overview: total market cap, 24h volume, BTC dominance, active coins, and fear & greed index context.",
    {},
    async () => {
      const [global, fearGreed] = await Promise.allSettled([
        cgFetch("/global"),
        fetch("https://api.alternative.me/fng/?limit=1").then(r => r.json()),
      ]);
      const g = global.status === "fulfilled" ? global.value.data : {};
      const fg = fearGreed.status === "fulfilled" ? (fearGreed.value.data?.[0] ?? {}) : {};
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            total_market_cap_usd: g.total_market_cap?.usd,
            total_volume_24h_usd: g.total_volume?.usd,
            btc_dominance: `${g.market_cap_percentage?.btc?.toFixed(1)}%`,
            eth_dominance: `${g.market_cap_percentage?.eth?.toFixed(1)}%`,
            active_coins: g.active_cryptocurrencies,
            markets: g.markets,
            market_cap_change_24h: `${g.market_cap_change_percentage_24h_usd?.toFixed(2)}%`,
            fear_greed_index: fg.value,
            fear_greed_label: fg.value_classification,
          }, null, 2),
        }],
      };
    }
  );

  // ── 15. On-chain contract info ────────────────────────────────────────────
  server.tool(
    "get_contract_info",
    "Check if an address is a contract or EOA, and get bytecode size and basic info.",
    {
      address: z.string().describe("EVM address (0x...)"),
      chain: z.enum(["ethereum", "base", "polygon", "arbitrum", "optimism", "bsc"]).default("ethereum"),
    },
    async ({ address, chain }) => {
      if (!isAddress(address)) return { content: [{ type: "text", text: "Invalid address" }], isError: true };
      const client = getClient(chain);
      const [bytecode, balance] = await Promise.all([
        client.getBytecode({ address: address as `0x${string}` }),
        client.getBalance({ address: address as `0x${string}` }),
      ]);
      const isContract = bytecode && bytecode !== "0x" && bytecode.length > 2;
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            address, chain,
            type: isContract ? "contract" : "EOA (wallet)",
            bytecode_size_bytes: isContract ? (bytecode!.length - 2) / 2 : 0,
            balance_native: formatEther(balance),
          }, null, 2),
        }],
      };
    }
  );

  // ── 16. Block explorer links ──────────────────────────────────────────────
  server.tool(
    "get_explorer_links",
    "Generate block explorer links for an address or transaction hash across all supported chains.",
    { address_or_hash: z.string().describe("Wallet/contract address or transaction hash") },
    async ({ address_or_hash }) => {
      const explorers = {
        ethereum: `https://etherscan.io/${address_or_hash.length === 66 ? "tx" : "address"}/${address_or_hash}`,
        base: `https://basescan.org/${address_or_hash.length === 66 ? "tx" : "address"}/${address_or_hash}`,
        polygon: `https://polygonscan.com/${address_or_hash.length === 66 ? "tx" : "address"}/${address_or_hash}`,
        arbitrum: `https://arbiscan.io/${address_or_hash.length === 66 ? "tx" : "address"}/${address_or_hash}`,
        optimism: `https://optimistic.etherscan.io/${address_or_hash.length === 66 ? "tx" : "address"}/${address_or_hash}`,
        bsc: `https://bscscan.com/${address_or_hash.length === 66 ? "tx" : "address"}/${address_or_hash}`,
        solana: `https://solscan.io/account/${address_or_hash}`,
      };
      return { content: [{ type: "text", text: JSON.stringify(explorers, null, 2) }] };
    }
  );

  // ── 17. DeFi yield opportunities ─────────────────────────────────────────
  server.tool(
    "get_defi_yields",
    "Get top yield farming / staking opportunities from DefiLlama. Filter by chain or min APY.",
    {
      min_apy: z.number().min(0).max(10000).default(5).describe("Minimum APY %"),
      chain: z.string().optional().describe("Filter by chain, e.g. Ethereum, Base, Polygon, Arbitrum"),
      limit: z.number().int().min(5).max(50).default(20),
    },
    async ({ min_apy, chain, limit }) => {
      const data = await defiLlamaFetch("/pools");
      let pools = data.data ?? [];
      if (chain) pools = pools.filter((p: any) => p.chain?.toLowerCase() === chain.toLowerCase());
      pools = pools.filter((p: any) => (p.apy ?? 0) >= min_apy && p.tvlUsd > 10000);
      pools.sort((a: any, b: any) => b.tvlUsd - a.tvlUsd);
      const top = pools.slice(0, limit).map((p: any) => ({
        project: p.project, symbol: p.symbol, chain: p.chain,
        apy: `${p.apy?.toFixed(2)}%`, tvl_usd: p.tvlUsd, pool_id: p.pool,
      }));
      return { content: [{ type: "text", text: JSON.stringify(top, null, 2) }] };
    }
  );

  // ── 18. Memecoin scanner ──────────────────────────────────────────────────
  server.tool(
    "scan_memecoins",
    "Scan for memecoin opportunities: trending tokens under $500M market cap with high 24h gains. Aggregates CoinGecko data.",
    {
      max_market_cap_usd: z.number().default(500_000_000).describe("Max market cap filter in USD"),
      min_change_24h: z.number().default(10).describe("Minimum 24h % gain"),
    },
    async ({ max_market_cap_usd, min_change_24h }) => {
      const [trending, markets] = await Promise.all([
        cgFetch("/search/trending"),
        cgFetch("/coins/markets?vs_currency=usd&order=gecko_desc&per_page=100&page=1&price_change_percentage=24h"),
      ]);
      const trendingIds = new Set((trending.coins ?? []).map((c: any) => c.item.id));
      const memes = markets
        .filter((c: any) =>
          (c.market_cap ?? Infinity) < max_market_cap_usd &&
          (c.price_change_percentage_24h ?? 0) >= min_change_24h
        )
        .map((c: any) => ({
          name: c.name,
          symbol: c.symbol,
          id: c.id,
          price_usd: c.current_price,
          market_cap_usd: c.market_cap,
          change_24h: `${c.price_change_percentage_24h?.toFixed(2)}%`,
          volume_24h_usd: c.total_volume,
          is_trending: trendingIds.has(c.id),
          coingecko_url: `https://www.coingecko.com/en/coins/${c.id}`,
        }))
        .sort((a: any, b: any) => parseFloat(b.change_24h) - parseFloat(a.change_24h))
        .slice(0, 30);
      return { content: [{ type: "text", text: JSON.stringify({ found: memes.length, coins: memes }, null, 2) }] };
    }
  );

  // ── 19. Token info / fundamentals ─────────────────────────────────────────
  server.tool(
    "get_token_fundamentals",
    "Get detailed fundamentals for a token: description, links, socials, team, ATH, supply, and more.",
    { token_id: z.string().describe("CoinGecko token ID, e.g. bitcoin, ethereum, pepe") },
    async ({ token_id }) => {
      const data = await cgFetch(`/coins/${token_id}?localization=false&tickers=false&market_data=true&community_data=true&developer_data=false`);
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            name: data.name, symbol: data.symbol,
            description: data.description?.en?.substring(0, 500),
            categories: data.categories,
            homepage: data.links?.homepage?.[0],
            twitter: data.links?.twitter_screen_name,
            reddit: data.links?.subreddit_url,
            github: data.links?.repos_url?.github?.[0],
            contract_addresses: data.platforms,
            market_cap_rank: data.market_cap_rank,
            current_price_usd: data.market_data?.current_price?.usd,
            ath_usd: data.market_data?.ath?.usd,
            ath_date: data.market_data?.ath_date?.usd,
            circulating_supply: data.market_data?.circulating_supply,
            total_supply: data.market_data?.total_supply,
            max_supply: data.market_data?.max_supply,
            community_twitter_followers: data.community_data?.twitter_followers,
            community_reddit_subscribers: data.community_data?.reddit_subscribers,
          }, null, 2),
        }],
      };
    }
  );

}
