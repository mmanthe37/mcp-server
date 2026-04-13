---
name: mmanthe37-mcp-server
description: Production MCP server with web3 market data, Coinbase AgentKit wallet operations, and DeFi/NFT analytics. Deployed via Streamable HTTP on Azure Container Apps.
version: 0.1.0
metadata:
  openclaw:
    requires:
      env:
        - CDP_API_KEY_ID
        - CDP_API_KEY_SECRET
        - CDP_WALLET_SECRET
        - NETWORK_ID
        - PORT
    primaryEnv: CDP_API_KEY_ID
    emoji: "🔗"
    homepage: https://github.com/mmanthe37/mcp-server
---

# MCP Server — `mmanthe37-mcp-server`

Production-ready Model Context Protocol server running on Azure Container Apps with Streamable HTTP transport.

> **Requires CDP credentials** to enable wallet and AgentKit tools. Web3 data tools (prices, DeFi, NFTs) work without credentials. Set `CDP_API_KEY_ID`, `CDP_API_KEY_SECRET`, and `CDP_WALLET_SECRET` to unlock wallet functionality.

## Required Environment Variables

| Variable | Required | Purpose |
|---|---|---|
| `CDP_API_KEY_ID` | For wallet tools | Coinbase Developer Platform API key ID |
| `CDP_API_KEY_SECRET` | For wallet tools | CDP API key secret |
| `CDP_WALLET_SECRET` | For wallet tools | CDP smart wallet encryption secret |
| `NETWORK_ID` | Optional | Blockchain network (default: `base-sepolia`) |
| `PORT` | Optional | HTTP server port (default: `3000`) |

## Tools

### Base Tools (no credentials needed)

| Tool | Description |
|---|---|
| `echo` | Echoes a message — connectivity test |
| `get_timestamp` | Returns current UTC timestamp |
| `system_info` | Returns server environment metadata |
| `calculate` | Basic arithmetic: add, subtract, multiply, divide |

### Web3 Data Tools (no credentials needed)

These tools call public APIs (CoinGecko, DefiLlama, OpenSea) — no wallet or CDP keys required.

| Tool | Description |
|---|---|
| `get_token_price` | Token price by symbol or contract address |
| `search_token` | Search tokens by name/symbol |
| `get_trending_tokens` | Currently trending tokens |
| `get_top_movers` | Top gainers and losers |
| `get_wallet_balance` | Native token balance for any address |
| `get_gas_price` | Current gas prices |
| `get_erc20_balance` | ERC-20 token balance for any address |
| `get_transaction` | On-chain transaction details by hash |
| `get_defi_tvl` | TVL for a DeFi protocol |
| `get_top_defi_protocols` | Top DeFi protocols by TVL |
| `get_nft_collection` | NFT collection stats |
| `get_trending_nfts` | Trending NFT collections |
| `get_token_price_history` | Historical price data |
| `get_crypto_market_overview` | Global market overview |
| `get_contract_info` | Smart contract metadata |

### Coinbase AgentKit Tools (requires CDP credentials)

These tools use Coinbase's AgentKit SDK to perform wallet operations. **They can transfer real funds if provided with live credentials.** Use testnet credentials (`base-sepolia`) for development.

| Tool | Description |
|---|---|
| `agentkit_status` | AgentKit/CDP initialization status |
| `agentkit_run_action` | Execute any AgentKit action by name |
| `agentkit_get_wallet` | Get wallet address and network |
| `agentkit_erc20_balance` | ERC-20 token balance for the configured wallet |
| `agentkit_send_eth` | **Send ETH** from the configured wallet |
| `agentkit_swap_quote` | Swap quote via AgentKit |
| `agentkit_wow_create_token` | Create a WOW Protocol token |
| `agentkit_compound_portfolio` | Compound Finance portfolio view |
| `agentkit_flaunch` | Flaunch token launch |
| `agentkit_pyth_price` | Pyth Network oracle price feed |

## Architecture

```
Client → HTTPS → Azure Container Apps (auto-scaled)
                    ├── /health  (GET — health check)
                    └── /mcp     (POST/GET/DELETE — MCP protocol)
                          ↕
                  Streamable HTTP Transport
                          ↕
              MCP Server (tools, resources, prompts)
                    ├── Base Tools
                    ├── Web3 Data Tools
                    └── AgentKit Wallet Tools
```

## Credential Handling

- CDP credentials are loaded from `CDP_API_KEY_ID`, `CDP_API_KEY_SECRET`, `CDP_WALLET_SECRET` environment variables.
- Wallet state is persisted to `wallet_data.txt` in the container filesystem.
- The server does **not** log or expose credentials.
- AgentKit tools gracefully degrade (return status error) if credentials are absent.
- **Do not** provide production CDP credentials unless you have audited the code and trust the deployment environment.

## Local Development

```bash
npm install
npm run dev     # hot-reload with tsx
```

```bash
curl http://localhost:3000/health
```

## Deploy to Azure

```bash
azd auth login
azd up
```

After deployment, `SERVICE_MCP_URI` in the output is your public endpoint.
