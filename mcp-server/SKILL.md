---
name: mmanthe37-mcp-server
description: Production MCP server with read-only web3 market data, DeFi analytics, NFT intelligence, and blockchain lookup tools.
version: 0.1.5
metadata:
  openclaw:
    emoji: "🔗"
    homepage: https://github.com/mmanthe37/mcp-server
---

# MCP Server — `mmanthe37-mcp-server`

Production-ready Model Context Protocol server running on Azure Container Apps with Streamable HTTP transport.

This release is a **read-only analytics profile**:
- No wallet signing
- No funds transfer tools
- No CDP/secret credential requirements

## Runtime

No credentials or environment variables are required.

## Tools

### Base

| Tool | Description |
|---|---|
| `echo` | Echoes a message (connectivity test) |
| `get_timestamp` | Returns current UTC timestamp |
| `system_info` | Returns server environment metadata |
| `calculate` | Basic arithmetic (add, subtract, multiply, divide) |

### Web3 / DeFi / NFT (read-only)

| Tool | Description |
|---|---|
| `get_token_price` | Token price by symbol or contract address |
| `search_token` | Search tokens by name or symbol |
| `get_trending_tokens` | Trending crypto tokens |
| `get_top_movers` | Top gainers and losers |
| `get_wallet_balance` | Native token balance for an address |
| `get_gas_price` | Current gas prices |
| `get_erc20_balance` | ERC-20 balance for an address |
| `get_transaction` | Transaction details by hash |
| `get_defi_tvl` | TVL for a DeFi protocol |
| `get_top_defi_protocols` | Top protocols by TVL |
| `get_nft_collection` | NFT collection stats |
| `get_trending_nfts` | Trending NFT collections |
| `get_token_price_history` | Historical token price data |
| `get_crypto_market_overview` | Global market overview |
| `get_contract_info` | Smart contract metadata |
| `get_explorer_links` | Explorer links for address/tx/token |
| `get_defi_yields` | Yield opportunities from public DeFi sources |
| `scan_memecoins` | Public memecoin signal snapshot |
| `get_token_fundamentals` | Token fundamentals and category/profile info |

## Local Development

```bash
npm install
npm run dev
```

```bash
curl http://localhost:3000/health
```

## Build

```bash
npm run build
npm start
```

## Deploy to Azure

```bash
azd auth login
azd up
```

After deployment, `SERVICE_MCP_URI` is your public endpoint.
