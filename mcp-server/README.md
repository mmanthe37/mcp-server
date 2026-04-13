# MCP Server — Production Deployment

A production-ready [Model Context Protocol](https://modelcontextprotocol.io/) server running on Azure Container Apps with Streamable HTTP transport.

This release is a **read-only analytics profile**:
- No wallet signing
- No funds transfer tools
- No CDP credential requirements

## Tools

| Tool | Description |
|------|-------------|
| `echo` | Echoes back a message (connectivity test) |
| `get_timestamp` | Returns current UTC timestamp |
| `system_info` | Returns server environment details |
| `calculate` | Basic arithmetic (add, subtract, multiply, divide) |
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
| `get_token_price_history` | Historical token price data |
| `get_crypto_market_overview` | Global market overview |
| `get_contract_info` | Smart contract metadata |
| `get_explorer_links` | Explorer links for address/tx/token |
| `get_defi_yields` | Yield opportunities from public DeFi sources |
| `scan_memecoins` | Public memecoin signal snapshot |
| `get_token_fundamentals` | Token fundamentals and profile metadata |

## Local Development

```bash
npm install
npm run dev     # hot-reload with tsx
```

Test the server:

```bash
# Health check
curl http://localhost:3000/health

# Initialize MCP session
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}'
```

## Build

```bash
npm run build   # TypeScript → dist/
npm start       # run production build
```

## Deploy to Azure

### Prerequisites

- [Azure CLI](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli) installed
- [Azure Developer CLI (azd)](https://learn.microsoft.com/en-us/azure/developer/azure-developer-cli/install-azd) installed
- An Azure subscription

### Deploy

```bash
# Login to Azure
azd auth login

# Initialize environment (first time only)
azd init

# Provision infrastructure + deploy app
azd up
```

This will:
1. Create a Resource Group
2. Create an Azure Container Registry
3. Build and push the Docker image
4. Create a Container Apps Environment with Log Analytics
5. Deploy the Container App with auto-scaling (1–5 replicas)

### Subsequent deploys

```bash
azd deploy       # redeploy code only (no infra changes)
```

### Environment outputs

After deployment, `azd` will display:
- `SERVICE_MCP_URI` — The public HTTPS URL of your MCP server

Your MCP endpoint will be at: `https://<your-app>.azurecontainerapps.io/mcp`

## Architecture

```
Client → HTTPS → Azure Container Apps (auto-scaled)
                    ├── /health  (GET — health check)
                    └── /mcp     (POST/GET/DELETE — MCP protocol)
                          ↕
                  Streamable HTTP Transport
                          ↕
                  MCP Server (tools, resources, prompts)
```

## Infrastructure

| Resource | Purpose |
|----------|---------|
| Container Registry | Hosts Docker images |
| Container Apps Environment | Managed Kubernetes with Log Analytics |
| Container App | Runs the MCP server (0.5 vCPU, 1 GiB RAM) |

## Adding Your Own Tools

Edit `src/tools.ts` to register custom tools:

```typescript
server.tool(
  "my_tool",
  "Description of what this tool does",
  { param: z.string().describe("Parameter description") },
  async ({ param }) => ({
    content: [{ type: "text", text: `Result: ${param}` }],
  })
);
```

Rebuild and redeploy:

```bash
npm run build && azd deploy
```
